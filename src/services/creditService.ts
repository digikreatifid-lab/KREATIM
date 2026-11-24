import { Prisma, type LedgerType, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

/**
 * Credit Ledger engine (PRD §3.4, CLAUDE.md §3).
 *
 * Rules enforced here:
 * 1. Every balance change happens inside `prisma.$transaction` with a row lock
 *    (`SELECT ... FOR UPDATE`) on the user, so parallel requests are serialised
 *    and the balance can never go negative.
 * 2. Usage takes from `subCredits` first, then `topupCredits`.
 * 3. Every mutation writes an immutable `CreditLedger` row (one row per bucket
 *    touched). Ledger rows are never updated or deleted.
 */

export type CreditBucket = "SUBSCRIPTION" | "TOPUP";

export type BucketSplit = {
  subscription: number;
  topup: number;
};

export type Db = PrismaClient | Prisma.TransactionClient;

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`Kredit tidak cukup: butuh ${required}, tersedia ${available}.`);
    this.name = "InsufficientCreditsError";
  }
}

export class CreditUserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} tidak ditemukan.`);
    this.name = "CreditUserNotFoundError";
  }
}

type LockedBalance = { subCredits: number; topupCredits: number };

/** Locks the user row for the rest of the transaction and returns its balance. */
export async function lockUserBalance(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<LockedBalance> {
  const rows = await tx.$queryRaw<LockedBalance[]>`
    SELECT "subCredits", "topupCredits" FROM "User" WHERE "id" = ${userId} FOR UPDATE
  `;
  if (rows.length === 0) throw new CreditUserNotFoundError(userId);
  return rows[0];
}

function assertPositiveInt(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} harus bilangan bulat positif, diterima: ${value}`);
  }
}

export function splitCost(balance: LockedBalance, cost: number): BucketSplit {
  const subscription = Math.min(balance.subCredits, cost);
  return { subscription, topup: cost - subscription };
}

export type ReserveResult = {
  split: BucketSplit;
  balanceAfter: number;
};

/**
 * Reserve (deduct) credits BEFORE calling an AI provider.
 * Throws `InsufficientCreditsError` without touching the balance when the
 * user cannot afford `cost`.
 */
export async function reserveCredits(
  userId: string,
  cost: number,
  type: LedgerType,
  referenceId: string | null,
  description: string,
  db: PrismaClient = defaultPrisma,
): Promise<ReserveResult> {
  assertPositiveInt(cost, "cost");

  return db.$transaction(async (tx) => {
    const balance = await lockUserBalance(tx, userId);
    const total = balance.subCredits + balance.topupCredits;
    if (total < cost) throw new InsufficientCreditsError(cost, total);

    const split = splitCost(balance, cost);
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        subCredits: { decrement: split.subscription },
        topupCredits: { decrement: split.topup },
      },
      select: { subCredits: true, topupCredits: true },
    });

    let running = total;
    if (split.subscription > 0) {
      running -= split.subscription;
      await tx.creditLedger.create({
        data: {
          userId,
          type,
          amount: -split.subscription,
          bucket: "SUBSCRIPTION",
          balanceAfter: running,
          referenceId,
          description,
        },
      });
    }
    if (split.topup > 0) {
      running -= split.topup;
      await tx.creditLedger.create({
        data: {
          userId,
          type,
          amount: -split.topup,
          bucket: "TOPUP",
          balanceAfter: running,
          referenceId,
          description,
        },
      });
    }

    return { split, balanceAfter: updated.subCredits + updated.topupCredits };
  });
}

export type RefundResult = {
  refunded: boolean;
  balanceAfter: number;
};

/**
 * Return credits of a failed job to the buckets they were taken from.
 * Idempotent per `referenceId`: a second refund for the same job is a no-op.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  originalBucketSplit: BucketSplit,
  referenceId: string,
  reason: string,
  db: PrismaClient = defaultPrisma,
): Promise<RefundResult> {
  assertPositiveInt(amount, "amount");
  if (originalBucketSplit.subscription + originalBucketSplit.topup !== amount) {
    throw new RangeError("Jumlah refund tidak sama dengan total pembagian bucket.");
  }
  if (originalBucketSplit.subscription < 0 || originalBucketSplit.topup < 0) {
    throw new RangeError("Pembagian bucket tidak boleh negatif.");
  }

  return db.$transaction(async (tx) => {
    const balance = await lockUserBalance(tx, userId);
    const total = balance.subCredits + balance.topupCredits;

    const already = await tx.creditLedger.findFirst({
      where: { userId, referenceId, type: "REFUND_FAILED_JOB" },
      select: { id: true },
    });
    if (already) return { refunded: false, balanceAfter: total };

    await tx.user.update({
      where: { id: userId },
      data: {
        subCredits: { increment: originalBucketSplit.subscription },
        topupCredits: { increment: originalBucketSplit.topup },
      },
    });

    let running = total;
    const description = `Refund otomatis: ${reason}`.slice(0, 500);
    if (originalBucketSplit.subscription > 0) {
      running += originalBucketSplit.subscription;
      await tx.creditLedger.create({
        data: {
          userId,
          type: "REFUND_FAILED_JOB",
          amount: originalBucketSplit.subscription,
          bucket: "SUBSCRIPTION",
          balanceAfter: running,
          referenceId,
          description,
        },
      });
    }
    if (originalBucketSplit.topup > 0) {
      running += originalBucketSplit.topup;
      await tx.creditLedger.create({
        data: {
          userId,
          type: "REFUND_FAILED_JOB",
          amount: originalBucketSplit.topup,
          bucket: "TOPUP",
          balanceAfter: running,
          referenceId,
          description,
        },
      });
    }

    return { refunded: true, balanceAfter: running };
  });
}

/**
 * Add credits to one bucket (trial grant, subscription grant, top-up purchase).
 * Pass `tx` to run inside a caller's transaction (e.g. payment webhook).
 */
export async function grantCredits(
  userId: string,
  amount: number,
  bucket: CreditBucket,
  type: LedgerType,
  referenceId: string | null,
  description: string,
  db: Db = defaultPrisma,
): Promise<{ balanceAfter: number }> {
  assertPositiveInt(amount, "amount");

  const run = async (tx: Prisma.TransactionClient) => {
    const balance = await lockUserBalance(tx, userId);
    const total = balance.subCredits + balance.topupCredits;
    await tx.user.update({
      where: { id: userId },
      data:
        bucket === "SUBSCRIPTION"
          ? { subCredits: { increment: amount } }
          : { topupCredits: { increment: amount } },
    });
    const balanceAfter = total + amount;
    await tx.creditLedger.create({
      data: { userId, type, amount, bucket, balanceAfter, referenceId, description },
    });
    return { balanceAfter };
  };

  return "$transaction" in db ? db.$transaction(run) : run(db);
}

/**
 * Wrap an AI call with the Reserve -> Execute -> Finalize/Refund pattern.
 * If `execute` throws, the reserved credits are refunded and the error rethrown.
 */
export async function withReservedCredits<T>(
  params: {
    userId: string;
    cost: number;
    type: LedgerType;
    referenceId: string;
    description: string;
  },
  execute: (reservation: ReserveResult) => Promise<T>,
  db: PrismaClient = defaultPrisma,
): Promise<T> {
  const reservation = await reserveCredits(
    params.userId,
    params.cost,
    params.type,
    params.referenceId,
    params.description,
    db,
  );
  try {
    return await execute(reservation);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await refundCredits(params.userId, params.cost, reservation.split, params.referenceId, reason, db);
    throw error;
  }
}

export async function getBalance(userId: string, db: Db = defaultPrisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subCredits: true, topupCredits: true, planTier: true, subExpiresAt: true, topupExpiresAt: true },
  });
  if (!user) throw new CreditUserNotFoundError(userId);
  return { ...user, total: user.subCredits + user.topupCredits };
}

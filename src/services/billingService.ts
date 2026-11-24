import { randomBytes } from "node:crypto";
import type { PaymentTransaction, Prisma, PrismaClient } from "@prisma/client";
import { paymentProvider, PaymentProviderError, type WebhookEvent } from "@/lib/payments";
import { getBillingItem, SUBSCRIPTION_PERIOD_DAYS, TOPUP_VALIDITY_DAYS, type BillingItem } from "@/lib/plans";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { grantCredits, lockUserBalance } from "@/services/creditService";

const DAY = 24 * 60 * 60 * 1000;

export class UnknownBillingItemError extends Error {
  constructor() {
    super("Paket tidak dikenal.");
    this.name = "UnknownBillingItemError";
  }
}

export function newOrderId() {
  return `KRT-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createCheckout(
  userId: string,
  itemId: string,
  appUrl: string,
  db: PrismaClient = defaultPrisma,
) {
  const item = getBillingItem(itemId);
  if (!item) throw new UnknownBillingItemError();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true } });
  const provider = paymentProvider();

  const payment = await db.paymentTransaction.create({
    data: { userId, externalOrderId: newOrderId(), itemType: item.id, amountIdr: item.priceIdr, status: "PENDING" },
  });

  try {
    const checkout = await provider.createCheckout({
      orderId: payment.externalOrderId,
      amountIdr: item.priceIdr,
      itemId: item.id,
      itemName: `Kreatim ${item.name}`,
      customer: { name: user.name ?? user.email.split("@")[0], email: user.email },
      returnUrl: `${appUrl}/dashboard/billing?order=${payment.externalOrderId}`,
    });
    return { orderId: payment.externalOrderId, ...checkout };
  } catch (error) {
    await db.paymentTransaction.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    if (error instanceof PaymentProviderError) throw error;
    throw new PaymentProviderError("Gagal membuat invoice pembayaran.", { cause: error });
  }
}

async function fulfill(tx: Prisma.TransactionClient, payment: PaymentTransaction, item: BillingItem, now: Date) {
  if (item.kind === "TOPUP") {
    await grantCredits(payment.userId, item.credits, "TOPUP", "TOPUP_PURCHASE", payment.id, `Pembelian ${item.name}`, tx);
    await tx.user.update({
      where: { id: payment.userId },
      data: { topupExpiresAt: new Date(now.getTime() + TOPUP_VALIDITY_DAYS * DAY) },
    });
    return;
  }

  // Subscription: monthly quota is replaced, never rolled over (PRD §3.4).
  const balance = await lockUserBalance(tx, payment.userId);
  let running = balance.subCredits + balance.topupCredits;
  if (balance.subCredits > 0) {
    running -= balance.subCredits;
    await tx.creditLedger.create({
      data: {
        userId: payment.userId,
        type: "MONTHLY_EXPIRATION",
        amount: -balance.subCredits,
        bucket: "SUBSCRIPTION",
        balanceAfter: running,
        referenceId: payment.id,
        description: "Sisa kuota bulanan diganti paket baru (tanpa rollover)",
      },
    });
  }
  await tx.user.update({
    where: { id: payment.userId },
    data: {
      planTier: item.tier,
      subCredits: item.credits,
      subExpiresAt: new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * DAY),
    },
  });
  await tx.creditLedger.create({
    data: {
      userId: payment.userId,
      type: "SUBSCRIPTION_GRANT",
      amount: item.credits,
      bucket: "SUBSCRIPTION",
      balanceAfter: running + item.credits,
      referenceId: payment.id,
      description: `Paket ${item.name}: ${item.credits} kredit / 30 hari`,
    },
  });
}

export type WebhookOutcome = "fulfilled" | "duplicate" | "pending" | "failed" | "unknown_order" | "amount_mismatch";

/**
 * Applies a VERIFIED provider event. Idempotent: the payment row is locked
 * and a PAID transaction is never fulfilled twice (CLAUDE.md §3.5).
 */
export async function applyPaymentEvent(event: WebhookEvent, db: PrismaClient = defaultPrisma, now = new Date()): Promise<WebhookOutcome> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "PaymentTransaction" WHERE "externalOrderId" = ${event.orderId} FOR UPDATE
    `;
    if (rows.length === 0) return "unknown_order";
    const payment = await tx.paymentTransaction.findUniqueOrThrow({ where: { id: rows[0].id } });
    const raw = event.raw as Prisma.InputJsonValue;

    if (payment.status === "PAID") return "duplicate";

    if (event.status === "PENDING") {
      await tx.paymentTransaction.update({ where: { id: payment.id }, data: { rawWebhook: raw } });
      return "pending";
    }
    if (event.status === "FAILED") {
      await tx.paymentTransaction.update({ where: { id: payment.id }, data: { status: "FAILED", rawWebhook: raw } });
      return "failed";
    }

    if (event.grossAmountIdr !== undefined && event.grossAmountIdr !== payment.amountIdr) {
      await tx.paymentTransaction.update({ where: { id: payment.id }, data: { status: "AMOUNT_MISMATCH", rawWebhook: raw } });
      return "amount_mismatch";
    }

    const item = getBillingItem(payment.itemType);
    if (!item) throw new UnknownBillingItemError();
    await tx.paymentTransaction.update({ where: { id: payment.id }, data: { status: "PAID", rawWebhook: raw } });
    await fulfill(tx, payment, item, now);
    return "fulfilled";
  });
}

/**
 * Daily cron: zero out monthly quota past `subExpiresAt` (downgrading to
 * FREE_TRIAL until the user renews) and top-up credits past `topupExpiresAt`.
 * Safe to run repeatedly: each user is re-checked under a row lock.
 */
export async function resetExpiredCredits(now = new Date(), db: PrismaClient = defaultPrisma) {
  const candidates = await db.user.findMany({
    where: {
      OR: [
        { subExpiresAt: { lte: now } },
        { topupExpiresAt: { lte: now }, topupCredits: { gt: 0 } },
      ],
    },
    select: { id: true },
    take: 5000,
  });

  let subscriptions = 0;
  let topups = 0;
  for (const { id: userId } of candidates) {
    await db.$transaction(async (tx) => {
      const balance = await lockUserBalance(tx, userId);
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { subExpiresAt: true, topupExpiresAt: true } });
      let running = balance.subCredits + balance.topupCredits;

      if (user.subExpiresAt && user.subExpiresAt <= now) {
        if (balance.subCredits > 0) {
          running -= balance.subCredits;
          await tx.creditLedger.create({
            data: { userId, type: "MONTHLY_EXPIRATION", amount: -balance.subCredits, bucket: "SUBSCRIPTION", balanceAfter: running, referenceId: null, description: "Kuota bulanan kedaluwarsa (30 hari, tanpa rollover)" },
          });
        }
        await tx.user.update({ where: { id: userId }, data: { subCredits: 0, subExpiresAt: null, planTier: "FREE_TRIAL" } });
        subscriptions += 1;
      }

      if (user.topupExpiresAt && user.topupExpiresAt <= now && balance.topupCredits > 0) {
        running -= balance.topupCredits;
        await tx.creditLedger.create({
          data: { userId, type: "MONTHLY_EXPIRATION", amount: -balance.topupCredits, bucket: "TOPUP", balanceAfter: running, referenceId: null, description: "Kredit top-up kedaluwarsa (90 hari)" },
        });
        await tx.user.update({ where: { id: userId }, data: { topupCredits: 0, topupExpiresAt: null } });
        topups += 1;
      }
    });
  }
  return { checked: candidates.length, subscriptionsExpired: subscriptions, topupsExpired: topups };
}

export async function listLedger(userId: string, page = 1, pageSize = 20, db: PrismaClient = defaultPrisma) {
  const [items, total] = await Promise.all([
    db.creditLedger.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    db.creditLedger.count({ where: { userId } }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { FREE_TRIAL_CREDITS } from "@/lib/plans";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email sudah terdaftar.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Create a user with the one-time FREE_TRIAL grant (15 subCredits) and record
 * that grant in the ledger in the same transaction.
 */
async function createUserWithTrial(
  data: { email: string; name?: string | null; passwordHash?: string | null },
  db: PrismaClient,
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normaliseEmail(data.email),
        name: data.name ?? null,
        passwordHash: data.passwordHash ?? null,
        planTier: "FREE_TRIAL",
        subCredits: FREE_TRIAL_CREDITS,
        topupCredits: 0,
      },
    });
    await tx.creditLedger.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION_GRANT",
        amount: FREE_TRIAL_CREDITS,
        bucket: "SUBSCRIPTION",
        balanceAfter: FREE_TRIAL_CREDITS,
        referenceId: null,
        description: "Free Trial: 15 kredit gratis saat registrasi",
      },
    });
    return user;
  });
}

export async function registerWithPassword(
  input: { email: string; password: string; name?: string },
  db: PrismaClient = defaultPrisma,
) {
  const email = normaliseEmail(input.email);
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new EmailAlreadyRegisteredError();
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    return await createUserWithTrial({ email, name: input.name, passwordHash }, db);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new EmailAlreadyRegisteredError();
    throw error;
  }
}

export async function verifyPassword(
  email: string,
  password: string,
  db: PrismaClient = defaultPrisma,
) {
  const user = await db.user.findUnique({ where: { email: normaliseEmail(email) } });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** Used by Google OAuth sign-in: returns the existing user or creates one with the trial grant. */
export async function findOrCreateOAuthUser(
  input: { email: string; name?: string | null },
  db: PrismaClient = defaultPrisma,
) {
  const email = normaliseEmail(input.email);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  try {
    return await createUserWithTrial({ email, name: input.name }, db);
  } catch (error) {
    // Two parallel first logins: the other request won the unique constraint.
    if ((error as { code?: string }).code === "P2002") {
      return db.user.findUniqueOrThrow({ where: { email } });
    }
    throw error;
  }
}

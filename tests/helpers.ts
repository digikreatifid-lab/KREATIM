import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient();

export async function resetDb() {
  await testPrisma.$transaction([
    testPrisma.creditLedger.deleteMany(),
    testPrisma.generationJob.deleteMany(),
    testPrisma.paymentTransaction.deleteMany(),
    testPrisma.brandProfile.deleteMany(),
    testPrisma.user.deleteMany(),
  ]);
}

let seq = 0;
export async function createUser(data: { subCredits?: number; topupCredits?: number; planTier?: "FREE_TRIAL" | "STARTER" | "GROWTH" | "PRO" } = {}) {
  seq += 1;
  return testPrisma.user.create({
    data: {
      email: `user${seq}-${Date.now()}@test.local`,
      subCredits: data.subCredits ?? 0,
      topupCredits: data.topupCredits ?? 0,
      planTier: data.planTier ?? "FREE_TRIAL",
    },
  });
}

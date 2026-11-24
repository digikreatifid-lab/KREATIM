import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { EmailAlreadyRegisteredError, findOrCreateOAuthUser, registerWithPassword, verifyPassword } from "@/services/userService";
import { resetDb, testPrisma } from "./helpers";

beforeEach(resetDb);
afterAll(() => testPrisma.$disconnect());

describe("userService", () => {
  it("user baru mendapat 15 subCredits FREE_TRIAL + entri ledger", async () => {
    const user = await registerWithPassword({ email: "Budi@Example.com", password: "rahasia123", name: "Budi" }, testPrisma);
    expect(user.email).toBe("budi@example.com");
    expect(user.planTier).toBe("FREE_TRIAL");
    expect(user.subCredits).toBe(15);
    const ledger = await testPrisma.creditLedger.findMany({ where: { userId: user.id } });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ type: "SUBSCRIPTION_GRANT", amount: 15, balanceAfter: 15 });
  });

  it("menolak email duplikat", async () => {
    await registerWithPassword({ email: "a@b.co", password: "rahasia123" }, testPrisma);
    await expect(registerWithPassword({ email: "A@b.co", password: "rahasia123" }, testPrisma)).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it("verifikasi password", async () => {
    await registerWithPassword({ email: "c@d.co", password: "rahasia123" }, testPrisma);
    expect(await verifyPassword("c@d.co", "rahasia123", testPrisma)).not.toBeNull();
    expect(await verifyPassword("c@d.co", "salah12345", testPrisma)).toBeNull();
  });

  it("login Google pertama membuat user + trial, login berikutnya tidak menambah kredit", async () => {
    const first = await findOrCreateOAuthUser({ email: "g@gmail.com", name: "G" }, testPrisma);
    const again = await findOrCreateOAuthUser({ email: "g@gmail.com", name: "G" }, testPrisma);
    expect(again.id).toBe(first.id);
    expect(await testPrisma.creditLedger.count({ where: { userId: first.id } })).toBe(1);
  });
});

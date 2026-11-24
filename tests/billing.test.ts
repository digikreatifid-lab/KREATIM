import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { midtransProvider, midtransSignature } from "@/lib/payments/midtrans";
import { tripayCallbackSignature, tripayProvider } from "@/lib/payments/tripay";
import { PaymentSignatureError } from "@/lib/payments";
import { secretMatches } from "@/lib/secrets";
import { applyPaymentEvent, resetExpiredCredits } from "@/services/billingService";
import { createUser, resetDb, testPrisma } from "./helpers";

process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-TEST";
process.env.TRIPAY_API_KEY = "tp-api";
process.env.TRIPAY_PRIVATE_KEY = "tp-private";
process.env.TRIPAY_MERCHANT_CODE = "T0001";

beforeEach(resetDb);
afterAll(() => testPrisma.$disconnect());

async function pendingPayment(userId: string, itemType: string, amountIdr: number, orderId = `KRT-${Math.random().toString(36).slice(2)}`) {
  return testPrisma.paymentTransaction.create({ data: { userId, externalOrderId: orderId, itemType, amountIdr, status: "PENDING" } });
}

const paid = (orderId: string, gross?: number) => ({ orderId, status: "PAID" as const, grossAmountIdr: gross, raw: { orderId } });

describe("verifikasi signature webhook", () => {
  it("Midtrans: menerima signature SHA512 yang benar, menolak yang salah", () => {
    const body = { order_id: "KRT-1", status_code: "200", gross_amount: "99000.00", transaction_status: "settlement" };
    const signed = JSON.stringify({ ...body, signature_key: midtransSignature("KRT-1", "200", "99000.00") });
    const ev = midtransProvider.parseWebhook(signed, new Headers());
    expect(ev).toMatchObject({ orderId: "KRT-1", status: "PAID", grossAmountIdr: 99000 });

    const forged = JSON.stringify({ ...body, signature_key: "0".repeat(128) });
    expect(() => midtransProvider.parseWebhook(forged, new Headers())).toThrow(PaymentSignatureError);
    // Changing the amount after signing invalidates the signature.
    const tampered = JSON.stringify({ ...JSON.parse(signed), gross_amount: "1.00" });
    expect(() => midtransProvider.parseWebhook(tampered, new Headers())).toThrow(PaymentSignatureError);
  });

  it("Midtrans: status pending/expire dipetakan dengan benar", () => {
    const mk = (ts: string) => JSON.stringify({ order_id: "A", status_code: "201", gross_amount: "1.00", transaction_status: ts, signature_key: midtransSignature("A", "201", "1.00") });
    expect(midtransProvider.parseWebhook(mk("pending"), new Headers()).status).toBe("PENDING");
    expect(midtransProvider.parseWebhook(mk("expire"), new Headers()).status).toBe("FAILED");
  });

  it("Tripay: HMAC-SHA256 raw body di header X-Callback-Signature", () => {
    const raw = JSON.stringify({ merchant_ref: "KRT-2", status: "PAID" });
    const headers = new Headers({ "x-callback-signature": tripayCallbackSignature(raw), "x-callback-event": "payment_status" });
    expect(tripayProvider.parseWebhook(raw, headers)).toMatchObject({ orderId: "KRT-2", status: "PAID" });
    const bad = new Headers({ "x-callback-signature": "abc", "x-callback-event": "payment_status" });
    expect(() => tripayProvider.parseWebhook(raw, bad)).toThrow(PaymentSignatureError);
  });
});

describe("applyPaymentEvent", () => {
  it("langganan: kuota bulanan diganti (tanpa rollover) dan paket diperbarui", async () => {
    const user = await createUser({ subCredits: 7, topupCredits: 20 });
    const p = await pendingPayment(user.id, "GROWTH", 249_000);
    expect(await applyPaymentEvent(paid(p.externalOrderId, 249_000), testPrisma)).toBe("fulfilled");
    const u = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(u).toMatchObject({ planTier: "GROWTH", subCredits: 600, topupCredits: 20 });
    expect(u.subExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 29 * 864e5);
    const ledger = await testPrisma.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    expect(ledger.map((l) => [l.type, l.amount, l.balanceAfter])).toEqual([
      ["MONTHLY_EXPIRATION", -7, 20],
      ["SUBSCRIPTION_GRANT", 600, 620],
    ]);
  });

  it("top-up: masuk bucket terpisah dengan masa berlaku 90 hari", async () => {
    const user = await createUser({ subCredits: 5 });
    const p = await pendingPayment(user.id, "TOPUP_BOOST", 129_000);
    await applyPaymentEvent(paid(p.externalOrderId, 129_000), testPrisma);
    const u = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(u).toMatchObject({ subCredits: 5, topupCredits: 300, planTier: "FREE_TRIAL" });
    expect(u.topupExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 89 * 864e5);
  });

  it("idempoten: webhook ganda (berurutan maupun paralel) tidak menggandakan kredit", async () => {
    const user = await createUser();
    const p = await pendingPayment(user.id, "TOPUP_MINI", 49_000);
    const results = await Promise.all(Array.from({ length: 5 }, () => applyPaymentEvent(paid(p.externalOrderId, 49_000), testPrisma)));
    expect(results.filter((r) => r === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r === "duplicate")).toHaveLength(4);
    expect(await applyPaymentEvent(paid(p.externalOrderId, 49_000), testPrisma)).toBe("duplicate");
    const u = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(u.topupCredits).toBe(100);
  });

  it("menolak nominal yang tidak sesuai dan order yang tidak dikenal", async () => {
    const user = await createUser();
    const p = await pendingPayment(user.id, "PRO", 499_000);
    expect(await applyPaymentEvent(paid(p.externalOrderId, 1_000), testPrisma)).toBe("amount_mismatch");
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } })).planTier).toBe("FREE_TRIAL");
    expect(await applyPaymentEvent(paid("KRT-TIDAK-ADA", 1), testPrisma)).toBe("unknown_order");
  });

  it("status gagal tidak menambah kredit", async () => {
    const user = await createUser();
    const p = await pendingPayment(user.id, "STARTER", 99_000);
    expect(await applyPaymentEvent({ orderId: p.externalOrderId, status: "FAILED", raw: {} }, testPrisma)).toBe("failed");
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } })).subCredits).toBe(0);
  });
});

describe("resetExpiredCredits (cron)", () => {
  it("mereset kuota bulanan & top-up yang lewat masa berlaku, mencatat MONTHLY_EXPIRATION", async () => {
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 864e5);
    const expired = await testPrisma.user.create({ data: { email: "a@x.co", planTier: "STARTER", subCredits: 40, topupCredits: 10, subExpiresAt: past, topupExpiresAt: past } });
    const active = await testPrisma.user.create({ data: { email: "b@x.co", planTier: "GROWTH", subCredits: 300, subExpiresAt: future } });
    const trial = await testPrisma.user.create({ data: { email: "c@x.co", subCredits: 15 } });

    const res = await resetExpiredCredits(new Date(), testPrisma);
    expect(res).toMatchObject({ subscriptionsExpired: 1, topupsExpired: 1 });

    expect(await testPrisma.user.findUniqueOrThrow({ where: { id: expired.id } })).toMatchObject({ subCredits: 0, topupCredits: 0, planTier: "FREE_TRIAL", subExpiresAt: null });
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: active.id } })).subCredits).toBe(300);
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: trial.id } })).subCredits).toBe(15);

    const ledger = await testPrisma.creditLedger.findMany({ where: { userId: expired.id }, orderBy: { createdAt: "asc" } });
    expect(ledger.map((l) => [l.type, l.bucket, l.amount, l.balanceAfter])).toEqual([
      ["MONTHLY_EXPIRATION", "SUBSCRIPTION", -40, 10],
      ["MONTHLY_EXPIRATION", "TOPUP", -10, 0],
    ]);

    // Running again is a no-op.
    const again = await resetExpiredCredits(new Date(), testPrisma);
    expect(again).toMatchObject({ subscriptionsExpired: 0, topupsExpired: 0 });
    expect(await testPrisma.creditLedger.count({ where: { userId: expired.id } })).toBe(2);
  });

  it("CRON_SECRET dibandingkan secara konstan dan wajib cukup panjang", () => {
    expect(secretMatches("x".repeat(32), "x".repeat(32))).toBe(true);
    expect(secretMatches("y".repeat(32), "x".repeat(32))).toBe(false);
    expect(secretMatches("short", "short")).toBe(false);
    expect(secretMatches(null, "x".repeat(32))).toBe(false);
    expect(secretMatches("x".repeat(32), undefined)).toBe(false);
  });
});

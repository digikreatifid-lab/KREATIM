import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  grantCredits,
  InsufficientCreditsError,
  refundCredits,
  reserveCredits,
  withReservedCredits,
} from "@/services/creditService";
import { createUser, resetDb, testPrisma } from "./helpers";

const db = testPrisma;

async function balanceOf(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  return { sub: u.subCredits, topup: u.topupCredits };
}

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe("reserveCredits", () => {
  it("memotong subCredits terlebih dahulu", async () => {
    const user = await createUser({ subCredits: 10, topupCredits: 10 });
    const res = await reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-1", "Desain", db);
    expect(res.split).toEqual({ subscription: 5, topup: 0 });
    expect(res.balanceAfter).toBe(15);
    expect(await balanceOf(user.id)).toEqual({ sub: 5, topup: 10 });
  });

  it("mengambil sisa dari topupCredits jika subCredits kurang", async () => {
    const user = await createUser({ subCredits: 2, topupCredits: 10 });
    const res = await reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-2", "Desain", db);
    expect(res.split).toEqual({ subscription: 2, topup: 3 });
    expect(await balanceOf(user.id)).toEqual({ sub: 0, topup: 7 });

    const ledger = await db.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    expect(ledger.map((l) => [l.bucket, l.amount, l.balanceAfter])).toEqual([
      ["SUBSCRIPTION", -2, 10],
      ["TOPUP", -3, 7],
    ]);
  });

  it("menolak jika saldo kurang dan tidak mengubah apa pun", async () => {
    const user = await createUser({ subCredits: 2, topupCredits: 2 });
    await expect(
      reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-3", "Desain", db),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(await balanceOf(user.id)).toEqual({ sub: 2, topup: 2 });
    expect(await db.creditLedger.count({ where: { userId: user.id } })).toBe(0);
  });

  it("menolak cost yang bukan bilangan bulat positif", async () => {
    const user = await createUser({ subCredits: 10 });
    await expect(reserveCredits(user.id, 0, "USAGE_COPYWRITER", null, "x", db)).rejects.toBeInstanceOf(RangeError);
    await expect(reserveCredits(user.id, -1, "USAGE_COPYWRITER", null, "x", db)).rejects.toBeInstanceOf(RangeError);
    await expect(reserveCredits(user.id, 1.5, "USAGE_COPYWRITER", null, "x", db)).rejects.toBeInstanceOf(RangeError);
  });

  it("race condition: 2 request paralel saat saldo tepat 5 kredit, hanya 1 yang berhasil", async () => {
    const user = await createUser({ subCredits: 3, topupCredits: 2 });

    const results = await Promise.allSettled([
      reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-a", "Desain A", db),
      reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-b", "Desain B", db),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientCreditsError);

    expect(await balanceOf(user.id)).toEqual({ sub: 0, topup: 0 });
    const sum = await db.creditLedger.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(-5);
  });

  it("race condition: 10 request paralel 1 kredit dengan saldo 5, tepat 5 yang berhasil", async () => {
    const user = await createUser({ subCredits: 5 });
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        reserveCredits(user.id, 1, "USAGE_COPYWRITER", `job-${i}`, "Copy", db),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(await balanceOf(user.id)).toEqual({ sub: 0, topup: 0 });
  });
});

describe("refundCredits", () => {
  it("mengembalikan kredit ke bucket asal dan mencatat REFUND_FAILED_JOB", async () => {
    const user = await createUser({ subCredits: 2, topupCredits: 10 });
    const { split } = await reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-r", "Desain", db);
    const res = await refundCredits(user.id, 5, split, "job-r", "AI timeout", db);

    expect(res).toEqual({ refunded: true, balanceAfter: 12 });
    expect(await balanceOf(user.id)).toEqual({ sub: 2, topup: 10 });
    const refunds = await db.creditLedger.findMany({ where: { userId: user.id, type: "REFUND_FAILED_JOB" } });
    expect(refunds.map((r) => [r.bucket, r.amount]).sort()).toEqual([
      ["SUBSCRIPTION", 2],
      ["TOPUP", 3],
    ]);
  });

  it("idempoten: refund kedua untuk job yang sama tidak menambah saldo", async () => {
    const user = await createUser({ subCredits: 5 });
    const { split } = await reserveCredits(user.id, 5, "USAGE_DESIGN_HYBRID", "job-x", "Desain", db);
    await refundCredits(user.id, 5, split, "job-x", "error", db);
    const second = await refundCredits(user.id, 5, split, "job-x", "error", db);
    expect(second.refunded).toBe(false);
    expect(await balanceOf(user.id)).toEqual({ sub: 5, topup: 0 });
  });

  it("menolak pembagian bucket yang tidak cocok dengan jumlah", async () => {
    const user = await createUser({ subCredits: 5 });
    await expect(
      refundCredits(user.id, 5, { subscription: 1, topup: 1 }, "job-y", "x", db),
    ).rejects.toBeInstanceOf(RangeError);
  });
});

describe("grantCredits", () => {
  it("menambah kredit ke bucket yang dipilih dan mencatat ledger", async () => {
    const user = await createUser({ subCredits: 1 });
    await grantCredits(user.id, 100, "TOPUP", "TOPUP_PURCHASE", "pay-1", "Top-Up Mini", db);
    await grantCredits(user.id, 200, "SUBSCRIPTION", "SUBSCRIPTION_GRANT", "pay-2", "Starter", db);
    expect(await balanceOf(user.id)).toEqual({ sub: 201, topup: 100 });
    const last = await db.creditLedger.findFirstOrThrow({ where: { referenceId: "pay-2" } });
    expect(last.balanceAfter).toBe(301);
  });
});

describe("withReservedCredits", () => {
  it("auto-refund ketika eksekusi AI gagal", async () => {
    const user = await createUser({ subCredits: 5 });
    await expect(
      withReservedCredits(
        { userId: user.id, cost: 5, type: "USAGE_DESIGN_HYBRID", referenceId: "job-f", description: "Desain" },
        async () => {
          throw new Error("Provider down");
        },
        db,
      ),
    ).rejects.toThrow("Provider down");
    expect(await balanceOf(user.id)).toEqual({ sub: 5, topup: 0 });
  });

  it("tidak refund ketika eksekusi berhasil", async () => {
    const user = await createUser({ subCredits: 5 });
    const out = await withReservedCredits(
      { userId: user.id, cost: 1, type: "USAGE_COPYWRITER", referenceId: "job-s", description: "Copy" },
      async () => "ok",
      db,
    );
    expect(out).toBe("ok");
    expect(await balanceOf(user.id)).toEqual({ sub: 4, topup: 0 });
  });
});

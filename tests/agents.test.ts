import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { brandInputSchema } from "@/lib/validation/brand";
import { LOCAL_UPLOAD_DIR, storagePublicBaseUrl } from "@/lib/r2";
import { BrandNotFoundError, createBrand } from "@/services/brandService";
import { InsufficientCreditsError } from "@/services/creditService";
import { runCopywriter } from "@/services/copywriterService";
import { generateDesign, loadR2Image, rerenderDesign, UnsafeImageUrlError } from "@/services/designService";
import { createUser, resetDb, testPrisma } from "./helpers";

process.env.AI_TEXT_PROVIDER = "mock";
process.env.AI_IMAGE_PROVIDER = "mock";

const realFetch = globalThis.fetch;
beforeAll(() => {
  // Serve the local development store without running Next.js.
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    const base = storagePublicBaseUrl()!;
    if (url.startsWith(`${base}/`)) {
      const key = url.slice(base.length + 1);
      try {
        const data = await readFile(path.join(LOCAL_UPLOAD_DIR, key));
        return new Response(new Uint8Array(data), { headers: { "content-type": key.endsWith(".png") ? "image/png" : "image/jpeg" } });
      } catch {
        return new Response("nf", { status: 404 });
      }
    }
    return realFetch(input, init);
  });
});
beforeEach(resetDb);
afterAll(async () => {
  vi.restoreAllMocks();
  await testPrisma.$disconnect();
});

async function setup(credits: { subCredits?: number; topupCredits?: number } = { subCredits: 15 }) {
  const user = await createUser(credits);
  const brand = await createBrand(
    user.id,
    brandInputSchema.parse({
      name: "Kopi Senja",
      industry: "Kuliner & Minuman",
      targetAudience: "Pekerja muda",
      toneOfVoice: "SANTAI",
      primaryColor: "#3B2F2F",
      secondaryColor: "#D4A373",
      fontPreset: "MODERN_SANS",
      products: [{ id: "p1", name: "Es Kopi Susu Aren", price: 22000, benefits: ["Manis pas"] }],
    }),
    testPrisma,
  );
  return { user, brand };
}

async function balance(userId: string) {
  const u = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
  return u.subCredits + u.topupCredits;
}

const copyInput = (brandId: string, topic = "Promo gajian") => ({
  brandId,
  productId: "p1",
  topic,
  format: "CAPTION",
  framework: "AIDA",
  cta: "Order via WhatsApp",
});

describe("Agent Penulis", () => {
  it("memotong 1 kredit dan menyimpan 3 variasi", async () => {
    const { user, brand } = await setup();
    const res = await runCopywriter(user.id, copyInput(brand.id), testPrisma);
    expect(res.output.variations).toHaveLength(3);
    expect(await balance(user.id)).toBe(14);
    const job = await testPrisma.generationJob.findUniqueOrThrow({ where: { id: res.jobId } });
    expect(job).toMatchObject({ status: "COMPLETED", agentType: "COPYWRITER", creditCost: 1 });
  });

  it("auto-refund saat AI gagal dan job ditandai FAILED", async () => {
    const { user, brand } = await setup();
    await expect(runCopywriter(user.id, copyInput(brand.id, "__FAIL__"), testPrisma)).rejects.toThrow();
    expect(await balance(user.id)).toBe(15);
    const refund = await testPrisma.creditLedger.findFirst({ where: { userId: user.id, type: "REFUND_FAILED_JOB" } });
    expect(refund?.amount).toBe(1);
    const job = await testPrisma.generationJob.findFirstOrThrow({ where: { userId: user.id } });
    expect(job.status).toBe("FAILED");
  });

  it("menolak saat kredit habis", async () => {
    const { user, brand } = await setup({ subCredits: 0 });
    await expect(runCopywriter(user.id, copyInput(brand.id), testPrisma)).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("anti-IDOR: tidak bisa memakai brand milik user lain", async () => {
    const { brand } = await setup();
    const attacker = await createUser({ subCredits: 15 });
    await expect(runCopywriter(attacker.id, copyInput(brand.id), testPrisma)).rejects.toBeInstanceOf(BrandNotFoundError);
    expect(await balance(attacker.id)).toBe(15);
  });
});

const designInput = (brandId: string, concept = "kopi di meja kayu, cahaya pagi") => ({
  brandId,
  productId: "p1",
  concept,
  ratio: "4:5" as const,
  template: "HERO_PROMO" as const,
  logoPosition: "top-left" as const,
  content: { headline: "Es Kopi Susu Aren", subheadline: "Manis pas", price: "Rp 22.000", cta: "Pesan" },
});

describe("Agent Desain Hybrid", () => {
  it("memotong 5 kredit, menyimpan latar & hasil PNG", async () => {
    const { user, brand } = await setup();
    const res = await generateDesign(user.id, designInput(brand.id), testPrisma);
    expect(await balance(user.id)).toBe(10);
    expect(res.state.bgUrl).toContain(`/users/${user.id}/designs/`);
    expect(res.state.imageUrl).toMatch(/\.png$/);
  });

  it("auto-refund 5 kredit saat Layer 1 gagal", async () => {
    const { user, brand } = await setup();
    await expect(generateDesign(user.id, designInput(brand.id, "__FAIL__"), testPrisma)).rejects.toThrow();
    expect(await balance(user.id)).toBe(15);
  });

  it("live edit (render ulang) GRATIS: tidak mengubah saldo maupun ledger", async () => {
    const { user, brand } = await setup();
    const { jobId } = await generateDesign(user.id, designInput(brand.id), testPrisma);
    const ledgerBefore = await testPrisma.creditLedger.count({ where: { userId: user.id } });

    for (const template of ["SPLIT_PRODUCT", "MINIMALIST_BADGE", "BOLD_TYPOGRAPHY", "STORY_SHOWCASE"] as const) {
      const { png, state } = await rerenderDesign(
        user.id,
        { jobId, template, ratio: "9:16", content: { headline: "Typo sudah diperbaiki", price: "Rp 20.000" } },
        testPrisma,
      );
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(state.template).toBe(template);
    }
    expect(await balance(user.id)).toBe(10);
    expect(await testPrisma.creditLedger.count({ where: { userId: user.id } })).toBe(ledgerBefore);
  });

  it("anti-IDOR: user lain tidak bisa render ulang desain", async () => {
    const { user, brand } = await setup();
    const { jobId } = await generateDesign(user.id, designInput(brand.id), testPrisma);
    const attacker = await createUser();
    await expect(rerenderDesign(attacker.id, { jobId }, testPrisma)).rejects.toThrow("tidak ditemukan");
  });

  it("loadR2Image menolak URL di luar penyimpanan Kreatim (anti-SSRF)", async () => {
    const user = await createUser();
    await expect(loadR2Image("http://169.254.169.254/latest/meta-data", user.id)).rejects.toBeInstanceOf(UnsafeImageUrlError);
    await expect(loadR2Image("https://evil.example.com/a.png", user.id)).rejects.toBeInstanceOf(UnsafeImageUrlError);
  });
});

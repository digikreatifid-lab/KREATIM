import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { brandInputSchema, brandUpdateSchema } from "@/lib/validation/brand";
import {
  BrandNotFoundError,
  BrandQuotaExceededError,
  createBrand,
  deleteBrand,
  getBrand,
  InvalidAssetUrlError,
  listBrands,
  updateBrand,
} from "@/services/brandService";
import { buildBrandContextPrompt, getBrandContext } from "@/services/brandContextService";
import { createUser, resetDb, testPrisma } from "./helpers";

const R2 = "https://cdn.kreatim.test";
process.env.R2_PUBLIC_BASE_URL = R2;

function brandInput(overrides: Record<string, unknown> = {}) {
  return brandInputSchema.parse({
    name: "Kopi Senja",
    industry: "Kuliner & Minuman",
    targetAudience: "Pekerja muda 22-35 tahun di Jakarta",
    toneOfVoice: "SANTAI",
    usp: "Kopi susu gula aren tanpa pengawet",
    primaryColor: "#3B2F2F",
    secondaryColor: "#D4A373",
    fontPreset: "MODERN_SANS",
    products: [{ id: "p1", name: "Es Kopi Susu Aren", price: 22000, benefits: ["Manis pas", "Tanpa pengawet"] }],
    ...overrides,
  });
}

beforeEach(resetDb);
afterAll(() => testPrisma.$disconnect());

describe("brandService", () => {
  it("FREE_TRIAL hanya boleh 1 brand", async () => {
    const user = await createUser({ planTier: "FREE_TRIAL" });
    await createBrand(user.id, brandInput(), testPrisma);
    await expect(createBrand(user.id, brandInput({ name: "Brand Kedua" }), testPrisma)).rejects.toBeInstanceOf(BrandQuotaExceededError);
  });

  it("GROWTH boleh 3 brand, PRO boleh 10 brand", async () => {
    const growth = await createUser({ planTier: "GROWTH" });
    for (let i = 0; i < 3; i++) await createBrand(growth.id, brandInput({ name: `Brand ${i}` }), testPrisma);
    await expect(createBrand(growth.id, brandInput(), testPrisma)).rejects.toBeInstanceOf(BrandQuotaExceededError);

    const pro = await createUser({ planTier: "PRO" });
    for (let i = 0; i < 10; i++) await createBrand(pro.id, brandInput({ name: `Brand ${i}` }), testPrisma);
    await expect(createBrand(pro.id, brandInput(), testPrisma)).rejects.toBeInstanceOf(BrandQuotaExceededError);
  });

  it("kuota tidak bisa dibobol dengan request paralel", async () => {
    const user = await createUser({ planTier: "STARTER" });
    const results = await Promise.allSettled([
      createBrand(user.id, brandInput({ name: "A1" }), testPrisma),
      createBrand(user.id, brandInput({ name: "A2" }), testPrisma),
      createBrand(user.id, brandInput({ name: "A3" }), testPrisma),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await testPrisma.brandProfile.count({ where: { userId: user.id } })).toBe(1);
  });

  it("brand yang dihapus tidak dihitung dalam kuota", async () => {
    const user = await createUser();
    const brand = await createBrand(user.id, brandInput(), testPrisma);
    await deleteBrand(user.id, brand.id, testPrisma);
    await expect(createBrand(user.id, brandInput({ name: "Baru" }), testPrisma)).resolves.toBeTruthy();
  });

  it("anti-IDOR: user lain tidak bisa membaca, mengubah, atau menghapus brand", async () => {
    const owner = await createUser();
    const attacker = await createUser();
    const brand = await createBrand(owner.id, brandInput(), testPrisma);
    await expect(getBrand(attacker.id, brand.id, testPrisma)).rejects.toBeInstanceOf(BrandNotFoundError);
    await expect(updateBrand(attacker.id, brand.id, { name: "Dibajak" }, testPrisma)).rejects.toBeInstanceOf(BrandNotFoundError);
    await expect(deleteBrand(attacker.id, brand.id, testPrisma)).rejects.toBeInstanceOf(BrandNotFoundError);
    expect(await listBrands(attacker.id, testPrisma)).toEqual([]);
    expect((await getBrand(owner.id, brand.id, testPrisma)).name).toBe("Kopi Senja");
  });

  it("PATCH sebagian tidak menghapus katalog produk", async () => {
    const user = await createUser();
    const brand = await createBrand(user.id, brandInput(), testPrisma);
    const updated = await updateBrand(user.id, brand.id, brandUpdateSchema.parse({ name: "Kopi Fajar" }), testPrisma);
    expect(updated.name).toBe("Kopi Fajar");
    expect(updated.products).toHaveLength(1);
  });

  it("menolak URL logo/foto di luar R2 Kreatim atau milik user lain", async () => {
    const user = await createUser();
    await expect(
      createBrand(user.id, brandInput({ logoUrl: "https://evil.example.com/logo.png" }), testPrisma),
    ).rejects.toBeInstanceOf(InvalidAssetUrlError);
    await expect(
      createBrand(user.id, brandInput({ logoUrl: `${R2}/users/someoneelse/logos/a.png` }), testPrisma),
    ).rejects.toBeInstanceOf(InvalidAssetUrlError);
    const ok = await createBrand(user.id, brandInput({ logoUrl: `${R2}/users/${user.id}/logos/a.png` }), testPrisma);
    expect(ok.logoUrl).toContain(user.id);
  });

  it("validasi: warna harus Hex dan maksimal 3 manfaat produk", () => {
    expect(brandInputSchema.safeParse({ ...brandInput(), primaryColor: "red" }).success).toBe(false);
    expect(
      brandInputSchema.safeParse({
        ...brandInput(),
        products: [{ id: "x", name: "X", price: 1, benefits: ["a", "b", "c", "d"] }],
      }).success,
    ).toBe(false);
  });
});

describe("brandContextService", () => {
  it("menyusun ringkasan JSON Brand Brain untuk prompt", async () => {
    const user = await createUser();
    const brand = await createBrand(
      user.id,
      brandInput({ mustUseKeywords: ["gula aren"], forbiddenWords: ["murahan"] }),
      testPrisma,
    );
    const ctx = await getBrandContext(brand.id, user.id, testPrisma);
    expect(ctx.brand).toMatchObject({ name: "Kopi Senja", toneOfVoice: "Santai / Akrab", mustUseKeywords: ["gula aren"], forbiddenWords: ["murahan"] });
    expect(ctx.visual.primaryColor).toBe("#3B2F2F");
    expect(ctx.products[0]).toEqual({ id: "p1", name: "Es Kopi Susu Aren", priceIdr: 22000, benefits: ["Manis pas", "Tanpa pengawet"] });

    const prompt = await buildBrandContextPrompt(brand.id, user.id, testPrisma);
    expect(JSON.parse(prompt)).toEqual(ctx);
  });

  it("menolak brand milik user lain", async () => {
    const owner = await createUser();
    const other = await createUser();
    const brand = await createBrand(owner.id, brandInput(), testPrisma);
    await expect(getBrandContext(brand.id, other.id, testPrisma)).rejects.toBeInstanceOf(BrandNotFoundError);
  });
});

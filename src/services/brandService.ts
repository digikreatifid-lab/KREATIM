import type { BrandProfile, Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { BRAND_LIMIT } from "@/lib/plans";
import { isKreatimR2Url } from "@/lib/r2";
import { lockUserBalance } from "@/services/creditService";
import { parseProducts, type BrandInput, type BrandUpdate, type Product } from "@/lib/validation/brand";

export class BrandQuotaExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`Paket kamu hanya bisa menyimpan ${limit} brand. Upgrade paket untuk menambah brand.`);
    this.name = "BrandQuotaExceededError";
  }
}

export class BrandNotFoundError extends Error {
  constructor() {
    super("Brand tidak ditemukan.");
    this.name = "BrandNotFoundError";
  }
}

export class InvalidAssetUrlError extends Error {
  constructor(field: string) {
    super(`URL gambar pada "${field}" harus berasal dari penyimpanan Kreatim.`);
    this.name = "InvalidAssetUrlError";
  }
}

export type BrandDto = Omit<BrandProfile, "productsJson"> & { products: Product[] };

export function toBrandDto(brand: BrandProfile): BrandDto {
  const { productsJson, ...rest } = brand;
  return { ...rest, products: parseProducts(productsJson) };
}

function assertOwnedAssetUrls(userId: string, input: BrandUpdate) {
  if (input.logoUrl && !isKreatimR2Url(input.logoUrl, userId)) throw new InvalidAssetUrlError("logo");
  for (const p of input.products ?? []) {
    if (p.imageUrl && !isKreatimR2Url(p.imageUrl, userId)) throw new InvalidAssetUrlError(`foto ${p.name}`);
  }
}

function toData(input: BrandUpdate): Prisma.BrandProfileUncheckedUpdateInput {
  const { products, ...rest } = input;
  return {
    ...rest,
    ...(products !== undefined ? { productsJson: products as unknown as Prisma.InputJsonValue } : {}),
  };
}

export async function listBrands(userId: string, db: PrismaClient = defaultPrisma) {
  const brands = await db.brandProfile.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return brands.map(toBrandDto);
}

/** Always scoped by userId, so another user's brand id returns "not found" (anti-IDOR). */
export async function getBrand(userId: string, brandId: string, db: PrismaClient = defaultPrisma) {
  const brand = await db.brandProfile.findFirst({ where: { id: brandId, userId, isActive: true } });
  if (!brand) throw new BrandNotFoundError();
  return toBrandDto(brand);
}

export async function createBrand(userId: string, input: BrandInput, db: PrismaClient = defaultPrisma) {
  assertOwnedAssetUrls(userId, input);
  return db.$transaction(async (tx) => {
    // Lock the user row so two parallel creates cannot both pass the quota check.
    await lockUserBalance(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { planTier: true } });
    const limit = BRAND_LIMIT[user.planTier];
    const count = await tx.brandProfile.count({ where: { userId, isActive: true } });
    if (count >= limit) throw new BrandQuotaExceededError(limit);

    const { products, ...rest } = input;
    const brand = await tx.brandProfile.create({
      data: { ...rest, userId, productsJson: products as unknown as Prisma.InputJsonValue },
    });
    return toBrandDto(brand);
  });
}

export async function updateBrand(userId: string, brandId: string, input: BrandUpdate, db: PrismaClient = defaultPrisma) {
  assertOwnedAssetUrls(userId, input);
  const result = await db.brandProfile.updateMany({
    where: { id: brandId, userId, isActive: true },
    data: toData(input) as Prisma.BrandProfileUpdateManyMutationInput,
  });
  if (result.count === 0) throw new BrandNotFoundError();
  return getBrand(userId, brandId, db);
}

/**
 * Soft delete: generated jobs keep their history. The brand stops counting
 * toward the plan quota.
 */
export async function deleteBrand(userId: string, brandId: string, db: PrismaClient = defaultPrisma) {
  const result = await db.brandProfile.updateMany({
    where: { id: brandId, userId, isActive: true },
    data: { isActive: false },
  });
  if (result.count === 0) throw new BrandNotFoundError();
}

export async function getBrandUsage(userId: string, db: PrismaClient = defaultPrisma) {
  const [user, count] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { planTier: true } }),
    db.brandProfile.count({ where: { userId, isActive: true } }),
  ]);
  return { used: count, limit: BRAND_LIMIT[user.planTier] };
}

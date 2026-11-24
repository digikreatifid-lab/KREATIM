import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { FONT_PRESETS, toneLabel } from "@/lib/brand-options";
import { BrandNotFoundError, toBrandDto } from "@/services/brandService";

export type BrandContext = {
  brand: {
    name: string;
    industry: string;
    usp: string | null;
    targetAudience: string;
    toneOfVoice: string;
    mustUseKeywords: string[];
    forbiddenWords: string[];
  };
  visual: {
    primaryColor: string;
    secondaryColor: string;
    fontPreset: string;
    hasLogo: boolean;
  };
  products: { id: string; name: string; priceIdr: number; benefits: string[] }[];
};

/**
 * Builds the structured Brand Brain summary that is injected into every agent
 * prompt (PRD §3.1 "Context Injector"). Pass `userId` from the session to
 * enforce ownership.
 */
export async function getBrandContext(brandId: string, userId?: string, db: PrismaClient = defaultPrisma): Promise<BrandContext> {
  const row = await db.brandProfile.findFirst({
    where: { id: brandId, isActive: true, ...(userId ? { userId } : {}) },
  });
  if (!row) throw new BrandNotFoundError();
  const brand = toBrandDto(row);
  const font = FONT_PRESETS.find((f) => f.value === brand.fontPreset);

  return {
    brand: {
      name: brand.name,
      industry: brand.industry,
      usp: brand.usp ?? null,
      targetAudience: brand.targetAudience,
      toneOfVoice: toneLabel(brand.toneOfVoice),
      mustUseKeywords: brand.mustUseKeywords,
      forbiddenWords: brand.forbiddenWords,
    },
    visual: {
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      fontPreset: font ? `${font.label} (${font.heading} / ${font.body})` : brand.fontPreset,
      hasLogo: Boolean(brand.logoUrl),
    },
    products: brand.products.map((p) => ({ id: p.id, name: p.name, priceIdr: p.price, benefits: p.benefits })),
  };
}

/** JSON string ready to drop into a system prompt. */
export async function buildBrandContextPrompt(brandId: string, userId?: string, db: PrismaClient = defaultPrisma): Promise<string> {
  const context = await getBrandContext(brandId, userId, db);
  return JSON.stringify(context, null, 2);
}

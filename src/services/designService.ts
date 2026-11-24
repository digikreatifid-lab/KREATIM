import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { generateBackground, type Ratio } from "@/lib/ai/image";
import { CREDIT_COST } from "@/lib/plans";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { buildObjectKey, isKreatimR2Url, putObject } from "@/lib/r2";
import { getBrand, type BrandDto } from "@/services/brandService";
import { withReservedCredits } from "@/services/creditService";
import { getOwnedJob } from "@/services/jobService";
import { LOGO_POSITIONS, renderDesign, TEMPLATES, type DesignContent, type LogoPosition, type TemplateId } from "@/services/satoriRenderer";

const templateIds = TEMPLATES.map((t) => t.value) as [TemplateId, ...TemplateId[]];

export const designContentSchema = z.object({
  headline: z.string().trim().min(1, "Headline wajib diisi.").max(80),
  subheadline: z.string().trim().max(140).optional(),
  price: z.string().trim().max(24).optional(),
  cta: z.string().trim().max(28).optional(),
});

export const designGenerateSchema = z.object({
  brandId: z.string().min(1),
  productId: z.string().max(64).optional().nullable(),
  concept: z.string().trim().min(3, "Ceritakan konsep visualnya.").max(400),
  ratio: z.enum(["4:5", "9:16"]),
  template: z.enum(templateIds),
  logoPosition: z.enum(LOGO_POSITIONS).default("top-left"),
  content: designContentSchema,
});
export type DesignGenerateInput = z.infer<typeof designGenerateSchema>;

export const designRenderSchema = z.object({
  jobId: z.string().min(1),
  ratio: z.enum(["4:5", "9:16"]).optional(),
  template: z.enum(templateIds).optional(),
  logoPosition: z.enum(LOGO_POSITIONS).optional(),
  content: designContentSchema.optional(),
});
export type DesignRenderInput = z.infer<typeof designRenderSchema>;

export type DesignState = {
  bgUrl: string;
  imageUrl?: string;
  ratio: Ratio;
  template: TemplateId;
  logoPosition: LogoPosition;
  content: DesignContent;
};

export class UnsafeImageUrlError extends Error {
  constructor() {
    super("Gambar hanya boleh berasal dari penyimpanan Kreatim.");
    this.name = "UnsafeImageUrlError";
  }
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Fetch an image for Satori ONLY from Kreatim's own storage, inside the owner's
 * folder, and hand it over as a data URI (anti-SSRF, CLAUDE.md §4).
 */
export async function loadR2Image(url: string, userId: string): Promise<string> {
  if (!isKreatimR2Url(url, userId)) throw new UnsafeImageUrlError();
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "error" });
  if (!res.ok) throw new Error(`Gagal memuat gambar (${res.status}).`);
  const type = res.headers.get("content-type") ?? "";
  if (!/^image\/(png|jpeg|webp)/.test(type)) throw new UnsafeImageUrlError();
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error("Gambar terlalu besar.");
  return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
}

function buildImagePrompt(brand: BrandDto, concept: string, productName?: string) {
  return [
    concept,
    productName ? `featuring ${productName}` : null,
    `for a ${brand.industry} brand`,
    `color palette inspired by ${brand.primaryColor} and ${brand.secondaryColor}`,
  ]
    .filter(Boolean)
    .join(", ");
}

async function renderState(userId: string, brand: BrandDto, state: DesignState) {
  const [background, logo] = await Promise.all([
    loadR2Image(state.bgUrl, userId),
    brand.logoUrl ? loadR2Image(brand.logoUrl, userId).catch(() => null) : Promise.resolve(null),
  ]);
  return renderDesign({
    template: state.template,
    ratio: state.ratio,
    background,
    logo,
    logoPosition: state.logoPosition,
    brand: { primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor, fontPreset: brand.fontPreset },
    content: state.content,
  });
}

/**
 * Agent Desain Hybrid (PRD §3.3): reserve 5 credits -> Layer 1 AI background
 * (no text) -> store on R2 -> first Layer 2 render. Any failure refunds.
 */
export async function generateDesign(userId: string, input: DesignGenerateInput, db: PrismaClient = defaultPrisma) {
  const brand = await getBrand(userId, input.brandId, db);
  const product = input.productId ? brand.products.find((p) => p.id === input.productId) : undefined;

  const job = await db.generationJob.create({
    data: {
      userId,
      brandId: brand.id,
      agentType: "DESIGN_HYBRID",
      creditCost: CREDIT_COST.DESIGN_HYBRID,
      status: "PROCESSING",
      inputPayload: input as unknown as Prisma.InputJsonValue,
    },
  });

  try {
    const result = await withReservedCredits(
      {
        userId,
        cost: CREDIT_COST.DESIGN_HYBRID,
        type: "USAGE_DESIGN_HYBRID",
        referenceId: job.id,
        description: `Agent Desain: ${input.content.headline.slice(0, 60)}`,
      },
      async (reservation) => {
        const bg = await generateBackground({
          prompt: buildImagePrompt(brand, input.concept, product?.name),
          ratio: input.ratio,
          primaryColor: brand.primaryColor,
          secondaryColor: brand.secondaryColor,
        });
        const bgType = bg.contentType.includes("png") ? "image/png" : bg.contentType.includes("webp") ? "image/webp" : "image/jpeg";
        const bgUrl = await putObject(buildObjectKey(userId, "designs", bgType), bg.data, bgType);

        const state: DesignState = {
          bgUrl,
          ratio: input.ratio,
          template: input.template,
          logoPosition: input.logoPosition,
          content: input.content,
        };
        const png = await renderState(userId, brand, state);
        state.imageUrl = await putObject(buildObjectKey(userId, "designs", "image/png"), png, "image/png");
        return { state, balanceAfter: reservation.balanceAfter };
      },
      db,
    );

    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", outputPayload: result.state as unknown as Prisma.InputJsonValue },
    });
    return { jobId: job.id, ...result };
  } catch (error) {
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "unknown" },
    });
    throw error;
  }
}

/** Live edit: re-runs Layer 2 only. Never touches credits. */
export async function rerenderDesign(userId: string, input: DesignRenderInput, db: PrismaClient = defaultPrisma) {
  const job = await getOwnedJob(userId, input.jobId, "DESIGN_HYBRID", db);
  if (job.status !== "COMPLETED" || !job.outputPayload) throw new Error("Desain belum selesai dibuat.");
  const previous = job.outputPayload as unknown as DesignState;
  const brand = await getBrand(userId, job.brandId, db);

  const state: DesignState = {
    ...previous,
    ratio: input.ratio ?? previous.ratio,
    template: input.template ?? previous.template,
    logoPosition: input.logoPosition ?? previous.logoPosition,
    content: input.content ?? previous.content,
  };
  const png = await renderState(userId, brand, state);
  await db.generationJob.update({
    where: { id: job.id },
    data: { outputPayload: state as unknown as Prisma.InputJsonValue },
  });
  return { png, state };
}

import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { COPY_FORMATS, COPY_FRAMEWORKS, type CopyOutput } from "@/lib/ai/copy-schema";
import { generateCopy } from "@/lib/ai/text";
import { CREDIT_COST } from "@/lib/plans";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { getBrandContext } from "@/services/brandContextService";
import { withReservedCredits } from "@/services/creditService";

export const copywriterInputSchema = z
  .object({
    brandId: z.string().min(1),
    productId: z.string().max(64).optional().nullable(),
    topic: z.string().trim().max(500).optional().nullable(),
    format: z.enum(COPY_FORMATS.map((f) => f.value) as [string, ...string[]]),
    framework: z.enum(COPY_FRAMEWORKS.map((f) => f.value) as [string, ...string[]]),
    cta: z.string().trim().max(80).optional().nullable(),
  })
  .refine((v) => Boolean(v.productId) || Boolean(v.topic?.trim()), {
    message: "Pilih produk atau tulis topik bebas.",
    path: ["topic"],
  });
export type CopywriterInput = z.infer<typeof copywriterInputSchema>;

const FORMAT_GUIDE: Record<string, string> = {
  CAPTION: "Caption Instagram/TikTok: 80-150 kata, hook kuat di kalimat pertama, boleh emoji secukupnya, sertakan hashtag.",
  AD_COPY: "Ad copy Meta/Google: body maks 125 karakter untuk teks utama, headline maks 40 karakter, sangat fokus pada manfaat dan CTA. Hashtag boleh kosong.",
  VIDEO_SCRIPT: "Skrip video 30 detik: tulis body sebagai adegan bernomor dengan durasi (0-3 dtk hook, dst) berisi visual + voice over. Hashtag boleh kosong.",
  MARKETPLACE: "Deskripsi marketplace (Shopee/Tokopedia): paragraf pembuka singkat lalu poin manfaat/spesifikasi dengan bullet '•'. Tanpa hashtag.",
};

const FRAMEWORK_GUIDE: Record<string, string> = {
  AIDA: "Attention - Interest - Desire - Action",
  PAS: "Problem - Agitate - Solution",
  HOOK_STORY_OFFER: "Hook - Story - Offer",
};

export function buildCopyPrompt(brandContextJson: string, input: CopywriterInput, productName?: string) {
  const system = [
    "Kamu adalah copywriter senior untuk UMKM dan brand lokal Indonesia.",
    "Tulis dalam bahasa Indonesia yang natural, luwes, dan sesuai tone of voice brand, bukan terjemahan kaku.",
    "Wajib memakai kata kunci wajib brand bila relevan dan TIDAK PERNAH memakai kata terlarang.",
    "Jangan mengarang klaim kesehatan, harga, atau promo yang tidak ada di data brand.",
    "Hasilkan tepat 3 variasi yang berbeda sudut pandangnya.",
    "",
    "Data Brand Brain (JSON):",
    brandContextJson,
  ].join("\n");

  const user = [
    `Format: ${FORMAT_GUIDE[input.format]}`,
    `Framework: ${FRAMEWORK_GUIDE[input.framework]}`,
    productName ? `Produk yang dipromosikan: ${productName} (lihat detail di data brand).` : null,
    input.topic ? `Topik / konteks tambahan: ${input.topic}` : null,
    input.cta ? `CTA utama yang diinginkan: ${input.cta}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export type CopywriterResult = { jobId: string; output: CopyOutput; balanceAfter: number };

/**
 * Agent Penulis: Reserve 1 credit -> call the LLM -> save job, or refund and
 * mark the job FAILED when the provider errors (PRD §3.2, CLAUDE.md §3).
 */
export async function runCopywriter(userId: string, input: CopywriterInput, db: PrismaClient = defaultPrisma): Promise<CopywriterResult> {
  const context = await getBrandContext(input.brandId, userId, db);
  const product = input.productId ? context.products.find((p) => p.id === input.productId) : undefined;
  const prompt = buildCopyPrompt(JSON.stringify(context, null, 2), input, product?.name);

  const job = await db.generationJob.create({
    data: {
      userId,
      brandId: input.brandId,
      agentType: "COPYWRITER",
      creditCost: CREDIT_COST.COPYWRITER,
      status: "PROCESSING",
      inputPayload: input as unknown as Prisma.InputJsonValue,
    },
  });

  let balanceAfter = 0;
  try {
    const output = await withReservedCredits(
      {
        userId,
        cost: CREDIT_COST.COPYWRITER,
        type: "USAGE_COPYWRITER",
        referenceId: job.id,
        description: `Agent Penulis: ${product?.name ?? input.topic?.slice(0, 60) ?? "copy"}`,
      },
      async (reservation) => {
        balanceAfter = reservation.balanceAfter;
        return generateCopy(prompt);
      },
      db,
    );
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", outputPayload: output as unknown as Prisma.InputJsonValue },
    });
    return { jobId: job.id, output, balanceAfter };
  } catch (error) {
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "unknown" },
    });
    throw error;
  }
}

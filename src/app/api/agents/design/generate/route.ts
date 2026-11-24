import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { R2NotConfiguredError } from "@/lib/r2";
import { BrandNotFoundError } from "@/services/brandService";
import { InsufficientCreditsError } from "@/services/creditService";
import { designGenerateSchema, generateDesign } from "@/services/designService";

export const maxDuration = 180;

export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  if (!rateLimit(`design:${userId}`, 5, 60_000)) throw new HttpError(429, "Terlalu banyak permintaan. Coba lagi sebentar.");
  const input = await parseJson(req, designGenerateSchema);
  try {
    const { jobId, state, balanceAfter } = await generateDesign(userId, input);
    return NextResponse.json({ jobId, design: state, balanceAfter });
  } catch (error) {
    if (error instanceof BrandNotFoundError) throw new HttpError(404, error.message);
    if (error instanceof InsufficientCreditsError) throw error;
    if (error instanceof R2NotConfiguredError) throw new HttpError(503, `${error.message} Kredit sudah dikembalikan.`);
    if (error instanceof AiProviderError) {
      throw new HttpError(502, "Agent Desain sedang bermasalah. Kredit kamu sudah dikembalikan otomatis.");
    }
    console.error("[design.generate]", error);
    throw new HttpError(500, "Gagal membuat desain. Kredit kamu sudah dikembalikan otomatis.");
  }
});

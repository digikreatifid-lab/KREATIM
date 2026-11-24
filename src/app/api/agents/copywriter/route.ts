import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { BrandNotFoundError } from "@/services/brandService";
import { copywriterInputSchema, runCopywriter } from "@/services/copywriterService";

export const maxDuration = 90;

export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  if (!rateLimit(`copy:${userId}`, 10, 60_000)) throw new HttpError(429, "Terlalu banyak permintaan. Coba lagi sebentar.");
  const input = await parseJson(req, copywriterInputSchema);
  try {
    const result = await runCopywriter(userId, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BrandNotFoundError) throw new HttpError(404, error.message);
    if (error instanceof AiProviderError) {
      throw new HttpError(502, "Agent Penulis sedang bermasalah. Kredit kamu sudah dikembalikan otomatis.");
    }
    throw error;
  }
});

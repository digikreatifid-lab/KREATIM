import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { BrandNotFoundError } from "@/services/brandService";
import { designRenderSchema, rerenderDesign, UnsafeImageUrlError } from "@/services/designService";
import { JobNotFoundError } from "@/services/jobService";

/** Live edit (Layer 2 only). 0 credits by design: never call creditService here. */
export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  if (!rateLimit(`render:${userId}`, 60, 60_000)) throw new HttpError(429, "Terlalu banyak perubahan sekaligus. Tunggu sebentar.");
  const input = await parseJson(req, designRenderSchema);
  try {
    const { png } = await rerenderDesign(userId, input);
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store", "Content-Length": String(png.length) },
    });
  } catch (error) {
    if (error instanceof JobNotFoundError || error instanceof BrandNotFoundError) throw new HttpError(404, error.message);
    if (error instanceof UnsafeImageUrlError) throw new HttpError(422, error.message);
    throw error;
  }
});

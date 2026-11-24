import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { ALLOWED_IMAGE_TYPES, createPresignedUpload, MAX_UPLOAD_BYTES, R2NotConfiguredError } from "@/lib/r2";

const presignSchema = z.object({
  kind: z.enum(["logo", "product"]),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, { message: "Format harus PNG, JPG, atau WebP." }),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES, { message: "Ukuran file maksimal 5 MB." }),
});

export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  const input = await parseJson(req, presignSchema);
  try {
    const upload = await createPresignedUpload({ userId, ...input });
    return NextResponse.json(upload);
  } catch (error) {
    if (error instanceof R2NotConfiguredError) throw new HttpError(503, error.message);
    throw error;
  }
});

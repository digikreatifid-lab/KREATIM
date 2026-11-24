import { NextResponse } from "next/server";
import { handleRoute, HttpError } from "@/lib/api";
import { isSafeObjectKey, verifyLocalUploadToken, writeLocalUpload } from "@/lib/r2";

/** Development-only stand-in for a presigned R2 PUT. Disabled in production. */
export const PUT = handleRoute(async (req: Request) => {
  if (process.env.NODE_ENV === "production") throw new HttpError(404, "Not found");
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const contentType = url.searchParams.get("contentType") ?? "";
  const size = Number(url.searchParams.get("size"));
  const expires = Number(url.searchParams.get("expires"));
  const token = url.searchParams.get("token") ?? "";
  if (!isSafeObjectKey(key) || !verifyLocalUploadToken({ key, contentType, size, expires, token })) {
    throw new HttpError(403, "Token upload tidak valid atau kedaluwarsa.");
  }
  if (req.headers.get("content-type") !== contentType) throw new HttpError(400, "Content-Type tidak sesuai.");
  const body = Buffer.from(await req.arrayBuffer());
  if (body.length !== size) throw new HttpError(400, "Ukuran file tidak sesuai.");
  await writeLocalUpload(key, body);
  return new NextResponse(null, { status: 200 });
});

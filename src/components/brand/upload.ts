"use client";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Presign on our API, then PUT the file straight to Cloudflare R2. Returns the public URL. */
export async function uploadImage(file: File, kind: "logo" | "product"): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Format harus PNG, JPG, atau WebP.");
  if (file.size > MAX) throw new Error("Ukuran file maksimal 5 MB.");

  const presign = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const data = await presign.json().catch(() => ({}));
  if (!presign.ok) throw new Error(data.error ?? "Gagal menyiapkan upload.");

  const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("Upload ke penyimpanan gagal. Coba lagi.");
  return data.publicUrl as string;
}

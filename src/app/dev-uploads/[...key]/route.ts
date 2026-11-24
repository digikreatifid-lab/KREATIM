import { readFile } from "node:fs/promises";
import path from "node:path";
import { isSafeObjectKey, LOCAL_UPLOAD_DIR } from "@/lib/r2";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Serves files from the local development store. Always 404 in production. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const key = (await params).key.join("/");
  if (!isSafeObjectKey(key)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(LOCAL_UPLOAD_DIR, key));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": TYPES[key.split(".").pop()!] ?? "application/octet-stream", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

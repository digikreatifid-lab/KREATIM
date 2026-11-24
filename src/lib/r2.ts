import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 helper (S3-compatible). PRD §4: logos, product photos and
 * rendered designs live here; serving them has zero egress cost.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export type UploadKind = "logo" | "product";

const EXTENSION: Record<AllowedImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export class R2NotConfiguredError extends Error {
  constructor() {
    super("Penyimpanan Cloudflare R2 belum dikonfigurasi (cek variabel R2_* di .env).");
    this.name = "R2NotConfiguredError";
  }
}

function r2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new R2NotConfiguredError();
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl: publicBaseUrl.replace(/\/+$/, "") };
}

let client: S3Client | null = null;
function r2Client() {
  const env = r2Env();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
  });
  return { client, env };
}

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Object keys are always namespaced by user so one user can never overwrite another's files. */
export function buildObjectKey(userId: string, folder: string, contentType: AllowedImageType) {
  if (!/^[a-z0-9]+$/i.test(userId)) throw new Error("userId tidak valid untuk object key");
  return `users/${userId}/${folder}/${randomUUID()}.${EXTENSION[contentType]}`;
}

export function publicUrlForKey(key: string) {
  return `${r2Env().publicBaseUrl}/${key}`;
}

/**
 * Presigned PUT URL valid for 5 minutes. Content-Type and Content-Length are
 * part of the signature, so the browser must upload exactly the declared file.
 */
export async function createPresignedUpload(params: {
  userId: string;
  kind: UploadKind;
  contentType: AllowedImageType;
  size: number;
}) {
  if (params.size <= 0 || params.size > MAX_UPLOAD_BYTES) throw new RangeError("Ukuran file maksimal 5 MB.");
  const { client, env } = r2Client();
  const key = buildObjectKey(params.userId, params.kind === "logo" ? "logos" : "products", params.contentType);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      ContentType: params.contentType,
      ContentLength: params.size,
    }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  return { key, uploadUrl, publicUrl: `${env.publicBaseUrl}/${key}` };
}

/** Server-side upload (AI backgrounds and rendered designs). */
export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string) {
  const { client, env } = r2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${env.publicBaseUrl}/${key}`;
}

/**
 * True only for https URLs on Kreatim's own R2 public domain. Every image URL
 * that reaches Satori or is stored on a brand must pass this check (anti-SSRF).
 * When `userId` is given, the object must also live in that user's folder.
 */
export function isKreatimR2Url(url: string, userId?: string, publicBaseUrl = process.env.R2_PUBLIC_BASE_URL): boolean {
  if (!publicBaseUrl) return false;
  let target: URL;
  let base: URL;
  try {
    target = new URL(url);
    base = new URL(publicBaseUrl);
  } catch {
    return false;
  }
  if (target.protocol !== "https:" || target.host !== base.host) return false;
  if (target.username || target.password || target.search || target.hash) return false;
  const basePath = base.pathname.replace(/\/+$/, "");
  if (!target.pathname.startsWith(`${basePath}/users/`)) return false;
  if (target.pathname.includes("..") || target.pathname.includes("%")) return false;
  if (userId && !target.pathname.startsWith(`${basePath}/users/${userId}/`)) return false;
  return true;
}

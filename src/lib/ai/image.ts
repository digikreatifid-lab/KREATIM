import { Resvg } from "@resvg/resvg-js";
import { AI_TIMEOUT_MS, AiProviderError } from "./errors";
import { assertMockAllowed } from "./text";

/**
 * Layer 1 visual engine (PRD §3.3): background images WITHOUT any text.
 * AI_IMAGE_PROVIDER: "fal" (Flux via Fal.ai), "gemini" (Gemini image model),
 * or "mock" (local gradient, no API key needed).
 */

export type Ratio = "4:5" | "9:16";
export const RATIO_SIZE: Record<Ratio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

export type ImageProvider = "fal" | "gemini" | "mock";

export function imageProvider(): ImageProvider {
  const explicit = process.env.AI_IMAGE_PROVIDER as ImageProvider | undefined;
  if (explicit) return explicit;
  if (process.env.FAL_KEY) return "fal";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

export const NO_TEXT_SUFFIX =
  "clean commercial photography, minimalist studio background, soft natural lighting, generous empty space for text overlay, strictly NO text, NO typography, NO letters, NO logo, NO watermark";

export type BackgroundRequest = { prompt: string; ratio: Ratio; primaryColor: string; secondaryColor: string };
export type GeneratedImage = { data: Buffer; contentType: string };

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

async function download(url: string): Promise<GeneratedImage> {
  const res = await fetch(url, { signal: AbortSignal.timeout(AI_TIMEOUT_MS) });
  if (!res.ok) throw new AiProviderError(`Gagal mengunduh gambar AI (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new AiProviderError("Gambar AI terlalu besar.");
  return { data: buf, contentType: res.headers.get("content-type") ?? "image/jpeg" };
}

async function viaFal(req: BackgroundRequest): Promise<GeneratedImage> {
  const key = process.env.FAL_KEY;
  if (!key) throw new AiProviderError("FAL_KEY belum di-set.");
  const model = process.env.FAL_IMAGE_MODEL ?? "fal-ai/flux/dev";
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(AI_TIMEOUT_MS * 2),
    body: JSON.stringify({
      prompt: `${req.prompt}. ${NO_TEXT_SUFFIX}`,
      image_size: req.ratio === "4:5" ? { width: 1024, height: 1280 } : { width: 1080, height: 1920 },
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
    }),
  }).catch((error) => {
    throw new AiProviderError("Gagal menghubungi Fal.ai.", { cause: error });
  });
  if (!res.ok) throw new AiProviderError(`Fal.ai error ${res.status}.`);
  const data = (await res.json()) as { images?: { url?: string }[] };
  const url = data.images?.[0]?.url;
  if (!url) throw new AiProviderError("Fal.ai tidak mengembalikan gambar.");
  return download(url);
}

async function viaGemini(req: BackgroundRequest): Promise<GeneratedImage> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiProviderError("GEMINI_API_KEY belum di-set.");
  const model = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(AI_TIMEOUT_MS * 2),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${req.prompt}. ${NO_TEXT_SUFFIX}` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: req.ratio } },
    }),
  }).catch((error) => {
    throw new AiProviderError("Gagal menghubungi Gemini.", { cause: error });
  });
  if (!res.ok) throw new AiProviderError(`Gemini image error ${res.status}.`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new AiProviderError("Gemini tidak mengembalikan gambar.");
  return { data: Buffer.from(part.inlineData.data, "base64"), contentType: part.inlineData.mimeType ?? "image/png" };
}

/** Deterministic soft gradient in brand colours, for development without an image API. */
function viaMock(req: BackgroundRequest): GeneratedImage {
  assertMockAllowed();
  if (req.prompt.includes("__FAIL__")) throw new AiProviderError("Mock image provider gagal (simulasi).");
  const { width, height } = RATIO_SIZE[req.ratio];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${req.secondaryColor}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="${req.primaryColor}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#F8FAFC"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${width * 0.75}" cy="${height * 0.3}" r="${width * 0.28}" fill="#ffffff" fill-opacity="0.18"/>
    <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.35}" fill="${req.secondaryColor}" fill-opacity="0.25"/>
  </svg>`;
  const png = new Resvg(svg).render().asPng();
  return { data: Buffer.from(png), contentType: "image/png" };
}

export async function generateBackground(req: BackgroundRequest): Promise<GeneratedImage> {
  switch (imageProvider()) {
    case "fal":
      return viaFal(req);
    case "gemini":
      return viaGemini(req);
    default:
      return viaMock(req);
  }
}

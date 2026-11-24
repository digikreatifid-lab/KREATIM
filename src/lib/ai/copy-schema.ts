import { z } from "zod";

export const COPY_FORMATS = [
  { value: "CAPTION", label: "Caption IG / TikTok" },
  { value: "AD_COPY", label: "Ad Copy Meta / Google" },
  { value: "VIDEO_SCRIPT", label: "Skrip Video 30 Detik" },
  { value: "MARKETPLACE", label: "Deskripsi Marketplace" },
] as const;

export const COPY_FRAMEWORKS = [
  { value: "AIDA", label: "AIDA" },
  { value: "PAS", label: "PAS (Problem-Agitate-Solution)" },
  { value: "HOOK_STORY_OFFER", label: "Hook-Story-Offer" },
] as const;

export type CopyFormat = (typeof COPY_FORMATS)[number]["value"];
export type CopyFramework = (typeof COPY_FRAMEWORKS)[number]["value"];

export const copyVariationSchema = z.object({
  headline: z.string().describe("Judul pendek / hook, maks 60 karakter, cocok jadi headline desain"),
  subheadline: z.string().describe("Sub-headline pendukung, maks 90 karakter"),
  body: z.string().describe("Isi copy lengkap sesuai format yang diminta"),
  cta: z.string().describe("Kalimat ajakan bertindak singkat"),
  hashtags: z.array(z.string()).describe("0-8 hashtag relevan tanpa spasi, diawali #"),
});

export const copyOutputSchema = z.object({
  variations: z.array(copyVariationSchema).describe("Tepat 3 variasi copy yang berbeda sudut pandangnya"),
});

export type CopyVariation = z.infer<typeof copyVariationSchema>;
export type CopyOutput = z.infer<typeof copyOutputSchema>;

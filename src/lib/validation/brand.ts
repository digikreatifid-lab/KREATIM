import { z } from "zod";
import { FONT_PRESETS, TONE_OPTIONS } from "@/lib/brand-options";

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const tones = TONE_OPTIONS.map((t) => t.value) as [string, ...string[]];
const fonts = FONT_PRESETS.map((f) => f.value) as [string, ...string[]];

const wordList = z.array(z.string().trim().min(1).max(40)).max(20, { message: "Maksimal 20 kata." });

export const productSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(80),
  price: z.number().int().min(0).max(1_000_000_000),
  benefits: z.array(z.string().trim().min(1).max(120)).max(3, { message: "Maksimal 3 manfaat utama." }).default([]),
  imageUrl: z.url().nullable().optional(),
});
export type Product = z.infer<typeof productSchema>;

const brandFields = {
  name: z.string().trim().min(2, "Nama brand minimal 2 karakter.").max(60),
  industry: z.string().trim().min(2).max(60),
  targetAudience: z.string().trim().min(3, "Ceritakan target audiens kamu.").max(300),
  toneOfVoice: z.enum(tones),
  usp: z.string().trim().max(500).optional().nullable(),
  mustUseKeywords: wordList,
  forbiddenWords: wordList,
  primaryColor: z.string().regex(HEX_COLOR, "Gunakan format Hex, contoh #0F172A."),
  secondaryColor: z.string().regex(HEX_COLOR, "Gunakan format Hex, contoh #0F766E."),
  fontPreset: z.enum(fonts),
  logoUrl: z.url().nullable().optional(),
  products: z.array(productSchema).max(50),
};

export const brandInputSchema = z.object({
  ...brandFields,
  mustUseKeywords: brandFields.mustUseKeywords.default([]),
  forbiddenWords: brandFields.forbiddenWords.default([]),
  products: brandFields.products.default([]),
});
export type BrandInput = z.infer<typeof brandInputSchema>;

/** PATCH schema: no defaults, so omitted fields are left untouched. */
export const brandUpdateSchema = z.object(brandFields).partial();
export type BrandUpdate = z.infer<typeof brandUpdateSchema>;

/** Parses the `productsJson` column defensively (legacy or malformed rows become []). */
export function parseProducts(value: unknown): Product[] {
  const parsed = z.array(productSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

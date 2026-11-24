import type { Product } from "@/lib/validation/brand";

export type BrandFormState = {
  name: string;
  industry: string;
  targetAudience: string;
  toneOfVoice: string;
  usp: string;
  mustUseKeywords: string[];
  forbiddenWords: string[];
  primaryColor: string;
  secondaryColor: string;
  fontPreset: string;
  logoUrl: string | null;
  products: Product[];
};

export const EMPTY_BRAND: BrandFormState = {
  name: "",
  industry: "",
  targetAudience: "",
  toneOfVoice: "SANTAI",
  usp: "",
  mustUseKeywords: [],
  forbiddenWords: [],
  primaryColor: "#0F172A",
  secondaryColor: "#0F766E",
  fontPreset: "MODERN_SANS",
  logoUrl: null,
  products: [],
};

export function newProduct(): Product {
  return { id: crypto.randomUUID(), name: "", price: 0, benefits: [], imageUrl: null };
}

export function toPayload(state: BrandFormState) {
  return {
    ...state,
    usp: state.usp.trim() || null,
    products: state.products.map((p) => ({ ...p, benefits: p.benefits.filter((b) => b.trim()) })),
  };
}

export type ApiErrorBody = { error?: string; details?: { path?: (string | number)[]; message?: string }[] };

export function describeApiError(body: ApiErrorBody, fallback: string) {
  const first = body.details?.[0];
  if (first?.message) return `${body.error ?? fallback} ${first.path?.join(".") ?? ""}: ${first.message}`.trim();
  return body.error ?? fallback;
}

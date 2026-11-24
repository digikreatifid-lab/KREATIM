/** Options shown in the Brand Brain forms (PRD §3.1). Safe to import from client components. */

export const TONE_OPTIONS = [
  { value: "SANTAI", label: "Santai / Akrab" },
  { value: "PROFESIONAL", label: "Profesional" },
  { value: "ELEGAN", label: "Elegan" },
  { value: "JENAKA", label: "Jenaka" },
  { value: "PERSUASIF", label: "Persuasif" },
] as const;
export type ToneValue = (typeof TONE_OPTIONS)[number]["value"];

export const INDUSTRY_OPTIONS = [
  "Fesyen & Aksesoris",
  "Kuliner & Minuman",
  "Kecantikan & Skincare",
  "Kesehatan",
  "Rumah Tangga & Dekorasi",
  "Jasa Lokal",
  "Pendidikan & Kursus",
  "Teknologi & Gadget",
  "Lainnya",
] as const;

/** Five safe font pairings (heading / body). The same ids drive the Satori renderer. */
export const FONT_PRESETS = [
  { value: "MODERN_SANS", label: "Modern Sans", heading: "Plus Jakarta Sans", body: "Inter" },
  { value: "ELEGANT_SERIF", label: "Elegant Serif", heading: "Playfair Display", body: "Inter" },
  { value: "BOLD_DISPLAY", label: "Bold Display", heading: "Montserrat", body: "Inter" },
  { value: "FRIENDLY_ROUNDED", label: "Friendly Rounded", heading: "Poppins", body: "Poppins" },
  { value: "CLASSIC_MIX", label: "Classic Mix", heading: "DM Serif Display", body: "DM Sans" },
] as const;
export type FontPresetValue = (typeof FONT_PRESETS)[number]["value"];

export function toneLabel(value: string) {
  return TONE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

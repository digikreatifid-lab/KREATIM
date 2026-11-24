import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { RATIO_SIZE, type Ratio } from "@/lib/ai/image";

/**
 * Layer 2 deterministic template engine (PRD §3.3): Satori lays out text,
 * price, CTA and logo over the Layer 1 background, resvg rasterises to PNG.
 * No credits are involved here: re-rendering is free.
 *
 * Images must already be data URIs (see designService.loadR2Image), so
 * Satori never fetches arbitrary URLs.
 */

export const TEMPLATES = [
  { value: "HERO_PROMO", label: "Hero Promo" },
  { value: "SPLIT_PRODUCT", label: "Split Product" },
  { value: "MINIMALIST_BADGE", label: "Minimalist Badge" },
  { value: "BOLD_TYPOGRAPHY", label: "Bold Typography" },
  { value: "STORY_SHOWCASE", label: "Story Showcase" },
] as const;
export type TemplateId = (typeof TEMPLATES)[number]["value"];

export const LOGO_POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type LogoPosition = (typeof LOGO_POSITIONS)[number];

export type DesignContent = {
  headline: string;
  subheadline?: string;
  price?: string;
  cta?: string;
};

export type RenderInput = {
  template: TemplateId;
  ratio: Ratio;
  background: string; // data URI
  logo?: string | null; // data URI
  logoPosition: LogoPosition;
  brand: { primaryColor: string; secondaryColor: string; fontPreset: string };
  content: DesignContent;
};

// ---------- fonts ----------

type FontDef = { name: string; data: Buffer; weight: 400 | 600 | 700 | 800 | 900; style: "normal" };

const FONT_FILES: { name: string; file: string; weight: FontDef["weight"] }[] = [
  { name: "Plus Jakarta Sans", file: "plus-jakarta-sans-latin-700-normal.woff", weight: 700 },
  { name: "Plus Jakarta Sans", file: "plus-jakarta-sans-latin-800-normal.woff", weight: 800 },
  { name: "Inter", file: "inter-latin-400-normal.woff", weight: 400 },
  { name: "Inter", file: "inter-latin-600-normal.woff", weight: 600 },
  { name: "Inter", file: "inter-latin-700-normal.woff", weight: 700 },
  { name: "Playfair Display", file: "playfair-display-latin-700-normal.woff", weight: 700 },
  { name: "Playfair Display", file: "playfair-display-latin-800-normal.woff", weight: 800 },
  { name: "Montserrat", file: "montserrat-latin-700-normal.woff", weight: 700 },
  { name: "Montserrat", file: "montserrat-latin-900-normal.woff", weight: 900 },
  { name: "Poppins", file: "poppins-latin-400-normal.woff", weight: 400 },
  { name: "Poppins", file: "poppins-latin-600-normal.woff", weight: 600 },
  { name: "Poppins", file: "poppins-latin-700-normal.woff", weight: 700 },
  { name: "DM Serif Display", file: "dm-serif-display-latin-400-normal.woff", weight: 400 },
  { name: "DM Sans", file: "dm-sans-latin-400-normal.woff", weight: 400 },
  { name: "DM Sans", file: "dm-sans-latin-700-normal.woff", weight: 700 },
];

let fontCache: Promise<FontDef[]> | null = null;
function loadFonts(): Promise<FontDef[]> {
  fontCache ??= Promise.all(
    FONT_FILES.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: "normal" as const,
      data: await readFile(path.join(process.cwd(), "assets", "fonts", f.file)),
    })),
  );
  return fontCache;
}

const PRESET_FONTS: Record<string, { heading: string; headingWeight: number; body: string; uppercase?: boolean }> = {
  MODERN_SANS: { heading: "Plus Jakarta Sans", headingWeight: 800, body: "Inter" },
  ELEGANT_SERIF: { heading: "Playfair Display", headingWeight: 700, body: "Inter" },
  BOLD_DISPLAY: { heading: "Montserrat", headingWeight: 900, body: "Inter", uppercase: true },
  FRIENDLY_ROUNDED: { heading: "Poppins", headingWeight: 700, body: "Poppins" },
  CLASSIC_MIX: { heading: "DM Serif Display", headingWeight: 400, body: "DM Sans" },
};

// ---------- tiny element helper (Satori accepts React-like objects) ----------

type Style = Record<string, string | number | undefined>;
type Node = { type: string; props: Record<string, unknown> } | string | null | false;

function h(type: string, style: Style, ...children: Node[]): Node {
  const kids = children.filter((c) => c !== null && c !== false && c !== "");
  return { type, props: { style: { display: "flex", ...style }, children: kids.length === 1 ? kids[0] : kids } };
}

function img(src: string, style: Style): Node {
  return { type: "img", props: { src, style } };
}

// ---------- shared pieces ----------

type Ctx = {
  W: number;
  H: number;
  tall: boolean;
  primary: string;
  secondary: string;
  font: (typeof PRESET_FONTS)[string];
  c: DesignContent;
};

function headline(ctx: Ctx, size: number, color: string, extra: Style = {}) {
  return h(
    "div",
    {
      fontFamily: ctx.font.heading,
      fontWeight: ctx.font.headingWeight,
      fontSize: size,
      lineHeight: 1.08,
      color,
      letterSpacing: ctx.font.uppercase ? -1 : -0.5,
      textTransform: ctx.font.uppercase ? "uppercase" : undefined,
      ...extra,
    },
    ctx.c.headline,
  );
}

function sub(ctx: Ctx, size: number, color: string, extra: Style = {}) {
  if (!ctx.c.subheadline) return null;
  return h("div", { fontFamily: ctx.font.body, fontWeight: 400, fontSize: size, lineHeight: 1.35, color, ...extra }, ctx.c.subheadline);
}

function pricePill(ctx: Ctx, bg: string, color: string, size = 40) {
  if (!ctx.c.price) return null;
  return h(
    "div",
    { fontFamily: ctx.font.body, fontWeight: 700, fontSize: size, color, background: bg, padding: "14px 30px", borderRadius: 999, alignSelf: "flex-start" },
    ctx.c.price,
  );
}

function ctaButton(ctx: Ctx, bg: string, color: string, size = 34) {
  if (!ctx.c.cta) return null;
  return h(
    "div",
    { fontFamily: ctx.font.body, fontWeight: 700, fontSize: size, color, background: bg, padding: "18px 38px", borderRadius: 16 },
    ctx.c.cta,
  );
}

function bgImage(src: string, style: Style = {}) {
  return img(src, { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", ...style });
}

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ---------- templates ----------

function heroPromo(ctx: Ctx, bg: string) {
  return h(
    "div",
    { width: ctx.W, height: ctx.H, position: "relative", background: ctx.primary },
    bgImage(bg),
    h("div", {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "62%",
      backgroundImage: `linear-gradient(to bottom, ${hexToRgba(ctx.primary, 0)}, ${hexToRgba(ctx.primary, 0.92)})`,
    }),
    h(
      "div",
      { position: "absolute", left: 80, right: 80, bottom: ctx.tall ? 200 : 96, flexDirection: "column", gap: 26 },
      headline(ctx, ctx.tall ? 104 : 92, "#FFFFFF"),
      sub(ctx, 38, "rgba(255,255,255,0.88)"),
      h("div", { gap: 20, alignItems: "center", marginTop: 12 }, pricePill(ctx, ctx.secondary, "#FFFFFF"), ctaButton(ctx, "#FFFFFF", ctx.primary)),
    ),
  );
}

function splitProduct(ctx: Ctx, bg: string) {
  const imageH = Math.round(ctx.H * (ctx.tall ? 0.56 : 0.58));
  return h(
    "div",
    { width: ctx.W, height: ctx.H, flexDirection: "column", background: ctx.primary },
    h("div", { width: ctx.W, height: imageH, position: "relative" }, bgImage(bg)),
    h(
      "div",
      { flex: 1, flexDirection: "column", justifyContent: "center", padding: "0 80px", gap: 24, background: ctx.primary },
      h("div", { width: 90, height: 8, borderRadius: 4, background: ctx.secondary }),
      headline(ctx, ctx.tall ? 88 : 76, "#FFFFFF"),
      sub(ctx, 34, "rgba(255,255,255,0.85)"),
      h("div", { gap: 20, alignItems: "center", marginTop: 8 }, pricePill(ctx, ctx.secondary, "#FFFFFF", 36), ctaButton(ctx, "#FFFFFF", ctx.primary, 30)),
    ),
  );
}

function minimalistBadge(ctx: Ctx, bg: string) {
  return h(
    "div",
    { width: ctx.W, height: ctx.H, position: "relative", background: "#F8FAFC" },
    bgImage(bg),
    ctx.c.price
      ? h(
          "div",
          {
            position: "absolute",
            top: ctx.tall ? 220 : 130,
            right: 70,
            width: 250,
            height: 250,
            borderRadius: 999,
            background: ctx.secondary,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
            fontFamily: ctx.font.heading,
            fontWeight: ctx.font.headingWeight,
            fontSize: ctx.c.price.length > 9 ? 36 : 46,
            color: "#FFFFFF",
            transform: "rotate(-8deg)",
          },
          ctx.c.price,
        )
      : null,
    h(
      "div",
      {
        position: "absolute",
        left: 64,
        right: 64,
        bottom: ctx.tall ? 180 : 64,
        flexDirection: "column",
        gap: 20,
        background: "rgba(255,255,255,0.94)",
        borderRadius: 32,
        padding: "52px 56px",
      },
      headline(ctx, ctx.tall ? 80 : 70, ctx.primary),
      sub(ctx, 32, "#475569"),
      h("div", { marginTop: 10 }, ctaButton(ctx, ctx.primary, "#FFFFFF", 30)),
    ),
  );
}

function boldTypography(ctx: Ctx, bg: string) {
  const frame = ctx.tall ? 700 : 450;
  return h(
    "div",
    { width: ctx.W, height: ctx.H, flexDirection: "column", background: ctx.primary, padding: ctx.tall ? "280px 72px 200px" : "180px 72px 80px", gap: 36 },
    headline(ctx, ctx.tall ? 136 : 118, "#FFFFFF", { textTransform: "uppercase", letterSpacing: -2, lineHeight: 0.98 }),
    h("div", { width: ctx.W - 144, height: frame, position: "relative", borderRadius: 28, overflow: "hidden" }, bgImage(bg)),
    h(
      "div",
      { justifyContent: "space-between", alignItems: "center", gap: 24 },
      h("div", { flexDirection: "column", flex: 1, gap: 18 }, sub(ctx, 34, "rgba(255,255,255,0.85)"), pricePill(ctx, ctx.secondary, "#FFFFFF", 36)),
      ctaButton(ctx, "#FFFFFF", ctx.primary, 32),
    ),
  );
}

function storyShowcase(ctx: Ctx, bg: string) {
  return h(
    "div",
    { width: ctx.W, height: ctx.H, position: "relative", background: ctx.primary },
    bgImage(bg),
    h("div", {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "38%",
      backgroundImage: `linear-gradient(to bottom, ${hexToRgba(ctx.primary, 0.9)}, ${hexToRgba(ctx.primary, 0)})`,
    }),
    h(
      "div",
      { position: "absolute", top: ctx.tall ? 300 : 190, left: 72, right: 72, flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center" },
      headline(ctx, ctx.tall ? 96 : 80, "#FFFFFF", { textAlign: "center", justifyContent: "center" }),
      sub(ctx, 36, "rgba(255,255,255,0.9)", { textAlign: "center", justifyContent: "center" }),
    ),
    h(
      "div",
      {
        position: "absolute",
        left: 72,
        right: 72,
        bottom: ctx.tall ? 210 : 80,
        justifyContent: "space-between",
        alignItems: "center",
        background: ctx.secondary,
        borderRadius: 999,
        padding: "16px 16px 16px 44px",
      },
      h("div", { fontFamily: ctx.font.body, fontWeight: 700, fontSize: 40, color: "#FFFFFF" }, ctx.c.price ?? ""),
      ctaButton(ctx, "#FFFFFF", ctx.primary, 32),
    ),
  );
}

const RENDERERS: Record<TemplateId, (ctx: Ctx, bg: string) => Node> = {
  HERO_PROMO: heroPromo,
  SPLIT_PRODUCT: splitProduct,
  MINIMALIST_BADGE: minimalistBadge,
  BOLD_TYPOGRAPHY: boldTypography,
  STORY_SHOWCASE: storyShowcase,
};

function logoNode(logo: string, position: LogoPosition, W: number, H: number, tall: boolean): Node {
  const inset = 56;
  const vInset = tall ? 140 : inset;
  const pos: Style = {
    position: "absolute",
    ...(position.startsWith("top") ? { top: vInset } : { bottom: vInset }),
    ...(position.endsWith("left") ? { left: inset } : { right: inset }),
  };
  return h(
    "div",
    { ...pos, background: "rgba(255,255,255,0.92)", borderRadius: 18, padding: "14px 20px", maxWidth: W * 0.32 },
    img(logo, { height: Math.round(H * 0.045), maxWidth: W * 0.28, objectFit: "contain" }),
  );
}

/** Renders a design to a PNG buffer at full resolution (1080×1350 or 1080×1920). */
export async function renderDesign(input: RenderInput): Promise<Buffer> {
  const { width: W, height: H } = RATIO_SIZE[input.ratio];
  const ctx: Ctx = {
    W,
    H,
    tall: input.ratio === "9:16",
    primary: input.brand.primaryColor,
    secondary: input.brand.secondaryColor,
    font: PRESET_FONTS[input.brand.fontPreset] ?? PRESET_FONTS.MODERN_SANS,
    c: input.content,
  };
  const body = RENDERERS[input.template](ctx, input.background);
  const root = h(
    "div",
    { width: W, height: H, position: "relative" },
    body,
    input.logo ? logoNode(input.logo, input.logoPosition, W, H, ctx.tall) : null,
  );

  const svg = await satori(root as Parameters<typeof satori>[0], { width: W, height: H, fonts: await loadFonts() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
}

import { FONT_PRESETS } from "@/lib/brand-options";
import type { BrandFormState } from "./types";

const PREVIEW_FONT: Record<string, string> = {
  MODERN_SANS: "ui-sans-serif, system-ui, sans-serif",
  ELEGANT_SERIF: "Georgia, 'Times New Roman', serif",
  BOLD_DISPLAY: "ui-sans-serif, system-ui, sans-serif",
  FRIENDLY_ROUNDED: "ui-rounded, 'Segoe UI', sans-serif",
  CLASSIC_MIX: "Georgia, serif",
};

/** Live mini feed post (4:5) showing how brand colours, logo and font combine. */
export function BrandPreview({ brand }: { brand: Pick<BrandFormState, "name" | "primaryColor" | "secondaryColor" | "fontPreset" | "logoUrl" | "products"> }) {
  const product = brand.products.find((p) => p.name) ?? null;
  const font = FONT_PRESETS.find((f) => f.value === brand.fontPreset);
  return (
    <div className="grid gap-2">
      <div
        className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[24px] p-5 text-white shadow-[0_30px_50px_-30px_rgb(36_26_75/0.6)]"
        style={{ background: `linear-gradient(160deg, ${brand.primaryColor} 0%, ${brand.primaryColor} 55%, ${brand.secondaryColor} 100%)`, fontFamily: PREVIEW_FONT[brand.fontPreset] }}
      >
        <div className="flex items-center gap-2">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt="Logo" className="h-8 w-auto max-w-24 rounded bg-white/90 object-contain p-1" />
          ) : (
            <span className="rounded bg-white/15 px-2 py-1 text-xs">LOGO</span>
          )}
          <span className="text-sm font-medium opacity-90">{brand.name || "Nama Brand"}</span>
        </div>
        <div className="grid gap-2">
          <p className={brand.fontPreset === "BOLD_DISPLAY" ? "text-2xl font-black uppercase leading-tight" : "text-2xl font-semibold leading-tight"}>
            {product?.name || "Headline promo kamu di sini"}
          </p>
          <p className="text-sm opacity-80">{product?.benefits[0] || "Sub-headline singkat yang menjual."}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: brand.secondaryColor }}>
              {product ? `Rp ${product.price.toLocaleString("id-ID")}` : "Rp 99.000"}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold" style={{ color: brand.primaryColor }}>
              Pesan Sekarang
            </span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Pratinjau feed 4:5 · {font ? `${font.heading} / ${font.body}` : brand.fontPreset}
      </p>
    </div>
  );
}

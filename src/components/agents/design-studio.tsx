"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Palette, RefreshCw, Sparkles } from "lucide-react";
import { Starfield } from "@/components/cosmos/starfield";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BrandProductPicker, type BrandOption } from "./brand-product-picker";

const TEMPLATE_OPTIONS = [
  { value: "HERO_PROMO", label: "Hero Promo" },
  { value: "SPLIT_PRODUCT", label: "Split Product" },
  { value: "MINIMALIST_BADGE", label: "Minimalist Badge" },
  { value: "BOLD_TYPOGRAPHY", label: "Bold Typography" },
  { value: "STORY_SHOWCASE", label: "Story Showcase" },
] as const;

const LOGO_OPTIONS = [
  { value: "top-left", label: "Kiri atas" },
  { value: "top-right", label: "Kanan atas" },
  { value: "bottom-left", label: "Kiri bawah" },
  { value: "bottom-right", label: "Kanan bawah" },
] as const;

type Ratio = "4:5" | "9:16";
export type DesignContent = { headline: string; subheadline: string; price: string; cta: string };
export type ExistingDesign = {
  jobId: string;
  brandId: string;
  imageUrl?: string;
  ratio: Ratio;
  template: string;
  logoPosition: string;
  content: Partial<DesignContent>;
};

function cleanContent(c: DesignContent) {
  return {
    headline: c.headline.trim(),
    ...(c.subheadline.trim() ? { subheadline: c.subheadline.trim() } : {}),
    ...(c.price.trim() ? { price: c.price.trim() } : {}),
    ...(c.cta.trim() ? { cta: c.cta.trim() } : {}),
  };
}

function formatPrice(price: number) {
  return price ? `Rp ${price.toLocaleString("id-ID")}` : "";
}

export function DesignStudio({
  brands,
  initial,
  existing,
}: {
  brands: BrandOption[];
  initial: { brandId?: string; productId?: string; headline?: string; subheadline?: string; cta?: string };
  existing?: ExistingDesign | null;
}) {
  const router = useRouter();
  const startBrand = brands.find((b) => b.id === (existing?.brandId ?? initial.brandId)) ?? brands[0];
  const startProduct = startBrand?.products.find((p) => p.id === initial.productId);

  const [sel, setSel] = useState({ brandId: startBrand?.id ?? "", productId: startProduct?.id ?? "" });
  const [concept, setConcept] = useState("");
  const [ratio, setRatio] = useState<Ratio>(existing?.ratio ?? "4:5");
  const [template, setTemplate] = useState<string>(existing?.template ?? "HERO_PROMO");
  const [logoPosition, setLogoPosition] = useState<string>(existing?.logoPosition ?? "top-left");
  const [content, setContent] = useState<DesignContent>({
    headline: existing?.content.headline ?? initial.headline ?? startProduct?.name ?? "",
    subheadline: existing?.content.subheadline ?? initial.subheadline ?? "",
    price: existing?.content.price ?? formatPrice(startProduct?.price ?? 0),
    cta: existing?.content.cta ?? initial.cta ?? "Pesan Sekarang",
  });
  const [jobId, setJobId] = useState<string | null>(existing?.jobId ?? null);
  const [preview, setPreview] = useState<string | null>(existing?.imageUrl ?? null);
  const [busy, setBusy] = useState<"generate" | "render" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Preview is always a same-origin blob from the free render endpoint, so "Download PNG" saves the latest edit.
  const objectUrl = useRef<string | null>(null);

  const render = useCallback(async () => {
    if (!jobId || !content.headline.trim()) return;
    setBusy("render");
    setError(null);
    try {
      const res = await fetch("/api/agents/design/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ratio, template, logoPosition, content: cleanContent(content) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return setError(body.error ?? "Gagal memperbarui pratinjau.");
      }
      const blob = await res.blob();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setPreview(objectUrl.current);
    } finally {
      setBusy((b) => (b === "render" ? null : b));
    }
  }, [jobId, ratio, template, logoPosition, content]);

  // Live edit: debounce re-render (0 credits) whenever text/template/ratio changes.
  useEffect(() => {
    if (!jobId) return;
    const t = setTimeout(render, 450);
    return () => clearTimeout(t);
  }, [render, jobId]);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  async function generate() {
    setError(null);
    if (concept.trim().length < 3) return setError("Ceritakan konsep visualnya, contoh: kopi di meja kayu dengan cahaya pagi.");
    if (!content.headline.trim()) return setError("Headline wajib diisi.");
    setBusy("generate");
    try {
      const res = await fetch("/api/agents/design/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: sel.brandId, productId: sel.productId || null, concept, ratio, template, logoPosition, content: cleanContent(content) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Gagal membuat desain.");
      setJobId(body.jobId);
      setPreview(body.design.imageUrl);
      router.replace(`/dashboard/design?job=${body.jobId}`, { scroll: false });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const patch = (p: Partial<DesignContent>) => setContent((c) => ({ ...c, ...p }));
  const aspect = ratio === "4:5" ? "aspect-[4/5]" : "aspect-[9/16]";

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card className="lg:self-start">
        <CardHeader>
          <CardTitle>{jobId ? "Edit desain" : "Buat desain baru"}</CardTitle>
          <CardDescription>
            {jobId ? "Ubah teks, harga, template, atau rasio. Live edit GRATIS (0 kredit)." : "AI membuat latar bersih (5 kredit), teks & logo ditempel presisi."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!jobId && (
            <>
              <BrandProductPicker
                brands={brands}
                brandId={sel.brandId}
                productId={sel.productId}
                onChange={(v) => {
                  setSel(v);
                  const p = brands.find((b) => b.id === v.brandId)?.products.find((x) => x.id === v.productId);
                  if (p) patch({ price: formatPrice(p.price), headline: content.headline || p.name });
                }}
              />
              <div className="grid gap-2">
                <Label htmlFor="concept">Konsep visual latar</Label>
                <Textarea id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} maxLength={400}
                  placeholder="Contoh: segelas es kopi di meja kayu, cahaya pagi hangat, daun hijau di sudut" />
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label>Rasio</Label>
            <div className="flex gap-2">
              {(["4:5", "9:16"] as const).map((r) => (
                <button key={r} type="button" aria-pressed={ratio === r} onClick={() => setRatio(r)}
                  className={cn("flex-1 rounded-2xl border border-input bg-white px-3 py-2.5 text-sm", ratio === r ? "border-aurora bg-accent font-semibold text-accent-foreground" : "hover:bg-secondary")}>
                  {r === "4:5" ? "4:5 Feed (1080×1350)" : "9:16 Story (1080×1920)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_OPTIONS.map((t) => (
                <button key={t.value} type="button" aria-pressed={template === t.value} onClick={() => setTemplate(t.value)}
                  className={cn("rounded-2xl border border-input bg-white px-3 py-2.5 text-left text-sm", template === t.value ? "border-aurora bg-accent font-semibold text-accent-foreground" : "hover:bg-secondary")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={content.headline} maxLength={80} onChange={(e) => patch({ headline: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subheadline">Sub-headline</Label>
            <Input id="subheadline" value={content.subheadline} maxLength={140} onChange={(e) => patch({ subheadline: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="price">Harga / badge</Label>
              <Input id="price" value={content.price} maxLength={24} onChange={(e) => patch({ price: e.target.value })} placeholder="Rp 99.000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cta-btn">Tombol CTA</Label>
              <Input id="cta-btn" value={content.cta} maxLength={28} onChange={(e) => patch({ cta: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Posisi logo</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {LOGO_OPTIONS.map((l) => (
                <button key={l.value} type="button" aria-pressed={logoPosition === l.value} onClick={() => setLogoPosition(l.value)}
                  className={cn("rounded-2xl border border-input bg-white px-2 py-2 text-xs", logoPosition === l.value ? "border-aurora bg-accent font-semibold text-accent-foreground" : "hover:bg-secondary")}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {!jobId ? (
            <Button variant="brand" onClick={generate} disabled={busy !== null || !sel.brandId}>
              {busy === "generate" ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {busy === "generate" ? "AI sedang membuat latar..." : "Generate desain (5 kredit)"}
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/dashboard/design"><RefreshCw /> Buat desain baru</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid content-start justify-items-center gap-4">
        <div className={cn("relative w-full max-w-[440px] cosmos overflow-hidden rounded-[22px] shadow-[0_40px_60px_-40px_rgb(13_18_48/0.6)]", aspect)}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau desain" className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/70">
              <Starfield density={0.9} />
              {busy === "generate" ? <Loader2 className="relative size-7 animate-spin text-comet" /> : <Palette className="relative size-7 text-comet" />}
              {busy === "generate" ? "Membuat latar AI dan menyusun desain..." : "Isi konsep dan headline, desainnya muncul di sini."}
            </div>
          )}
          {busy === "render" && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs">
              <Loader2 className="size-3 animate-spin" /> Memperbarui
            </span>
          )}
        </div>
        {preview && (
          <Button variant="brand" asChild>
            <a href={preview} download={`kreatim-${template.toLowerCase()}-${ratio.replace(":", "x")}.png`}>
              <Download /> Download PNG ({ratio === "4:5" ? "1080×1350" : "1080×1920"})
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

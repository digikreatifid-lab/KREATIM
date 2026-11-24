"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Loader2, Palette, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COPY_FORMATS, COPY_FRAMEWORKS, type CopyVariation } from "@/lib/ai/copy-schema";
import { ClayBuddy } from "@/components/clay/clay";
import { cn } from "@/lib/utils";
import { BrandProductPicker, type BrandOption } from "./brand-product-picker";

function variationText(v: CopyVariation) {
  return [v.headline, "", v.body, "", v.cta, v.hashtags.length ? `\n${v.hashtags.join(" ")}` : ""].join("\n").trim();
}

export function CopywriterStudio({ brands }: { brands: BrandOption[] }) {
  const router = useRouter();
  const [sel, setSel] = useState({ brandId: brands[0]?.id ?? "", productId: brands[0]?.products[0]?.id ?? "" });
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<string>("CAPTION");
  const [framework, setFramework] = useState<string>("AIDA");
  const [cta, setCta] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ jobId: string; variations: CopyVariation[] } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);

  async function generate() {
    setError(null);
    if (!sel.productId && !topic.trim()) return setError("Pilih produk atau tulis topik bebas.");
    setBusy(true);
    try {
      const res = await fetch("/api/agents/copywriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: sel.brandId, productId: sel.productId || null, topic: topic || null, format, framework, cta: cta || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Gagal membuat copy.");
      setResult({ jobId: body.jobId, variations: body.output.variations });
      setFavorite(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!result) return;
    const next = !favorite;
    const res = await fetch(`/api/jobs/${result.jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });
    if (res.ok) {
      setFavorite(next);
      router.refresh();
    }
  }

  function designHref(v: CopyVariation) {
    const qs = new URLSearchParams({ brandId: sel.brandId, headline: v.headline.slice(0, 80), subheadline: v.subheadline.slice(0, 140), cta: v.cta.slice(0, 28) });
    if (sel.productId) qs.set("productId", sel.productId);
    return `/dashboard/design?${qs}`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="lg:self-start">
        <CardHeader>
          <CardTitle>Brief</CardTitle>
          <CardDescription>1 kredit untuk 3 variasi copy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <BrandProductPicker brands={brands} brandId={sel.brandId} productId={sel.productId} onChange={setSel} />
          <div className="grid gap-2">
            <Label htmlFor="topic">Topik / konteks</Label>
            <Textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: promo gajian, diskon 20% khusus akhir pekan" maxLength={500} />
          </div>
          <div className="grid gap-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {COPY_FORMATS.map((f) => (
                <button key={f.value} type="button" aria-pressed={format === f.value} onClick={() => setFormat(f.value)}
                  className={cn("rounded-2xl border border-input bg-white px-3 py-2.5 text-left text-sm", format === f.value ? "border-ink bg-lilac/50 font-semibold" : "hover:bg-secondary")}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Framework</Label>
            <div className="flex flex-wrap gap-2">
              {COPY_FRAMEWORKS.map((f) => (
                <button key={f.value} type="button" aria-pressed={framework === f.value} onClick={() => setFramework(f.value)}
                  className={cn("rounded-full border border-input bg-white px-3 py-1.5 text-sm", framework === f.value ? "border-brand bg-accent text-accent-foreground" : "hover:bg-secondary")}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cta">CTA utama (opsional)</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Contoh: Order via WhatsApp" maxLength={80} />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button variant="brand" onClick={generate} disabled={busy || !sel.brandId}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Menulis..." : "Generate copy (1 kredit)"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid content-start gap-4">
        {!result && !busy && (
          <div className="stage flex flex-col items-center gap-4 rounded-[32px] p-12 text-center text-sm text-muted-foreground">
            <ClayBuddy kind="penulis" size={72} className="float-slow" />
            Tulis brief di kiri, tiga variasi copy muncul di sini.
          </div>
        )}
        {busy && (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-[28px] bg-white" />)}
          </div>
        )}
        {result && !busy && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">3 variasi siap pakai. Riwayat tersimpan otomatis.</p>
              <Button variant="outline" size="sm" onClick={toggleFavorite}>
                <Star className={cn(favorite && "fill-amber-400 text-amber-400")} /> {favorite ? "Tersimpan di favorit" : "Simpan ke favorit"}
              </Button>
            </div>
            {result.variations.map((v, i) => (
              <Card key={i} className="gap-4">
                <CardHeader>
                  <CardDescription>Variasi {i + 1}</CardDescription>
                  <CardTitle className="text-lg">{v.headline}</CardTitle>
                  {v.subheadline && <p className="text-sm text-muted-foreground">{v.subheadline}</p>}
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm whitespace-pre-line">{v.body}</p>
                  <p className="text-sm font-medium">{v.cta}</p>
                  {v.hashtags.length > 0 && <p className="text-sm text-brand">{v.hashtags.join(" ")}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                      await navigator.clipboard.writeText(variationText(v));
                      setCopied(i);
                      setTimeout(() => setCopied(null), 1500);
                    }}>
                      {copied === i ? <Check /> : <Copy />} {copied === i ? "Tersalin" : "Salin"}
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={designHref(v)}><Palette /> Kirim ke Agent Desain</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

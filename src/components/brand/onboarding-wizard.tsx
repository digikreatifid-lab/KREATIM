"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BrandPreview } from "./brand-preview";
import { BrandProfileFields, BrandVisualFields, ProductCatalogFields } from "./brand-fields";
import { describeApiError, EMPTY_BRAND, newProduct, toPayload, type BrandFormState } from "./types";

const STEPS = [
  { title: "Profil brand", description: "Ceritakan brand dan siapa yang ingin kamu jangkau." },
  { title: "Identitas visual", description: "Logo, warna, dan font yang dipakai di setiap desain." },
  { title: "Produk pertama", description: "Tambahkan minimal 1 produk untuk dipromosikan." },
] as const;

function stepError(step: number, s: BrandFormState): string | null {
  if (step === 0) {
    if (s.name.trim().length < 2) return "Nama brand minimal 2 karakter.";
    if (!s.industry) return "Pilih kategori industri.";
    if (s.targetAudience.trim().length < 3) return "Ceritakan target audiens kamu.";
  }
  if (step === 2) {
    const p = s.products[0];
    if (!p || !p.name.trim()) return "Isi nama produk pertama.";
  }
  return null;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BrandFormState>({ ...EMPTY_BRAND, products: [newProduct()] });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<BrandFormState>) => setState((s) => ({ ...s, ...p }));

  async function next() {
    const err = stepError(step, state);
    if (err) return setError(err);
    setError(null);
    if (step < STEPS.length - 1) return setStep(step + 1);

    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(state)),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(describeApiError(body, "Gagal menyimpan brand."));
      router.push(`/dashboard/brands/${body.brand.id}?welcome=1`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <ol className="mb-2 flex items-center gap-2 text-xs">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border font-medium",
                    i < step && "border-brand bg-brand text-white",
                    i === step && "border-brand text-brand",
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("hidden sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{s.title}</span>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
              </li>
            ))}
          </ol>
          <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {step === 0 && <BrandProfileFields value={state} onChange={patch} />}
          {step === 1 && <BrandVisualFields value={state} onChange={patch} />}
          {step === 2 && <ProductCatalogFields value={state} onChange={patch} />}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" disabled={step === 0 || saving} onClick={() => setStep(step - 1)}>
              Kembali
            </Button>
            <Button type="button" variant="brand" onClick={next} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {step < STEPS.length - 1 ? "Lanjut" : "Simpan Brand Brain"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <BrandPreview brand={state} />
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BrandDto } from "@/services/brandService";
import { BrandPreview } from "./brand-preview";
import { BrandProfileFields, BrandVisualFields, ProductCatalogFields } from "./brand-fields";
import { describeApiError, toPayload, type BrandFormState } from "./types";

const TABS = [
  { id: "profile", label: "Profil" },
  { id: "visual", label: "Identitas visual" },
  { id: "products", label: "Katalog produk" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function fromDto(b: BrandDto): BrandFormState {
  return {
    name: b.name,
    industry: b.industry,
    targetAudience: b.targetAudience,
    toneOfVoice: b.toneOfVoice,
    usp: b.usp ?? "",
    mustUseKeywords: b.mustUseKeywords,
    forbiddenWords: b.forbiddenWords,
    primaryColor: b.primaryColor,
    secondaryColor: b.secondaryColor,
    fontPreset: b.fontPreset,
    logoUrl: b.logoUrl,
    products: b.products,
  };
}

export function BrandEditor({ brand }: { brand: BrandDto }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");
  const [state, setState] = useState<BrandFormState>(() => fromDto(brand));
  const [saved, setSaved] = useState<BrandFormState>(() => fromDto(brand));
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const dirty = JSON.stringify(state) !== JSON.stringify(saved);
  const patch = (p: Partial<BrandFormState>) => {
    setStatus(null);
    setState((s) => ({ ...s, ...p }));
  };

  async function save() {
    setBusy("save");
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(state)),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setStatus({ kind: "error", text: describeApiError(body, "Gagal menyimpan.") });
      const fresh = fromDto(body.brand);
      setState(fresh);
      setSaved(fresh);
      setStatus({ kind: "ok", text: "Perubahan tersimpan." });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus brand "${brand.name}"? Riwayat konten tetap tersimpan.`)) return;
    setBusy("delete");
    const res = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      router.push("/dashboard/brands");
      router.refresh();
    } else {
      setStatus({ kind: "error", text: "Gagal menghapus brand." });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{state.name || "Brand"}</CardTitle>
          <CardDescription>Semua agent memakai data ini agar konten selalu konsisten.</CardDescription>
          <div role="tablist" className="mt-3 flex gap-1 border-b">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.id ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.id === "products" && ` (${state.products.length})`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {tab === "profile" && <BrandProfileFields value={state} onChange={patch} />}
          {tab === "visual" && <BrandVisualFields value={state} onChange={patch} />}
          {tab === "products" && <ProductCatalogFields value={state} onChange={patch} />}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Button type="button" variant="ghost" className="text-destructive" onClick={remove} disabled={busy !== null}>
              {busy === "delete" && <Loader2 className="animate-spin" />} Hapus brand
            </Button>
            <div className="flex items-center gap-3">
              {status && (
                <span role="status" className={cn("text-sm", status.kind === "ok" ? "text-brand" : "text-destructive")}>
                  {status.text}
                </span>
              )}
              {dirty && !status && <span className="text-sm text-muted-foreground">Ada perubahan belum disimpan</span>}
              <Button type="button" variant="brand" onClick={save} disabled={!dirty || busy !== null}>
                {busy === "save" && <Loader2 className="animate-spin" />} Simpan perubahan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <BrandPreview brand={state} />
      </div>
    </div>
  );
}

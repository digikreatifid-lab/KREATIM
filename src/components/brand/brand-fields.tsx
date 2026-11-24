"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FONT_PRESETS, INDUSTRY_OPTIONS, TONE_OPTIONS } from "@/lib/brand-options";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/validation/brand";
import { ColorField } from "./color-field";
import { ImageUploadField } from "./image-upload-field";
import { TagInput } from "./tag-input";
import { newProduct, type BrandFormState } from "./types";

type Props = { value: BrandFormState; onChange: (patch: Partial<BrandFormState>) => void };

export function BrandProfileFields({ value, onChange }: Props) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="brand-name">Nama brand</Label>
        <Input id="brand-name" value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Contoh: Kopi Senja" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="industry">Kategori industri</Label>
        <NativeSelect id="industry" value={value.industry} onChange={(e) => onChange({ industry: e.target.value })}>
          <option value="" disabled>Pilih kategori</option>
          {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="usp">Deskripsi & keunggulan (USP)</Label>
        <Textarea id="usp" value={value.usp} onChange={(e) => onChange({ usp: e.target.value })} placeholder="Apa yang membuat brand kamu beda?" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="audience">Target audiens</Label>
        <Textarea id="audience" value={value.targetAudience} onChange={(e) => onChange({ targetAudience: e.target.value })} placeholder="Contoh: Ibu muda 25–35 tahun yang aktif belanja online" />
      </div>
      <div className="grid gap-2">
        <Label>Tone of voice</Label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ toneOfVoice: t.value })}
              aria-pressed={value.toneOfVoice === t.value}
              className={cn(
                "rounded-full border border-input bg-white px-3 py-1.5 text-sm transition-colors",
                value.toneOfVoice === t.value ? "border-brand bg-accent text-accent-foreground" : "hover:bg-secondary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="must">Kata kunci wajib</Label>
          <TagInput id="must" value={value.mustUseKeywords} onChange={(v) => onChange({ mustUseKeywords: v })} placeholder="Ketik lalu Enter" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="forbidden">Kata terlarang</Label>
          <TagInput id="forbidden" value={value.forbiddenWords} onChange={(v) => onChange({ forbiddenWords: v })} placeholder="Ketik lalu Enter" />
        </div>
      </div>
    </div>
  );
}

export function BrandVisualFields({ value, onChange }: Props) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label>Logo</Label>
        <ImageUploadField kind="logo" label="logo" value={value.logoUrl} onChange={(url) => onChange({ logoUrl: url })} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <ColorField id="primary" label="Warna primer" value={value.primaryColor} onChange={(hex) => onChange({ primaryColor: hex })} />
        <ColorField id="secondary" label="Warna sekunder" value={value.secondaryColor} onChange={(hex) => onChange({ secondaryColor: hex })} />
      </div>
      <div className="grid gap-2">
        <Label>Preset font</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {FONT_PRESETS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange({ fontPreset: f.value })}
              aria-pressed={value.fontPreset === f.value}
              className={cn(
                "rounded-2xl border border-input bg-white p-3 text-left transition-colors",
                value.fontPreset === f.value ? "border-ink bg-lilac/50" : "hover:bg-secondary",
              )}
            >
              <span className="block text-sm font-medium">{f.label}</span>
              <span className="block text-xs text-muted-foreground">{f.heading} / {f.body}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, onChange, onRemove }: { product: Product; onChange: (p: Product) => void; onRemove: () => void }) {
  const benefits = [...product.benefits, "", "", ""].slice(0, 3);
  return (
    <div className="grid gap-4 rounded-3xl border bg-mist/60 p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <div className="grid gap-2">
          <Label htmlFor={`pn-${product.id}`}>Nama produk</Label>
          <Input id={`pn-${product.id}`} value={product.name} onChange={(e) => onChange({ ...product, name: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`pp-${product.id}`}>Harga (Rp)</Label>
          <Input
            id={`pp-${product.id}`}
            inputMode="numeric"
            value={product.price ? product.price.toLocaleString("id-ID") : ""}
            onChange={(e) => onChange({ ...product, price: Number(e.target.value.replace(/\D/g, "")) || 0 })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Manfaat utama (maks. 3)</Label>
        {benefits.map((b, i) => (
          <Input
            key={i}
            value={b}
            aria-label={`Manfaat ${i + 1}`}
            placeholder={`Manfaat ${i + 1}`}
            onChange={(e) => {
              const next = [...benefits];
              next[i] = e.target.value;
              onChange({ ...product, benefits: next.slice(0, next.findLastIndex((x) => x !== "") + 1) });
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ImageUploadField kind="product" label="foto" value={product.imageUrl} onChange={(url) => onChange({ ...product, imageUrl: url })} />
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 /> Hapus produk
        </Button>
      </div>
    </div>
  );
}

export function ProductCatalogFields({ value, onChange }: Props) {
  const update = (idx: number, p: Product) => onChange({ products: value.products.map((x, i) => (i === idx ? p : x)) });
  return (
    <div className="grid gap-4">
      {value.products.length === 0 && (
        <p className="rounded-3xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Belum ada produk. Tambahkan minimal 1 produk agar agent bisa menulis dan mendesain promo yang spesifik.
        </p>
      )}
      {value.products.map((p, i) => (
        <ProductRow key={p.id} product={p} onChange={(np) => update(i, np)} onRemove={() => onChange({ products: value.products.filter((_, idx) => idx !== i) })} />
      ))}
      <Button type="button" variant="outline" onClick={() => onChange({ products: [...value.products, newProduct()] })} disabled={value.products.length >= 50}>
        <Plus /> Tambah produk
      </Button>
    </div>
  );
}

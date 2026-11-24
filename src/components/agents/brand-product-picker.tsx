"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";

export type BrandOption = { id: string; name: string; products: { id: string; name: string; price: number }[] };

export function BrandProductPicker({
  brands,
  brandId,
  productId,
  onChange,
  productOptional = true,
}: {
  brands: BrandOption[];
  brandId: string;
  productId: string;
  onChange: (v: { brandId: string; productId: string }) => void;
  productOptional?: boolean;
}) {
  const brand = brands.find((b) => b.id === brandId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="brand">Brand</Label>
        <NativeSelect id="brand" value={brandId} onChange={(e) => onChange({ brandId: e.target.value, productId: "" })}>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="product">Produk{productOptional ? " (opsional)" : ""}</Label>
        <NativeSelect id="product" value={productId} onChange={(e) => onChange({ brandId, productId: e.target.value })}>
          <option value="">{productOptional ? "Tanpa produk / topik bebas" : "Pilih produk"}</option>
          {brand?.products.filter((p) => p.name).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

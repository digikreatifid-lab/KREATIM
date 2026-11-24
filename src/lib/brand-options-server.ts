import type { BrandDto } from "@/services/brandService";

/** Minimal brand data passed to client agent forms. */
export function toBrandOptions(brands: BrandDto[]) {
  return brands.map((b) => ({ id: b.id, name: b.name, products: b.products.map((p) => ({ id: p.id, name: p.name, price: p.price })) }));
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BrandEditor } from "@/components/brand/brand-editor";
import { BrandNotFoundError, getBrand } from "@/services/brandService";

export const metadata: Metadata = { title: "Kelola Brand" };

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const { welcome } = await searchParams;
  const brand = await getBrand(session!.user.id, id).catch((e) => {
    if (e instanceof BrandNotFoundError) notFound();
    throw e;
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Link href="/dashboard/brands" className="text-sm text-muted-foreground hover:text-foreground">← Semua brand</Link>
      {welcome && (
        <div className="rounded-lg border border-brand/30 bg-accent/60 p-4 text-sm text-accent-foreground">
          Brand Brain tersimpan. Semua agent sekarang akan memakai warna, logo, dan gaya bahasa brand ini.
        </div>
      )}
      <BrandEditor brand={brand} />
    </div>
  );
}

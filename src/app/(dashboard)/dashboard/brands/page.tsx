import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toneLabel } from "@/lib/brand-options";
import { getBrandUsage, listBrands } from "@/services/brandService";

export const metadata: Metadata = { title: "Brand Brain" };

export default async function BrandsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [brands, usage] = await Promise.all([listBrands(userId), getBrandUsage(userId)]);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Brain</h1>
          <p className="text-muted-foreground">
            Memori brand yang dipakai semua agent. {usage.used} dari {usage.limit} brand terpakai.
          </p>
        </div>
        {usage.used < usage.limit ? (
          <Button asChild variant="brand">
            <Link href="/dashboard/onboarding"><Plus /> Tambah brand</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/dashboard/billing">Upgrade untuk tambah brand</Link>
          </Button>
        )}
      </div>
      {brands.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <CardHeader className="items-center">
            <CardTitle>Belum ada brand</CardTitle>
            <CardDescription>Setup Brand Brain dulu supaya agent tahu gaya brand kamu.</CardDescription>
          </CardHeader>
          <Button asChild variant="brand"><Link href="/dashboard/onboarding">Mulai setup</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Link key={b.id} href={`/dashboard/brands/${b.id}`} className="group">
              <Card className="h-full gap-4 transition-shadow group-hover:shadow-md">
                <div className="mx-6 flex h-20 items-center gap-3 rounded-lg px-4" style={{ background: b.primaryColor }}>
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt="" className="h-10 w-auto max-w-20 rounded bg-white/90 object-contain p-1" />
                  ) : null}
                  <span className="size-6 rounded-full border-2 border-white/70" style={{ background: b.secondaryColor }} />
                </div>
                <CardHeader>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription>{b.industry}</CardDescription>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="brand">{toneLabel(b.toneOfVoice)}</Badge>
                    <Badge variant="secondary">{b.products.length} produk</Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

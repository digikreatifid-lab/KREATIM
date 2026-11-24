import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ClayBuddy, type BuddyKind } from "@/components/clay/clay";
import { CREDIT_COST } from "@/lib/plans";
import { getBrandUsage } from "@/services/brandService";
import { getBalance } from "@/services/creditService";

export const metadata: Metadata = { title: "Beranda" };

const LAUNCHERS: { kind: BuddyKind; href: string; title: string; body: string; cost: string; tint: string }[] = [
  {
    kind: "penulis",
    href: "/dashboard/copywriter",
    title: "Tulis caption atau iklan",
    body: "Tiga variasi copy sesuai gaya bahasa brand.",
    cost: `${CREDIT_COST.COPYWRITER} kredit`,
    tint: "bg-butter/55",
  },
  {
    kind: "desainer",
    href: "/dashboard/design",
    title: "Buat desain feed atau story",
    body: "Latar AI dengan teks dan logo yang presisi.",
    cost: `${CREDIT_COST.DESIGN_HYBRID} kredit, edit teks gratis`,
    tint: "bg-guava/30",
  },
  {
    kind: "brain",
    href: "/dashboard/brands",
    title: "Atur Brand Brain",
    body: "Warna, logo, produk, dan nada bicara.",
    cost: "Gratis",
    tint: "bg-lilac/45",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [balance, brands] = await Promise.all([getBalance(userId), getBrandUsage(userId)]);
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          {firstName ? `Halo, ${firstName}.` : "Halo."} Mau bikin apa hari ini?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sisa {balance.total} kredit di paket {balance.planTier.replace("_", " ").toLowerCase()}
          {balance.subExpiresAt ? `, kuota reset ${balance.subExpiresAt.toLocaleDateString("id-ID")}` : ""}.
        </p>
      </div>

      {brands.used === 0 && (
        <div className="stage flex flex-col items-start gap-5 rounded-[32px] p-6 sm:flex-row sm:items-center sm:p-8">
          <ClayBuddy kind="brain" size={84} />
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold">Kenalkan brand kamu dulu</h2>
            <p className="mt-1 max-w-lg text-muted-foreground">
              Isi warna, logo, dan produk sekali saja. Setelah itu semua agent menulis dan mendesain dengan gaya brand kamu.
            </p>
          </div>
          <Button asChild variant="brand" size="lg">
            <Link href="/dashboard/onboarding">Setup Brand Brain</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {LAUNCHERS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`group flex flex-col gap-6 rounded-[32px] p-6 outline-none transition-transform focus-visible:ring-4 focus-visible:ring-ring/40 ${l.tint}`}
          >
            <ClayBuddy kind={l.kind} size={64} className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
            <div>
              <h2 className="text-xl font-extrabold leading-tight">{l.title}</h2>
              <p className="mt-1 text-sm text-ink/75">{l.body}</p>
              <p className="mt-4 text-xs font-bold text-accent-foreground">{l.cost}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

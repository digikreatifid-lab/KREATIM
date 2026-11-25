import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Palette, PenLine } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Starfield } from "@/components/cosmos/starfield";
import { CREDIT_COST } from "@/lib/plans";
import { getBrandUsage } from "@/services/brandService";
import { getBalance } from "@/services/creditService";

export const metadata: Metadata = { title: "Beranda" };

const LAUNCHERS = [
  {
    icon: PenLine,
    tone: "bg-sun/25 text-[#9a6500]",
    href: "/dashboard/copywriter",
    title: "Tulis caption atau iklan",
    body: "Tiga variasi copy sesuai gaya bahasa brand.",
    cost: `${CREDIT_COST.COPYWRITER} kredit`,
  },
  {
    icon: Palette,
    tone: "bg-comet/20 text-[#0b7f73]",
    href: "/dashboard/design",
    title: "Buat desain feed atau story",
    body: "Latar AI dengan teks dan logo yang presisi.",
    cost: `${CREDIT_COST.DESIGN_HYBRID} kredit, edit teks gratis`,
  },
  {
    icon: Brain,
    tone: "bg-aurora/12 text-aurora",
    href: "/dashboard/brands",
    title: "Atur Brand Brain",
    body: "Warna, logo, produk, dan nada bicara.",
    cost: "Gratis",
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
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {firstName ? `Halo, ${firstName}.` : "Halo."} Mau bikin apa hari ini?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sisa {balance.total} kredit di paket {balance.planTier.replace("_", " ").toLowerCase()}
          {balance.subExpiresAt ? `, kuota reset ${balance.subExpiresAt.toLocaleDateString("id-ID")}` : ""}.
        </p>
      </div>

      {brands.used === 0 && (
        <div className="cosmos relative flex flex-col items-start gap-5 overflow-hidden rounded-[24px] p-7 sm:flex-row sm:items-center sm:p-9">
          <Starfield density={0.8} />
          <div className="relative flex-1">
            <h2 className="text-2xl font-extrabold">Kenalkan brand kamu dulu</h2>
            <p className="mt-1 max-w-lg text-white/70">
              Isi warna, logo, dan produk sekali saja. Setelah itu semua agent menulis dan mendesain dengan gaya brand kamu.
            </p>
          </div>
          <Button asChild size="lg" className="relative bg-white text-ink hover:bg-white/90">
            <Link href="/dashboard/onboarding">Setup Brand Brain</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {LAUNCHERS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex flex-col gap-6 rounded-[22px] border border-border bg-white p-6 outline-none transition-[border-color,box-shadow] hover:border-aurora/40 hover:shadow-[0_20px_40px_-24px_var(--aurora)] focus-visible:ring-4 focus-visible:ring-ring/30"
          >
            <span className={`grid size-12 place-items-center rounded-2xl ${l.tone}`}>
              <l.icon className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight">{l.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
              <p className="mt-4 text-xs font-semibold text-accent-foreground">{l.cost}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Starfield } from "@/components/cosmos/starfield";
import { getBalance } from "@/services/creditService";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const balance = await getBalance(session.user.id).catch(() => null);
  if (!balance) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-secondary/60 p-3 md:flex-row">
      <aside className="cosmos relative flex flex-col gap-5 overflow-hidden rounded-[24px] p-4 md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:w-64">
        <Starfield density={0.45} speed={0.6} meteors={false} />
        <Link href="/dashboard" className="relative flex items-center gap-2 px-2 pt-1 text-xl font-extrabold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-sun">✦</span>
          kreatim
        </Link>
        <div className="relative">
          <SidebarNav />
        </div>
        <div className="glass relative mt-auto hidden rounded-2xl p-4 md:block">
          <p className="text-xs text-white/60">Saldo kredit</p>
          <p className="text-3xl font-extrabold tracking-tight">{balance.total}</p>
          <p className="text-xs text-white/60">
            {balance.subCredits} bulanan, {balance.topupCredits} top-up
          </p>
          <Link href="/dashboard/billing" className="mt-3 inline-block text-xs font-semibold text-comet underline-offset-4 hover:underline">
            Tambah kredit
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col rounded-[24px] bg-white md:min-h-[calc(100vh-1.5rem)]">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-8">
          <span className="text-sm text-muted-foreground md:hidden">
            Saldo <b className="text-foreground">{balance.total} kredit</b>
          </span>
          <span className="hidden text-sm text-muted-foreground md:block">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">Keluar</Button>
          </form>
        </header>
        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

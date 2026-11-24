import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Clay } from "@/components/clay/clay";
import { getBalance } from "@/services/creditService";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const balance = await getBalance(session.user.id).catch(() => null);
  if (!balance) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col gap-3 p-3 md:flex-row">
      <aside className="flex flex-col gap-5 rounded-[28px] bg-white p-4 md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:w-64">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 pt-1 font-display text-2xl font-extrabold tracking-tight">
          <Clay color="violet" size={22} />
          kreatim
        </Link>
        <SidebarNav />
        <div className="relative mt-auto hidden overflow-hidden rounded-[24px] bg-ink p-4 text-white md:block">
          <Clay color="butter" size={54} className="absolute -right-3 -top-3" />
          <p className="text-xs text-white/70">Saldo kredit</p>
          <p className="font-display text-4xl font-extrabold">{balance.total}</p>
          <p className="text-xs text-white/70">
            {balance.subCredits} bulanan, {balance.topupCredits} top-up
          </p>
          <Link href="/dashboard/billing" className="mt-3 inline-block text-xs font-semibold text-butter underline-offset-4 hover:underline">
            Tambah kredit
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-3 py-2 md:px-6">
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
        <main className="flex-1 px-3 pb-10 pt-2 md:px-6">{children}</main>
      </div>
    </div>
  );
}

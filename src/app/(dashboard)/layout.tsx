import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getBalance } from "@/services/creditService";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const balance = await getBalance(session.user.id).catch(() => null);
  if (!balance) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b bg-secondary/40 p-4 md:w-60 md:border-r md:border-b-0">
        <Link href="/dashboard" className="px-3 text-lg font-semibold tracking-tight">
          kreatim<span className="text-brand">.</span>
        </Link>
        <SidebarNav />
        <div className="mt-auto hidden rounded-lg border bg-background p-3 md:block">
          <p className="text-xs text-muted-foreground">Saldo kredit</p>
          <p className="text-2xl font-semibold">{balance.total}</p>
          <p className="text-xs text-muted-foreground">
            {balance.subCredits} bulanan · {balance.topupCredits} top-up
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
          <span className="text-sm text-muted-foreground md:hidden">Saldo: <b className="text-foreground">{balance.total} kredit</b></span>
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

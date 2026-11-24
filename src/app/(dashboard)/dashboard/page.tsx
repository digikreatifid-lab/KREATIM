import type { Metadata } from "next";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREDIT_COST } from "@/lib/plans";
import { getBalance } from "@/services/creditService";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const balance = await getBalance(userId);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Halo{session?.user?.name ? `, ${session.user.name}` : ""} 👋</h1>
        <p className="text-muted-foreground">Ini ringkasan akun Kreatim kamu.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total kredit</CardDescription>
            <CardTitle className="text-3xl">{balance.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {balance.subCredits} kuota bulanan · {balance.topupCredits} top-up
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Paket aktif</CardDescription>
            <CardTitle className="text-3xl">
              <Badge variant="brand" className="text-base">{balance.planTier.replace("_", " ")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {balance.subExpiresAt ? `Kuota reset ${balance.subExpiresAt.toLocaleDateString("id-ID")}` : "Kredit trial sekali pakai"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Biaya per generate</CardDescription>
            <CardTitle className="text-base font-medium">
              Copywriter {CREDIT_COST.COPYWRITER} kr · Desain {CREDIT_COST.DESIGN_HYBRID} kr
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Live edit desain gratis (0 kredit).</CardContent>
        </Card>
      </div>
    </div>
  );
}

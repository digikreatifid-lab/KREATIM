import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { OnboardingWizard } from "@/components/brand/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrandUsage } from "@/services/brandService";

export const metadata: Metadata = { title: "Setup Brand Brain" };

export default async function OnboardingPage() {
  const session = await auth();
  const usage = await getBrandUsage(session!.user.id);

  if (usage.used >= usage.limit) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Kuota brand penuh</CardTitle>
          <CardDescription>
            Paket kamu bisa menyimpan {usage.limit} brand dan semuanya sudah terpakai. Upgrade paket untuk menambah brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/brands">Kelola brand</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setup Brand Brain</h1>
        <p className="text-muted-foreground">3 langkah singkat, sekitar 3 menit. Bisa diubah kapan saja.</p>
      </div>
      <OnboardingWizard />
    </div>
  );
}

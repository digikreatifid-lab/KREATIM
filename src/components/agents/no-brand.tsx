import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NoBrandNotice() {
  return (
    <Card className="mx-auto max-w-lg items-center text-center">
      <CardHeader className="items-center">
        <CardTitle>Setup Brand Brain dulu</CardTitle>
        <CardDescription>Agent butuh profil, warna, dan produk brand kamu agar hasilnya konsisten.</CardDescription>
      </CardHeader>
      <Button asChild variant="brand"><Link href="/dashboard/onboarding">Setup sekarang</Link></Button>
    </Card>
  );
}

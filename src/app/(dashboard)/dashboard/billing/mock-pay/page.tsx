import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { MockPayActions } from "@/components/billing/mock-pay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatIdr } from "@/lib/utils";

/** Development-only payment simulator for PAYMENT_PROVIDER=mock. */
export default async function MockPayPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const session = await auth();
  const { order } = await searchParams;
  const payment = order ? await prisma.paymentTransaction.findFirst({ where: { externalOrderId: order, userId: session!.user.id } }) : null;
  if (!payment) notFound();
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Simulator pembayaran (development)</CardTitle>
        <CardDescription>
          {payment.itemType} · {formatIdr(payment.amountIdr)} · {payment.externalOrderId}
        </CardDescription>
      </CardHeader>
      <CardContent><MockPayActions orderId={payment.externalOrderId} /></CardContent>
    </Card>
  );
}

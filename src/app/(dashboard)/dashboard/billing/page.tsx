import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { auth } from "@/auth";
import { BuyButton } from "@/components/billing/buy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_LIMIT, CREDIT_COST, SUBSCRIPTION_PLANS, TOPUP_PACKS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { cn, formatIdr } from "@/lib/utils";
import { listLedger } from "@/services/billingService";
import { getBalance } from "@/services/creditService";

export const metadata: Metadata = { title: "Paket & Billing" };

const LEDGER_LABEL: Record<string, string> = {
  SUBSCRIPTION_GRANT: "Kuota paket",
  TOPUP_PURCHASE: "Top-up",
  USAGE_COPYWRITER: "Agent Penulis",
  USAGE_DESIGN_HYBRID: "Agent Desain",
  REFUND_FAILED_JOB: "Refund otomatis",
  MONTHLY_EXPIRATION: "Kedaluwarsa",
};

const ORDER_STATUS: Record<string, { text: string; tone: "ok" | "wait" | "bad" }> = {
  PAID: { text: "Pembayaran berhasil, kredit sudah masuk.", tone: "ok" },
  PENDING: { text: "Menunggu konfirmasi pembayaran. Halaman ini akan terbarui setelah gateway mengirim notifikasi.", tone: "wait" },
  FAILED: { text: "Pembayaran gagal atau kedaluwarsa.", tone: "bad" },
  AMOUNT_MISMATCH: { text: "Ada selisih nominal pembayaran. Hubungi support.", tone: "bad" },
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ page?: string; order?: string }> }) {
  const session = await auth();
  const userId = session!.user.id;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [balance, ledger, order] = await Promise.all([
    getBalance(userId),
    listLedger(userId, page),
    sp.order ? prisma.paymentTransaction.findFirst({ where: { externalOrderId: sp.order, userId } }) : null,
  ]);
  const orderStatus = order ? ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paket & Billing</h1>
          <p className="text-muted-foreground">Bayar via QRIS, Virtual Account, atau e-wallet. Kredit masuk otomatis.</p>
        </div>
        <div className="rounded-lg border px-4 py-2 text-sm">
          Paket <Badge variant="brand">{balance.planTier.replace("_", " ")}</Badge> · <b>{balance.total}</b> kredit
          {balance.subExpiresAt && <span className="text-muted-foreground"> · reset {balance.subExpiresAt.toLocaleDateString("id-ID")}</span>}
        </div>
      </div>

      {orderStatus && (
        <div role="status" className={cn("rounded-lg border p-4 text-sm",
          orderStatus.tone === "ok" && "border-brand/30 bg-accent/60 text-accent-foreground",
          orderStatus.tone === "bad" && "border-destructive/30 bg-destructive/5 text-destructive")}>
          {orderStatus.text}
        </div>
      )}

      <section className="grid gap-4">
        <h2 className="font-semibold">Langganan bulanan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const current = balance.planTier === plan.tier;
            return (
              <Card key={plan.id} className={cn(plan.highlight && "border-brand ring-1 ring-brand")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.highlight && <Badge variant="brand">Best Seller</Badge>}
                  </div>
                  <p className="text-3xl font-semibold">{formatIdr(plan.priceIdr)}<span className="text-sm font-normal text-muted-foreground">/bulan</span></p>
                  <CardDescription>{formatIdr(Math.round(plan.priceIdr / plan.credits))} per kredit</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <ul className="grid gap-2 text-sm">
                    {[
                      `${plan.credits.toLocaleString("id-ID")} kredit / 30 hari`,
                      `±${Math.floor(plan.credits / CREDIT_COST.DESIGN_HYBRID)} desain atau ${plan.credits} set copy`,
                      `${BRAND_LIMIT[plan.tier]} brand di Brand Brain`,
                      "Live edit desain gratis",
                      "Reset tiap 30 hari (tanpa rollover)",
                    ].map((f) => (
                      <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-brand" /> {f}</li>
                    ))}
                  </ul>
                  <BuyButton itemId={plan.id} label={current ? "Perpanjang 30 hari" : `Pilih ${plan.name}`} variant={plan.highlight ? "brand" : "default"} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Top-up kredit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOPUP_PACKS.map((pack) => (
            <Card key={pack.id} className="gap-4">
              <CardHeader>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>{pack.credits} kredit · berlaku 90 hari · bucket terpisah dari kuota bulanan</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <span className="text-2xl font-semibold">{formatIdr(pack.priceIdr)}</span>
                <div className="w-40"><BuyButton itemId={pack.id} label="Beli" variant="outline" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Riwayat mutasi kredit</h2>
        <Card className="py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                  <th className="px-4 py-3 font-medium">Bucket</th>
                  <th className="px-4 py-3 text-right font-medium">Mutasi</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {ledger.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada mutasi.</td></tr>
                )}
                {ledger.items.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{LEDGER_LABEL[row.type] ?? row.type}</td>
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.bucket === "TOPUP" ? "Top-up" : "Bulanan"}</td>
                    <td className={cn("px-4 py-3 text-right font-medium tabular-nums", row.amount > 0 ? "text-brand" : "text-foreground")}>
                      {row.amount > 0 ? `+${row.amount}` : row.amount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {ledger.pageCount > 1 && (
          <div className="flex items-center justify-end gap-3 text-sm">
            {page > 1 && <Link className="text-brand hover:underline" href={`/dashboard/billing?page=${page - 1}`}>← Sebelumnya</Link>}
            <span className="text-muted-foreground">Halaman {page} dari {ledger.pageCount}</span>
            {page < ledger.pageCount && <Link className="text-brand hover:underline" href={`/dashboard/billing?page=${page + 1}`}>Berikutnya →</Link>}
          </div>
        )}
      </section>
    </div>
  );
}

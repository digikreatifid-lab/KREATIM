import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { mockSignature } from "@/lib/payments/mock";
import { prisma } from "@/lib/prisma";
import { applyPaymentEvent } from "@/services/billingService";
import { mockProvider } from "@/lib/payments/mock";

const schema = z.object({ orderId: z.string().min(1).max(64), status: z.enum(["PAID", "FAILED"]) });

/** Development-only: simulates the gateway calling our webhook. */
export const POST = handleRoute(async (req: Request) => {
  if (process.env.NODE_ENV === "production" || (process.env.PAYMENT_PROVIDER ?? "mock") !== "mock") {
    throw new HttpError(404, "Not found");
  }
  const userId = await requireUserId();
  const { orderId, status } = await parseJson(req, schema);
  const payment = await prisma.paymentTransaction.findFirst({ where: { externalOrderId: orderId, userId } });
  if (!payment) throw new HttpError(404, "Transaksi tidak ditemukan.");
  const raw = JSON.stringify({ orderId, status, amount: payment.amountIdr });
  const event = mockProvider.parseWebhook(raw, new Headers({ "x-mock-signature": mockSignature(raw) }));
  return NextResponse.json({ outcome: await applyPaymentEvent(event) });
});

import { createHmac, timingSafeEqual } from "node:crypto";
import { PaymentProviderError, PaymentSignatureError, type PaymentProvider } from "./types";

function secret() {
  if (process.env.NODE_ENV === "production") throw new PaymentProviderError("Provider pembayaran mock tidak boleh dipakai di production.");
  return process.env.AUTH_SECRET ?? "dev-secret";
}

export function mockSignature(rawBody: string) {
  return createHmac("sha256", secret()).update(rawBody).digest("hex");
}

/** Development-only gateway: redirects to a local "pay" page that fires a signed webhook. */
export const mockProvider: PaymentProvider = {
  id: "mock",
  async createCheckout(req) {
    secret();
    return { redirectUrl: `/dashboard/billing/mock-pay?order=${encodeURIComponent(req.orderId)}` };
  },
  parseWebhook(rawBody, headers) {
    const given = Buffer.from(headers.get("x-mock-signature") ?? "");
    const expected = Buffer.from(mockSignature(rawBody));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new PaymentSignatureError();
    const body = JSON.parse(rawBody) as { orderId: string; status: "PAID" | "FAILED"; amount: number };
    return { orderId: body.orderId, status: body.status, grossAmountIdr: body.amount, raw: body };
  },
};

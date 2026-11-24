import { createHmac, timingSafeEqual } from "node:crypto";
import { PaymentProviderError, PaymentSignatureError, type PaymentProvider } from "./types";

function cfg() {
  const apiKey = process.env.TRIPAY_API_KEY;
  const privateKey = process.env.TRIPAY_PRIVATE_KEY;
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
  if (!apiKey || !privateKey || !merchantCode) throw new PaymentProviderError("Konfigurasi TRIPAY_* belum lengkap.");
  const base = process.env.TRIPAY_IS_PRODUCTION === "true" ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox";
  return { apiKey, privateKey, merchantCode, base, method: process.env.TRIPAY_DEFAULT_METHOD ?? "QRIS" };
}

export function tripayCallbackSignature(rawBody: string, privateKey = cfg().privateKey) {
  return createHmac("sha256", privateKey).update(rawBody).digest("hex");
}

/** Tripay closed payment (default channel QRIS). Callback signed with HMAC-SHA256 of the raw body. */
export const tripayProvider: PaymentProvider = {
  id: "tripay",

  async createCheckout(req) {
    const c = cfg();
    const signature = createHmac("sha256", c.privateKey).update(`${c.merchantCode}${req.orderId}${req.amountIdr}`).digest("hex");
    const res = await fetch(`${c.base}/transaction/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        method: c.method,
        merchant_ref: req.orderId,
        amount: req.amountIdr,
        customer_name: req.customer.name,
        customer_email: req.customer.email,
        order_items: [{ sku: req.itemId, name: req.itemName, price: req.amountIdr, quantity: 1 }],
        return_url: req.returnUrl,
        expired_time: Math.floor(Date.now() / 1000) + 24 * 3600,
        signature,
      }),
    }).catch((error) => {
      throw new PaymentProviderError("Gagal menghubungi Tripay.", { cause: error });
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: { checkout_url?: string; reference?: string } };
    if (!res.ok || !data.success || !data.data?.checkout_url) {
      throw new PaymentProviderError(`Tripay menolak transaksi: ${data.message ?? res.status}`);
    }
    return { redirectUrl: data.data.checkout_url, token: data.data.reference };
  },

  parseWebhook(rawBody, headers) {
    const given = headers.get("x-callback-signature") ?? "";
    const expected = tripayCallbackSignature(rawBody);
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new PaymentSignatureError();
    if (headers.get("x-callback-event") !== "payment_status") throw new PaymentSignatureError();

    let body: { merchant_ref?: string; status?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new PaymentSignatureError();
    }
    if (!body.merchant_ref) throw new PaymentSignatureError();
    const status = body.status === "PAID" ? "PAID" : body.status === "EXPIRED" || body.status === "FAILED" ? "FAILED" : "PENDING";
    return { orderId: body.merchant_ref, status, raw: body };
  },
};

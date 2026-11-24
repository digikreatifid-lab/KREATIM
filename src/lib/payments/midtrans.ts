import { createHash, timingSafeEqual } from "node:crypto";
import { PaymentProviderError, PaymentSignatureError, type PaymentProvider } from "./types";

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new PaymentProviderError("MIDTRANS_SERVER_KEY belum di-set.");
  return key;
}

function snapBase() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, key = serverKey()) {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${key}`).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
};

/** Midtrans Snap (QRIS, VA, e-wallet). Docs: Snap API + HTTP notification signature (SHA512). */
export const midtransProvider: PaymentProvider = {
  id: "midtrans",

  async createCheckout(req) {
    const auth = Buffer.from(`${serverKey()}:`).toString("base64");
    const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        transaction_details: { order_id: req.orderId, gross_amount: req.amountIdr },
        item_details: [{ id: req.itemId, price: req.amountIdr, quantity: 1, name: req.itemName.slice(0, 50) }],
        customer_details: { first_name: req.customer.name.slice(0, 50), email: req.customer.email },
        callbacks: { finish: req.returnUrl },
        expiry: { unit: "hour", duration: 24 },
      }),
    }).catch((error) => {
      throw new PaymentProviderError("Gagal menghubungi Midtrans.", { cause: error });
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
    if (!res.ok || !data.redirect_url) {
      throw new PaymentProviderError(`Midtrans menolak transaksi: ${data.error_messages?.join(", ") ?? res.status}`);
    }
    return { redirectUrl: data.redirect_url, token: data.token };
  },

  parseWebhook(rawBody) {
    let n: MidtransNotification;
    try {
      n = JSON.parse(rawBody) as MidtransNotification;
    } catch {
      throw new PaymentSignatureError();
    }
    if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) throw new PaymentSignatureError();
    const expected = midtransSignature(n.order_id, n.status_code, n.gross_amount);
    if (!safeEqualHex(expected, n.signature_key)) throw new PaymentSignatureError();

    const ts = n.transaction_status;
    let status: "PAID" | "FAILED" | "PENDING" = "PENDING";
    if (ts === "settlement" || (ts === "capture" && (n.fraud_status ?? "accept") === "accept")) status = "PAID";
    else if (ts === "deny" || ts === "cancel" || ts === "expire" || ts === "failure") status = "FAILED";

    return { orderId: n.order_id, status, grossAmountIdr: Math.round(Number(n.gross_amount)), raw: n };
  },
};

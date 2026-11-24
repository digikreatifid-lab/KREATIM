import { NextResponse } from "next/server";
import { paymentProvider, PaymentSignatureError } from "@/lib/payments";
import { applyPaymentEvent } from "@/services/billingService";

const MAX_BODY = 64 * 1024;

/**
 * Payment gateway notification. Signature is verified on the RAW body before
 * anything else; fulfilment is idempotent on externalOrderId.
 */
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) {
    return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });

  let event;
  try {
    event = paymentProvider().parseWebhook(raw, req.headers);
  } catch (error) {
    if (error instanceof PaymentSignatureError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("[webhook] parse error", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const outcome = await applyPaymentEvent(event);
    if (outcome === "amount_mismatch") console.error("[webhook] amount mismatch", event.orderId);
    // 200 for every verified event (including unknown/duplicate) so the gateway stops retrying.
    return NextResponse.json({ success: true, outcome });
  } catch (error) {
    console.error("[webhook] apply failed", error);
    // 500 => gateway retries later; the handler is idempotent.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

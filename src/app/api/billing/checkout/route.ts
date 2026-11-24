import { NextResponse } from "next/server";
import { z } from "zod";
import { appUrl } from "@/lib/app-url";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { PaymentProviderError } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { createCheckout, UnknownBillingItemError } from "@/services/billingService";

const schema = z.object({ itemId: z.enum(["STARTER", "GROWTH", "PRO", "TOPUP_MINI", "TOPUP_BOOST"]) });

export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  if (!rateLimit(`checkout:${userId}`, 5, 60_000)) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi sebentar.");
  const { itemId } = await parseJson(req, schema);
  try {
    return NextResponse.json(await createCheckout(userId, itemId, appUrl(req)));
  } catch (error) {
    if (error instanceof UnknownBillingItemError) throw new HttpError(422, error.message);
    if (error instanceof PaymentProviderError) {
      console.error("[checkout]", error);
      throw new HttpError(502, "Gateway pembayaran sedang bermasalah. Coba lagi beberapa saat.");
    }
    throw error;
  }
});

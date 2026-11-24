import { NextResponse } from "next/server";
import { secretMatches } from "@/lib/secrets";
import { resetExpiredCredits } from "@/services/billingService";

/**
 * Daily job (PRD §4): expire monthly quota past subExpiresAt and top-ups past
 * topupExpiresAt, logging MONTHLY_EXPIRATION in the ledger.
 * Call with header `x-cron-secret: $CRON_SECRET` (or `Authorization: Bearer $CRON_SECRET`).
 */
export async function POST(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const given = req.headers.get("x-cron-secret") ?? bearer;
  if (!secretMatches(given, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await resetExpiredCredits();
  return NextResponse.json({ ok: true, ...result });
}

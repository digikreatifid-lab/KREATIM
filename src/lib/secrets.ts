import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison for shared secrets (e.g. CRON_SECRET). */
export function secretMatches(given: string | null | undefined, expected: string | undefined) {
  if (!given || !expected || expected.length < 16) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

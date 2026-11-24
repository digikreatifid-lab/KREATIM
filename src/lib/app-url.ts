/** Canonical public URL of the app (used for payment return URLs). */
export function appUrl(req?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return req ? new URL(req.url).origin : "http://localhost:3000";
}

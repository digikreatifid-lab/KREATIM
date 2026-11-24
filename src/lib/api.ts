import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSessionUserId } from "@/auth";
import { InsufficientCreditsError } from "@/services/creditService";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

/** Client IP behind the VPS reverse proxy (first X-Forwarded-For hop). */
export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new HttpError(401, "Silakan login terlebih dahulu.");
  return userId;
}

export async function parseJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Body harus berupa JSON yang valid.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(422, "Input tidak valid.", parsed.error.issues);
  return parsed.data;
}

/** Wrap a route handler so known errors become clean JSON responses. */
export function handleRoute<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return jsonError(error.status, error.message, error.details);
      if (error instanceof InsufficientCreditsError) {
        return jsonError(402, error.message, { required: error.required, available: error.available });
      }
      console.error("[api] unhandled error", error);
      return jsonError(500, "Terjadi kesalahan pada server.");
    }
  };
}

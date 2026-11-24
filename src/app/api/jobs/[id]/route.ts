import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { JobNotFoundError, setFavorite } from "@/services/jobService";

const patchSchema = z.object({ isFavorite: z.boolean() });

export const PATCH = handleRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { isFavorite } = await parseJson(req, patchSchema);
  try {
    await setFavorite(userId, id, isFavorite);
  } catch (error) {
    if (error instanceof JobNotFoundError) throw new HttpError(404, error.message);
    throw error;
  }
  return NextResponse.json({ ok: true });
});

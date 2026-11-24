import { NextResponse } from "next/server";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { brandUpdateSchema } from "@/lib/validation/brand";
import { BrandNotFoundError, deleteBrand, getBrand, InvalidAssetUrlError, updateBrand } from "@/services/brandService";

type Ctx = { params: Promise<{ id: string }> };

function mapError(error: unknown): never {
  if (error instanceof BrandNotFoundError) throw new HttpError(404, error.message);
  if (error instanceof InvalidAssetUrlError) throw new HttpError(422, error.message);
  throw error;
}

export const GET = handleRoute(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const { id } = await params;
  const brand = await getBrand(userId, id).catch(mapError);
  return NextResponse.json({ brand });
});

export const PATCH = handleRoute(async (req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const { id } = await params;
  const input = await parseJson(req, brandUpdateSchema);
  const brand = await updateBrand(userId, id, input).catch(mapError);
  return NextResponse.json({ brand });
});

export const DELETE = handleRoute(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const { id } = await params;
  await deleteBrand(userId, id).catch(mapError);
  return new NextResponse(null, { status: 204 });
});

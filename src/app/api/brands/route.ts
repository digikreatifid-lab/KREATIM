import { NextResponse } from "next/server";
import { handleRoute, HttpError, parseJson, requireUserId } from "@/lib/api";
import { brandInputSchema } from "@/lib/validation/brand";
import { BrandQuotaExceededError, createBrand, InvalidAssetUrlError, listBrands } from "@/services/brandService";

export const GET = handleRoute(async () => {
  const userId = await requireUserId();
  return NextResponse.json({ brands: await listBrands(userId) });
});

export const POST = handleRoute(async (req: Request) => {
  const userId = await requireUserId();
  const input = await parseJson(req, brandInputSchema);
  try {
    const brand = await createBrand(userId, input);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    if (error instanceof BrandQuotaExceededError) throw new HttpError(403, error.message, { limit: error.limit });
    if (error instanceof InvalidAssetUrlError) throw new HttpError(422, error.message);
    throw error;
  }
});

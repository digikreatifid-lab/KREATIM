import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, parseJson } from "@/lib/api";
import { EmailAlreadyRegisteredError, registerWithPassword } from "@/services/userService";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  password: z.string().min(8).max(128),
});

export const POST = handleRoute(async (req: Request) => {
  const input = await parseJson(req, registerSchema);
  try {
    const user = await registerWithPassword(input);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) throw new HttpError(409, error.message);
    throw error;
  }
});

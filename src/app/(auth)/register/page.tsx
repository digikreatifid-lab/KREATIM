import type { Metadata } from "next";
import { isGoogleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return <AuthForm mode="register" googleEnabled={isGoogleEnabled} />;
}

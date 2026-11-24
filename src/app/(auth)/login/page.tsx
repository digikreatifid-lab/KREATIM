import type { Metadata } from "next";
import { isGoogleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return <AuthForm mode="login" googleEnabled={isGoogleEnabled} />;
}

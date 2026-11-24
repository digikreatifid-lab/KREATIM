"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, googleEnabled }: { mode: "login" | "register"; googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(res.status === 422 ? "Periksa kembali nama, email, dan password (min. 8 karakter)." : data.error ?? "Registrasi gagal.");
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email atau password salah.");
        return;
      }
      router.push(isRegister ? "/dashboard/onboarding" : "/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{isRegister ? "Buat akun Kreatim" : "Masuk ke Kreatim"}</CardTitle>
        <CardDescription>
          {isRegister ? "Dapatkan 15 kredit gratis untuk mencoba semua agent." : "Lanjutkan membuat konten untuk brand kamu."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {googleEnabled && (
          <>
            <Button variant="outline" type="button" onClick={() => signIn("google", { redirectTo: "/dashboard" })}>
              Lanjutkan dengan Google
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <form onSubmit={onSubmit} className="grid gap-4">
          {isRegister && (
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" name="name" required minLength={2} autoComplete="name" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses..." : isRegister ? "Daftar & Dapatkan 15 Kredit" : "Masuk"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
          <Link href={isRegister ? "/login" : "/register"} className="font-medium text-brand hover:underline">
            {isRegister ? "Masuk" : "Daftar gratis"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

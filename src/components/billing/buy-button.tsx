"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuyButton({ itemId, label, variant = "default" }: { itemId: string; label: string; variant?: "default" | "brand" | "outline" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.redirectUrl) {
        setError(body.error ?? "Gagal membuat pembayaran.");
        setBusy(false);
        return;
      }
      window.location.href = body.redirectUrl;
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <Button variant={variant} onClick={buy} disabled={busy} className="w-full">
        {busy && <Loader2 className="animate-spin" />} {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

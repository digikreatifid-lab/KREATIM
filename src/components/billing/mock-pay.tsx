"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MockPayActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  async function send(status: "PAID" | "FAILED") {
    const res = await fetch("/api/billing/mock-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(body.error ?? "Gagal.");
    router.push(`/dashboard/billing?order=${orderId}`);
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button variant="brand" onClick={() => send("PAID")}>Simulasikan bayar berhasil</Button>
      <Button variant="outline" onClick={() => send("FAILED")}>Simulasikan gagal</Button>
      {msg && <p className="text-sm text-destructive">{msg}</p>}
    </div>
  );
}

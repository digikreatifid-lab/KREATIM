"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (pemilih warna)`}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          id={id}
          value={text}
          maxLength={7}
          aria-invalid={!HEX.test(text)}
          onChange={(e) => {
            const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setText(next);
            if (HEX.test(next)) onChange(next.toUpperCase());
          }}
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}

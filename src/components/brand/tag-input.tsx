"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const words = draft.split(",").map((w) => w.trim()).filter(Boolean);
    if (words.length) onChange(Array.from(new Set([...value, ...words])).slice(0, 20));
    setDraft("");
  }

  return (
    <div className="grid gap-2">
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
              {w}
              <button type="button" aria-label={`Hapus ${w}`} onClick={() => onChange(value.filter((x) => x !== w))}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

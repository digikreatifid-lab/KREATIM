"use client";

import { useRef } from "react";
import { MousePointer2, Palette, PenLine, Sparkles } from "lucide-react";
import { Starfield } from "./starfield";

/** Landing hero panel: deep-space stage where the agents' real outputs float at different depths. */
export function HeroCosmos() {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }

  const depth = (d: number): React.CSSProperties => ({
    transform: `translate3d(calc(var(--px, 0) * ${d}px), calc(var(--py, 0) * ${d}px), 0)`,
    transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
  });

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className="cosmos relative isolate aspect-[16/10] text-left w-full overflow-hidden rounded-[28px] sm:aspect-[16/9] sm:rounded-[36px]"
    >
      <Starfield />

      {/* center: the brief being typed */}
      <div className="absolute inset-x-0 top-1/2 z-10 mx-auto w-[86%] max-w-[520px] -translate-y-1/2" style={depth(-10)}>
        <div className="glass rise-in rounded-2xl p-3 sm:p-4" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 rounded-xl bg-white/95 px-4 py-3 text-left text-sm text-ink shadow-2xl sm:text-base">
            <Sparkles className="size-4 shrink-0 text-aurora" />
            <span className="flex-1 truncate">Promo gajian Kopi Senja, diskon 20% akhir pekan</span>
            <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white sm:inline">Buat</span>
          </div>
          <div className="mt-3 flex gap-2 px-1 text-[11px] text-white/70 sm:text-xs">
            <span className="rounded-full border border-white/15 px-2.5 py-1">Caption IG</span>
            <span className="rounded-full border border-white/15 px-2.5 py-1">Feed 4:5</span>
            <span className="hidden rounded-full border border-white/15 px-2.5 py-1 sm:inline">Gaya: santai</span>
          </div>
        </div>
      </div>

      {/* left: caption written by Agent Penulis */}
      <div className="absolute left-[4%] top-[9%] hidden w-[27%] md:block" style={depth(26)}>
        <div className="rise-in drift rounded-2xl bg-white p-4 text-[13px] leading-snug text-ink shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]" style={{ animationDelay: "0.45s" }}>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-md bg-sun/25 text-[#9a6500]"><PenLine className="size-3.5" /></span>
            Agent Penulis
          </p>
          Gajian udah cair? Self-reward yang manisnya pas: es kopi susu gula aren, diskon 20% cuma Sabtu dan Minggu.
        </div>
      </div>

      {/* right: poster rendered by Agent Desain */}
      <div className="absolute right-[5%] top-[8%] hidden w-[20%] md:block" style={depth(40)}>
        <figure
          className="rise-in drift overflow-hidden rounded-2xl shadow-[0_40px_70px_-20px_rgb(0_0_0/0.7)]"
          style={{ animationDelay: "0.6s", animationDuration: "0.9s, 8s" }}
        >
          <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_72%_24%,#fbe3bd_0_10%,rgb(251_227_189/0.45)_20%,transparent_42%),linear-gradient(160deg,#e9c49a,#8a5a3b_62%,#3b2a20)] p-3 text-white">
            <span className="text-[10px] font-bold">kopi senja</span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[clamp(13px,1.6vw,20px)] font-extrabold leading-[0.95] tracking-tight">Promo gajian, diskon 20%</p>
              <span className="mt-2 inline-block rounded-full bg-[#d98e32] px-2 py-0.5 text-[9px] font-bold">Rp 17.600</span>
            </div>
          </div>
        </figure>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/60">
          <Palette className="size-3" /> Agent Desain, 1080×1350
        </p>
      </div>

      {/* cursor accent */}
      <div className="absolute bottom-[16%] left-[58%] hidden md:block" style={depth(60)}>
        <MousePointer2 className="size-7 fill-aurora text-white drop-shadow-[0_0_18px_var(--aurora)]" />
      </div>

      {/* bottom chips */}
      <div className="absolute bottom-[7%] left-[6%] hidden md:block" style={depth(18)}>
        <div className="glass rounded-full px-4 py-2 text-xs text-white/85">3 variasi caption siap salin</div>
      </div>
      <div className="absolute bottom-[10%] right-[8%] hidden md:block" style={depth(30)}>
        <div className="glass rounded-full px-4 py-2 text-xs text-white/85">Edit teks desain: 0 kredit</div>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { Clay, ClayBuddy, ClayCube } from "@/components/clay/clay";

/** Hero 3D stage: a sample poster and caption the crew just made, tilting toward the pointer. */
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
  }
  function onLeave() {
    ref.current?.style.removeProperty("--rx");
    ref.current?.style.removeProperty("--ry");
  }

  return (
    <div className="relative mx-auto w-full max-w-[520px] [perspective:1200px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={ref}
        className="relative aspect-[5/6] transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx, 6deg)) rotateY(var(--ry, -12deg))" }}
      >
        {/* back glow disc */}
        <div className="absolute inset-[8%] rounded-full bg-lilac/60 blur-3xl [transform:translateZ(-80px)]" />

        {/* the poster Agent Desain made */}
        <figure
          className="pop-in absolute left-[12%] top-[6%] w-[62%] overflow-hidden rounded-[26px] shadow-[0_40px_60px_-30px_rgb(36_26_75/0.55)] [transform:translateZ(30px)]"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_72%_24%,#fbe3bd_0_10%,rgb(251_227_189/0.45)_20%,transparent_42%),linear-gradient(160deg,#e9c49a,#8a5a3b_62%,#3b2a20)] p-[8%] text-white">
            <span className="font-display text-[13px] font-bold tracking-tight">kopi senja</span>
            <div className="absolute inset-x-[8%] bottom-[8%]">
              <p className="font-display text-[clamp(22px,3.4vw,34px)] font-extrabold leading-[0.95]">Promo gajian, diskon 20%</p>
              <p className="mt-2 text-[11px] opacity-90">Es kopi susu gula aren, khusus akhir pekan</p>
              <div className="mt-3 flex gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-[#d98e32] px-3 py-1">Rp 17.600</span>
                <span className="rounded-full bg-white px-3 py-1 text-[#3b2a20]">Pesan sekarang</span>
              </div>
            </div>
          </div>
        </figure>

        {/* the caption Agent Penulis wrote */}
        <div
          className="pop-in absolute bottom-[4%] right-0 w-[58%] rounded-[22px] border border-border bg-white p-4 text-[13px] leading-snug shadow-[0_30px_50px_-28px_rgb(36_26_75/0.5)] [transform:translateZ(80px)]"
          style={{ animationDelay: "0.35s" }}
        >
          <div className="mb-2 flex items-center gap-4">
            <ClayBuddy kind="penulis" size={28} />
            <span className="text-xs font-semibold text-muted-foreground">Agent Penulis</span>
          </div>
          Gajian udah cair? Saatnya self-reward yang manisnya pas. Es kopi susu gula aren Kopi Senja diskon 20% cuma Sabtu–Minggu.
        </div>

        {/* the crew and loose clay */}
        <ClayBuddy kind="desainer" size={74} className="pop-in float-mid absolute right-[6%] top-[2%] [transform:translateZ(110px)]" />
        <ClayBuddy kind="brain" size={58} className="pop-in float-slow absolute bottom-[26%] left-[0%] [transform:translateZ(120px)]" />
        <Clay shape="ring" color="butter" size={54} className="float-slow absolute left-[2%] top-[0%] [transform:translateZ(-20px)]" />
        <Clay shape="pill" color="mint" size={22} className="float-mid absolute bottom-[0%] left-[22%] rotate-[24deg] [transform:translateZ(60px)]" />
        <span className="float-slow absolute right-[2%] top-[46%] [transform:translateZ(40px)]">
          <ClayCube color="lilac" size={30} />
        </span>
      </div>
    </div>
  );
}

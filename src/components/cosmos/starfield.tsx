"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Star = { x: number; y: number; z: number; r: number; tw: number; ph: number; hue: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

/**
 * Canvas starfield: layered stars drifting at depth-based speeds, twinkling,
 * with an occasional shooting star. Pauses off-screen / in hidden tabs and
 * renders a still sky when the visitor prefers reduced motion.
 */
export function Starfield({
  density = 1,
  speed = 1,
  meteors = true,
  className,
}: {
  density?: number;
  speed?: number;
  meteors?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const seed = () => {
      const count = Math.round(((w * h) / 2600) * density);
      stars = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.35 + z * 1.25,
          tw: 0.6 + Math.random() * 2.2,
          ph: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.18 ? (Math.random() < 0.5 ? 255 : 175) : 0,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduce) draw(0, 0);
    };

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) {
          s.x -= (0.004 + s.z * 0.018) * dt * speed;
          s.y += (0.001 + s.z * 0.004) * dt * speed;
          if (s.x < -2) s.x = w + 2;
          if (s.y > h + 2) s.y = -2;
        }
        const a = reduce ? 0.55 + s.z * 0.4 : 0.35 + s.z * 0.45 + Math.sin(t * 0.001 * s.tw + s.ph) * 0.25;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, a));
        ctx.fillStyle = s.hue ? `hsl(${s.hue} 90% 80%)` : "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.93) {
          ctx.globalAlpha *= 0.25;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduce && meteors) {
        if (!meteor && Math.random() < 0.0016 * dt * 0.06) {
          meteor = { x: w * (0.4 + Math.random() * 0.6), y: Math.random() * h * 0.4, vx: -0.9, vy: 0.38, life: 1 };
        }
        if (meteor) {
          const m = meteor;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt / 1100;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 120, m.y - m.vy * 120);
          g.addColorStop(0, `rgba(255,255,255,${0.9 * m.life})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = 1;
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 120, m.y - m.vy * 120);
          ctx.stroke();
          if (m.life <= 0 || m.x < -200 || m.y > h + 200) meteor = null;
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      if (visible && !document.hidden) draw(t, dt);
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    resize();
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [density, speed, meteors]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} />;
}

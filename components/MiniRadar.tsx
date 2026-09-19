"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/session";
import { t } from "@/lib/i18n";

export interface MiniBlip {
  id: string;
  angleDeg: number;
  severity: "opportunity" | "watch" | "critical";
}

const SEV_COLOR: Record<MiniBlip["severity"], string> = {
  opportunity: "#3D9BE9", // sky, a friendly chance
  watch: "#F5A623", // sun, keep an eye
  critical: "#E5543A", // tomato, needs attention
};

/**
 * A soft, friendly growth radar, 2D canvas, pastel rings, warm sweep,
 * glowing blips with gentle pings. Deliberately calmer than a cockpit:
 * the merchant should feel "my shop at a glance", not "trading desk".
 */
export default function MiniRadar({ blips }: { blips: MiniBlip[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blipsRef = useRef<MiniBlip[]>(blips);
  blipsRef.current = blips;

  const { lang } = useLang();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const time = (now - start) / 1000;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) / 2 - 10;

      ctx.clearRect(0, 0, w, h);

      // pastel dish
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      bg.addColorStop(0, "#FFF9EE");
      bg.addColorStop(0.75, "#FDF2DE");
      bg.addColorStop(1, "#FAE9CC");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // rings
      ctx.strokeStyle = "rgba(107, 97, 86, 0.18)";
      ctx.lineWidth = 1.5;
      for (const f of [1 / 3, 2 / 3, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      }
      // cross hairs
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();

      // warm sweep
      const sweepA = time * 1.1;
      const grad = ctx.createConicGradient
        ? ctx.createConicGradient(sweepA, cx, cy)
        : null;
      if (grad) {
        grad.addColorStop(0, "rgba(61, 155, 233, 0.30)");
        grad.addColorStop(0.12, "rgba(61, 155, 233, 0.02)");
        grad.addColorStop(1, "rgba(61, 155, 233, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      }

      // blips with pings
      for (const b of blipsRef.current) {
        const a = (b.angleDeg * Math.PI) / 180 - Math.PI / 2;
        const dist = R * 0.62;
        const x = cx + Math.cos(a) * dist;
        const y = cy + Math.sin(a) * dist;
        const col = SEV_COLOR[b.severity];

        // ping
        const pingT = (time * 0.9 + (b.angleDeg % 360) / 360) % 1;
        ctx.strokeStyle = col + "55";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8 + pingT * 16, 0, Math.PI * 2);
        ctx.stroke();

        // glow dot
        const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
        g.addColorStop(0, col);
        g.addColorStop(0.6, col + "CC");
        g.addColorStop(1, col + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // center dot
      ctx.fillStyle = "#3BB273";
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="relative rounded-[1.8rem]"
      style={{
        boxShadow: "inset 0 4px 12px rgba(150,120,70,.18), 0 2px 0 rgba(255,255,255,.7)",
        background: "linear-gradient(160deg,#FFFDF6,#FBF0DC)",
      }}
    >
      <canvas ref={canvasRef} className="w-full rounded-[1.8rem]" style={{ height: 320 }} />
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="chip3d bg-white/85 text-cocoa">✨ {t(lang, "radarHint")}</span>
      </div>
    </div>
  );
}

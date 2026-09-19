"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/session";
import { t } from "@/lib/i18n";

export interface DishBlip {
  id: string;
  angleDeg: number;
  severity: "opportunity" | "watch" | "critical";
}

const SEV: Record<DishBlip["severity"], string> = {
  opportunity: "#4A7EF0",
  watch: "#FFC24B",
  critical: "#F96A3C",
};

/**
 * The RADAAR dish: a 2D-canvas radar drawn in perspective so it LOOKS 3D
 * (an elliptical dish tilted toward the viewer) while staying light and
 * instantly readable as a radar icon: concentric rings, sweeping beam with
 * a fading trail, and glowing blips with pings.
 */
export default function RadarDish({ blips }: { blips: DishBlip[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blipsRef = useRef<DishBlip[]>(blips);
  blipsRef.current = blips;

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
      const cy = h * 0.54;
      const R = Math.min(w * 0.42, h * 0.42);

      ctx.clearRect(0, 0, w, h);

      // ── perspective dish: ellipse squashed to ~0.42 tilt ────────────────
      const SQUASH = 0.42;

      // outer rim (thick clay edge)
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.12, R * SQUASH * 1.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      // rim shading
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, R * 1.12, R * SQUASH * 1.12, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16,52,128,0.10)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // dish face
      const face = ctx.createRadialGradient(
        cx - R * 0.3, cy - R * 0.35, R * 0.1,
        cx, cy, R,
      );
      face.addColorStop(0, "#F6FAFF");
      face.addColorStop(0.7, "#E7F0FE");
      face.addColorStop(1, "#CFE0FA");
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * SQUASH, 0, 0, Math.PI * 2);
      ctx.fillStyle = face;
      ctx.fill();

      // concentric rings (ellipses)
      ctx.strokeStyle = "rgba(74,126,240,0.30)";
      ctx.lineWidth = 2;
      for (const f of [1 / 3, 2 / 3, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * f, R * SQUASH * f, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // cross hairs
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R * SQUASH);
      ctx.lineTo(cx, cy + R * SQUASH);
      ctx.strokeStyle = "rgba(74,126,240,0.22)";
      ctx.stroke();

      // ── sweeping beam with fading trail ─────────────────────────────────
      const ang = time * 1.5;
      const TRAIL = Math.PI / 2.4;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, "rgba(74,126,240,0.45)");
      grad.addColorStop(1, "rgba(74,126,240,0.08)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // arc across the trail (behind the beam line)
      ctx.ellipse(cx, cy, R, R * SQUASH, 0, ang - TRAIL, ang);
      ctx.closePath();
      ctx.fill();
      // beam edge line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R * SQUASH);
      ctx.strokeStyle = "rgba(74,126,240,0.75)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // ── blips: elevated pins so they read "above the dish" ──────────────
      for (const b of blipsRef.current) {
        const a = (b.angleDeg * Math.PI) / 180;
        const dist = R * 0.62;
        const x = cx + Math.cos(a) * dist;
        const y = cy + Math.sin(a) * dist * SQUASH;
        const col = SEV[b.severity];

        // ping rings on the dish surface
        const pingT = (time * 0.9 + (b.angleDeg % 360) / 360) % 1;
        ctx.strokeStyle = col + "66";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 10 + pingT * 22, (10 + pingT * 22) * SQUASH, 0, 0, Math.PI * 2);
        ctx.stroke();

        // stem: little pin standing up from the dish
        const stemH = b.severity === "critical" ? 26 : 18;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - stemH);
        ctx.strokeStyle = col;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();

        // head: glowing ball
        const headR = b.severity === "critical" ? 11 : 9;
        const g = ctx.createRadialGradient(x - 3, y - stemH - 3, 1, x, y - stemH, headR + 4);
        g.addColorStop(0, "#FFFFFF");
        g.addColorStop(0.35, col);
        g.addColorStop(1, col + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y - stemH, headR + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y - stemH, headR, 0, Math.PI * 2);
        ctx.fill();
        // shine
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(x - 3, y - stemH - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // contact shadow on the dish
        ctx.fillStyle = col + "33";
        ctx.beginPath();
        ctx.ellipse(x, y, headR * 0.9, headR * 0.9 * SQUASH, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── center hub ──────────────────────────────────────────────────────
      ctx.fillStyle = "#3EC98F";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(cx - 2.5, cy - 2.5, 3, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const { lang } = useLang();

  return (
    <div
      className="relative rounded-[1.8rem]"
      style={{
        background: "linear-gradient(160deg,#FBFDFF,#EAF2FE)",
        boxShadow: "inset 0 4px 14px rgba(16,52,128,.12), 0 2px 0 rgba(255,255,255,.8)",
      }}
    >
      <canvas ref={canvasRef} className="w-full rounded-[1.8rem]" style={{ height: 340 }} />
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="chip3d bg-white/90 text-royal">✨ {t(lang, "radarHint")}</span>
      </div>
    </div>
  );
}

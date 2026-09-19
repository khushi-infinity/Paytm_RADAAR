/**
 * The friendly layer — turns the intelligence spine's output into the few
 * warm, plain-language numbers a merchant actually needs. The full snapshot
 * stays available for the "My Business" tab and the chat, but HOME shows
 * only what this module returns. No jargon survives this layer.
 */

import type { BusinessSnapshot } from "./types";
import type { Lang } from "./i18n";
import { cardSignalHi, cardWhyHi, cardActionHi } from "./hi";

export interface FriendlyNumbers {
  weeklySales: number; // ₹ this week
  salesDeltaPct: number; // vs last week
  customerCount: number;
  customerDeltaPct: number;
  healthScore: number;
  healthMood: "great" | "ok" | "careful";
  radarBlips: Array<{
    id: string;
    angleDeg: number;
    severity: "opportunity" | "watch" | "critical";
  }>;
  focusCard: {
    severity: "opportunity" | "watch" | "critical";
    signal: string;
    why: string;
    action: string;
    impactLow: number;
    impactHigh: number;
    targetSize: number;
  } | null;
  moreCount: number; // how many other signals exist beyond the focus card
}

export interface CardView {
  severity: "opportunity" | "watch" | "critical";
  signal: string;
  why: string;
  action: string;
  impactLow: number;
  impactHigh: number;
  targetSize: number;
}

export function healthMoodOf(score: number): FriendlyNumbers["healthMood"] {
  if (score >= 75) return "great";
  if (score >= 55) return "ok";
  return "careful";
}

/** Deterministic angle per blip so the radar doesn't reshuffle on refresh. */
function angleFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 360);
}

/** The user asked for no em dashes anywhere in the UI. */
export function noDash(s: string): string {
  return s.replace(/\s*—\s*/g, ", ").replace(/\s+,/g, ",");
}

/**
 * Build language-aware views of every card. English reuses the engine's own
 * sentences; Hindi mirrors the same template with the same numbers (lib/hi.ts).
 */
export function cardViews(snap: BusinessSnapshot, lang: Lang): CardView[] {
  const eveningPct =
    snap.trends.find((tr) => tr.id === "trend_weekday_evening")?.deltaPct ?? 0;
  const avgTicket = snap.avgTicket.value;

  const order = { critical: 0, watch: 1, opportunity: 2 } as const;
  const sorted = [...snap.cards].sort((a, b) => order[a.severity] - order[b.severity]);

  return sorted.map((c) => {
    const o = c.linkedOpportunity;
    const id = o?.id ?? "";
    const size = o?.targetSize ?? 0;
    return {
      severity: c.severity,
      signal:
        lang === "hi" && o
          ? cardSignalHi(o.id, size, id === "opp_weekday_evening" ? eveningPct : 0)
          : noDash(c.signal),
      why:
        lang === "hi" && o
          ? cardWhyHi(o.id, size, eveningPct, avgTicket)
          : noDash(c.why),
      action:
        lang === "hi" && o
          ? cardActionHi(o.id)
          : noDash(c.action),
      impactLow: o?.impactLow ?? 0,
      impactHigh: o?.impactHigh ?? 0,
      targetSize: size,
    };
  });
}

export function friendly(snap: BusinessSnapshot): FriendlyNumbers {
  const mood = healthMoodOf(snap.health.score);
  const top = snap.cards[0] ?? null;
  const opp = top?.linkedOpportunity;

  // Home shows ONE action. Everything else stays in "My Business".
  const criticalFirst = [...snap.cards].sort((a, b) => {
    const w = { critical: 0, watch: 1, opportunity: 2 } as const;
    return w[a.severity] - w[b.severity];
  });
  const focus = criticalFirst[0] ?? top;

  return {
    weeklySales: snap.revenue.thisWeek,
    salesDeltaPct: snap.revenue.deltaPct,
    customerCount: snap.customers.total,
    customerDeltaPct: snap.customers.deltaPct,
    healthScore: snap.health.score,
    healthMood: mood,
    radarBlips: snap.cards.map((c) => ({
      id: c.id,
      angleDeg: angleFor(c.id),
      severity: c.severity,
    })),
    focusCard: focus
      ? {
          severity: focus.severity,
          signal: focus.signal,
          why: focus.why,
          action: focus.action,
          impactLow: opp?.impactLow ?? 0,
          impactHigh: opp?.impactHigh ?? 0,
          targetSize: opp?.targetSize ?? 0,
        }
      : null,
    moreCount: Math.max(0, snap.cards.length - 1),
  };
}

// ─── Bilingual phrasing of the numbers ───────────────────────────────────────

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function fmtMoney(n: number): string {
  return inr(n);
}

export function fmtPct(deltaPct: number): { text: string; up: boolean } {
  const up = deltaPct >= 0;
  return { text: `${up ? "+" : "−"}${Math.abs(Math.round(deltaPct))}%`, up };
}

/** "More than last week" / "पिछले हफ़्ते से ज़्यादा" */
export function deltaPhrase(lang: Lang, deltaPct: number, thing: "sales" | "customers"): string {
  const up = deltaPct >= 0;
  if (lang === "hi") {
    const what = thing === "sales" ? "बिक्री" : "ग्राहक";
    return up ? `${what} पिछले हफ़्ते से ज़्यादा` : `${what} पिछले हफ़्ते से कम`;
  }
  const what = thing === "sales" ? "Sales" : "Customers";
  return up ? `${what} more than last week` : `${what} less than last week`;
}

/** Trend line → plain sentence. English copy comes from the engine; Hindi is mapped here. */
export function trendPhrase(lang: Lang, window: string, direction: "up" | "down", deltaPct: number): string {
  const pct = `${Math.abs(Math.round(deltaPct))}%`;
  if (lang === "en") return `${direction === "up" ? "Up" : "Down"} ${pct} — ${window}`;
  const win = hindiWindow(window);
  return direction === "up" ? `${win} बिक्री ${pct} बढ़ी` : `${win} बिक्री ${pct} गिरी`;
}

export function anomalyPhrase(lang: Lang, description: string): string {
  if (lang === "en") return description;
  const d = description.toLowerCase();
  if (d.includes("large transaction")) return "एक बहुत बड़ा भुगतान आया — अच्छी बात, पर जान लें।";
  if (d.includes("refund")) return "कई वापसी (refund) एक साथ हुईं — एक बार जाँच लें।";
  if (d.includes("traffic")) return "ग्राहकों की भीड़ अचानक कम हुई थी — ध्यान दें।";
  if (d.includes("duplicate")) return "एक जैसे भुगतान बार-बार दिखे — जाँच कर लें।";
  return description;
}

export function segmentPhrase(lang: Lang, segment: string): string {
  if (lang === "hi") {
    const map: Record<string, string> = {
      regular: "नियमित ग्राहक",
      new: "नए ग्राहक",
      at_risk: "दूर जा रहे ग्राहक",
      inactive: "दूर चले गए ग्राहक",
    };
    return map[segment] ?? segment;
  }
  const map: Record<string, string> = {
    regular: "Regulars",
    new: "New customers",
    at_risk: "Drifting away",
    inactive: "Gone quiet",
  };
  return map[segment] ?? segment;
}

export function hindiWindow(window: string): string {
  const w = window.toLowerCase();
  if (w.includes("evening")) return "शाम के समय (5–8 बजे)";
  if (w.includes("this week")) return "इस हफ़्ते";
  if (w.includes("average transaction")) return "औसत बिल";
  if (w.includes("weekend")) return "वीकेंड";
  if (w.includes("festive")) return "त्योहारों में";
  if (w.includes("morning")) return "सुबह के समय";
  return window;
}

export function paymentLabel(lang: Lang, method: string): string {
  if (lang === "hi") {
    const map: Record<string, string> = {
      qr: "Paytm QR",
      upi_collect: "UPI कलेक्ट",
      card: "कार्ड",
      wallet: "Paytm वॉलेट",
    };
    return map[method] ?? method;
  }
  const map: Record<string, string> = {
    qr: "Paytm QR",
    upi_collect: "UPI Collect",
    card: "Card",
    wallet: "Paytm Wallet",
  };
  return map[method] ?? method;
}

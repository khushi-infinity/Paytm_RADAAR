"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import {
  fmtMoney,
  trendPhrase,
  anomalyPhrase,
  segmentPhrase,
  paymentLabel,
} from "@/lib/friendly";

interface MemFact {
  ts: number;
  kind: string;
  fact: string;
}

function memToPlain(f: MemFact, lang: "en" | "hi"): string {
  if (lang === "en") {
    if (f.kind === "OFFER_DISPATCHED")
      return f.fact.replace(/^OFFER DISPATCHED [0-9-]+: /, "You sent an offer: ");
    if (f.kind === "OFFER_OUTCOME")
      return f.fact.replace(/^OFFER OUTCOME [0-9-]+: /, "Result: ");
    if (f.kind === "INSIGHT") return f.fact.replace(/^INSIGHT [0-9-]+: /, "Insight: ");
    return f.fact;
  }
  if (f.kind === "OFFER_DISPATCHED")
    return f.fact.includes("Hinglish")
      ? "ऑफ़र भेजी गई — संदेश: " + (f.fact.split('"')[1] ?? "")
      : "ऑफ़र ग्राहकों को भेजी गई।";
  if (f.kind === "OFFER_OUTCOME") {
    const m = f.fact.match(/\+?₹?[\d,]+ rupees \(\+?[\d.]+%\)/);
    return lang === "hi"
      ? "नतीजा: " + (m ? m[0].replace("rupees", "रुपये") : "राजस्व बदलाव दर्ज हुआ")
      : "Result: " + (m ? m[0] : "revenue change recorded");
  }
  if (f.kind === "INSIGHT") {
    const why = f.fact.split("Why:")[1]?.split("Recommended")[0];
    return lang === "hi" ? "समझ: " + (why ?? f.fact) : "Insight: " + (why ?? f.fact);
  }
  return f.fact;
}

export default function BusinessView() {
  const { lang, snap, friendly: fr } = useSession();
  const [mems, setMems] = useState<MemFact[]>([]);
  const [graphOk, setGraphOk] = useState<boolean | null>(null);

  useEffect(() => {
    let on = true;
    fetch("/api/memory")
      .then((r) => r.json())
      .then((j: { facts?: MemFact[]; graph?: string }) => {
        if (!on) return;
        setMems(j.facts ?? []);
        setGraphOk(j.graph === "ok");
      })
      .catch(() => setGraphOk(false));
    return () => {
      on = false;
    };
  }, [fr?.moreCount]);

  if (!snap || !fr) return null;

  const totalTxs = snap.paymentMix.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* trends */}
      <div className="card">
        <h2 className="text-lg font-extrabold text-ink">📈 {t(lang, "bizTrends")}</h2>
        <ul className="mt-2 space-y-2">
          {snap.trends.map((tr) => {
            const up = tr.direction === "up";
            return (
              <li key={tr.id} className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-3">
                <span className={`text-xl ${up ? "text-leafdeep" : "text-tomato"}`}>{up ? "↑" : "↓"}</span>
                <div>
                  <p className={`text-sm font-bold ${up ? "text-leafdeep" : "text-tomato"}`}>
                    {trendPhrase(lang, tr.window, tr.direction, tr.deltaPct)}
                  </p>
                  <p className="text-xs text-cocoa">
                    {lang === "hi" ? "अभी" : "now"} {fmtMoney(tr.evidence.current)} ·{" "}
                    {lang === "hi" ? "पहले" : "before"} {fmtMoney(tr.evidence.baseline)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* anomalies */}
      {snap.anomalies.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-extrabold text-ink">👀 {t(lang, "bizAnomalies")}</h2>
          <ul className="mt-2 space-y-2">
            {snap.anomalies.map((a) => (
              <li key={a.id} className="rounded-2xl bg-butter px-4 py-3 text-sm font-semibold text-ink">
                💡 {anomalyPhrase(lang, a.description)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* customers */}
      <div className="card">
        <h2 className="text-lg font-extrabold text-ink">🧑‍🤝‍🧑 {t(lang, "bizCustomers")}</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {snap.segments.map((s) => (
            <div key={s.segment} className="rounded-2xl bg-mist px-4 py-3">
              <p className="text-xl font-extrabold text-ink">{s.count}</p>
              <p className="text-xs font-bold text-cocoa">{segmentPhrase(lang, s.segment)}</p>
              <p className="text-xs text-cocoa">
                {fmtMoney(s.avgTicket)} {t(lang, "perVisit")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* payment mix */}
      <div className="card">
        <h2 className="text-lg font-extrabold text-ink">💳 {t(lang, "bizPayments")}</h2>
        <div className="mt-3 space-y-2">
          {snap.paymentMix.map((p) => (
            <div key={p.method} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-bold text-cocoa">
                {paymentLabel(lang, p.method)}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-mist">
                <div
                  className={p.method === "qr" ? "h-full rounded-full bg-sky" : p.method === "wallet" ? "h-full rounded-full bg-sun" : "h-full rounded-full bg-coral"}
                  style={{ width: `${(p.count / totalTxs) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-extrabold text-ink">
                {Math.round((p.count / totalTxs) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* memory */}
      <div className="card">
        <h2 className="text-lg font-extrabold text-ink">🧠 {t(lang, "bizMemory")}</h2>
        {graphOk === false && mems.length === 0 ? (
          <p className="mt-2 text-sm text-cocoa">{t(lang, "memoryEmpty")}</p>
        ) : mems.length === 0 ? (
          <p className="mt-2 text-sm text-cocoa">{t(lang, "memoryEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {mems.slice(0, 6).map((m) => (
              <li key={m.ts} className="rounded-2xl bg-mist px-4 py-3 text-sm text-ink">
                {memToPlain(m, lang)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-12 gap-6 pb-4">
      {/* trends */}
      <section className="card3d pop-in col-span-7 p-6">
        <h3 className="text-xl font-extrabold text-ink">📈 {t(lang, "bizTrends")}</h3>
        <ul className="mt-4 space-y-3">
          {snap.trends.map((tr, i) => {
            const up = tr.direction === "up";
            return (
              <li
                key={`${tr.id}-${i}`}
                className="pop-in flex items-center gap-4 rounded-3xl bg-mist px-5 py-4"
                style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.7), 0 3px 0 #E8DCC4", animationDelay: `${i * 0.06}s` }}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${up ? "bg-leaf/15 text-leafdeep" : "bg-tomato/10 text-tomato"}`}
                  style={{ boxShadow: "0 3px 0 rgba(0,0,0,.06)" }}
                >
                  {up ? "↑" : "↓"}
                </span>
                <div>
                  <p className={`text-lg font-extrabold ${up ? "text-leafdeep" : "text-tomato"}`}>
                    {trendPhrase(lang, tr.window, tr.direction, tr.deltaPct)}
                  </p>
                  <p className="text-sm font-semibold text-cocoa">
                    {lang === "hi" ? "अभी" : "now"} {fmtMoney(tr.evidence.current)} ·{" "}
                    {lang === "hi" ? "पहले" : "before"} {fmtMoney(tr.evidence.baseline)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* right column stack */}
      <div className="col-span-5 space-y-6">
        {/* anomalies */}
        {snap.anomalies.length > 0 && (
          <section className="card3d pop-in p-6" style={{ animationDelay: ".08s" }}>
            <h3 className="text-xl font-extrabold text-ink">👀 {t(lang, "bizAnomalies")}</h3>
            <ul className="mt-3 space-y-3">
              {snap.anomalies.map((a, i) => (
                <li
                  key={`${a.id}-${i}`}
                  className="rounded-3xl bg-butter px-5 py-3.5 text-base font-semibold text-ink"
                  style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.8), 0 3px 0 #EFDCB4" }}
                >
                  💡 {anomalyPhrase(lang, a.description)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* payments */}
        <section className="card3d pop-in p-6" style={{ animationDelay: ".14s" }}>
          <h3 className="text-xl font-extrabold text-ink">💳 {t(lang, "bizPayments")}</h3>
          <div className="mt-4 space-y-3">
            {snap.paymentMix.map((p) => (
              <div key={p.method} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm font-extrabold text-cocoa">
                  {paymentLabel(lang, p.method)}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-mist" style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,.08)" }}>
                  <div
                    className={p.method === "qr" ? "h-full rounded-full bg-sky" : p.method === "wallet" ? "h-full rounded-full bg-sun" : "h-full rounded-full bg-coral"}
                    style={{ width: `${(p.count / totalTxs) * 100}%`, boxShadow: "inset 0 2px 0 rgba(255,255,255,.5)" }}
                  />
                </div>
                <span className="w-12 text-right text-base font-extrabold text-ink">
                  {Math.round((p.count / totalTxs) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* customers */}
      <section className="card3d pop-in col-span-7 p-6" style={{ animationDelay: ".1s" }}>
        <h3 className="text-xl font-extrabold text-ink">🧑‍🤝‍🧑 {t(lang, "bizCustomers")}</h3>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {snap.segments.map((s, i) => (
            <div
              key={`${s.segment}-${i}`}
              className="rounded-3xl bg-mist px-4 py-4 text-center"
              style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.7), 0 3px 0 #E8DCC4" }}
            >
              <p className="text-3xl font-extrabold text-ink">{s.count}</p>
              <p className="text-xs font-extrabold text-cocoa">{segmentPhrase(lang, s.segment)}</p>
              <p className="mt-1 text-xs font-semibold text-cocoa">
                {fmtMoney(s.avgTicket)} {t(lang, "perVisit")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* memory */}
      <section className="card3d pop-in col-span-5 p-6" style={{ animationDelay: ".16s" }}>
        <h3 className="text-xl font-extrabold text-ink">🧠 {t(lang, "bizMemory")}</h3>
        {mems.length === 0 ? (
          <p className="mt-3 text-base font-semibold text-cocoa">{t(lang, "memoryEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mems.slice(0, 5).map((m, i) => (
              <li
                key={`${m.ts}-${i}`}
                className="rounded-3xl bg-mist px-5 py-3 text-sm font-semibold text-ink"
                style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.7), 0 3px 0 #E8DCC4" }}
              >
                {memToPlain(m, lang)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

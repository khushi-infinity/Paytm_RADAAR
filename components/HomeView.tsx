"use client";

import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { fmtMoney, fmtPct, deltaPhrase, cardViews } from "@/lib/friendly";
import Radar3D from "./Radar3D";
import Mascot from "./Mascot";

function greetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

const SEV = {
  critical: { bg: "bg-tomato/10 text-tomato", dot: "🔴", bar: "#F96A3C" },
  watch: { bg: "bg-sun/15 text-[#B97D12]", dot: "🟠", bar: "#FFC24B" },
  opportunity: { bg: "bg-sky/10 text-skydeep", dot: "🔵", bar: "#4A7EF0" },
} as const;

/** The visible AI pipeline: answers "where are n8n and Cognee?" at a glance. */
function Pipeline({ stage, lang }: { stage: string; lang: "en" | "hi" }) {
  const steps = [
    { icon: "🤖", label: t(lang, "stepAi") },
    { icon: "⚙️", label: t(lang, "stepN8n") },
    { icon: "🧠", label: t(lang, "stepCognee") },
  ];
  const active =
    stage === "idle" || stage === "error" ? 0 : stage === "sending" ? 1 : 2;
  return (
    <div className="mt-4 flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center gap-1.5">
          <div
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-center transition-all ${
              i < active
                ? "bg-mint/15 text-leafdeep"
                : i === active
                  ? "bg-sky/10 text-skydeep ring-2 ring-sky/40"
                  : "bg-mist text-cocoa/70"
            }`}
          >
            <span className={`text-xl ${i === active && stage === "sending" ? "animate-bounce" : ""}`}>
              {i < active ? "✓" : s.icon}
            </span>
            <span className="text-[11px] font-extrabold leading-tight">{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className="text-cocoa/40">→</span>}
        </div>
      ))}
    </div>
  );
}

export default function HomeView() {
  const { lang, snap, friendly: fr, offerStage, offer, outcome, createOffer, measureOutcome } = useSession();
  if (!fr || !snap) return null;

  const mood = fr.healthMood;
  const moodEmoji = mood === "great" ? "🎉" : mood === "ok" ? "🙂" : "⚠️";
  const moodTitle =
    mood === "great" ? t(lang, "healthGreat") : mood === "ok" ? t(lang, "healthOk") : t(lang, "healthCareful");
  const moodBody =
    mood === "great" ? t(lang, "congratsGreat") : mood === "ok" ? t(lang, "congratsOk") : t(lang, "congratsCareful");

  const sales = fmtPct(fr.salesDeltaPct);
  const cust = fmtPct(fr.customerDeltaPct);
  const cards = cardViews(snap, lang);

  return (
    <div className="grid grid-cols-12 gap-6 pb-4">
      {/* ── left column: story + numbers + actions ────────────────────────── */}
      <div className="col-span-12 lg:col-span-7 space-y-6">
        {/* hero, glass on blue like the reference */}
        <section className="card3d-deep pop-in flex items-center gap-6 p-7">
          <div
            className="floaty flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/20 text-5xl backdrop-blur"
            style={{ boxShadow: "inset 0 3px 0 rgba(255,255,255,.4), 0 10px 24px rgba(9,34,84,.35)" }}
          >
            {moodEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <span className="chip3d-deep mb-2">
              ⭐ {lang === "hi" ? "आज का हिसाब" : "TODAY"} · {snap.merchantName.split(" ")[0]}
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-white" style={{ textShadow: "0 3px 0 rgba(14,47,102,.4)" }}>
              {moodTitle}
            </h2>
            <p className="mt-1 text-lg font-bold text-bluesoft">{moodBody}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full ${mood === "great" ? "bg-mint" : mood === "ok" ? "bg-skybright" : "bg-tomato"}`}
                  style={{ width: `${fr.healthScore}%`, boxShadow: "inset 0 2px 0 rgba(255,255,255,.5)" }}
                />
              </div>
              <span className="text-lg font-extrabold text-white">{fr.healthScore}/100</span>
            </div>
          </div>
        </section>

        {/* two numbers */}
        <div className="grid grid-cols-2 gap-6">
          <section className="card3d card3d-hover pop-in p-6" style={{ animationDelay: ".1s" }}>
            <p className="text-sm font-extrabold text-cocoa">{t(lang, "sales")} · {t(lang, "thisWeek")}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-extrabold text-ink">{fmtMoney(fr.weeklySales)}</p>
              <span className={`chip3d ${sales.up ? "bg-mint/15 text-leafdeep" : "bg-tomato/10 text-tomato"}`}>
                {sales.up ? "↑" : "↓"} {sales.text}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-cocoa">{deltaPhrase(lang, fr.salesDeltaPct, "sales")}</p>
          </section>
          <section className="card3d card3d-hover pop-in p-6" style={{ animationDelay: ".16s" }}>
            <p className="text-sm font-extrabold text-cocoa">{t(lang, "customers")}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-extrabold text-ink">{fr.customerCount}</p>
              <span className={`chip3d ${cust.up ? "bg-mint/15 text-leafdeep" : "bg-tomato/10 text-tomato"}`}>
                {cust.up ? "↑" : "↓"} {cust.text}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-cocoa">{deltaPhrase(lang, fr.customerDeltaPct, "customers")}</p>
          </section>
        </div>

        {/* mascot line + action cards */}
        {cards.map((card, idx) => {
          const st = SEV[card.severity];
          const hostsFlow = idx === 0;
          const mid = Math.round((card.impactLow + card.impactHigh) / 2);
          return (
            <section key={card.signal} className="card3d card3d-hover pop-in p-6" style={{ animationDelay: `${0.2 + idx * 0.07}s`, borderTop: `6px solid ${st.bar}` }}>
              {hostsFlow && (
                <div className="mb-3 flex items-center gap-3">
                  <div className="mascot-bob">
                    <Mascot size={64} />
                  </div>
                  <div className="rounded-[1.4rem] rounded-bl-md bg-bluemist px-4 py-2.5" style={{ boxShadow: "0 3px 0 #C9D9F6" }}>
                    <p className="text-sm font-extrabold text-royal">{t(lang, "mascotFocus")}</p>
                    <p className="text-[11px] font-bold text-cocoa">{t(lang, "pipelineIdle")}</p>
                  </div>
                </div>
              )}

              <span className={`chip3d w-fit ${st.bg}`}>
                {st.dot} {card.severity === "critical" ? (lang === "hi" ? "ज़रूरी" : "Urgent") : card.severity === "watch" ? (lang === "hi" ? "ध्यान दें" : "Watch") : (lang === "hi" ? "मौका" : "Chance")}
              </span>

              <p className="mt-3 text-2xl font-extrabold leading-snug text-ink">{card.signal}</p>

              <details className="mt-1">
                <summary className="cursor-pointer list-none text-base font-bold text-skydeep hover:underline">
                  ▸ {t(lang, "whyLabel")}
                </summary>
                <p className="mt-2 text-base leading-relaxed text-cocoa">{card.why}</p>
              </details>

              {mid > 0 && (
                <div className="mt-4 rounded-3xl bg-bluemist px-5 py-3" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.9), 0 3px 0 #C9D9F6" }}>
                  <p className="text-sm font-bold text-cocoa">{t(lang, "worth")}</p>
                  <p className="text-3xl font-extrabold text-royal">
                    {fmtMoney(mid)} <span className="text-base font-bold text-cocoa">{t(lang, "perWeek")}</span>
                  </p>
                </div>
              )}

              {hostsFlow && <Pipeline stage={offerStage} lang={lang} />}

              {hostsFlow && (
                <div className="mt-5">
                  {offerStage === "idle" || offerStage === "error" ? (
                    <button
                      onClick={() =>
                        void createOffer(card.signal, card.why, card.action, card.impactLow, card.impactHigh, card.targetSize)
                      }
                      className="btn3d btn3d-orange w-full"
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-lg">✨ {t(lang, "doThis")}</span>
                        <span className="text-xs font-bold opacity-90">{card.action}</span>
                      </span>
                    </button>
                  ) : offerStage === "sending" ? (
                    <div>
                      <button disabled className="btn3d w-full bg-white/60 !text-royal" style={{ ["--btn-base" as string]: "#C9D9F6" }}>
                        ⏳ {t(lang, "pipelineSending")}
                      </button>
                      <a
                        href="/api/platforms"
                        target="_blank"
                        className="mt-2 block text-center text-xs font-bold text-skydeep hover:underline"
                      >
                        🔗 {t(lang, "seeLive")}
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-3xl bg-mint/10 p-4" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.9), 0 3px 0 #BFE8D4" }}>
                        <p className="text-base font-extrabold text-leafdeep">
                          ✓ {t(lang, "pipelineSent")}
                        </p>
                        <div className="mt-3 rounded-3xl rounded-br-lg bg-white p-4" style={{ boxShadow: "0 3px 0 #C9D9F6, 0 10px 20px rgba(16,52,128,.15)" }}>
                          <p className="text-xs font-bold text-cocoa">
                            {lang === "hi" ? "ग्राहकों को यह भेजा गया:" : "Sent to your customers:"}
                          </p>
                          <p className="mt-1 text-base text-ink">
                            {lang === "hi" ? offer?.nudgeHi : offer?.nudgeEn || offer?.nudgeHi}
                          </p>
                        </div>
                        <a
                          href="/api/platforms"
                          target="_blank"
                          className="mt-2 block text-center text-xs font-bold text-skydeep hover:underline"
                        >
                          🔗 {t(lang, "seeLive")}
                        </a>
                      </div>
                      {offerStage === "sent" && (
                        <button onClick={() => void measureOutcome()} className="btn3d btn3d-sky w-full">
                          📅 {t(lang, "measureOutcome")}
                        </button>
                      )}
                      {offerStage === "measured" && outcome && (
                        <div className="rounded-3xl bg-mint/10 p-4" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.9), 0 3px 0 #BFE8D4" }}>
                          <p className="text-2xl font-extrabold text-leafdeep">
                            {outcome.verdict === "worked" ? "🎉" : outcome.verdict === "underperformed" ? "😔" : "🤔"}{" "}
                            {outcome.verdict === "worked"
                              ? t(lang, "offerWorked")
                              : outcome.verdict === "underperformed"
                                ? t(lang, "offerDidntWork")
                                : t(lang, "offerNeutral")}
                          </p>
                          <p className="text-xl font-extrabold text-ink">
                            +{fmtMoney(outcome.revenueDelta)} · +{Math.round(outcome.upliftPct)}% {t(lang, "perWeek")}
                          </p>
                          <p className="mt-1 text-sm font-bold text-cocoa">💾 {t(lang, "learnedFact")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── right column: the 3D radar + trust note ───────────────────────── */}
      <div className="col-span-12 lg:col-span-5 space-y-6">
        <section className="card3d pop-in flex flex-col p-6" style={{ animationDelay: ".08s", minHeight: 480 }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-ink">📡 {t(lang, "yourRadar")}</h3>
            <span className="chip3d bg-bluemist text-royal">{fr.radarBlips.length}</span>
          </div>
          <div className="min-h-[360px] flex-1">
            <Radar3D blips={fr.radarBlips} />
          </div>
          <p className="text-center text-xs font-bold text-cocoa">✨ {t(lang, "radarHint")}</p>
        </section>

        {/* trust note: where n8n + Cognee live */}
        <section className="card3d-deep pop-in p-6" style={{ animationDelay: ".16s" }}>
          <p className="text-base font-extrabold text-white">🔐 {t(lang, "pipelineNote")}</p>
          <div className="mt-3 flex items-center gap-2 text-2xl">
            <span className="chip3d-deep">🤖 AI</span>
            <span className="text-bluesoft">→</span>
            <span className="chip3d-deep">⚙️ n8n</span>
            <span className="text-bluesoft">→</span>
            <span className="chip3d-deep">🧠 Cognee</span>
          </div>
        </section>
      </div>
    </div>
  );
}

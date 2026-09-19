"use client";

import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { fmtMoney, fmtPct, deltaPhrase, cardViews } from "@/lib/friendly";
import MiniRadar from "./MiniRadar";

function greetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

const SEV_STYLE = {
  critical: { border: "#FFD9CF", badge: "bg-tomato/10 text-tomato", dot: "🔴", glow: "rgba(229,84,58,.16)" },
  watch: { border: "#FFE7BD", badge: "bg-sun/10 text-sun", dot: "🟠", glow: "rgba(245,166,35,.14)" },
  opportunity: { border: "#CBE7FB", badge: "bg-sky/10 text-skydeep", dot: "🔵", glow: "rgba(61,155,233,.14)" },
} as const;

export default function HomeView() {
  const { lang, snap, friendly: fr, offerStage, offer, outcome, createOffer, measureOutcome } = useSession();
  if (!fr || !snap) return null;

  const mood = fr.healthMood;
  const moodEmoji = mood === "great" ? "🎉" : mood === "ok" ? "🙂" : "⚠️";
  const moodTitle =
    mood === "great" ? t(lang, "healthGreat") : mood === "ok" ? t(lang, "healthOk") : t(lang, "healthCareful");
  const moodBody =
    mood === "great" ? t(lang, "congratsGreat") : mood === "ok" ? t(lang, "congratsOk") : t(lang, "congratsCareful");
  const moodColor = mood === "great" ? "text-leafdeep" : mood === "ok" ? "text-skydeep" : "text-tomato";
  const moodGlow = mood === "great" ? "rgba(59,178,115,.14)" : mood === "ok" ? "rgba(61,155,233,.14)" : "rgba(229,84,58,.14)";

  const sales = fmtPct(fr.salesDeltaPct);
  const cust = fmtPct(fr.customerDeltaPct);
  const cards = cardViews(snap, lang);

  return (
    <div className="grid grid-cols-12 gap-6 pb-4">
      {/* ── hero greeting (left 8) ─────────────────────────────────────────── */}
      <section className="card3d card3d-hover pop-in col-span-12 lg:col-span-8 flex items-center gap-6 xl:gap-8 p-6 xl:p-8" style={{ background: `linear-gradient(135deg, #FFFFFF 62%, ${moodGlow})` }}>
        <div
          className="floaty flex h-20 w-20 xl:h-28 xl:w-28 shrink-0 items-center justify-center rounded-[2rem] text-5xl xl:text-6xl"
          style={{
            background: "linear-gradient(145deg,#FFFDF7,#FFF3DC)",
            boxShadow: "inset 0 3px 0 rgba(255,255,255,.9), 0 8px 0 #F3E3C6, 0 18px 36px rgba(196,158,96,.28)",
          }}
        >
          {moodEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base xl:text-lg font-bold text-cocoa">
            {t(lang, greetingKey())}, {snap.merchantName.split(" ")[0]} 👋
          </p>
          <h2 className={`mt-1 text-3xl xl:text-5xl font-extrabold leading-tight ${moodColor}`} style={{ textShadow: "0 2px 0 rgba(255,255,255,.8)" }}>
            {moodTitle}
          </h2>
          <p className="mt-1 text-lg xl:text-xl font-semibold text-ink">{moodBody}</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-mist" style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,.08)" }}>
              <div
                className={`h-full rounded-full ${mood === "great" ? "bg-leaf" : mood === "ok" ? "bg-sky" : "bg-tomato"}`}
                style={{ width: `${fr.healthScore}%`, boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 3px 6px rgba(0,0,0,.15)" }}
              />
            </div>
            <span className="text-xl font-extrabold text-cocoa">{fr.healthScore}/100</span>
          </div>
        </div>
      </section>

      {/* ── radar (right 4, tall) ──────────────────────────────────────────── */}
      <section className="card3d card3d-hover pop-in col-span-12 lg:col-span-4 lg:row-span-2 flex flex-col p-5 xl:p-6" style={{ animationDelay: ".08s" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg xl:text-xl font-extrabold text-ink">📡 {t(lang, "yourRadar")}</h3>
          <span className="chip3d bg-mist text-cocoa">{fr.radarBlips.length}</span>
        </div>
        <div className="mt-2 flex-1">
          <MiniRadar blips={fr.radarBlips} />
        </div>
      </section>

      {/* ── the two numbers ────────────────────────────────────────────────── */}
      <section className="card3d card3d-hover pop-in col-span-6 lg:col-span-4 p-5 xl:p-6" style={{ animationDelay: ".14s" }}>
        <p className="text-sm xl:text-base font-bold text-cocoa">{t(lang, "sales")} · {t(lang, "thisWeek")}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-3xl xl:text-4xl font-extrabold text-ink" style={{ textShadow: "0 2px 0 #FFF" }}>{fmtMoney(fr.weeklySales)}</p>
          <span className={`chip3d ${sales.up ? "bg-leaf/10 text-leafdeep" : "bg-tomato/10 text-tomato"}`}>
            {sales.up ? "↑" : "↓"} {sales.text}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-cocoa">{deltaPhrase(lang, fr.salesDeltaPct, "sales")}</p>
      </section>

      <section className="card3d card3d-hover pop-in col-span-6 lg:col-span-4 p-5 xl:p-6" style={{ animationDelay: ".2s" }}>
        <p className="text-sm xl:text-base font-bold text-cocoa">{t(lang, "customers")}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-3xl xl:text-4xl font-extrabold text-ink" style={{ textShadow: "0 2px 0 #FFF" }}>{fr.customerCount}</p>
          <span className={`chip3d ${cust.up ? "bg-leaf/10 text-leafdeep" : "bg-tomato/10 text-tomato"}`}>
            {cust.up ? "↑" : "↓"} {cust.text}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-cocoa">{deltaPhrase(lang, fr.customerDeltaPct, "customers")}</p>
      </section>

      {/* ── action cards, 2-col under the hero ─────────────────────────────── */}
      <div className="col-span-12 lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {cards.map((card, idx) => {
          const st = SEV_STYLE[card.severity];
          const hostsFlow = idx === 0;
          const mid = Math.round((card.impactLow + card.impactHigh) / 2);
          return (
            <section
              key={card.signal}
              className="card3d card3d-hover pop-in flex flex-col p-6"
              style={{ borderColor: st.border, borderWidth: 2, animationDelay: `${0.24 + idx * 0.06}s`, background: `linear-gradient(160deg,#FFF 60%,${st.glow})` }}
            >
              <span className={`chip3d w-fit ${st.badge}`}>
                {st.dot} {card.severity === "critical" ? (lang === "hi" ? "ज़रूरी" : "Urgent") : card.severity === "watch" ? (lang === "hi" ? "ध्यान दें" : "Watch") : (lang === "hi" ? "मौका" : "Chance")}
              </span>

              <p className="mt-3 text-xl xl:text-2xl font-extrabold leading-snug text-ink" style={{ textShadow: "0 1px 0 #FFF" }}>
                {card.signal}
              </p>

              <details className="mt-1">
                <summary className="cursor-pointer list-none text-base font-bold text-skydeep hover:underline">
                  ▸ {t(lang, "whyLabel")}
                </summary>
                <p className="mt-2 text-base leading-relaxed text-cocoa">{card.why}</p>
              </details>

              {mid > 0 && (
                <div className="mt-4 rounded-3xl bg-butter px-5 py-3" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.8), 0 3px 0 #EFDCB4" }}>
                  <p className="text-sm font-bold text-cocoa">{t(lang, "worth")}</p>
                  <p className="text-3xl font-extrabold text-ink">
                    {fmtMoney(mid)} <span className="text-base font-bold text-cocoa">{t(lang, "perWeek")}</span>
                  </p>
                </div>
              )}

              <div className="flex-1" />

              {hostsFlow && (
                <div className="mt-5">
                  {offerStage === "idle" || offerStage === "error" ? (
                    <button
                      onClick={() =>
                        void createOffer(card.signal, card.why, card.action, card.impactLow, card.impactHigh, card.targetSize)
                      }
                      className="btn3d btn3d-tomato w-full !text-lg"
                    >
                      ✨ {t(lang, "doThis")}
                      <span className="block text-xs font-semibold opacity-90">{card.action}</span>
                    </button>
                  ) : offerStage === "sending" ? (
                    <button disabled className="btn3d w-full bg-mist !text-cocoa" style={{ ["--btn-base" as string]: "#E4D6BC" }}>
                      ⏳ {t(lang, "offerSending")}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-3xl bg-leaf/10 p-4" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.8), 0 3px 0 #CDEBD9" }}>
                        <p className="text-base font-extrabold text-leafdeep">✓ {t(lang, "offerCreated")}</p>
                        <div
                          className="mt-3 rounded-3xl rounded-br-lg bg-white p-4"
                          style={{ boxShadow: "0 3px 0 #F3E3C6, 0 10px 20px rgba(196,158,96,.2)" }}
                        >
                          <p className="text-xs font-bold text-cocoa">
                            {lang === "hi" ? "ग्राहकों को यह भेजा गया:" : "Sent to your customers:"}
                          </p>
                          <p className="mt-1 text-base text-ink">
                            {lang === "hi" ? offer?.nudgeHi : offer?.nudgeEn || offer?.nudgeHi}
                          </p>
                        </div>
                      </div>
                      {offerStage === "sent" && (
                        <button onClick={() => void measureOutcome()} className="btn3d btn3d-sky w-full">
                          📅 {t(lang, "measureOutcome")}
                        </button>
                      )}
                      {offerStage === "measured" && outcome && (
                        <div className="rounded-3xl bg-leaf/10 p-4" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.8), 0 3px 0 #CDEBD9" }}>
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
    </div>
  );
}

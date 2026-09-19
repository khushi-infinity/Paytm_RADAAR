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
  critical: { border: "#FFD3CA", badge: "bg-tomato/10 text-tomato", dot: "🔴" },
  watch: { border: "#FFE7BD", badge: "bg-sun/10 text-sun", dot: "🟠" },
  opportunity: { border: "#CFE8FA", badge: "bg-sky/10 text-skydeep", dot: "🔵" },
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
  const moodColor =
    mood === "great" ? "text-leafdeep" : mood === "ok" ? "text-skydeep" : "text-tomato";
  const moodBg = mood === "great" ? "bg-leaf/10" : mood === "ok" ? "bg-sky/10" : "bg-tomato/10";

  const sales = fmtPct(fr.salesDeltaPct);
  const cust = fmtPct(fr.customerDeltaPct);
  const cards = cardViews(snap, lang);

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* ── the greeting: congrats in green, attention in red ─────────────── */}
      <div className={`card ${moodBg}`}>
        <p className="text-sm font-bold text-cocoa">
          {t(lang, greetingKey())}, {snap.merchantName.split(" ")[0]} 👋
        </p>
        <div className="mt-1 flex items-start gap-3">
          <span className="text-4xl">{moodEmoji}</span>
          <div>
            <h1 className={`text-2xl font-extrabold leading-tight ${moodColor}`}>{moodTitle}</h1>
            <p className="mt-0.5 text-base font-semibold text-ink">{moodBody}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-mist">
            <div
              className={`h-full rounded-full ${
                mood === "great" ? "bg-leaf" : mood === "ok" ? "bg-sky" : "bg-tomato"
              }`}
              style={{ width: `${fr.healthScore}%` }}
            />
          </div>
          <span className="text-sm font-extrabold text-cocoa">{fr.healthScore}/100</span>
        </div>
      </div>

      {/* ── today's two numbers ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card !p-4">
          <p className="text-sm font-bold text-cocoa">{t(lang, "sales")} · {t(lang, "thisWeek")}</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{fmtMoney(fr.weeklySales)}</p>
          <p className={`mt-0.5 text-sm font-bold ${sales.up ? "text-leafdeep" : "text-tomato"}`}>
            {sales.text} · {t(lang, "vsLastWeek")}
          </p>
          <p className="text-xs text-cocoa">{deltaPhrase(lang, fr.salesDeltaPct, "sales")}</p>
        </div>
        <div className="card !p-4">
          <p className="text-sm font-bold text-cocoa">{t(lang, "customers")}</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{fr.customerCount}</p>
          <p className={`mt-0.5 text-sm font-bold ${cust.up ? "text-leafdeep" : "text-tomato"}`}>
            {cust.text} · {t(lang, "vsLastWeek")}
          </p>
          <p className="text-xs text-cocoa">{deltaPhrase(lang, fr.customerDeltaPct, "customers")}</p>
        </div>
      </div>

      {/* ── the radar ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">📡 {t(lang, "yourRadar")}</h2>
          <span className="chip bg-mist text-cocoa">{fr.radarBlips.length}</span>
        </div>
        <MiniRadar blips={fr.radarBlips} />
      </div>

      {/* ── action cards, fully bilingual, one tap each ───────────────────── */}
      {cards.map((card, idx) => {
        const st = SEV_STYLE[card.severity];
        // Offer flow state is per-session (single active offer), so only the
        // first card hosts it; the rest stay as clean informational cards.
        const hostsFlow = idx === 0;
        const mid = Math.round((card.impactLow + card.impactHigh) / 2);
        return (
          <div
            key={card.signal}
            className="card border-2"
            style={{ borderColor: st.border }}
          >
            <div className="flex items-center justify-between">
              <span className={`chip ${st.badge}`}>
                {st.dot} {card.severity === "critical" ? (lang === "hi" ? "ज़रूरी" : "Urgent") : card.severity === "watch" ? (lang === "hi" ? "ध्यान दें" : "Watch") : (lang === "hi" ? "मौका" : "Chance")}
              </span>
            </div>

            <p className="mt-2 text-base font-extrabold leading-snug text-ink">{card.signal}</p>

            <details className="mt-1">
              <summary className="cursor-pointer text-sm font-bold text-skydeep">
                {t(lang, "whyLabel")}
              </summary>
              <p className="mt-1 text-sm leading-relaxed text-cocoa">{card.why}</p>
            </details>

            {mid > 0 && (
              <div className="mt-3 rounded-2xl bg-butter px-4 py-2.5">
                <p className="text-sm font-bold text-cocoa">{t(lang, "worth")}</p>
                <p className="text-2xl font-extrabold text-ink">
                  {fmtMoney(mid)} <span className="text-sm font-bold text-cocoa">{t(lang, "perWeek")}</span>
                </p>
              </div>
            )}

            {hostsFlow && (
              <>
                {offerStage === "idle" || offerStage === "error" ? (
                  <button
                    onClick={() =>
                      void createOffer(
                        card.signal,
                        card.why,
                        card.action,
                        card.impactLow,
                        card.impactHigh,
                        card.targetSize,
                      )
                    }
                    className="big-btn-primary mt-3 w-full"
                  >
                    <span className="flex flex-col items-center leading-tight">
                      <span>✨ {t(lang, "doThis")}</span>
                      <span className="text-xs font-semibold opacity-90">{card.action}</span>
                    </span>
                  </button>
                ) : offerStage === "sending" ? (
                  <button disabled className="big-btn mt-3 w-full bg-mist text-cocoa">
                    ⏳ {t(lang, "offerSending")}
                  </button>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-2xl bg-leaf/10 px-4 py-3">
                      <p className="text-sm font-extrabold text-leafdeep">✓ {t(lang, "offerCreated")}</p>
                      <div className="mt-2 rounded-2xl rounded-br-md bg-white p-3 shadow-soft">
                        <p className="text-xs font-bold text-cocoa">
                          {lang === "hi" ? "ग्राहकों को यह भेजा गया:" : "Sent to your customers:"}
                        </p>
                        <p className="mt-1 text-sm text-ink">
                          {lang === "hi" ? offer?.nudgeHi : offer?.nudgeEn || offer?.nudgeHi}
                        </p>
                      </div>
                    </div>
                    {offerStage === "sent" && (
                      <button onClick={() => void measureOutcome()} className="big-btn-sky w-full">
                        📅 {t(lang, "measureOutcome")}
                      </button>
                    )}
                    {offerStage === "measured" && outcome && (
                      <div className="rounded-2xl bg-leaf/10 px-4 py-3">
                        <p className="text-lg font-extrabold text-leafdeep">
                          {outcome.verdict === "worked" ? "🎉" : outcome.verdict === "underperformed" ? "😔" : "🤔"}{" "}
                          {outcome.verdict === "worked"
                            ? t(lang, "offerWorked")
                            : outcome.verdict === "underperformed"
                              ? t(lang, "offerDidntWork")
                              : t(lang, "offerNeutral")}
                        </p>
                        <p className="text-base font-bold text-ink">
                          +{fmtMoney(outcome.revenueDelta)} · +{Math.round(outcome.upliftPct)}% {t(lang, "perWeek")}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-cocoa">💾 {t(lang, "learnedFact")}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { SessionProvider, useSession, type Tab } from "@/lib/session";
import { t } from "@/lib/i18n";
import HomeView from "@/components/HomeView";
import BusinessView from "@/components/BusinessView";
import ChatView from "@/components/ChatView";
import Mascot from "@/components/Mascot";

function LangToggle() {
  const { lang, setLang } = useSession();
  return (          <div className="flex items-center rounded-full bg-white/15 p-1 backdrop-blur"
      style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.35), 0 8px 20px rgba(9,34,84,.3)" }}
    >
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-5 py-2 text-base font-extrabold transition-all ${
            lang === l ? "btn3d btn3d-orange !px-5 !py-1.5" : "text-bluesoft hover:text-white"
          }`}
        >
          {l === "en" ? "English" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}

function TabBar() {
  const { lang, tab, setTab } = useSession();
  const tabs: Array<{ id: Tab; icon: string; label: Parameters<typeof t>[1] }> = [
    { id: "home", icon: "🏠", label: "tabHome" },
    { id: "business", icon: "📊", label: "tabBusiness" },
    { id: "chat", icon: "💬", label: "tabChat" },
  ];
  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#2C68E4] via-[#2C68E4]/80 to-transparent pb-5 pt-6">
      <div
        className="mx-auto flex max-w-xl items-end gap-3 rounded-[2rem] bg-white/15 p-2.5 backdrop-blur"
        style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.3), 0 10px 26px rgba(9,34,84,.35)" }}
      >
        {tabs.map((tb) => (
          <button key={tb.id} data-active={tab === tb.id} onClick={() => setTab(tb.id)} className="tabstone">
            <span className="text-2xl drop-shadow-sm">{tb.icon}</span>
            {t(lang, tb.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Puffy clay clouds, lit like the reference (top-left key light). */
function Cloud({ x, y, s = 1, delay = "0s" }: { x: string; y: string; s?: number; delay?: string }) {
  return (
    <div className="floaty-slow absolute" style={{ left: x, top: y, transform: `scale(${s})`, animationDelay: delay }} aria-hidden>
      <div className="relative h-16 w-36">
        <div className="absolute bottom-0 h-12 w-36 rounded-full bg-white" style={{ boxShadow: "0 14px 28px rgba(10,40,100,.25)" }} />
        <div className="absolute bottom-4 left-5 h-14 w-14 rounded-full bg-white" />
        <div className="absolute bottom-5 left-14 h-11 w-11 rounded-full bg-white" />
        <div className="absolute bottom-1 left-3 h-9 w-9 rounded-full bg-white/95" />
        <div className="absolute bottom-8 left-7 h-5 w-20 rounded-full bg-white/80 blur-[2px]" />
        <div className="absolute bottom-0 left-2 h-4 w-32 rounded-full bg-royal/10 blur-[3px]" />
      </div>
    </div>
  );
}

function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <Cloud x="6%" y="16%" s={1.1} />
      <Cloud x="80%" y="10%" s={0.85} delay="1.2s" />
      <Cloud x="72%" y="58%" s={1.25} delay="2s" />
      <Cloud x="4%" y="64%" s={0.7} delay=".6s" />
      <div className="floaty absolute right-[10%] top-[36%] text-3xl drop-shadow-lg" style={{ animationDelay: "1.4s" }}>🪙</div>
      <div className="floaty absolute left-[8%] top-[44%] text-2xl drop-shadow-lg" style={{ animationDelay: "2.2s" }}>🌱</div>
    </div>
  );
}

function Shell() {
  const { lang, tab, loading, loadError, reload } = useSession();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Scenery />
      {/* DADA mascot: bottom-right companion, like the reference's fox */}
      <div className="pointer-events-none fixed bottom-16 right-4 z-0 hidden lg:block">
        <div className="mascot-bob">
          <Mascot size={290} className="drop-shadow-2xl" />
        </div>
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-8">
        <header className="flex items-center justify-between pb-4 pt-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl"
              style={{ boxShadow: "inset 0 3px 0 rgba(255,255,255,.9), 0 5px 0 #D9E6FB, 0 14px 26px rgba(9,34,84,.4)" }}
            >
              📡
            </div>
            <div>
              <h1 className="text-4xl font-extrabold leading-none tracking-wide text-white" style={{ textShadow: "0 3px 0 rgba(14,47,102,.45)" }}>
                RADAAR
              </h1>
              <p className="text-base font-bold text-bluesoft">{t(lang, "tagline")}</p>
            </div>
          </div>
          <LangToggle />
        </header>

        <main className="relative z-[1] flex-1 pt-2">
          {loading ? (
            <div className="py-40 text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-[6px] border-white/25 border-t-white" />
              <p className="mt-6 text-xl font-bold text-bluesoft">{t(lang, "loading")}</p>
            </div>
          ) : loadError ? (
            <div className="py-40 text-center">
              <p className="text-6xl">😕</p>
              <p className="mt-4 text-xl font-bold text-white">{t(lang, "errorLoad")}</p>
              <button onClick={reload} className="btn3d btn3d-orange mt-6">
                {t(lang, "retry")}
              </button>
            </div>
          ) : tab === "home" ? (
            <HomeView />
          ) : tab === "business" ? (
            <BusinessView />
          ) : (
            <ChatView />
          )}
        </main>

        <TabBar />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}

"use client";

import { SessionProvider, useSession, type Tab } from "@/lib/session";
import { t } from "@/lib/i18n";
import HomeView from "@/components/HomeView";
import BusinessView from "@/components/BusinessView";
import ChatView from "@/components/ChatView";

function LangToggle() {
  const { lang, setLang } = useSession();
  return (
    <div
      className="flex items-center rounded-full bg-white p-1"
      style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.9), 0 4px 0 #F3E3C6, 0 10px 20px rgba(196,158,96,.25)" }}
    >
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-5 py-2 text-base font-extrabold transition-all ${
            lang === l ? "btn3d btn3d-tomato !px-5 !py-1.5" : "text-cocoa hover:text-tomato"
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
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-cream via-cream/90 to-transparent pb-5 pt-6">
      <div
        className="mx-auto flex max-w-xl items-end gap-3 rounded-[2rem] bg-butter/80 p-2.5 backdrop-blur"
        style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,.7), 0 8px 0 #EAD9B8, 0 18px 36px rgba(196,158,96,.3)" }}
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

/** Soft 3D scenery — puffy CSS clouds & coins drifting behind the app. */
function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* blurred colour blobs */}
      <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-sun/20 blur-3xl" />
      <div className="absolute right-[-6rem] top-[30rem] h-96 w-96 rounded-full bg-peach/15 blur-3xl" />
      <div className="absolute left-[30%] top-[52rem] h-72 w-72 rounded-full bg-sky/15 blur-3xl" />
      {/* puffy clouds (stacked circles + highlight) */}
      {[
        { l: "4%", t: "12%", s: 1.15, d: "0s", r: "-3deg" },
        { l: "88%", t: "8%", s: 0.9, d: "1.2s", r: "4deg" },
        { l: "78%", t: "62%", s: 1.3, d: "2s", r: "-2deg" },
        { l: "10%", t: "68%", s: 0.75, d: ".6s", r: "3deg" },
      ].map((c, i) => (
        <div
          key={i}
          className="floaty-slow absolute opacity-80"
          style={{ left: c.l, top: c.t, transform: `scale(${c.s})`, animationDelay: c.d, ["--rot" as string]: c.r }}
        >
          <div className="relative h-14 w-28">
            <div className="absolute bottom-0 h-10 w-28 rounded-full bg-white" style={{ boxShadow: "0 10px 20px rgba(196,158,96,.25)" }} />
            <div className="absolute bottom-3 left-4 h-12 w-12 rounded-full bg-white" />
            <div className="absolute bottom-4 left-12 h-9 w-9 rounded-full bg-white" />
            <div className="absolute bottom-1 left-2 h-8 w-8 rounded-full bg-white/95" />
            <div className="absolute bottom-6 left-6 h-4 w-16 rounded-full bg-white/70 blur-[2px]" />
          </div>
        </div>
      ))}
      {/* floating coins / rupees */}
      <div className="floaty absolute left-[16%] top-[22%] text-3xl drop-shadow-lg" style={{ animationDelay: ".4s" }}>🪙</div>
      <div className="floaty absolute right-[12%] top-[40%] text-2xl drop-shadow-lg" style={{ animationDelay: "1.4s" }}>💰</div>
      <div className="floaty absolute left-[6%] top-[46%] text-2xl drop-shadow-lg" style={{ animationDelay: "2.2s" }}>📈</div>
      <div className="floaty absolute right-[22%] top-[80%] text-3xl drop-shadow-lg" style={{ animationDelay: "1s" }}>🪙</div>
    </div>
  );
}

function Shell() {
  const { lang, tab, loading, loadError, reload } = useSession();
  return (
    <div className="relative min-h-screen">
      <Scenery />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-8">
        <header className="flex items-center justify-between pb-4 pt-7">
          <div className="flex items-center gap-4">
            {/* 3D logo stone */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tomato text-3xl"
              style={{ boxShadow: "inset 0 3px 0 rgba(255,255,255,.4), 0 6px 0 #C9442D, 0 14px 24px rgba(229,84,58,.4)" }}
            >
              📡
            </div>
            <div>
              <h1 className="text-4xl font-extrabold leading-none tracking-wide text-tomato" style={{ textShadow: "0 2px 0 #FFD9CE" }}>
                RADAAR
              </h1>
              <p className="text-base font-bold text-cocoa">{t(lang, "tagline")}</p>
            </div>
          </div>
          <LangToggle />
        </header>

        <main className="relative z-[1] flex-1 pt-2">
          {loading ? (
            <div className="py-40 text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-[6px] border-mist border-t-tomato" />
              <p className="mt-6 text-xl font-bold text-cocoa">{t(lang, "loading")}</p>
            </div>
          ) : loadError ? (
            <div className="py-40 text-center">
              <p className="text-6xl">😕</p>
              <p className="mt-4 text-xl font-bold text-ink">{t(lang, "errorLoad")}</p>
              <button onClick={reload} className="btn3d btn3d-tomato mt-6">
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

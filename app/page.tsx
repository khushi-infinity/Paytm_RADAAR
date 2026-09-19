"use client";

import { SessionProvider, useSession, type Tab } from "@/lib/session";
import { t } from "@/lib/i18n";
import HomeView from "@/components/HomeView";
import BusinessView from "@/components/BusinessView";
import ChatView from "@/components/ChatView";

function LangToggle() {
  const { lang, setLang } = useSession();
  return (
    <div className="flex items-center rounded-full bg-white p-1 shadow-soft">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-extrabold transition-all ${
            lang === l ? "bg-tomato text-white shadow-pop" : "text-cocoa"
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
    <nav className="sticky bottom-0 z-10 border-t-2 border-mist bg-cream/95 px-3 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-lg gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            data-active={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className="tabbar-item"
          >
            <span className="text-xl">{tb.icon}</span>
            {t(lang, tb.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Shell() {
  const { lang, tab, loading, loadError, reload } = useSession();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide text-tomato">RADAAR</h1>
          <p className="text-xs font-semibold text-cocoa">{t(lang, "tagline")}</p>
        </div>
        <LangToggle />
      </header>

      <main className="flex-1 pt-2">
        {loading ? (
          <div className="px-4 py-24 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-mist border-t-tomato" />
            <p className="mt-4 font-bold text-cocoa">{t(lang, "loading")}</p>
          </div>
        ) : loadError ? (
          <div className="px-4 py-24 text-center">
            <p className="text-4xl">😕</p>
            <p className="mt-3 font-bold text-ink">{t(lang, "errorLoad")}</p>
            <button onClick={reload} className="big-btn-primary mt-4">
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
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}

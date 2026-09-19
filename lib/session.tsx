"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BusinessSnapshot } from "./types";
import { friendly, type FriendlyNumbers } from "./friendly";
import type { Lang } from "./i18n";

export type Tab = "home" | "business" | "chat";
export type OfferStage = "idle" | "sending" | "sent" | "measured" | "error";

export interface OfferInfo {
  offerId: string;
  nudgeHi: string;
  nudgeEn: string;
}

export interface OutcomeInfo {
  revenueDelta: number;
  upliftPct: number;
  verdict: "worked" | "underperformed" | "neutral" | string;
}

interface SessionCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tab: Tab;
  setTab: (t: Tab) => void;
  snap: BusinessSnapshot | null;
  friendly: FriendlyNumbers | null;
  loading: boolean;
  loadError: string | null;
  reload: () => void;
  // offer loop — per card, keyed by card id so every card runs its own loop
  stageOf: (cardId: string) => OfferStage;
  offerOf: (cardId: string) => OfferInfo | null;
  outcomeOf: (cardId: string) => OutcomeInfo | null;
  createOffer: (cardId: string, signal: string, why: string, action: string, impactLow: number, impactHigh: number, targetSize: number) => Promise<void>;
  measureOutcome: (cardId: string) => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside provider");
  return v;
}

export function useLang() {
  const s = useSession();
  return { lang: s.lang, setLang: s.setLang };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi"); // merchant-first default: Hindi
  const [tab, setTab] = useState<Tab>("home");
  const [snap, setSnap] = useState<BusinessSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offerStages, setOfferStages] = useState<Record<string, OfferStage>>({});
  const [offers, setOffers] = useState<Record<string, OfferInfo>>({});
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeInfo>>({});

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("radaar_lang", l);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    try {
      // deep links: ?lang=en|hi and ?tab=home|business|chat (also used for screenshots)
      const q = new URLSearchParams(window.location.search);
      const qLang = q.get("lang");
      if (qLang === "en" || qLang === "hi") setLangState(qLang);
      const qTab = q.get("tab");
      if (qTab === "home" || qTab === "business" || qTab === "chat") setTab(qTab);
      const saved = localStorage.getItem("radaar_lang");
      if (!qLang && (saved === "en" || saved === "hi")) setLangState(saved);
    } catch {
      /* private mode */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(`snapshot ${res.status}`);
      const j = (await res.json()) as BusinessSnapshot;
      setSnap(j);
    } catch {
      setLoadError("load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createOffer = useCallback(
    async (
      cardId: string,
      signal: string,
      why: string,
      action: string,
      impactLow: number,
      impactHigh: number,
      targetSize: number,
    ) => {
      if (!snap || offerStages[cardId] === "sending") return;
      setOfferStages((s) => ({ ...s, [cardId]: "sending" }));
      try {
        const res = await fetch("/api/offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signal,
            why,
            action,
            impact: impactLow > 0 && impactHigh > 0 ? `₹${impactLow.toLocaleString("en-IN")}–₹${impactHigh.toLocaleString("en-IN")}` : "",
            audience: "at_risk",
            audienceSize: Math.max(1, targetSize),
            merchant: snap.merchantName,
          }),
        });
        const j = (await res.json()) as {
          ok?: boolean;
          offerId?: string;
          nudgeHi?: string;
          nudgeEn?: string;
          error?: string;
        };
        if (!res.ok || !j.ok || !j.offerId) throw new Error(j.error ?? "offer failed");
        setOffers((o) => ({ ...o, [cardId]: { offerId: j.offerId!, nudgeHi: j.nudgeHi ?? "", nudgeEn: j.nudgeEn ?? "" } }));
        setOfferStages((s) => ({ ...s, [cardId]: "sent" }));
      } catch {
        setOfferStages((s) => ({ ...s, [cardId]: "error" }));
      }
    },
    [snap, offerStages],
  );

  const measureOutcome = useCallback(
    async (cardId: string) => {
      const offer = offers[cardId];
      if (!snap || !offer || offerStages[cardId] !== "sent") return;
      setOfferStages((s) => ({ ...s, [cardId]: "measured" })); // optimistic; the API is fast (simulated week)
      try {
        const res = await fetch("/api/outcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: offer.offerId,
            action: "",
            audienceSize: 0,
            weeklyRevenue: snap.revenue.thisWeek,
            merchant: snap.merchantName,
          }),
        });
        const j = (await res.json()) as {
          ok?: boolean;
          revenueDelta?: number;
          upliftPct?: number;
          verdict?: string;
        };
        if (!res.ok || !j.ok) throw new Error("outcome failed");
        setOutcomes((o) => ({
          ...o,
          [cardId]: {
            revenueDelta: j.revenueDelta ?? 0,
            upliftPct: j.upliftPct ?? 0,
            verdict: j.verdict ?? "worked",
          },
        }));
      } catch {
        setOfferStages((s) => ({ ...s, [cardId]: "sent" })); // allow retry
      }
    },
    [snap, offers, offerStages],
  );

  const fr = useMemo(() => (snap ? friendly(snap) : null), [snap]);

  const value: SessionCtx = {
    lang,
    setLang,
    tab,
    setTab,
    snap,
    friendly: fr,
    loading,
    loadError,
    reload: () => void load(),
    stageOf: (cardId) => offerStages[cardId] ?? "idle",
    offerOf: (cardId) => offers[cardId] ?? null,
    outcomeOf: (cardId) => outcomes[cardId] ?? null,
    createOffer,
    measureOutcome,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

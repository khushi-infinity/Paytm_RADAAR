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
  // offer loop
  offerStage: OfferStage;
  offer: OfferInfo | null;
  outcome: OutcomeInfo | null;
  createOffer: (signal: string, why: string, action: string, impactLow: number, impactHigh: number, targetSize: number) => Promise<void>;
  measureOutcome: () => Promise<void>;
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
  const [offerStage, setOfferStage] = useState<OfferStage>("idle");
  const [offer, setOffer] = useState<OfferInfo | null>(null);
  const [outcome, setOutcome] = useState<OutcomeInfo | null>(null);

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
      const saved = localStorage.getItem("radaar_lang");
      if (saved === "en" || saved === "hi") setLangState(saved);
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
      signal: string,
      why: string,
      action: string,
      impactLow: number,
      impactHigh: number,
      targetSize: number,
    ) => {
      if (!snap || offerStage === "sending") return;
      setOfferStage("sending");
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
        setOffer({ offerId: j.offerId, nudgeHi: j.nudgeHi ?? "", nudgeEn: j.nudgeEn ?? "" });
        setOfferStage("sent");
      } catch {
        setOfferStage("error");
      }
    },
    [snap, offerStage],
  );

  const measureOutcome = useCallback(async () => {
    if (!snap || !offer || offerStage !== "sent") return;
    setOfferStage("measured"); // optimistic; the API is fast (simulated week)
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
      setOutcome({
        revenueDelta: j.revenueDelta ?? 0,
        upliftPct: j.upliftPct ?? 0,
        verdict: j.verdict ?? "worked",
      });
    } catch {
      setOfferStage("sent"); // allow retry
    }
  }, [snap, offer, offerStage]);

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
    offerStage,
    offer,
    outcome,
    createOffer,
    measureOutcome,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

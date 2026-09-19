import { NextResponse } from "next/server";
import { MEMORY_DATASET, search, type SearchType } from "@/lib/cognee";
import { sarvamChat } from "@/lib/sarvam";
import { generateMerchantData } from "@/lib/generator";
import { buildSnapshot } from "@/lib/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Chat latency guards: skip the graph readiness probe for 60s after a success,
// and cap each chat search at 45s so the merchant always gets a timely answer
// (falling back to live snapshot facts when the graph is slow or asleep).
let graphReadyUntil = 0;
const GRAPH_READY_TTL_MS = 60_000;
const CHAT_SEARCH_TIMEOUT_MS = 45_000;

let snapshot: ReturnType<typeof buildSnapshot> | null = null;
function getSnapshot() {
  if (!snapshot) {
    const data = generateMerchantData({ days: 90, seed: 42 });
    snapshot = buildSnapshot(data.transactions, data.customers, data.merchantName, data.now);
  }
  return snapshot;
}

function snapshotFacts(): string {
  const s = getSnapshot();
  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const trend = s.trends.map((t) => `${t.window}: ${t.deltaPct > 0 ? "+" : ""}${t.deltaPct}% vs ${t.baselineLabel}`).join("; ");
  const segs = s.segments.map((x) => `${x.segment}=${x.count}`).join(", ");
  const cards = s.cards
    .slice(0, 3)
    .map((c, i) => `${i + 1}. ${c.signal} → ${c.action} → ${c.impact}`)
    .join(" | ");
  return [
    `Merchant: ${s.merchantName}.`,
    `Health ${s.health.score}/100 (${s.health.grade}).`,
    `Weekly revenue ${inr(s.revenue.thisWeek)} (${s.revenue.deltaPct >= 0 ? "+" : ""}${s.revenue.deltaPct}% vs last week).`,
    `Customers ${s.customers.total} (${s.customers.newThisWeek} new this week). Avg ticket ${inr(s.avgTicket.value)}.`,
    `Trends: ${trend}.`,
    `Segments: ${segs}.`,
    `Top recommendations: ${cards}`,
  ].join(" ");
}

/**
 * Keep answers merchant-short: strip markdown, take the first sentence, add a
 * second only if it fits the character budget. Applies to BOTH answer paths so
 * the copilot never lectures (in text or in voice).
 */
function trimAnswer(raw: string, maxSentences = 2, maxChars = 260): string {
  const clean = raw
    .replace(/\s+/g, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*•#]+\s*/, "")
    .trim();
  const sentences = clean.split(/(?<=[।.!?])\s+/).filter((x) => x.trim().length > 0);
  let picked = sentences[0] ?? clean;
  for (let i = 1; i < sentences.length && i < maxSentences; i++) {
    if ((picked + " " + sentences[i]).length > maxChars) break;
    picked += " " + sentences[i];
  }
  if (picked.length > maxChars) {
    picked = picked.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
  }
  return picked;
}

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as { message?: string };
    const q = (message ?? "").trim();
    if (!q) return NextResponse.json({ ok: false, error: "empty message" }, { status: 400 });

    // 1) Preferred path: the merchant's Cognee memory graph (grounded, learned)
    try {
      if (Date.now() > graphReadyUntil) {
        const chunks = await search(MEMORY_DATASET, "merchant offer outcome", "CHUNKS" as SearchType, CHAT_SEARCH_TIMEOUT_MS);
        if (chunks.length === 0) throw new Error("graph not ready");
        graphReadyUntil = Date.now() + GRAPH_READY_TTL_MS;
      }
      const answers = await search(MEMORY_DATASET, q, "GRAPH_COMPLETION" as SearchType, CHAT_SEARCH_TIMEOUT_MS);
      const answer = answers.filter((a) => a.trim()).join(" ");
      if (answer) {
        graphReadyUntil = Date.now() + GRAPH_READY_TTL_MS;
        return NextResponse.json({ ok: true, answer: trimAnswer(answer), source: "memory-graph" });
      }
    } catch {
      // graph unavailable or slow, fall through to snapshot-grounded answer
    }

    // 2) Fallback: Sarvam answers strictly from the live snapshot facts
    const answer = await sarvamChat(
      `Merchant data: ${snapshotFacts()}\n\nQuestion: ${q}\n\nAnswer in at most 2 short sentences using ONLY the data above. If the answer is not in the data, say what related information IS available. Reply in the same language as the question (Hinglish if mixed).`,
      { system: "You are RADAAR, a concise business copilot for an Indian merchant. Never use more than two sentences.", maxTokens: 250 },
    );
    return NextResponse.json({ ok: true, answer: trimAnswer(answer), source: "live-snapshot" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "copilot failed" },
      { status: 500 },
    );
  }
}


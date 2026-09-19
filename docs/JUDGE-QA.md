# RADAAR · Judge Q&A Script

Everything a judge needs to hear about guardrails, capabilities, and the n8n/Cognee mechanics, in speakable form. Short line first, detail if they push.

## The 30-second framing (open with this)

> "RADAAR reads a merchant's payment stream, finds the few things worth acting on, prices each in rupees, and executes through the merchant's own n8n. Every action and result is remembered in the merchant's Cognee graph, so tomorrow's advice is grounded in what actually worked for this store. The merchant asks anything by voice, in Hindi or English, and hears the answer."

## Guardrails (say these before they ask)

**1. RADAAR never touches money.**
No payments, settlements, or refunds flow through RADAAR. The customer pays on the merchant's Paytm QR exactly as today; RADAAR only *reads* the transaction stream and *measures* the result. An AI that merchants trust with advice must not be an AI that can move their money. That separation is deliberate architecture, not a missing feature.

**2. The AI never invents numbers.**
Every rupee figure on screen comes from deterministic TypeScript engines over the transaction data. Sarvam's job is language (explaining, writing nudges, translating), never math. If the data doesn't contain an answer, the copilot says so instead of guessing.

**3. The copilot cannot hallucinate, structurally.**
Answers are retrieved from the merchant's Cognee memory graph (GRAPH_COMPLETION). If the graph is unreachable, it falls back to live snapshot facts and the answer is *badged differently* so you can see the source. There is no code path where it freestyles. Ask it something not in its data ("how many chickens do I own?") and it tells you what IS available instead.

**4. Actions live in the merchant's own automation.**
RADAAR triggers workflows inside the merchant's n8n instance; the merchant can open, edit, pause, or delete them. RADAAR never acts *on* the merchant, it fires *their* machinery. The one simulated step (the final WhatsApp send) is a named mock node, swappable for the WhatsApp Business API or Paytm's business inbox.

**5. One data world per merchant.**
Cognee facts are written per dataset (`radaar_merchant_memory` per merchant); nothing is cross-merchant. Memory is auditable: the "मुझे क्या याद है" panel shows the facts exactly as stored, and a local audit log records every write.

**6. Short answers, honest labels.**
The copilot is capped at 1–2 sentences. Source badges (🧠 Cognee स्मृति से / लाइव आँकड़ों से) tell the merchant where every answer came from. Synthetic data is labeled synthetic; the mocked send is labeled mock.

## What the product can do (the capability list)

1. **Mood check**: green "खुशखबरी!" or red "ध्यान दें" verdict before any numbers
2. **Two numbers only**: weekly sales, customers served
3. **Growth radar**: every blinking pin is a priced revenue opportunity
4. **Action cards**: what happened → why → what to do → क़रीब इतना मिल सकता है ₹X हर हफ़्ते
5. **One-tap execution**: triggers the merchant's n8n → Sarvam writes the nudge → Cognee files the offer; pipeline stepper lights up as each system completes
6. **Outcome measurement**: revenue delta flows back through n8n → verdict (worked / underperformed / neutral) → stored as memory
7. **Learning loop**: future recommendations are grounded in past outcomes, per store
8. **Ask RADAAR**: voice or text, Hindi/English/Hinglish, answered from the memory graph or live facts, spoken aloud (auto Hindi/English voice)
9. **Full bilingual app**: हिंदी ⇄ English for everything, including engine sentences with computed numbers
10. **Visible memory**: the graph is readable in the app and in the Cognee console

## n8n: what we used, node by node

Three workflows, **deployed programmatically** through the n8n public API (`npm run pipeline`: list → delete-by-name → create → activate). Nothing hand-built in the UI.

**Workflow 1: RADAAR · Ingest → Detect → Act**
- **Webhook** `radaar-ingest` receives the daily snapshot
- **IF "Action needed?"** decides whether anything deserves the merchant's attention
- **HTTP "Sarvam Nudge (Hinglish)"** calls Sarvam (model sarvam-105b) to write the ≤160-char Devanagari nudge from this store's own numbers
- **Code "Build Memory Fact"** shapes the typed INSIGHT fact (deterministic, no LLM in the write path)
- **HTTP "Write to Cognee"** POSTs it into the merchant's memory (multipart add)
- Responds with the nudge the UI displays

**Workflow 2: RADAAR · Offer Dispatch** (fires when the merchant taps यह करें)
- **Webhook** `radaar-offer` receives offer + audience + both nudge texts
- **Code "Prepare Delivery + Fact"** builds the delivery manifest (offer id, audience size, named sample recipients) and the OFFER DISPATCHED fact
- **HTTP "Write to Cognee"** files the dispatch into memory
- Responds with the delivery preview the app renders as the WhatsApp mock

**Workflow 3: RADAAR · Outcome → Learning Loop**
- **Webhook** `radaar-outcome` receives the measured revenue delta
- **Code "Verdict + Fact"** computes the verdict (uplift > 1% worked, < −1% underperformed, else neutral) plus the lesson sentence, and shapes the OFFER OUTCOME fact
- **HTTP "Write to Cognee"** stores the outcome, closing the loop
- Responds with verdict + lesson, which the app shows as "🎉 काम बना! +₹X · +Y%"

**The line to deliver:** "The action layer belongs to the merchant. They can open the canvas and edit their own automation without touching our code. That is why we built execution in n8n and not inside the app."

## Cognee: what we used, step by step

**Dataset:** `radaar_merchant_memory`, one per merchant, on the merchant's Cognee tenant.

**Write path (deterministic, no LLM):** typed text facts → `POST /api/v1/add` (multipart) → `POST /api/v1/cognify` builds the graph async. Fact types: MERCHANT PROFILE, TREND, ANOMALY, SEGMENT, INSIGHT, OFFER DISPATCHED, OFFER OUTCOME. Two of those (offers, outcomes) are written **by the n8n workflows**, so two orchestrators share one memory.

**Two API contracts we encoded after live verification:**
1. Every cognify call starts a new run, so readiness is polled with a cheap CHUNKS search, never by re-POSTing data.
2. The dataset is deleted and re-cognified before a demo so the graph holds exactly one clean, provable loop.

**Read path:** the copilot probes the graph with CHUNKS; when data is visible it asks via GRAPH_COMPLETION (LLM reasoning *from the graph*) and wears the 🧠 badge. Readiness is cached 60s and each chat search is capped at 45s, so a cold graph never strands the merchant; the fallback is snapshot facts with the 📊 badge.

**Grounding proof:** `npm run pipeline` ends by asking the graph a question whose answer can only come from facts written minutes earlier. Ask the chat "पिछले ऑफ़र का क्या नतीजा आया?" and it cites the offer id and measured rupee delta from memory.

**Why a graph, not a vector DB:** "Vector search returns similar text. The graph returns a *because*: offer → outcome → lesson. The compounding connection is the product."

## Memory architecture: short-term, long-term, and why context is never "lost"

Judges with an ML background will probe this. Three layers, each with a clear job:

**1. Long-term memory = the Cognee graph (per merchant, permanent).**
Seven typed fact types are cognified into a knowledge graph: profile, trends, anomalies, segments, insights, offers, outcomes. Facts are deterministic sentences shaped by code, so memory quality is controlled at write time. This memory is **structured, not a text dump**: offer facts connect to outcome facts, which is what lets the system answer *because* questions ("why should I trust this offer?"). It compounds: every measured outcome makes the next recommendation more grounded. Nothing expires; the merchant can inspect every fact in the app and the Cognee console.

**2. Short-term memory = a sliding conversation window (per session).**
The chat keeps the last 6 turns (each truncated to 200 chars) on the client and sends them with every request. The server injects them as a compact "Conversation so far" block next to the question. This is why follow-ups like "और पिछले हफ़्ते से तुलना?" or "why?" work without repeating the question. Nothing is persisted server-side; the merchant's device holds the session, which is also a privacy guardrail.

**3. The live snapshot = the always-fresh context floor.**
Every copilot call re-grounds on current facts (weekly revenue, health score, segments, top recommendations) generated deterministically from the transaction data. So even a brand-new session answers from today's numbers, never a stale cache.

**How context gets lost in naive bots, and what we do instead:**
- **Lost by truncation**: naive bots paste the whole transcript until the model's context window overflows and old turns fall off silently. We never paste raw transcripts: short-term context is a size-capped summary block (6 turns × 200 chars), long-term facts live in the graph where retrieval is selective, not sequential.
- **Lost by distance**: relevant facts sit thousands of tokens back in a long chat. We retrieve *per question*: the graph search pulls only the facts related to this question, so relevant memory arrives adjacent to the question no matter how old it is.
- **Lost by staleness**: a summarized session memory goes stale. Our snapshot layer re-computes fresh facts on every call.

**The RAG flow, concretely (say this when asked "how do you do RAG?"):**
1. Question arrives ("पिछले ऑफ़र का क्या नतीजा आया?")
2. **Retrieve**: Cognee CHUNKS probe confirms the graph has data, then GRAPH_COMPLETION retrieves the offer/outcome subgraph relevant to the question (semantic + graph traversal, not keyword matching)
3. **Augment**: retrieved facts are the grounding context; the model is instructed to answer ONLY from them
4. **Generate**: the answer comes back with a provenance badge (🧠 graph / 📊 live facts) shown to the merchant
5. If retrieval finds nothing relevant, the system says so instead of generating. **Refusal is a retrieval feature, not a failure.**

**Retrieval tuning we actually shipped:** 60s graph-readiness cache (so repeated questions skip the probe), 45s per-search timeout (a cold graph falls back to snapshot facts fast), 2-sentence answer cap applied after generation (so grounding, not verbosity, reaches the merchant), markdown stripped server-side.

**Why Cognee's graph RAG over classic vector RAG:** vector stores return *similar text*; the graph returns *connected facts with relations*. "Offer X → dispatched to 935 customers → outcome +₹5,750 → lesson: combos work" is one traversal, not four near-miss chunks stitched by an LLM. The relations are the memory.

## Sarvam in one breath (they will ask)

sarvam-105b writes every nudge and answers the copilot in Hindi/English/Hinglish; saarika:v2.5 turns mic audio into text; bulbul:v3 speaks every answer, auto-switching Hindi/English voice by script. The merchant's language is the product, and one vendor covers the full loop.

## Rapid-fire Q&A crib

**"Is the data real?"** "Synthetic, seeded, reproducible, and labeled. The engines, workflows, and memory contracts run unchanged on a real Paytm feed; it is a schema swap, not an architecture change."

**"What did you build vs what the platforms gave you?"** "The platforms gave the infrastructure. We built the fact schema, the two-writer architecture, the deterministic pricing engines, the bilingual friendly layer, and the programmatic deployment."

**"What happens at scale?"** "Per-merchant state, shared engines. Same three-node workflow pattern per merchant's n8n, same dataset schema per tenant, all on platforms that already run multi-tenant."

**"What's mocked?"** "Exactly one step, the final WhatsApp send, and it is labeled mock in the UI. Everything up to it is live: Sarvam wrote the message, n8n orchestrated, Cognee remembered."

**"Can the merchant break it?"** "They can pause their n8n, and RADAAR then reports honestly instead of silently failing. Memory is append-only facts; the merchant can inspect or export every write."

**"Why not just a chatbot?"** "A chatbot answers questions. RADAAR prices the answer, executes it, measures it, and remembers it. The loop is the product."

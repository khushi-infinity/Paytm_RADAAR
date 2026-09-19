# RADAAR — आपके व्यापार का साथी

### The merchant's friendly business companion (Hindi · English)

This is the **merchant-facing** RADAAR: a calm, warm, phone-first app built for a shopkeeper — not an analyst. It answers the only four questions a merchant has, in the language they speak, with the least possible data on screen.

> Design reference: bright, rounded, few-elements UIs (e.g. the FUNTYX-style pastel cards) — everything big, everything tappable, nothing confusing.

---

## Who this is for

**Sharma General Store.** A kirana / salon / café owner with a Paytm QR on the counter. They don't read dashboards, don't know English well, and have 30 seconds in the morning between customers. Every design decision serves them:

| Principle | What it means here |
|---|---|
| **Least data wins** | Home shows a mood, two numbers, a radar, and one urgent action. Everything else is one tab away, never on the main screen |
| **Feelings before numbers** | Business good → green **"खुशखबरी!"** with 🎉. Something wrong → red **"ध्यान दें"**. The merchant reads the mood before any figure |
| **Their language** | One toggle (English ⇄ हिंदी) translates the **whole app** — greetings, cards, reasons, buttons, chat, even the AI's suggested questions |
| **Speak, don't type** | The 🎙️ button records their voice → Sarvam transcribes → they get a spoken answer back |
| **One tap to act** | "यह करें" sends the offer for them — the WhatsApp message is written by AI, the customers are chosen from their own data |

## The three tabs (the toggle principle)

Instead of one crowded dashboard, everything is separated by a bottom tab bar — **click to see one thing at a time**:

1. **होम / Home** — the morning glance: mood greeting (congratulate or warn), this week's sales + customers, the friendly growth radar, and every opportunity as a big bilingual card with its ₹ value and one action button.
2. **मेरा व्यापार / My Business** — the "why", in plain words: how sales are moving, worth-knowing events, who your customers are (regulars / new / drifting), how people pay (Paytm QR, UPI, Wallet, Card), and what RADAAR remembers.
3. **पूछो RADAAR / Ask RADAAR** — the companion: speak or type in Hindi/English/Hinglish and get grounded answers from the shop's own memory graph. Suggested question chips for one-tap asking.

## What's under the hood (unchanged from the judges' build)

The intelligence "brain" is shared with `../Paytm_Build` — deterministic engines over 90 days of seeded Paytm-style transactions, and the full sponsor stack:

- **Sarvam** — `saarika:v2.5` transcribes the merchant's voice; `sarvam-105b` writes the Hinglish offer message and chat answers; `bulbul:v3` (speaker priya) speaks replies in hi-IN/en-IN automatically.
- **n8n** — "यह करें" fires the merchant's own n8n workflow, which calls Sarvam and files the dispatch into memory.
- **Cognee** — every insight, offer, and measured outcome lives in the merchant's memory graph; chat answers are retrieved from it and badged "आपके व्यापार की स्मृति से".

## Run it

```bash
cd ~/Desktop/paytm
npm install
cp .env.example .env    # if starting fresh — fill COGNEE_*, N8N_*, SARVAM_API_KEY
npm run dev             # → http://localhost:3001
```

One-time (from either project): `npm run pipeline` — deploys the 3 n8n workflows and builds the Cognee memory graph.

> Port is **3001** so this can run beside the judges' build (`Paytm_Build` on 3000).

## Project layout

```
app/page.tsx          # shell: header + language toggle + 3-tab bottom nav
app/globals.css       # warm light design system (cream/butter/tomato/leaf)
lib/i18n.ts           # the full Hindi↔English dictionary — every visible string
lib/hi.ts             # Hindi templates for the engine's insight cards (same numbers)
lib/friendly.ts       # the "friendly layer": snapshot → plain-language views
lib/session.tsx       # language + data + offer-flow state, shared by all tabs
components/HomeView.tsx      # mood greeting · 2 numbers · mini radar · action cards
components/BusinessView.tsx  # trends/anomalies/customers/payments/memory, plain words
components/ChatView.tsx      # voice + text chat, chips, grounded badge
components/MiniRadar.tsx     # soft 2D canvas radar (pastel rings, glowing blips)
lib/generator.ts …    # the shared intelligence brain (same as ../Paytm_Build)
app/api/*             # snapshot · offer · outcome · copilot · stt · tts · memory
```

## Status & progress

See `PROGRESS.md` for the decision log. The judges'/operators' dashboard build lives in `../Paytm_Build`.

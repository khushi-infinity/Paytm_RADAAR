# RADAAR (paytm) — Progress

Merchant-friendly rebuild of RADAAR. Companion project to `../Paytm_Build` (the operator-terminal build kept for judge demos).

| Date | Decision | Why |
|------|----------|-----|
| 2026-09-19 | New project at Desktop/paytm with copied "brain" (generator, engines, insights, all AI clients, all API routes) — UI rebuilt from zero | Merchant-facing product deserves a clean start; the judges build stays intact |
| 2026-09-19 | Whole-app Hindi/English toggle (lib/i18n.ts dictionary + lib/hi.ts engine-card templates); Hindi is the default | The merchant must understand everything; engine copy is template-mirrored so Hindi uses the exact same computed numbers |
| 2026-09-19 | Mood-first Home: 🎉 खुशखबरी (green) / 🙂 सब ठीक (blue) / ⚠️ ध्यान दें (red) driven by health score tiers (75/55) | Business judges/merchants read the feeling before the numbers; congrats/warning is the requested emotional signal |
| 2026-09-19 | Three-tab bottom nav (Home / My Business / Ask RADAAR) instead of one dense dashboard | The user's core ask: "do not put everything in one place" — one thing per tap, like the FUNTYX reference |
| 2026-09-19 | MiniRadar: soft 2D canvas pastel radar replacing the 3D cockpit radar | The 3D terminal radar impresses judges but reads as "complex"; a pastel dish with glowing blips reads as friendly |
| 2026-09-19 | One action card per opportunity, big type, ₹ value in a butter highlight, single ✨ यह करें button | Merchant acts on one thing at a time; worth-value is the motivation |
| 2026-09-19 | Dev server on port 3001 | Runs beside the Paytm_Build judges' build on 3000 |
| 2026-09-19 | Verified live in preview: greeting/congrats state, bilingual card stack (ज़रूरी/मौका badges), full offer loop (Sarvam nudge "नमस्ते! शाम 5 से 8 बजे…" → outcome "🎉 काम बना! +₹36,135 · +8%"), chat round-trip answering in Hindi from the Cognee memory graph, My Business tab plain-language trends | End-to-end proof in the merchant's language, not just the judges' |
| 2026-09-19 | TODO: offer flow currently stateful per session (single active offer, first card hosts it) — next step is per-card offer state | Multiple offers in one session would overwrite; acceptable for demo, flagged for build-out |
| 2026-09-19 | TODO: BusinessView memory rows use regex-plainified engine facts — could move to friendly templates in lib/hi.ts like cards | Keeps one translation surface; cards already do this properly |
| 2026-09-19 | Desktop redesign per user feedback: soft-3D look in 2D (puffy cards with extruded base shadows, chunky 3D buttons with press physics, floating CSS clouds/coins, gradient sky), 12-column desktop grid (hero 8 + radar 4, actions 2-col, business 7+5), phone column removed | User: "make it 3d kind but in 2d… no mobile view, desktop has too much space left and right" — depth cues give the friendly feel of the reference image while using the full canvas |
| 2026-09-19 | Responsive tiers xl:/lg: so the 968px preview shows the stacked tablet layout and full desktop gets the 8+4 split | Same code must look intentional at both widths; preview window ≠ user's actual screen |

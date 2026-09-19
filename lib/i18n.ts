/**
 * Merchant-first bilingual dictionary. Every visible string comes from here —
 * the language toggle translates the WHOLE dashboard instantly.
 */

export type Lang = "en" | "hi";

export const STR = {
  // App identity
  appName: { en: "RADAAR", hi: "RADAAR" },
  tagline: {
    en: "Your business, explained simply",
    hi: "आपका व्यापार, आसान भाषा में",
  },

  // Tab bar
  tabHome: { en: "Home", hi: "होम" },
  tabBusiness: { en: "My Business", hi: "मेरा व्यापार" },
  tabChat: { en: "Ask RADAAR", hi: "पूछो RADAAR" },

  // Language switcher
  langLabel: { en: "भाषा", hi: "Language" },

  // Greeting
  goodMorning: { en: "Good morning", hi: "सुप्रभात" },
  goodAfternoon: { en: "Good afternoon", hi: "नमस्ते" },
  goodEvening: { en: "Good evening", hi: "शुभ संध्या" },

  // Health messages (the emotional core)
  healthGreat: { en: "Great news!", hi: "खुशखबरी!" },
  healthOk: { en: "All okay", hi: "सब ठीक है" },
  healthCareful: { en: "Needs attention", hi: "ध्यान दें" },
  congratsGreat: {
    en: "Your business is doing well. Keep it up!",
    hi: "आपका व्यापार अच्छा कर रहा है। दम है! 👏",
  },
  congratsOk: {
    en: "Business is steady. Small steps can grow it.",
    hi: "व्यापार ठीक-ठाक चल रहा है। छोटे कदम बढ़ेंगे।",
  },
  congratsCareful: {
    en: "Something needs your attention today.",
    hi: "आज एक चीज़ पर ध्यान देना ज़रूरी है।",
  },

  // Hero numbers
  thisWeek: { en: "This week", hi: "इस हफ़्ते" },
  sales: { en: "Sales", hi: "बिक्री" },
  customers: { en: "Customers", hi: "ग्राहक" },
  vsLastWeek: { en: "vs last week", hi: "पिछले हफ़्ते से" },
  more: { en: "more", hi: "ज़्यादा" },
  less: { en: "less", hi: "कम" },

  // Radar card
  yourRadar: { en: "Your growth radar", hi: "आपका ग्रोथ रडार" },
  radarHint: {
    en: "Glowing dots = chances to grow",
    hi: "चमकती बिंदियाँ = बढ़ने के मौके",
  },

  // Action card
  todayFocus: { en: "Today's focus", hi: "आज का ध्यान" },
  doThis: { en: "Do this", hi: "यह करें" },
  whyLabel: { en: "Why?", hi: "क्यों?" },
  worth: { en: "Worth about", hi: "क़रीब इतना मिल सकता है" },
  perWeek: { en: "a week", hi: "हर हफ़्ते" },
  offerCreated: { en: "Offer sent to your customers!", hi: "ऑफ़र ग्राहकों को भेज दिया!" },
  offerSending: { en: "Sending your offer…", hi: "ऑफ़र भेजी जा रही है…" },
  measureOutcome: { en: "See result after a week", hi: "एक हफ़्ते बाद नतीजा देखें" },
  offerWorked: { en: "It worked!", hi: "काम बना!" },
  offerDidntWork: { en: "Did not work", hi: "काम नहीं बना" },
  offerNeutral: { en: "No big change", hi: "कोई खास फ़र्क़ नहीं" },
  learnedFact: { en: "RADAAR learned from this", hi: "RADAAR ने यह सीखा" },

  // Business tab
  bizTrends: { en: "How sales are moving", hi: "बिक्री कैसी चल रही है" },
  bizAnomalies: { en: "Worth knowing", hi: "जानने लायक बातें" },
  bizCustomers: { en: "Your customers", hi: "आपके ग्राहक" },
  bizPayments: { en: "How customers pay", hi: "ग्राहक कैसे भुगतान करते हैं" },
  bizMemory: { en: "What RADAAR remembers", hi: "RADAAR को क्या याद है" },
  memoryEmpty: {
    en: "Nothing yet — RADAAR remembers after your first offer.",
    hi: "अभी कुछ नहीं — पहली ऑफ़र के बाद RADAAR याद रखेगा।",
  },

  // Chat tab
  chatTitle: { en: "Ask anything about your shop", hi: "अपनी दुकान के बारे में पूछें" },
  chatHint: {
    en: "Speak or type in Hindi, English or Hinglish",
    hi: "हिंदी, अंग्रेज़ी या हिंग्लिश में बोलें या लिखें",
  },
  chatGrounded: { en: "Answer from your business memory", hi: "आपके व्यापार की स्मृति से" },
  chatFallback: { en: "Answer from today's numbers", hi: "आज के आँकड़ों से" },
  chatListening: { en: "Listening…", hi: "सुन रहा हूँ…" },
  chatThinking: { en: "Thinking…", hi: "सोच रहा हूँ…" },
  chatSpeaking: { en: "Speaking…", hi: "बोल रहा हूँ…" },
  chatPlaceholder: { en: "Type your question…", hi: "अपना सवाल लिखें…" },
  chatMic: { en: "Tap to speak", hi: "बोलने के लिए दबाएँ" },
  chatRetry: { en: "Something went wrong. Tap to try again.", hi: "कुछ गड़बड़ हुई। दोबारा कोशिश करें।" },
  chatSuggested: { en: "Try asking", hi: "यह पूछें" },

  // Suggested questions (also shown as chips)
  q1: { en: "How is my business doing?", hi: "मेरा व्यापार कैसा चल रहा है?" },
  q2: { en: "Which day had the most sales?", hi: "सबसे ज़्यादा बिक्री किस दिन हुई?" },
  q3: { en: "Which customers should I focus on?", hi: "किन ग्राहकों पर ध्यान दूँ?" },

  // Misc
  perVisit: { en: "per visit", hi: "प्रति विज़िट" },

  // The visible AI pipeline (answers "where are n8n and Cognee used?")
  stepAi: { en: "AI suggests", hi: "AI सुझाव देता है" },
  stepN8n: { en: "n8n runs it", hi: "n8n चलाता है" },
  stepCognee: { en: "Cognee remembers", hi: "Cognee याद रखता है" },
  pipelineIdle: {
    en: "RADAAR's AI picked this for you",
    hi: "RADAAR की AI ने यह आपके लिए चुना",
  },
  pipelineSending: {
    en: "Your n8n workflow is running…",
    hi: "आपका n8n वर्कफ़्लो चल रहा है…",
  },
  pipelineSent: {
    en: "Done! Saved to your Cognee memory.",
    hi: "हो गया! आपकी Cognee स्मृति में सेव हो गया।",
  },
  seeLive: { en: "See it live in your n8n", hi: "इसे अपने n8n में लाइव देखें" },
  pipelineNote: {
    en: "Every step runs in YOUR n8n, saved in YOUR Cognee memory.",
    hi: "हर कदम आपके अपने n8n में चलता है, आपकी Cognee स्मृति में सेव होता है।",
  },
  cogneeBadge: { en: "from Cognee memory", hi: "Cognee स्मृति से" },
  snapshotBadge: { en: "from today's numbers", hi: "आज के आँकड़ों से" },
  mascotName: { en: "DADA", hi: "दादा" },
  mascotFocus: {
    en: "I'm DADA! Here's today's focus.",
    hi: "मैं हूँ दादा! आज का फोकस यह है।",
  },
  newThisWeek: { en: "new this week", hi: "इस हफ़्ते नए" },
  total: { en: "total", hi: "कुल" },
  loading: { en: "Setting up your shop view…", hi: "आपकी दुकान का व्यू तैयार हो रहा है…" },
  errorLoad: {
    en: "Could not load your business data. Pull to refresh.",
    hi: "व्यापार का डेटा नहीं खुला। दोबारा कोशिश करें।",
  },
  retry: { en: "Try again", hi: "फिर से कोशिश करें" },
} as const;

export type StrKey = keyof typeof STR;

export function t(lang: Lang, key: StrKey): string {
  return STR[key][lang];
}

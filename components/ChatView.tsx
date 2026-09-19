"use client";

import { useEffect, useRef, useState } from "react";
import { blobToWav } from "@/lib/wav";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

interface Msg {
  role: "user" | "assistant";
  text: string;
  source?: string;
}

/** Strip markdown decorations the graph models like to emit (**bold**, `code`). */
function stripMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export default function ChatView() {
  const { lang } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function speak(text: string) {
    if (!voiceOn) return;
    audioRef.current?.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(stripMd(text).slice(0, 400))}`);
    audioRef.current = audio;
    setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    void audio.play().catch(() => setSpeaking(false));
  }

  async function send(text: string, fromVoice = false) {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: fromVoice ? `🎙️ ${q}` : q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const j = (await res.json()) as { ok: boolean; answer?: string; source?: string };
      const answer = j.ok
        ? stripMd(j.answer ?? "…")
        : lang === "hi"
          ? "क्षमा करें, अभी उत्तर नहीं मिला — दोबारा पूछें।"
          : "Sorry, I couldn't answer that — please ask again.";
      setMessages((m) => [...m, { role: "assistant", text: answer, source: j.source }]);
      speak(answer);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: lang === "hi" ? "नेटवर्क समस्या — दोबारा कोशिश करें।" : "Network issue — please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ── voice input: mic → WAV → Sarvam saarika STT ────────────────────────────
  async function startListening() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => void finishRecording();
      rec.onerror = () => {
        setMicError(lang === "hi" ? "माइक में दिक्कत — फिर कोशिश करें।" : "Mic error — try again.");
        setListening(false);
      };
      mediaRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setMicError(
        lang === "hi"
          ? "आवाज़ के लिए अनुमति चाहिए — लिखकर भी पूछ सकते हैं।"
          : "Mic permission needed — typing works everywhere.",
      );
      setListening(false);
    }
  }

  function stopListening() {
    mediaRef.current?.stop();
    setListening(false);
  }

  async function finishRecording() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    const blob = new Blob(chunksRef.current, { type: mediaRef.current?.mimeType || "audio/webm" });
    if (blob.size < 1200) {
      setMicError(lang === "hi" ? "कुछ सुनाई नहीं दिया — थोड़ा और बोलें।" : "Heard nothing — speak a little longer.");
      return;
    }
    setTranscribing(true);
    try {
      let upload: Blob = blob;
      if (!blob.type.includes("wav") && !blob.type.includes("mpeg")) {
        upload = await blobToWav(blob);
      }
      const fd = new FormData();
      fd.append("audio", upload, "speech.wav");
      const sttRes = await fetch("/api/stt", { method: "POST", body: fd });
      const stt = (await sttRes.json()) as { ok: boolean; transcript?: string; error?: string };
      if (!stt.ok || !stt.transcript) throw new Error(stt.error ?? "STT failed");
      await send(stt.transcript, true);
    } catch {
      setMicError(
        lang === "hi"
          ? "आवाज़ अभी काम नहीं कर रही — लिखकर पूछें।"
          : "Voice isn't working right now — please type.",
      );
    } finally {
      setTranscribing(false);
    }
  }

  const chips = [t(lang, "q1"), t(lang, "q2"), t(lang, "q3")];
  const hello =
    lang === "hi"
      ? "नमस्ते! मैं RADAAR हूँ। अपनी दुकान के बारे में कुछ भी पूछिए — बिक्री, ग्राहक, ऑफ़र। 👋"
      : "Namaste! I'm RADAAR. Ask me anything about your shop — sales, customers, offers. 👋";
  const greetingShown = messages.length > 0 || true; // greeting is always first

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-1">
        <h2 className="text-xl font-extrabold text-ink">{t(lang, "chatTitle")}</h2>
        <p className="text-sm text-cocoa">{t(lang, "chatHint")}</p>
        <button
          onClick={() => setVoiceOn((v) => !v)}
          className="chip mt-2 bg-white text-cocoa shadow-soft"
        >
          {voiceOn
            ? lang === "hi" ? "🔊 आवाज़ चालू" : "🔊 Voice on"
            : lang === "hi" ? "🔇 आवाज़ बंद" : "🔇 Voice off"}
        </button>
      </div>

      <div ref={listRef} className="mt-3 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {greetingShown && messages.length === 0 && (
          <Bubble text={hello} source="hello" lang={lang} />
        )}
        {messages.map((m, i) => (
          <Bubble key={i} text={m.text} source={m.source} lang={lang} />
        ))}
        {(busy || listening || transcribing || speaking) && (
          <div className="flex justify-start">
            <div className="rounded-3xl rounded-bl-lg bg-white px-4 py-3 shadow-soft">
              <span className="text-sm font-semibold text-cocoa">
                {listening
                  ? `🎙️ ${t(lang, "chatListening")}`
                  : transcribing
                    ? `✍️ ${lang === "hi" ? "लिख रहा हूँ…" : "Writing…"}`
                    : busy
                      ? `💭 ${t(lang, "chatThinking")}`
                      : `🔊 ${t(lang, "chatSpeaking")}`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => void send(c)}
              className="chip bg-white text-skydeep shadow-soft hover:bg-mist"
            >
              {c}
            </button>
          ))}
        </div>
        {micError && <p className="mb-2 text-sm font-semibold text-tomato">{micError}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(lang, "chatPlaceholder")}
            className="min-w-0 flex-1 rounded-full border-2 border-mist bg-white px-5 py-3 text-base text-ink placeholder:text-cocoa/60 focus:border-sky focus:outline-none"
          />
          <button
            type="button"
            onClick={() => (listening ? stopListening() : void startListening())}
            disabled={transcribing}
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full p-3.5 text-xl transition-all ${
              listening ? "animate-pulse bg-tomato text-white shadow-pop" : "bg-sky text-white hover:bg-skydeep"
            }`}
            aria-label={t(lang, "chatMic")}
          >
            {transcribing ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              "🎙️"
            )}
          </button>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="big-btn-primary !px-5 !py-3 disabled:opacity-40"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ text, source, lang }: { text: string; source?: string; lang: "en" | "hi" }) {
  const isUser = text.startsWith("🎙️") || source === undefined;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap px-4 py-3 text-base leading-relaxed ${
          isUser
            ? "rounded-3xl rounded-br-lg bg-sky text-white"
            : "rounded-3xl rounded-bl-lg bg-white text-ink shadow-soft"
        }`}
      >
        {text}
        {source === "memory-graph" && (
          <span className="mt-1 block text-xs font-bold text-leafdeep">● {t(lang, "chatGrounded")}</span>
        )}
        {source === "live-snapshot" && (
          <span className="mt-1 block text-xs font-bold text-sun">{t(lang, "chatFallback")}</span>
        )}
      </div>
    </div>
  );
}

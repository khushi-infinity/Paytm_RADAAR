"use client";

import { useEffect, useRef, useState } from "react";
import { blobToWav } from "@/lib/wav";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

interface Msg {
  id: number;
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
  const [elapsed, setElapsed] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakIdRef = useRef(0);
  const busyTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, elapsed]);

  // seconds ticker while the copilot thinks, so the wait feels tracked, not stuck
  useEffect(() => {
    if (busy) {
      setElapsed(0);
      busyTickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (busyTickRef.current) {
      clearInterval(busyTickRef.current);
      busyTickRef.current = null;
    }
    return () => {
      if (busyTickRef.current) {
        clearInterval(busyTickRef.current);
        busyTickRef.current = null;
      }
    };
  }, [busy]);

  function speak(text: string, msgId: number) {
    if (!voiceOn) return;
    audioRef.current?.pause();
    const myId = ++speakIdRef.current;
    setSpeaking(true);
    setSpeakingId(msgId);
    // fetch the audio first so the bubble lights up only when voice truly plays
    void fetch(`/api/tts?text=${encodeURIComponent(stripMd(text).slice(0, 400))}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("tts failed"))))
      .then((blob) => {
        if (myId !== speakIdRef.current) return; // a newer answer took over
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          setSpeakingId(null);
        };
        audio.onerror = () => {
          setSpeaking(false);
          setSpeakingId(null);
        };
        void audio.play();
      })
      .catch(() => {
        if (myId === speakIdRef.current) {
          setSpeaking(false);
          setSpeakingId(null);
        }
      });
  }

  const [speakingId, setSpeakingId] = useState<number | null>(null);

  async function send(text: string, fromVoice = false) {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", source: "user", text: fromVoice ? `🎙️ ${q}` : q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const j = (await res.json()) as { ok: boolean; answer?: string; source?: string };
      const fallback =
        lang === "hi"
          ? "क्षमा करें, अभी उत्तर नहीं मिला, दोबारा पूछें।"
          : "Sorry, I couldn't answer that, please ask again.";
      const answer = j.ok ? stripMd(j.answer ?? "…") : fallback;
      const id = Date.now() + 1;
      setMessages((m) => [...m, { id, role: "assistant", text: answer, source: j.ok ? j.source : "error" }]);
      speak(answer, id);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: lang === "hi" ? "नेटवर्क समस्या, दोबारा कोशिश करें।" : "Network issue, please try again.",
          source: "error",
        },
      ]
      );
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
        setMicError(lang === "hi" ? "माइक में दिक्कत, फिर कोशिश करें।" : "Mic error, try again.");
        setListening(false);
      };
      mediaRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setMicError(
        lang === "hi"
          ? "आवाज़ के लिए अनुमति चाहिए, लिखकर भी पूछ सकते हैं।"
          : "Mic permission needed, typing works everywhere.",
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
      setMicError(lang === "hi" ? "कुछ सुनाई नहीं दिया, थोड़ा और बोलें।" : "Heard nothing, speak a little longer.");
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
          ? "आवाज़ अभी काम नहीं कर रही, लिखकर पूछें।"
          : "Voice isn't working right now, please type.",
      );
    } finally {
      setTranscribing(false);
    }
  }

  const chips = [t(lang, "q1"), t(lang, "q2"), t(lang, "q3")];
  const hello =
    lang === "hi"
      ? "नमस्ते! मैं RADAAR हूँ। अपनी दुकान के बारे में कुछ भी पूछिए, बिक्री, ग्राहक, ऑफ़र। 👋"
      : "Namaste! I'm RADAAR. Ask me anything about your shop: sales, customers, offers. 👋";

  const status = listening
    ? `🎙️ ${t(lang, "chatListening")}`
    : transcribing
      ? `✍️ ${lang === "hi" ? "लिख रहा हूँ…" : "Writing…"}`
      : busy
        ? `💭 ${t(lang, "chatThinking")} · ${elapsed}s`
        : speaking
          ? `🔊 ${t(lang, "chatSpeaking")}`
          : null;

  return (
    <div className="grid grid-cols-12 gap-6 pb-4">
      {/* chat panel */}
      <section className="card3d pop-in col-span-8 flex h-[72vh] flex-col p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-ink">💬 {t(lang, "chatTitle")}</h3>
            <p className="text-sm font-bold text-cocoa">{t(lang, "chatHint")}</p>
          </div>
          <button
            onClick={() => setVoiceOn((v) => !v)}
            className="chip3d bg-mist text-cocoa hover:bg-white"
          >
            {voiceOn
              ? lang === "hi" ? "🔊 आवाज़ चालू" : "🔊 Voice on"
              : lang === "hi" ? "🔇 आवाज़ बंद" : "🔇 Voice off"}
          </button>
        </div>

        <div ref={listRef} className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.length === 0 && !busy && <Bubble text={hello} source="hello" lang={lang} />}
          {messages.map((m) => (
            <Bubble key={m.id} text={m.text} source={m.source} lang={lang} speaking={speakingId === m.id} />
          ))}
          {status && (
            <div className="flex justify-start">
              <div
                className="rounded-[1.6rem] rounded-bl-lg bg-white px-5 py-3 text-base font-bold text-cocoa"
                style={{ boxShadow: "0 3px 0 #C9D9F6, 0 10px 20px rgba(16,52,128,.15)" }}
              >
                {status}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t-2 border-mist pt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => void send(c)}
                className="chip3d bg-bluemist text-skydeep hover:bg-white"
              >
                {c}
              </button>
            ))}
          </div>
          {micError && <p className="mb-2 text-sm font-extrabold text-tomato">{micError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(lang, "chatPlaceholder")}
              className="min-w-0 flex-1 rounded-full border-2 border-bluemist bg-bluemist/60 px-6 py-3.5 text-lg text-ink placeholder:text-cocoa/60 focus:border-skybright focus:outline-none"
              style={{ boxShadow: "inset 0 2px 6px rgba(16,52,128,.08)" }}
            />
            <button
              type="button"
              onClick={() => (listening ? stopListening() : void startListening())}
              disabled={transcribing}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-all ${
                listening ? "animate-pulse btn3d btn3d-orange !p-0" : "btn3d btn3d-sky !p-0"
              }`}
              aria-label={t(lang, "chatMic")}
            >
              {transcribing ? (
                <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
              ) : (
                "🎙️"
              )}
            </button>
            <button type="submit" disabled={busy || !input.trim()} className="btn3d btn3d-orange !px-6 !disabled:opacity-40">
              ➤
            </button>
          </form>
        </div>
      </section>

      {/* side rail: how it works, friendly */}
      <aside className="col-span-4 space-y-6">
        <section className="card3d pop-in p-6 text-center" style={{ animationDelay: ".1s" }}>
          <div
            className="floaty mx-auto flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-sky/10 text-5xl"
            style={{ boxShadow: "inset 0 3px 0 rgba(255,255,255,.9), 0 6px 0 #C9D9F6, 0 14px 28px rgba(16,52,128,.2)" }}
          >
            🎙️
          </div>
          <p className="mt-4 text-lg font-extrabold text-ink">
            {lang === "hi" ? "बोलकर पूछें" : "Just ask out loud"}
          </p>
          <p className="mt-1 text-sm font-semibold text-cocoa">
            {lang === "hi"
              ? "हिंदी, अंग्रेज़ी या हिंग्लिश, जैसे दुकान पर बोलते हैं। RADAAR सुनेगा, समझेगा, और बोलकर जवाब देगा।"
              : "Hindi, English or Hinglish, however you talk at the shop. RADAAR listens, understands, and answers out loud."}
          </p>
        </section>
        <section className="card3d pop-in p-6" style={{ animationDelay: ".18s" }}>
          <p className="text-sm font-extrabold text-cocoa">
            🧠 {lang === "hi" ? "जवाब कहाँ से आते हैं?" : "Where answers come from"}
          </p>
          <p className="mt-2 text-sm font-semibold text-cocoa">
            {lang === "hi"
              ? "हर जवाब आपके ही व्यापार की स्मृति (memory graph) से आता है, RADAAR कुछ भी अंदाज़े से नहीं कहता।"
              : "Every answer is retrieved from your own business memory graph, RADAAR never guesses."}
          </p>
        </section>
      </aside>
    </div>
  );
}

function Bubble({
  text,
  source,
  lang,
  speaking = false,
}: {
  text: string;
  source?: string;
  lang: "en" | "hi";
  speaking?: boolean;
}) {
  const isUser = source === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80%] whitespace-pre-wrap px-5 py-3.5 text-lg leading-relaxed transition-all ${
          isUser ? "rounded-[1.6rem] rounded-br-lg text-white" : "rounded-[1.6rem] rounded-bl-lg bg-white text-ink"
        } ${speaking ? "ring-4 ring-skybright/60" : ""}`}
        style={
          isUser
            ? { background: "linear-gradient(145deg,#4A7EF0,#2C63D9)", boxShadow: "0 4px 0 #2C63D9, 0 12px 22px rgba(9,34,84,.3)" }
            : { boxShadow: "0 3px 0 #C9D9F6, 0 10px 20px rgba(16,52,128,.15)" }
        }
      >
        {speaking && <span className="mr-2 inline-block animate-pulse">🔊</span>}
        {text}
        {source === "memory-graph" && (
          <span className="mt-1 block text-sm font-extrabold text-leafdeep">🧠 {t(lang, "cogneeBadge")}</span>
        )}
        {source === "live-snapshot" && (
          <span className="mt-1 block text-sm font-extrabold text-sun">📊 {t(lang, "snapshotBadge")}</span>
        )}
        {source === "error" && (
          <span className="mt-1 block text-sm font-extrabold text-tomato">⚠️ {lang === "hi" ? "जवाब नहीं बन पाया" : "Could not answer"}</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";

// OpenAI TTS voices — ash/onyx best for deep narrator, coral/sage for lighter
const TTS_VOICES = [
  { id: "ash", label: "Ash (hluboký vypravěč)" },
  { id: "onyx", label: "Onyx (temný hlas)" },
  { id: "sage", label: "Sage (klidný)" },
  { id: "coral", label: "Coral (měkký)" },
  { id: "nova", label: "Nova (ženský)" },
  { id: "echo", label: "Echo (neutrální)" },
  { id: "fable", label: "Fable (britský)" },
  { id: "shimmer", label: "Shimmer (jasný)" },
  { id: "alloy", label: "Alloy (vyrovnaný)" },
] as const;

const LS_TTS_VOICE = "narrator_tts_voice";

function getSavedVoice(): string {
  if (typeof window === "undefined") return "ash";
  const saved = localStorage.getItem(LS_TTS_VOICE);
  if (saved && TTS_VOICES.some((v) => v.id === saved)) return saved;
  return "ash";
}

interface TalkingNarratorProps {
  text: string;
  compact?: boolean;
  /** Language code for fallback Web Speech API (e.g. cs-CZ, sk-SK) */
  speechLang?: string;
  /** Automaticky prečítať text keď sa zmení (po vygenerovaní narratorom) */
  autoPlay?: boolean;
}

export default function TalkingNarrator({ text, compact, speechLang = "cs-CZ", autoPlay = false }: TalkingNarratorProps) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePremiumTts, setUsePremiumTts] = useState<boolean | null>(null); // null = not yet tried
  const [selectedVoice, setSelectedVoice] = useState(getSavedVoice);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAutoPlayedRef = useRef<string>("");
  const handleSpeakRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Sync utterance when text changes (for Web Speech API fallback)
  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth || !text) return;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    u.rate = 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;

    return () => {
      synth.cancel();
      setSpeaking(false);
    };
  }, [text, speechLang]);

  // Auto-play when new narrator text arrives
  useEffect(() => {
    if (!autoPlay || !text.trim() || text === lastAutoPlayedRef.current) return;
    lastAutoPlayedRef.current = text;
    const t = setTimeout(() => handleSpeakRef.current(), 300);
    return () => clearTimeout(t);
  }, [text, autoPlay]);

  function stopPlayback() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (synth) synth.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
    setLoading(false);
  }

  async function handleSpeak() {
    if (speaking || loading) {
      stopPlayback();
      return;
    }

    if (!text) return;

    // Try OpenAI TTS first (if we haven't confirmed it's unavailable)
    if (usePremiumTts !== false) {
      setLoading(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: selectedVoice }),
        });

        if (res.ok) {
          setUsePremiumTts(true);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onplay = () => {
            setLoading(false);
            setSpeaking(true);
          };
          audio.onended = () => {
            setSpeaking(false);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };
          audio.onerror = () => {
            setSpeaking(false);
            setLoading(false);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };

          await audio.play();
          return;
        }

        // 503 = no API key, 502 = OpenAI error — fallback to browser TTS
        if (res.status === 503 || res.status === 502) {
          setUsePremiumTts(false);
        }
      } catch {
        setUsePremiumTts(false);
      }
      setLoading(false);
    }

    // Fallback: Web Speech API
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth || !utteranceRef.current) return;
    synth.speak(utteranceRef.current);
    setSpeaking(true);
  }

  // Keep ref updated with latest handleSpeak closure after every render
  // useLayoutEffect runs synchronously after DOM mutations, before useEffect — ref is
  // always fresh by the time the auto-play effects fire.
  useLayoutEffect(() => {
    handleSpeakRef.current = handleSpeak;
  });

  function handleVoiceChange(voiceId: string) {
    setSelectedVoice(voiceId);
    localStorage.setItem(LS_TTS_VOICE, voiceId);
  }

  const size = compact ? 56 : 112;

  return (
    <div className="narrator-avatar-container flex flex-row items-center gap-3 flex-wrap">
      <div
        className={`narrator-avatar rounded-lg flex-shrink-0 ${compact ? "narrator-avatar-compact" : ""} ${speaking ? "speaking" : ""}`}
        style={{ width: size, height: size }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleSpeak}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg dh-btn-primary transition-colors disabled:opacity-70"
        >
          <span className="opacity-80">
            {loading ? "⏳" : speaking ? "⏹" : "▶"}
          </span>
          {loading ? "Generuji…" : speaking ? "Zastavit" : "Přehrát"}
        </button>
        {usePremiumTts !== false && (
          <select
            value={selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="text-[10px] rounded px-2 py-1 dh-input"
            title="Hlas vypravěče (OpenAI TTS)"
          >
            {TTS_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

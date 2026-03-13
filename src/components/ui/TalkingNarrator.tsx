"use client";

import { useState, useEffect, useRef } from "react";

// OpenAI TTS voices (marin/cedar recommended)
const TTS_VOICES = [
  { id: "marin", label: "Marin (odporúčané)" },
  { id: "cedar", label: "Cedar (odporúčané)" },
  { id: "onyx", label: "Onyx" },
  { id: "sage", label: "Sage" },
  { id: "coral", label: "Coral" },
  { id: "nova", label: "Nova" },
  { id: "alloy", label: "Alloy" },
] as const;

const LS_TTS_VOICE = "narrator_tts_voice";

function getSavedVoice(): string {
  if (typeof window === "undefined") return "marin";
  const saved = localStorage.getItem(LS_TTS_VOICE);
  if (saved && TTS_VOICES.some((v) => v.id === saved)) return saved;
  return "marin";
}

interface TalkingNarratorProps {
  text: string;
  compact?: boolean;
  /** Language code for fallback Web Speech API (e.g. cs-CZ, sk-SK) */
  speechLang?: string;
}

export default function TalkingNarrator({ text, compact, speechLang = "cs-CZ" }: TalkingNarratorProps) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePremiumTts, setUsePremiumTts] = useState<boolean | null>(null); // null = not yet tried
  const [selectedVoice, setSelectedVoice] = useState(getSavedVoice);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync utterance when text changes (for fallback)
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
          {loading ? "Generujem…" : speaking ? "Zastaviť" : "Prehrať"}
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

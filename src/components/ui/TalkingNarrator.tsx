"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";

// OpenAI TTS voices
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
const LS_NARRATOR_PORTRAIT = "narrator_portrait_url";

function getSavedVoice(): string {
  if (typeof window === "undefined") return "ash";
  const saved = localStorage.getItem(LS_TTS_VOICE);
  if (saved && TTS_VOICES.some((v) => v.id === saved)) return saved;
  return "ash";
}

function getSavedPortrait(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_NARRATOR_PORTRAIT);
}

interface TalkingNarratorProps {
  text: string;
  compact?: boolean;
  speechLang?: string;
  autoPlay?: boolean;
  /** Campaign ID for per-campaign narrator portraits */
  campaignId?: string;
}

export default function TalkingNarrator({ text, compact, speechLang = "cs-CZ", autoPlay = false, campaignId }: TalkingNarratorProps) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePremiumTts, setUsePremiumTts] = useState<boolean | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(getSavedVoice);
  const [customPortrait, setCustomPortrait] = useState<string | null>(null);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAutoPlayedRef = useRef<string>("");
  const handleSpeakRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Load saved portrait
  useEffect(() => {
    const key = campaignId ? `${LS_NARRATOR_PORTRAIT}:${campaignId}` : LS_NARRATOR_PORTRAIT;
    const saved = localStorage.getItem(key);
    if (saved) setCustomPortrait(saved);
  }, [campaignId]);

  // Sync utterance when text changes (Web Speech API fallback)
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

  // Auto-play
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

          audio.onplay = () => { setLoading(false); setSpeaking(true); };
          audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
          audio.onerror = () => { setSpeaking(false); setLoading(false); URL.revokeObjectURL(url); audioRef.current = null; };

          await audio.play();
          return;
        }

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

  useLayoutEffect(() => {
    handleSpeakRef.current = handleSpeak;
  });

  function handleVoiceChange(voiceId: string) {
    setSelectedVoice(voiceId);
    localStorage.setItem(LS_TTS_VOICE, voiceId);
  }

  // ── Generate narrator portrait via DALL-E ──
  async function handleGeneratePortrait() {
    if (generatingPortrait) return;
    setGeneratingPortrait(true);

    try {
      const res = await fetch("/api/generate-narrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Chyba ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        // Convert to data URL for persistence (DALL-E URLs expire)
        const imgRes = await fetch(data.url);
        const blob = await imgRes.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const key = campaignId ? `${LS_NARRATOR_PORTRAIT}:${campaignId}` : LS_NARRATOR_PORTRAIT;
          localStorage.setItem(key, dataUrl);
          setCustomPortrait(dataUrl);
        };
        reader.readAsDataURL(blob);
      }
    } catch (e) {
      console.error("[narrator] Generate portrait failed:", e);
      alert("Nepodařilo se vygenerovat portrét.");
    } finally {
      setGeneratingPortrait(false);
    }
  }

  function handleRemovePortrait() {
    const key = campaignId ? `${LS_NARRATOR_PORTRAIT}:${campaignId}` : LS_NARRATOR_PORTRAIT;
    localStorage.removeItem(key);
    setCustomPortrait(null);
  }

  const size = compact ? 56 : 112;

  const avatarClasses = [
    "narrator-avatar",
    "rounded-lg",
    "flex-shrink-0",
    compact ? "narrator-avatar-compact" : "",
    speaking ? "speaking" : "",
    customPortrait ? "narrator-custom" : "",
  ].filter(Boolean).join(" ");

  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(customPortrait ? { backgroundImage: `url(${customPortrait})` } : {}),
  };

  return (
    <div className="narrator-avatar-container flex flex-col gap-2">
      {/* Avatar */}
      <div className="flex flex-row items-center gap-3 flex-wrap">
        <div className={avatarClasses} style={avatarStyle} />
        <div className="flex flex-col gap-1.5">
          {/* TTS controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg dh-btn-primary transition-colors disabled:opacity-70"
            >
              <span className="opacity-80">
                {loading ? "\u23F3" : speaking ? "\u23F9" : "\u25B6"}
              </span>
              {loading ? "Generuji\u2026" : speaking ? "Zastavit" : "P\u0159ehr\u00E1t"}
            </button>
            {usePremiumTts !== false && (
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="text-[10px] rounded px-2 py-1 dh-input"
                title="Hlas vyprav\u011B\u010De (OpenAI TTS)"
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Generate narrator button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePortrait}
              disabled={generatingPortrait}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: "rgba(201,162,39,0.12)",
                border: "1px solid rgba(201,162,39,0.3)",
                color: "var(--accent-gold)",
              }}
            >
              {generatingPortrait ? (
                <><span className="animate-spin inline-block">&#x2B50;</span> Generuji\u2026</>
              ) : (
                <><span>&#x1F3A8;</span> Generovat vypr\u00E1v\u011B\u010De</>
              )}
            </button>
            {customPortrait && (
              <button
                type="button"
                onClick={handleRemovePortrait}
                className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
                title="Odstranit portr\u00E9t"
              >
                \u2715
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

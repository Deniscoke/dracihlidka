// ============================================================
// POST /api/tts — OpenAI TTS text-to-speech
// Uses NARRATOR_AI_API_KEY (same as narrate endpoint)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

// OpenAI voices — marin/cedar recommended for best quality
const VOICES = ["marin", "cedar", "onyx", "sage", "coral", "nova", "alloy"] as const;
type VoiceId = (typeof VOICES)[number];

function isValidVoice(v: string): v is VoiceId {
  return VOICES.includes(v as VoiceId);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NARRATOR_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TTS nie je nakonfigurovaný. Nastav NARRATOR_AI_API_KEY v .env.local." },
      { status: 503 }
    );
  }

  let body: { text?: string; voice?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Pole 'text' je povinné" }, { status: 400 });
  }

  // Max 4096 chars for OpenAI TTS
  const truncated = text.length > 4096 ? text.slice(0, 4096) : text;

  const voice: VoiceId = isValidVoice(body.voice ?? "") ? (body.voice as VoiceId) : "marin";

  // Instructions for narrator / GM tone
  const instructions =
    "Speak in a calm, engaging narrative tone like a storyteller or game master. Moderate pace, clear pronunciation.";

  try {
    const res = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: truncated,
        instructions,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[TTS] OpenAI error:", res.status, err);
      return NextResponse.json(
        { error: `TTS chyba: ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[TTS] Request failed:", e);
    return NextResponse.json(
      { error: "Nepodarilo sa vygenerovať audio." },
      { status: 502 }
    );
  }
}

// ============================================================
// POST /api/tts — OpenAI TTS text-to-speech
// Uses NARRATOR_AI_API_KEY (same as narrate endpoint)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

// OpenAI voices — ash/onyx for deep narrator, coral/sage for lighter tones
const VOICES = ["ash", "onyx", "sage", "coral", "nova", "alloy", "echo", "fable", "shimmer"] as const;
type VoiceId = (typeof VOICES)[number];

function isValidVoice(v: string): v is VoiceId {
  return VOICES.includes(v as VoiceId);
}

export async function POST(req: NextRequest) {
  // ---- Auth check — prevent unauthenticated credit abuse ----
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Nepřihlášený uživatel." }, { status: 401 });
      }
      // Rate limit: 20 TTS requests per minute per user
      const rl = checkRateLimit(`tts:${user.id}`, 20, 60_000);
      if (!rl.ok) {
        return NextResponse.json(
          { error: `Příliš mnoho požadavků. Zkus to znovu za ${rl.retryAfter}s.` },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
        );
      }
    } catch {
      // If Supabase client creation fails (misconfigured), fail safely
      return NextResponse.json({ error: "Chyba autentizace." }, { status: 401 });
    }
  }

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

  const voice: VoiceId = isValidVoice(body.voice ?? "") ? (body.voice as VoiceId) : "ash";

  // Czech narrator instructions — detailed tone guidance for authentic human sound
  const instructions = [
    "Mluvíš jako zkušený český vypravěč stolní RPG hry.",
    "Hlas je hluboký, klidný a jistý — jako by vyprávěl u táboráku.",
    "Používej přirozené pauzy mezi větami pro dramatický efekt.",
    "Při napínavých scénách zrychli a ztišíš hlas, u odhalení naopak zdůrazni.",
    "Vyslovuj česká jména a slova přirozeně, bez přízvuku.",
    "Nikdy nezní mechanicky — střídej intonaci, důraz a tempo jako živý herec.",
    "Emoce: strach šeptem, radost zvýšeným hlasem, bitva energicky a rázně.",
  ].join(" ");

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
        speed: 1.05,
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

    // Stream audio to client for faster first-byte playback
    const audioStream = res.body;
    if (audioStream) {
      return new NextResponse(audioStream as ReadableStream, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Fallback: buffer entire response
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

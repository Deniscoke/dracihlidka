// ============================================================
// POST /api/generate-narrator — DALL-E pixel art narrator portrait
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Auth check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Nepřihlášený uživatel." }, { status: 401 });
      }
      const rl = checkRateLimit(`narrator-portrait:${user.id}`, 3, 120_000);
      if (!rl.ok) {
        return NextResponse.json(
          { error: `Příliš mnoho požadavků. Zkus to znovu za ${rl.retryAfter}s.` },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
        );
      }
    } catch {
      return NextResponse.json({ error: "Chyba autentizace." }, { status: 401 });
    }
  }

  const apiKey = process.env.NARRATOR_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NARRATOR_AI_API_KEY není nastavený." },
      { status: 503 }
    );
  }

  const prompt = [
    "Pixel art portrait of a mysterious RPG game master narrator.",
    "Dark hooded figure, medieval fantasy style, detailed pixel art.",
    "Visible face with sharp angular features, glowing eyes, long beard.",
    "Warm earth tones: browns, golds, amber. Dark moody background.",
    "Head and shoulders composition, front-facing, symmetrical.",
    "16-bit retro pixel art style, clean pixels, no anti-aliasing.",
    "Dark fantasy atmosphere like Czech tabletop RPG.",
    "No text, no watermark, no UI elements.",
  ].join(" ");

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? `OpenAI error ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json();
    const imageUrl: string = data.data?.[0]?.url ?? "";

    if (!imageUrl) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (e) {
    console.error("[generate-narrator]", e);
    return NextResponse.json({ error: "Nepodařilo se vygenerovat portrét." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NARRATOR_AI_API_KEY ?? "";

interface PortraitRequest {
  name:   string;
  race:   string;
  class:  string;
  gender: string;
}

const RACE_DESC: Record<string, string> = {
  Člověk:   "human",
  Trpaslík: "dwarf, stocky, thick beard, rugged",
  Elf:      "elf, slender, pointed ears, ethereal",
  Barbar:   "barbarian, large muscular body, tribal markings",
  Obr:      "half-giant, very tall, powerful build",
  Gnóm:     "gnome, small, clever face, wide eyes",
  Půlčík:   "halfling, small, nimble, curly hair",
};

const CLASS_DESC: Record<string, string> = {
  Válečník:   "warrior in heavy plate armor, holding a sword, battle-worn",
  Kouzelník:  "wizard in dark robes, glowing arcane runes, magical staff",
  Hraničář:   "ranger in leather armor, bow and quiver, forest background",
  Alchymista: "alchemist with potion vials, leather apron, mystical ingredients",
  Zloděj:     "rogue in dark hood and cloak, daggers, lurking in shadows",
  Klerik:     "cleric in religious vestments, holy symbol, divine glow",
};

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  let body: PortraitRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, race, class: cls, gender } = body;
  if (!API_KEY) {
    return NextResponse.json({ error: "OpenAI API kľúč nie je nastavený na serveri (NARRATOR_AI_API_KEY)." }, { status: 503 });
  }
  const usedKey = API_KEY;

  const genderStr = gender === "Žena" ? "female" : "male";
  const raceStr   = RACE_DESC[race]  ?? race;
  const classStr  = CLASS_DESC[cls]  ?? cls;
  const nameHint  = name ? `, named ${name}` : "";

  const prompt = `Dark fantasy RPG character portrait${nameHint}. ${genderStr} ${raceStr}, ${classStr}. Medieval Slavic fantasy style, detailed digital painting, dramatic lighting, cinematic composition, dark moody atmosphere similar to Czech/Slovak tabletop RPG "Dračí Hlídka". Head and shoulders portrait, highly detailed face, painterly style. No text, no watermark.`;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usedKey}`,
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
        { status: response.status }
      );
    }

    const data = await response.json();
    const imageUrl: string = data.data?.[0]?.url ?? "";

    if (!imageUrl) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ url: imageUrl, prompt });
  } catch (err) {
    console.error("[generate-portrait]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

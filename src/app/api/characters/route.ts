// ============================================================
// GET /api/characters?owner=me — my characters (for profile)
// POST /api/characters — create character with owner_id (sync from client)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");

  if (owner !== "me") {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ characters: [] }, { status: 200 });
    }

    const { data: characters, error } = await supabase
      .from("characters")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_npc", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[characters] fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase for client (null campaign_id = roster)
    const mapped = (characters ?? []).map((c: Record<string, unknown>) => ({
      id: c.id,
      campaignId: c.campaign_id ?? "__roster__",
      name: c.name,
      race: c.race,
      class: c.class,
      level: c.level,
      hp: c.hp,
      maxHp: c.max_hp,
      stats: c.stats ?? {},
      notes: c.notes ?? "",
      isNPC: c.is_npc,
      portraitUrl: c.portrait_url,
      specialization: c.specialization,
      gender: c.gender,
      statuses: c.statuses ?? [],
      injuries: c.injuries ?? [],
      inventory: c.inventory ?? [],
      xp: c.xp,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({ characters: mapped });
  } catch (e) {
    console.error("[characters] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const MAX_CHARACTERS = 5;
    const { count } = await supabase
      .from("characters")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);
    if ((count ?? 0) >= MAX_CHARACTERS) {
      return NextResponse.json({ error: `Maximálny počet postáv je ${MAX_CHARACTERS}.` }, { status: 400 });
    }

    const body = await req.json();
    const {
      id,
      campaignId,
      name,
      race,
      class: cls,
      level,
      hp,
      maxHp,
      stats,
      notes,
      isNPC,
      portraitUrl,
      specialization,
      gender,
      statuses,
      injuries,
      inventory,
      xp,
    } = body;

    // Basic input validation
    const charName = typeof name === "string" ? name.trim() : "";
    if (!charName) {
      return NextResponse.json({ error: "Jméno postavy je povinné." }, { status: 400 });
    }
    if (charName.length > 100) {
      return NextResponse.json({ error: "Jméno postavy je příliš dlouhé (max 100 znaků)." }, { status: 400 });
    }

    // campaign_id must be UUID — "__roster__" is not valid, use null for roster
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dbCampaignId =
      !campaignId || campaignId === "__roster__"
        ? null
        : UUID_RE.test(campaignId)
          ? campaignId
          : null;

    const { data: char, error } = await supabase
      .from("characters")
      .insert({
        id: id ?? crypto.randomUUID(),
        campaign_id: dbCampaignId,
        owner_id: user.id,
        name: charName || "Bez mena",
        race: race ?? "",
        class: cls ?? "",
        level: level ?? 1,
        hp: hp ?? null,
        max_hp: maxHp ?? null,
        stats: stats ?? {},
        notes: notes ?? "",
        is_npc: isNPC ?? false,
        portrait_url: portraitUrl ?? null,
        specialization: specialization ?? null,
        gender: gender ?? null,
        statuses: statuses ?? [],
        injuries: injuries ?? [],
        inventory: inventory ?? [],
        xp: xp ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("[characters] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ character: char });
  } catch (e) {
    console.error("[characters] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ============================================================
// GET /api/hall-of-fame — profiles + their characters for Síň slávy
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export async function GET(req: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const supabase = createClient(url, key);

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, last_seen_at, created_at")
      .order("last_seen_at", { ascending: false });

    if (pErr) {
      console.error("[hall-of-fame] profiles error:", pErr);
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const { data: characters, error: cErr } = await supabase
      .from("characters")
      .select("id, owner_id, name, race, class, level, is_npc")
      .not("owner_id", "is", null);

    if (cErr) {
      console.error("[hall-of-fame] characters error:", cErr);
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    // Group characters by owner
    const charsByOwner: Record<string, Array<{ id: string; name: string; race: string; class: string; level: number; is_npc: boolean }>> = {};
    for (const c of characters ?? []) {
      const row = c as { id: string; owner_id: string; name: string; race: string; class: string; level: number; is_npc: boolean };
      if (row.owner_id && !row.is_npc) {
        if (!charsByOwner[row.owner_id]) charsByOwner[row.owner_id] = [];
        charsByOwner[row.owner_id].push({
          id: row.id,
          name: row.name,
          race: row.race,
          class: row.class,
          level: row.level ?? 1,
          is_npc: row.is_npc,
        });
      }
    }

    const entries = (profiles ?? []).map((p) => ({
      ...p,
      characters: charsByOwner[p.id] ?? [],
      character_count: (charsByOwner[p.id] ?? []).length,
    }));

    return NextResponse.json({ entries });
  } catch (e) {
    console.error("[hall-of-fame] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

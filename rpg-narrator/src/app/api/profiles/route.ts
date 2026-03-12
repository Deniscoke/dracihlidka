// ============================================================
// GET /api/profiles — list all profiles (Hall of Fame)
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export async function GET() {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const supabase = createClient(url, key);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, last_seen_at, created_at")
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("[profiles] fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch character counts per user
    const { data: chars } = await supabase
      .from("characters")
      .select("owner_id")
      .not("owner_id", "is", null);

    const charCountByOwner: Record<string, number> = {};
    for (const c of chars ?? []) {
      const oid = (c as { owner_id: string }).owner_id;
      if (oid) charCountByOwner[oid] = (charCountByOwner[oid] ?? 0) + 1;
    }

    const enriched = (profiles ?? []).map((p) => ({
      ...p,
      character_count: charCountByOwner[p.id] ?? 0,
    }));

    return NextResponse.json({ profiles: enriched });
  } catch (e) {
    console.error("[profiles] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

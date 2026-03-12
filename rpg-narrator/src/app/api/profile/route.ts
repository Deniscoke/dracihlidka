// ============================================================
// GET /api/profile — current user's profile
// POST /api/profile — upsert profile (call after login)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[profile] fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: profile ?? null });
  } catch (e) {
    console.error("[profile] error:", e);
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

    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "Hráč";
    const avatarUrl = user.user_metadata?.avatar_url ?? null;
    const email = user.email ?? null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          email,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[profile] upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[profile] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

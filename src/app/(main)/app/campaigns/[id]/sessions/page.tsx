"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@/types";

const SB_AVAILABLE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
);

export default function SessionsPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      if (SB_AVAILABLE) {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("sessions")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("order", { ascending: true });
        if (err) throw err;
        setSessions((data ?? []).map(mapSession));
      } else {
        const { sessionRepo } = await import("@/lib/storage");
        const s = await sessionRepo.getAll({ campaignId } as Partial<Session>);
        setSessions(s.sort((a, b) => a.order - b.order));
      }
      setError(null);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Chyba při načítání";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSessions(); }, [campaignId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !campaignId) return;
    setSaving(true);
    try {
      if (SB_AVAILABLE) {
        const supabase = createClient();
        const { error: err } = await supabase.from("sessions").insert({
          campaign_id: campaignId,
          title: title.trim(),
          summary: "",
          date: new Date().toISOString().slice(0, 10),
          order: sessions.length + 1,
        });
        if (err) throw err;
      } else {
        const { sessionRepo } = await import("@/lib/storage");
        await sessionRepo.create({
          campaignId,
          title: title.trim(),
          summary: "",
          date: new Date().toISOString().slice(0, 10),
          order: sessions.length + 1,
        });
      }
      setTitle("");
      await loadSessions();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Chyba při vytváření";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/app/campaigns/${campaignId}`}
        className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 inline-block"
      >
        ← Zpět na kampaň
      </Link>

      <h1 className="text-xl font-bold text-zinc-100 mb-6">Sezení</h1>

      {error && (
        <div className="bg-red-950/50 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název sezení"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-medium text-sm px-4 py-2 rounded transition-colors"
        >
          {saving ? "…" : "+ Přidat"}
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="animate-spin">⟳</span>
          <span>Načítání…</span>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-zinc-500 text-sm">Žádná sezení.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="border border-zinc-800 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-zinc-200 text-sm font-medium">#{s.order} — {s.title}</p>
                <p className="text-xs text-zinc-500">{s.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function mapSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    title: (row.title as string) ?? "",
    summary: (row.summary as string) ?? "",
    date: (row.date as string) ?? "",
    order: (row.order as number) ?? 0,
    createdAt: (row.created_at as string) ?? "",
  };
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { narrationRepo } from "@/lib/storage";
import { fetchNarrations } from "@/lib/campaigns/campaign-content-live";
import { NarrationEntry } from "@/types";

const SB_AVAILABLE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
);

const MAX_ENTRIES = 50;

export default function NarrationLogPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<NarrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      let all: NarrationEntry[];
      if (SB_AVAILABLE) {
        all = await fetchNarrations(campaignId);
      } else {
        all = await narrationRepo.getAll({ campaignId } as Partial<NarrationEntry>);
      }
      const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setEntries(sorted.slice(0, MAX_ENTRIES));
    } catch (err) {
      console.error("[log] loadEntries failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [campaignId]);

  async function handleDelete(entryId: string) {
    if (!confirm("Naozaj chceš vymazať tento záznam?")) return;
    // Supabase delete — narrations RLS allows member delete
    if (SB_AVAILABLE) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("narrations").delete().eq("id", entryId);
    } else {
      await narrationRepo.delete(entryId);
    }
    loadEntries();
  }

  function formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleString("sk-SK", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/app/campaigns/${campaignId}/narrate`}
        className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 inline-block"
      >
        ← Zpět na vyprávění
      </Link>

      <h1 className="text-xl font-bold text-zinc-100 mb-6">
        História rozprávání
      </h1>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="animate-spin">⟳</span>
          <span>Načítání…</span>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Zatím žádné záznamy.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <div key={entry.id} className="border border-zinc-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">{formatTime(entry.createdAt)}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        entry.mode === "ai"
                          ? "bg-violet-900/50 text-violet-300"
                          : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {entry.mode}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">
                      <span className="text-zinc-500">Vstup:</span> {entry.userInput}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                      className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                    >
                      {isOpen ? "Zavřít" : "Otevřít"}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                      title="Vymazať záznam"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">
                      {entry.narrationText}
                    </pre>
                    {entry.suggestedActions && entry.suggestedActions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Návrhy akcií</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.suggestedActions.map((action, i) => (
                            <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {entries.length >= MAX_ENTRIES && (
        <p className="text-xs text-zinc-600 mt-4 text-center">
          Zobrazených max. {MAX_ENTRIES} záznamov.
        </p>
      )}
    </div>
  );
}

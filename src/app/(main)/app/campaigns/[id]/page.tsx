"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCampaignById } from "@/lib/campaigns";
import type { Campaign } from "@/types";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [houseRules, setHouseRules] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotFound(true); setLoading(false); return; }

      const c = await getCampaignById(id, user.id);
      if (!c) { setNotFound(true); setLoading(false); return; }

      setCampaign(c);
      setHouseRules(c.houseRules ?? "");
      setLoading(false);
    })();
  }, [id]);

  async function handleSaveNotes() {
    if (!campaign) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("campaigns")
      .update({ house_rules: houseRules, updated_at: new Date().toISOString() })
      .eq("id", campaign.id);
    setCampaign((prev) => prev ? { ...prev, houseRules } : prev);
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 mt-8">
        <span className="animate-spin">⟳</span>
        <span>Načítání kampaně…</span>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="max-w-md mt-8">
        <p className="text-zinc-400 mb-4">Kampaň nenalezena nebo nemáš přístup.</p>
        <Link href="/app/campaigns" className="text-amber-500 hover:text-amber-400 text-sm">
          ← Zpět na kampaně
        </Link>
      </div>
    );
  }

  const sections = [
    { href: `/app/campaigns/${id}/sessions`, label: "Sezení", icon: "/ilustrations/campaign-sessions.png" },
    { href: `/app/campaigns/${id}/characters`, label: "Postavy", icon: "/ilustrations/campaign-characters.png" },
    { href: `/app/campaigns/${id}/narrate`, label: "Vyprávění", icon: "/ilustrations/campaign-narrate.png" },
    { href: `/app/campaigns/${id}/settings`, label: "Nastavení", icon: "/ilustrations/campaign-settings.png" },
  ];

  return (
    <div className="max-w-3xl">
      <Link
        href="/app/campaigns"
        className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 inline-block"
      >
        ← Zpět na kampaně
      </Link>

      {/* Campaign header */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-zinc-100">{campaign.name}</h1>
        {campaign.hasPassword && (
          <span className="text-amber-500 text-xs" title="Zamčená kampaň">🔒</span>
        )}
        {campaign.joinCode && (
          <span className="text-xs text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded tracking-[0.15em]">
            {campaign.joinCode}
          </span>
        )}
        <span className="text-[10px] text-zinc-600 font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded">
          {campaign.id.slice(0, 8)}
        </span>
      </div>
      {campaign.description && (
        <p className="text-zinc-400 text-sm mb-6">{campaign.description}</p>
      )}

      {/* Navigation tiles */}
      <div className="grid gap-3 sm:grid-cols-4 mb-8">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border border-zinc-800 rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors"
          >
            <img src={s.icon} alt="" className="w-10 h-10 mx-auto mb-2 object-contain" />
            <p className="text-sm font-medium text-zinc-300">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* House rules / notes */}
      <div className="border-t border-zinc-800 pt-6 mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Poznámky / domácí pravidla
        </p>
        <textarea
          value={houseRules}
          onChange={(e) => { setHouseRules(e.target.value); setSaveOk(false); }}
          rows={4}
          placeholder="Sem zapiš domácí pravidla, poznámky ke kampani…"
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-y mb-2"
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving || houseRules === (campaign.houseRules ?? "")}
          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-200 text-xs px-3 py-1.5 rounded transition-colors"
        >
          {saving ? "Ukládám…" : saveOk ? "✓ Uloženo" : "Uložit poznámky"}
        </button>
      </div>

      {/* Memory summary (read-only) */}
      <div className="border-t border-zinc-800 pt-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Paměť kampaně (shrnutí)
        </p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded p-3">
          <p className="text-sm text-zinc-400 italic">
            {campaign.memorySummary || "Zatím žádné shrnutí — vygeneruj první vyprávění."}
          </p>
        </div>
      </div>
    </div>
  );
}

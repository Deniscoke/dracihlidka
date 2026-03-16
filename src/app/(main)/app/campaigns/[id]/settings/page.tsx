"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCampaignById } from "@/lib/campaigns";
import type { Campaign } from "@/types";

const SB_AVAILABLE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
);

export default function CampaignSettingsPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rulesPackText, setRulesPackText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCampaign();
  }, [campaignId]);

  async function loadCampaign() {
    if (!campaignId) return;
    setLoading(true);
    try {
      if (SB_AVAILABLE) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Nejsi přihlášen."); setLoading(false); return; }
        const c = await getCampaignById(campaignId, user.id);
        if (!c) { setError("Kampaň nenalezena."); setLoading(false); return; }
        setCampaign(c);
        setRulesPackText(c.rulesPackText ?? "");
      } else {
        const { campaignRepo } = await import("@/lib/storage");
        const c = await campaignRepo.getById(campaignId);
        if (c) { setCampaign(c); setRulesPackText(c.rulesPackText ?? ""); }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!campaignId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (SB_AVAILABLE) {
        const supabase = createClient();
        const { error: err } = await supabase
          .from("campaigns")
          .update({ rules_pack_text: rulesPackText.trim(), updated_at: new Date().toISOString() })
          .eq("id", campaignId);
        if (err) throw err;
        setCampaign(prev => prev ? { ...prev, rulesPackText: rulesPackText.trim() } : prev);
      } else {
        const { campaignRepo } = await import("@/lib/storage");
        const updated = await campaignRepo.update(campaignId, { rulesPackText: rulesPackText.trim() });
        setCampaign(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Chyba při ukládání";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl"><p className="text-sm text-zinc-500">Načítání...</p></div>;
  }

  if (error && !campaign) {
    return (
      <div className="max-w-3xl">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <Link href="/app/campaigns" className="text-sm text-amber-500 hover:text-amber-400">← Zpět na kampaně</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/app/campaigns/${campaignId}`} className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 inline-block">
        ← Zpět
      </Link>

      <h1 className="text-xl font-bold text-zinc-100 mb-6">Nastavení kampaně</h1>

      {/* Campaign info */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-2">{campaign?.name}</h2>
        <p className="text-xs text-zinc-500">{campaign?.description || "Bez popisu"}</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Rules Pack editor */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-zinc-200 mb-1">Balíček pravidel (Rules Pack)</h2>
          <p className="text-xs text-zinc-500">
            Vlastní pravidla, poznámky nebo kontext pro AI. Tato pole budou součástí každého volání AI.
          </p>
        </div>

        <textarea
          value={rulesPackText}
          onChange={(e) => setRulesPackText(e.target.value)}
          rows={12}
          placeholder={"Například:\n- Kampaň používá úroveňový systém 1-20\n- Kritický zásah = 2x poškození\n- Magie je vzácná a nebezpečná\n- Tón: temný fantasy s politickými intriky"}
          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-y font-mono"
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-zinc-600">{rulesPackText.length} znaků</p>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-500">✓ Uloženo</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-medium text-sm px-4 py-2 rounded transition-colors"
            >
              {saving ? "Ukládám..." : "Uložit"}
            </button>
          </div>
        </div>
      </div>

      {campaign?.houseRules && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-zinc-500 mb-1">Domácí pravidla</p>
          <p className="text-xs text-zinc-400 italic">{campaign.houseRules}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/app/campaigns/${campaignId}/narrate`)}
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded transition-colors"
        >
          Přejít na vyprávění
        </button>
      </div>
    </div>
  );
}

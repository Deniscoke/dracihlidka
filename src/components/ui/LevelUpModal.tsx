"use client";

import { useState } from "react";
import { Character } from "@/types";

const CLASS_DOMINANT: Record<string, [string, string]> = {
  Válečník:  ["sila", "odolnost"],
  Hraničář:  ["obratnost", "inteligence"],
  Alchymista:["obratnost", "odolnost"],
  Kouzelník: ["inteligence", "charisma"],
  Zloděj:    ["obratnost", "charisma"],
  Klerik:    ["inteligence", "charisma"],
};

const STAT_LABELS: Record<string, string> = {
  sila: "SIL", obratnost: "OBR", odolnost: "ODO",
  inteligence: "INT", charisma: "CHA",
};

export interface LevelUpModalProps {
  character: Character;
  onApply: (updates: { hpBonus: number; statKey: string }) => void;
  onCancel: () => void;
}

export function LevelUpModal({ character, onApply, onCancel }: LevelUpModalProps) {
  const [hpChoice, setHpChoice] = useState<"roll" | "fixed">("roll");
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [statKey, setStatKey] = useState<string | null>(null);

  const dominants = CLASS_DOMINANT[character.class ?? ""] ?? ["sila", "odolnost"];
  const canApply = statKey && (hpChoice === "fixed" || hpRoll !== null);

  function rollHp() {
    const roll = Math.floor(Math.random() * 6) + 1;
    setHpRoll(roll);
  }

  function handleApply() {
    if (!statKey) return;
    const hpBonus = hpChoice === "fixed" ? 3 : (hpRoll ?? 0);
    onApply({ hpBonus, statKey });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-zinc-900 border border-amber-500/40 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-zinc-100 mb-1">Postup postavy</h3>
        <p className="text-sm text-zinc-500 mb-4">
          {character.name} · Úr. {character.level} → {character.level + 1}
        </p>
        <p className="text-xs text-amber-500/80 mb-4">
          DH-LITE: pri levelupe +1k6 HP (alebo +3) a +1 k jednému atribútu dle povolania.
        </p>

        {/* HP */}
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-400 mb-2">Životy</p>
          <div className="flex gap-2">
            <button
              onClick={() => setHpChoice("roll")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                hpChoice === "roll" ? "bg-amber-600 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Hod 1k6
            </button>
            <button
              onClick={() => setHpChoice("fixed")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                hpChoice === "fixed" ? "bg-amber-600 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              +3 pevne
            </button>
            {hpChoice === "roll" && (
              <button
                onClick={rollHp}
                className="px-3 py-2 rounded-lg text-sm bg-zinc-700 hover:bg-zinc-600 text-amber-400"
              >
                {hpRoll !== null ? `Hod: ${hpRoll}` : "Hod k6"}
              </button>
            )}
          </div>
        </div>

        {/* +1 atribút */}
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-400 mb-2">+1 k atribútu (dle povolania)</p>
          <div className="flex gap-2">
            {dominants.map((k) => (
              <button
                key={k}
                onClick={() => setStatKey(k)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  statKey === k ? "bg-amber-600 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {STAT_LABELS[k] ?? k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-lg transition-colors"
          >
            Aplikovať
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-zinc-400 hover:text-zinc-200"
          >
            Zrušiť
          </button>
        </div>
      </div>
    </div>
  );
}

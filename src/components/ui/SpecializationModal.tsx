"use client";

import { Character } from "@/types";
import { getSpecializationsForClass, type SpecializationOption } from "@/lib/dh-progressions";

export interface SpecializationModalProps {
  character: Character;
  onSelect: (spec: SpecializationOption) => void;
  onCancel: () => void;
}

export function SpecializationModal({ character, onSelect, onCancel }: SpecializationModalProps) {
  const baseClass = character.class ?? "";
  const level = character.level ?? 1;
  const currentSpec = character.specialization;
  const options = getSpecializationsForClass(baseClass, level);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-zinc-900 border border-amber-500/40 rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-100">Vylepšenie postavy</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {character.name} · {baseClass} · Úr. {level}
          </p>
          {currentSpec && (
            <p className="text-xs text-amber-500/90 mt-2">
              Aktuálna specializácia: <strong>{currentSpec}</strong>
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {options.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">
                Žiadne dostupné vylepšenia. Potrebuješ aspoň úroveň 3 pre prvú specializáciu.
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                {baseClass} → úroveň 3: prvá cesta | úroveň 4: druhá cesta
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => onSelect(spec)}
                  className="w-full text-left p-4 rounded-xl border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/60 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100 group-hover:text-amber-200 transition-colors">
                        {spec.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Od úrovne {spec.minLevel}</p>
                      <p className="text-sm text-zinc-400 mt-2">{spec.description}</p>
                      <p className="text-xs text-amber-500/90 mt-2 font-medium">{spec.ability}</p>
                      {spec.statBonus && (
                        <p className="text-[10px] text-zinc-600 mt-1">
                          +1 k {spec.statBonus === "sila" ? "SIL" : spec.statBonus === "obratnost" ? "OBR" : spec.statBonus === "odolnost" ? "ODO" : spec.statBonus === "inteligence" ? "INT" : "CHA"}
                        </p>
                      )}
                    </div>
                    <span className="text-amber-500 text-lg opacity-60 group-hover:opacity-100">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={onCancel} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-sm">
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
}

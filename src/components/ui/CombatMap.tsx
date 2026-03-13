"use client";

import type { CombatScene, CombatEnemy } from "@/lib/ai/provider";
import type { Character } from "@/types";

interface CombatMapProps {
  scene: CombatScene;
  characters: Character[];
  onClose?: () => void;
}

/** Mřížková bojová mapa — kostky = políčka, postavy a NPC */
export default function CombatMap({ scene, characters, onClose }: CombatMapProps) {
  const { gridCols, gridRows, enemies, description } = scene;

  // Hráčské postavy umístíme vlevo (sloupec 0), NPC vpravo
  const playerChars = characters.filter((c) => !c.isNPC);
  const playerPositions = playerChars.map((c, i) => ({
    ...c,
    x: 0,
    y: Math.min(i, gridRows - 1),
  }));

  const cellSize = 48;

  return (
    <div className="rounded-xl border-2 dh-card p-4" style={{ borderColor: "var(--border-accent)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: "var(--accent-gold)" }}>
          ⚔️ Bojová mapa — {description}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded dh-input hover:bg-zinc-700 transition-colors"
          >
            Zavřít
          </button>
        )}
      </div>

      {/* Grid — kostkovaná mřížka */}
      <div
        className="inline-grid gap-1 rounded-lg p-2"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
          background: "var(--bg-panel)",
        }}
      >
        {Array.from({ length: gridRows * gridCols }).map((_, idx) => {
          const col = idx % gridCols;
          const row = Math.floor(idx / gridCols);

          // Najdi postavu nebo nepřítele na tomto políčku
          const player = playerPositions.find((p) => p.x === col && p.y === row);
          const enemy = enemies.find((e) => e.x === col && e.y === row);

          const content = player ? (
            <div
              key={`p-${player.id}`}
              className="w-full h-full rounded flex flex-col items-center justify-center bg-emerald-900/60 border border-emerald-600/50 text-[10px] font-medium"
              title={`${player.name} HP ${player.hp ?? "?"}/${player.maxHp ?? "?"}`}
            >
              <span className="text-emerald-300 truncate max-w-full px-0.5">{player.name.slice(0, 6)}</span>
              <span className="text-emerald-400/80 text-[9px]">
                {player.hp ?? "?"}/{player.maxHp ?? "?"}
              </span>
            </div>
          ) : enemy ? (
            <div
              key={enemy.id}
              className="w-full h-full rounded flex flex-col items-center justify-center bg-red-900/60 border border-red-600/50 text-[10px] font-medium"
              title={`${enemy.name} HP ${enemy.hp}/${enemy.maxHp}`}
            >
              <span className="text-red-300 truncate max-w-full px-0.5">{enemy.name.slice(0, 6)}</span>
              <span className="text-red-400/80 text-[9px]">
                {enemy.hp}/{enemy.maxHp}
              </span>
            </div>
          ) : (
            <div
              key={idx}
              className="w-full h-full rounded flex items-center justify-center"
              style={{
                background: "rgba(63,63,70,0.4)",
                border: "1px solid rgba(113,113,122,0.3)",
              }}
            >
              <span className="text-zinc-600 text-[8px]">□</span>
            </div>
          );

          return <div key={idx}>{content}</div>;
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mt-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-900/60 border border-emerald-600/50" /> Hráči
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-900/60 border border-red-600/50" /> Nepřátelé
        </span>
      </div>
    </div>
  );
}

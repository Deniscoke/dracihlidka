"use client";

import { useState, useCallback } from "react";
import { Dice3D } from "./Dice3D";

// ── Types ──────────────────────────────────────────────────

export type RollPhase =
  | "idle"            // no roll yet this turn
  | "rolling"         // animation playing
  | "rolled_normal"   // first roll done, not critical — no further rolls allowed
  | "rolled_critical" // first roll was critical — bonus roll available
  | "rolling_bonus"   // bonus roll animation playing
  | "done";           // bonus roll used — sequence complete

export interface DiceRollMeta {
  isCritical: boolean;
  isBonusRoll: boolean;
  phase: "first" | "bonus";
}

export interface DiceRollRecord {
  diceType: "d6" | "d20";
  result: number;
  isCritical: boolean;
  isBonusRoll: boolean;
}

interface DiceRollerProps {
  characters: { id: string; name: string }[];
  /** Called for every individual roll. meta.phase distinguishes first vs. bonus. */
  onRollResult: (
    charName: string,
    diceType: "d6" | "d20",
    result: number,
    meta: DiceRollMeta
  ) => void;
}

// ── Helpers ────────────────────────────────────────────────

function roll(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function isCriticalResult(diceType: "d6" | "d20", result: number): boolean {
  return (diceType === "d6" && result === 6) || (diceType === "d20" && result === 20);
}

// ── Component ──────────────────────────────────────────────

export default function DiceRoller({ characters, onRollResult }: DiceRollerProps) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [phase, setPhase] = useState<RollPhase>("idle");
  const [rolls, setRolls] = useState<DiceRollRecord[]>([]);
  // 3D dice animation state
  const [animDice, setAnimDice] = useState<{ type: "d6" | "d20"; value: number } | null>(null);
  const [animRolling, setAnimRolling] = useState(false);
  // Pending roll data (set before animation, fired after)
  const [pendingRoll, setPendingRoll] = useState<{
    charName: string;
    diceType: "d6" | "d20";
    result: number;
    critical: boolean;
    isBonus: boolean;
  } | null>(null);

  const char = characters.find((c) => c.id === selectedCharId) ?? characters[0];
  const charName = char?.name ?? "Postava";

  const canRoll = phase === "idle";
  const canBonus = phase === "rolled_critical";
  const isFinished = phase === "rolled_normal" || phase === "done";
  const isAnimating = phase === "rolling" || phase === "rolling_bonus";

  // When 3D animation ends, commit the roll
  const handleAnimEnd = useCallback(() => {
    setAnimRolling(false);
    if (!pendingRoll) return;

    const { charName: cn, diceType, result, critical, isBonus } = pendingRoll;
    const record: DiceRollRecord = { diceType, result, isCritical: critical, isBonusRoll: isBonus };

    if (isBonus) {
      setRolls((prev) => [...prev, record]);
      setPhase("done");
      onRollResult(cn, diceType, result, { isCritical: false, isBonusRoll: true, phase: "bonus" });
    } else {
      setRolls([record]);
      setPhase(critical ? "rolled_critical" : "rolled_normal");
      onRollResult(cn, diceType, result, { isCritical: critical, isBonusRoll: false, phase: "first" });
    }
    setPendingRoll(null);
  }, [pendingRoll, onRollResult]);

  function handleFirstRoll(diceType: "d6" | "d20") {
    if (!canRoll) return;
    const result = roll(diceType === "d6" ? 6 : 20);
    const critical = isCriticalResult(diceType, result);

    // Start animation
    setAnimDice({ type: diceType, value: result });
    setAnimRolling(true);
    setPhase("rolling");
    setPendingRoll({ charName, diceType, result, critical, isBonus: false });
  }

  function handleBonusRoll() {
    if (!canBonus) return;
    const firstRoll = rolls[0];
    if (!firstRoll) return;
    const result = roll(firstRoll.diceType === "d6" ? 6 : 20);

    setAnimDice({ type: firstRoll.diceType, value: result });
    setAnimRolling(true);
    setPhase("rolling_bonus");
    setPendingRoll({ charName, diceType: firstRoll.diceType, result, critical: false, isBonus: true });
  }

  function handleReset() {
    setPhase("idle");
    setRolls([]);
    setAnimDice(null);
    setAnimRolling(false);
    setPendingRoll(null);
  }

  if (characters.length === 0) return null;

  return (
    <div className="rounded-lg p-3 dh-card space-y-2">
      {/* Row 1: character selector + dice buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Postava:
          </span>
          <select
            value={selectedCharId ?? characters[0]?.id}
            onChange={(e) => setSelectedCharId(e.target.value)}
            className="rounded px-2 py-1 text-sm dh-input"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFirstRoll("d6")}
            disabled={!canRoll || isAnimating}
            className="px-3 py-1.5 rounded-lg dh-btn-primary text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            k6
          </button>
          <button
            type="button"
            onClick={() => handleFirstRoll("d20")}
            disabled={!canRoll || isAnimating}
            className="px-3 py-1.5 rounded-lg dh-btn-primary text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            k20
          </button>
        </div>

        {/* Reset — visible once any roll has been made */}
        {phase !== "idle" && !isAnimating && (
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 rounded text-xs transition-colors dh-input"
          >
            Nový hod
          </button>
        )}
      </div>

      {/* Row 2: 3D dice animation + roll results */}
      {animDice && (
        <div className="flex items-center gap-4 py-2">
          <Dice3D
            type={animDice.type}
            value={animDice.value}
            rolling={animRolling}
            onAnimationEnd={handleAnimEnd}
          />

          {/* Show result after animation */}
          {!animRolling && rolls.length > 0 && (
            <div className="flex flex-col gap-1">
              {rolls.map((r, i) => (
                <span
                  key={i}
                  className="text-sm font-medium"
                  style={{
                    color: r.isCritical ? "var(--accent-gold)" : "var(--text-secondary)",
                  }}
                >
                  {r.isBonusRoll ? "Bonus" : r.diceType.toUpperCase()}:{" "}
                  <strong className="text-lg">{r.result}</strong>
                  {r.isCritical && " 🎯 KRITICKÝ!"}
                </span>
              ))}
            </div>
          )}

          {animRolling && (
            <span className="text-xs animate-pulse" style={{ color: "var(--accent-gold)" }}>
              Hází se…
            </span>
          )}
        </div>
      )}

      {/* Row 3: bonus roll prompt */}
      {phase === "rolled_critical" && (
        <div className="flex items-center gap-3 pt-1 border-t border-amber-700/30">
          <span className="text-xs text-amber-400">
            🎲 Kritický hod — máš nárok na bonusový hod!
          </span>
          <button
            type="button"
            onClick={handleBonusRoll}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "rgba(201,162,39,0.2)",
              border: "1px solid rgba(201,162,39,0.5)",
              color: "var(--accent-gold)",
            }}
          >
            Bonusový hod
          </button>
        </div>
      )}

      {/* Row 4: finished indicator */}
      {isFinished && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {phase === "done"
            ? "Sekvence hodů dokončena."
            : "Hod proveden — žádný bonusový hod (není kritický)."}
        </p>
      )}
    </div>
  );
}

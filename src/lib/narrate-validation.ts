// ============================================================
// Narrate endpoint — pure validation functions
// Extracted here so they can be unit-tested without starting Next.js.
// ============================================================

export const NARRATE_LIMITS = {
  PROMPT_MAX: 2000,
  CAMPAIGN_TITLE_MAX: 200,
  CAMPAIGN_DESC_MAX: 1000,
  MEMORY_SUMMARY_MAX: 4000,
  HOUSE_RULES_MAX: 3000,
  RULES_PACK_MAX: 6000,
  DICE_ROLLS_MAX: 5,
} as const;

// UUID v4 pattern
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DiceRollRecord {
  diceType: "d6" | "d20";
  result: number;
  isCritical: boolean;
  isBonusRoll: boolean;
}

export type DiceValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validates the dice roll sequence sent with a narration request.
 * A bonus roll is only valid after a critical first roll of the same dice type.
 * This runs server-side so it cannot be bypassed via DevTools.
 */
export function validateDiceRolls(rolls: DiceRollRecord[]): DiceValidationResult {
  if (!rolls.length) return { ok: true };

  const bonusRolls = rolls.filter((r) => r.isBonusRoll);
  if (bonusRolls.length === 0) return { ok: true };

  if (bonusRolls.length > 1) {
    return { ok: false, error: "Neplatná sekvence hodů kostkou: více bonusových hodů." };
  }

  const criticalFirstRoll = rolls.find((r) => r.isCritical && !r.isBonusRoll);
  if (!criticalFirstRoll) {
    return { ok: false, error: "Neplatná sekvence hodů kostkou: bonusový hod bez předchozího kritického hodu." };
  }

  const bonus = bonusRolls[0];
  if (bonus.diceType !== criticalFirstRoll.diceType) {
    return { ok: false, error: "Neplatná sekvence hodů kostkou: bonusový hod použil jiný typ kostky." };
  }

  const criticalThreshold = criticalFirstRoll.diceType === "d6" ? 6 : 20;
  if (criticalFirstRoll.result !== criticalThreshold) {
    return { ok: false, error: "Neplatná sekvence hodů kostkou: označený kritický hod neodpovídá hodnotě." };
  }

  return { ok: true };
}

export interface NarrateRequestBody {
  prompt?: string;
  userInput?: string;
  campaignId?: string;
  [key: string]: unknown;
}

export type BodyValidationResult =
  | { ok: true; prompt: string; campaignId: string }
  | { ok: false; error: string; missingFields: string[] };

/** Validates the minimum required fields for a narration request. */
export function validateNarrateBody(body: NarrateRequestBody): BodyValidationResult {
  const prompt = (body.prompt || body.userInput || "").trim();
  const campaignId = (body.campaignId || "").trim();
  const missing: string[] = [];

  if (!prompt) missing.push("prompt");
  if (!campaignId) missing.push("campaignId");

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Chybějící povinná pole: ${missing.join(", ")}`,
      missingFields: missing,
    };
  }

  if (!UUID_RE.test(campaignId)) {
    return { ok: false, error: "Neplatný formát campaignId.", missingFields: ["campaignId"] };
  }

  if (prompt.length > NARRATE_LIMITS.PROMPT_MAX) {
    return {
      ok: false,
      error: `Příkaz je příliš dlouhý (max ${NARRATE_LIMITS.PROMPT_MAX} znaků).`,
      missingFields: [],
    };
  }

  return { ok: true, prompt, campaignId };
}

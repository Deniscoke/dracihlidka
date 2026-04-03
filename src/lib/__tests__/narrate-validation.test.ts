import { describe, it, expect } from "vitest";
import {
  validateDiceRolls,
  validateNarrateBody,
  NARRATE_LIMITS,
  type DiceRollRecord,
} from "../narrate-validation";

// ---- validateDiceRolls ----

describe("validateDiceRolls", () => {
  it("passes with empty rolls", () => {
    expect(validateDiceRolls([])).toEqual({ ok: true });
  });

  it("passes with normal rolls (no bonus)", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 3, isCritical: false, isBonusRoll: false },
      { diceType: "d20", result: 15, isCritical: false, isBonusRoll: false },
    ];
    expect(validateDiceRolls(rolls)).toEqual({ ok: true });
  });

  it("passes with a valid critical + bonus roll sequence (d6)", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 6, isCritical: true, isBonusRoll: false },
      { diceType: "d6", result: 4, isCritical: false, isBonusRoll: true },
    ];
    expect(validateDiceRolls(rolls)).toEqual({ ok: true });
  });

  it("passes with a valid critical + bonus roll sequence (d20)", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d20", result: 20, isCritical: true, isBonusRoll: false },
      { diceType: "d20", result: 17, isCritical: false, isBonusRoll: true },
    ];
    expect(validateDiceRolls(rolls)).toEqual({ ok: true });
  });

  it("rejects multiple bonus rolls", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 6, isCritical: true, isBonusRoll: false },
      { diceType: "d6", result: 4, isCritical: false, isBonusRoll: true },
      { diceType: "d6", result: 5, isCritical: false, isBonusRoll: true },
    ];
    const result = validateDiceRolls(rolls);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/více bonusových hodů/);
  });

  it("rejects bonus roll without preceding critical", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 3, isCritical: false, isBonusRoll: false },
      { diceType: "d6", result: 4, isCritical: false, isBonusRoll: true },
    ];
    const result = validateDiceRolls(rolls);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/bez předchozího kritického hodu/);
  });

  it("rejects bonus roll with different dice type than critical", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 6, isCritical: true, isBonusRoll: false },
      { diceType: "d20", result: 15, isCritical: false, isBonusRoll: true },
    ];
    const result = validateDiceRolls(rolls);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/jiný typ kostky/);
  });

  it("rejects fabricated 'critical' roll that doesn't hit the threshold", () => {
    const rolls: DiceRollRecord[] = [
      { diceType: "d6", result: 5, isCritical: true, isBonusRoll: false }, // 5 is NOT critical on d6
      { diceType: "d6", result: 4, isCritical: false, isBonusRoll: true },
    ];
    const result = validateDiceRolls(rolls);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/neodpovídá hodnotě/);
  });
});

// ---- validateNarrateBody ----

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("validateNarrateBody", () => {
  it("passes with valid prompt and UUID campaignId", () => {
    const result = validateNarrateBody({ prompt: "Útočím na skřeta", campaignId: VALID_UUID });
    expect(result).toEqual({ ok: true, prompt: "Útočím na skřeta", campaignId: VALID_UUID });
  });

  it("accepts userInput alias for prompt", () => {
    const result = validateNarrateBody({ userInput: "Průzkum", campaignId: VALID_UUID });
    expect(result).toMatchObject({ ok: true, prompt: "Průzkum" });
  });

  it("trims whitespace from prompt", () => {
    const result = validateNarrateBody({ prompt: "  Jdu dopředu  ", campaignId: VALID_UUID });
    expect(result).toMatchObject({ ok: true, prompt: "Jdu dopředu" });
  });

  it("fails when prompt is missing", () => {
    const result = validateNarrateBody({ campaignId: VALID_UUID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingFields).toContain("prompt");
  });

  it("fails when campaignId is missing", () => {
    const result = validateNarrateBody({ prompt: "test" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingFields).toContain("campaignId");
  });

  it("rejects non-UUID campaignId", () => {
    const result = validateNarrateBody({ prompt: "test", campaignId: "not-a-uuid" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Neplatný formát/);
  });

  it("rejects prompt exceeding PROMPT_MAX", () => {
    const longPrompt = "a".repeat(NARRATE_LIMITS.PROMPT_MAX + 1);
    const result = validateNarrateBody({ prompt: longPrompt, campaignId: VALID_UUID });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/příliš dlouhý/);
  });

  it("accepts prompt exactly at PROMPT_MAX", () => {
    const maxPrompt = "a".repeat(NARRATE_LIMITS.PROMPT_MAX);
    const result = validateNarrateBody({ prompt: maxPrompt, campaignId: VALID_UUID });
    expect(result.ok).toBe(true);
  });
});

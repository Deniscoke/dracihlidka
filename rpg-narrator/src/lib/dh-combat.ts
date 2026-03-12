// ============================================================
// DH-LITE Combat Mechanics — OB, HP, poškození
// Podľa DH-LITE.pdf
// ============================================================

/** Tabulka oprav za atribút */
export function getModifier(stupen: number): number {
  if (stupen <= 1) return -5;
  if (stupen <= 3) return -4;
  if (stupen <= 5) return -3;
  if (stupen <= 7) return -2;
  if (stupen <= 9) return -1;
  if (stupen <= 11) return 0;
  if (stupen <= 13) return +1;
  if (stupen <= 15) return +2;
  if (stupen <= 17) return +3;
  if (stupen <= 19) return +4;
  if (stupen <= 21) return +5;
  return +6;
}

/** HP = 10 + oprava ODO */
export function calcHP(odo: number): number {
  return Math.max(1, 10 + getModifier(odo));
}

/** OB = 10 + oprava OBR + bonus brnění */
export function calcOB(obr: number, armorBonus: number = 0): number {
  return 10 + getModifier(obr) + armorBonus;
}

/** Získa bonus brnění z inventára (najvyšší platí) */
const ARMOR_ITEMS: { pattern: RegExp; bonus: number }[] = [
  { pattern: /plát|platova|platová/i, bonus: 6 },
  { pattern: /kroužk|krouzkova|kroužková/i, bonus: 4 },
  { pattern: /kůže|kožen|kožena|kožená/i, bonus: 2 },
  { pattern: /štít|stit/i, bonus: 1 },
];

export function getArmorBonusFromInventory(inventory: string[] = []): number {
  let max = 0;
  for (const item of inventory) {
    for (const { pattern, bonus } of ARMOR_ITEMS) {
      if (pattern.test(item) && bonus > max) max = bonus;
    }
  }
  return max;
}

/** Získa poškození zbrane z inventára (prvá zbraň) */
const WEAPON_ITEMS: { pattern: RegExp; damage: string }[] = [
  { pattern: /kladivo|kladiva/i, damage: "1k8" },
  { pattern: /kuše|kuš/i, damage: "1k8" },
  { pattern: /meč|mec|stříbrný/i, damage: "1k6+SIL" },
  { pattern: /sekera|seker/i, damage: "1k6+SIL" },
  { pattern: /kopí|kopi/i, damage: "1k6+SIL" },
  { pattern: /luk/i, damage: "1k6" },
  { pattern: /dýka|dyka/i, damage: "1k4" },
];

export function getWeaponDamageFromInventory(inventory: string[] = []): string | null {
  for (const item of inventory) {
    for (const { pattern, damage } of WEAPON_ITEMS) {
      if (pattern.test(item)) return damage;
    }
  }
  return null;
}

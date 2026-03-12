// ============================================================
// DH-LITE — Postup a specializácie postáv
// Podľa pravidiel: postavy sa formujú smerom k specializácii
// ============================================================

export interface SpecializationOption {
  id: string;
  name: string;
  baseClass: string;
  minLevel: number;
  description: string;
  /** Bonus alebo schopnosť (napr. "+2 k útoku v zuřivosti") */
  ability: string;
  /** Atribút na zvýšenie pri výbere (voliteľné) */
  statBonus?: string;
}

/** Cesty postupu podľa základného povolania */
export const DH_SPECIALIZATIONS: SpecializationOption[] = [
  // Válečník
  {
    id: "berserk",
    name: "Berserk",
    baseClass: "Válečník",
    minLevel: 3,
    description: "Zuřivý bojovník. Pri zuřivosti +2 k útoku a poškození na 1 kolo.",
    ability: "Zuřivost: +2 k útoku a poškození na 1 kolo (1× za boj)",
    statBonus: "sila",
  },
  {
    id: "paladin-valecnik",
    name: "Paladin",
    baseClass: "Válečník",
    minLevel: 4,
    description: "Svatý bojovník. Odhánění nemrtvých, léčení 1k6+CHA.",
    ability: "Světlo: odhánění nemrtvých, léčení 1k6+CHA 1× za den",
    statBonus: "charisma",
  },
  // Hraničář
  {
    id: "druid",
    name: "Druid",
    baseClass: "Hraničář",
    minLevel: 3,
    description: "Spätosť s prírodou. Ovládanie rastlín, zvierat, prírodné kúzla.",
    ability: "Príroda: zvolanie zvieratka, léčení 1k4 v prírode",
    statBonus: "inteligence",
  },
  {
    id: "lucznik",
    name: "Łucznik",
    baseClass: "Hraničář",
    minLevel: 4,
    description: "Mistr luku. +1k6 poškození na dálku, presný výstrel.",
    ability: "Presný výstrel: +1k6 poškození lukom, krit na 19–20",
    statBonus: "obratnost",
  },
  // Alchymista
  {
    id: "toxik",
    name: "Toxik",
    baseClass: "Alchymista",
    minLevel: 3,
    description: "Mistr jedov. Jed na zbrani 1k4 extra, odolnost vůči jedům.",
    ability: "Jed: +1k4 jedové poškození, odolnost vůči jedům",
    statBonus: "odolnost",
  },
  {
    id: "vynalezce",
    name: "Vynálezce",
    baseClass: "Alchymista",
    minLevel: 4,
    description: "Mechanické vynálezy. Pasti, výbušniny 3k6.",
    ability: "Bomba+: 3k6 poškození v oblasti, mechanické pasti",
    statBonus: "obratnost",
  },
  // Kouzelník
  {
    id: "carodej",
    name: "Čaroděj",
    baseClass: "Kouzelník",
    minLevel: 3,
    description: "Divoká mágia. +1 Mana, kouzla bez přípravy.",
    ability: "Divoká mágia: +1 Mana, 1× za den re-roll kouzla",
    statBonus: "charisma",
  },
  {
    id: "illuzionista",
    name: "Illuzionista",
    baseClass: "Kouzelník",
    minLevel: 4,
    description: "Mistr ilúzií. Neviditelnost zdarma 1×, falošné stopy.",
    ability: "Ilúzia: Neviditelnost 1× za den, falošné stopy",
    statBonus: "inteligence",
  },
  // Zloděj
  {
    id: "vrah",
    name: "Vrah",
    baseClass: "Zloděj",
    minLevel: 3,
    description: "Zákeřný vrah. +3k6 ze zálohy, krit na 19–20.",
    ability: "Smrtící úder: +3k6 ze zálohy, krit 19–20",
    statBonus: "obratnost",
  },
  {
    id: "spion",
    name: "Špión",
    baseClass: "Zloděj",
    minLevel: 4,
    description: "Mistr převleku. +2 k přesvědčování, falšování.",
    ability: "Převlek: +2 CHA k přesvědčování, falšování dokumentů",
    statBonus: "charisma",
  },
  // Klerik
  {
    id: "paladin-klerik",
    name: "Paladin",
    baseClass: "Klerik",
    minLevel: 3,
    description: "Bojovník víry. Těžká zbroj, +1k6 k léčení.",
    ability: "Svatý úder: +1k6 k léčení, nosí plát bez penalizace",
    statBonus: "sila",
  },
  {
    id: "inkvizitor",
    name: "Inkvizitor",
    baseClass: "Klerik",
    minLevel: 4,
    description: "Pronásledovatel kacířů. Odhánění nemrtvých +2, detekce zla.",
    ability: "Odhánění+: dvojnásobný efekt, detekce zla",
    statBonus: "inteligence",
  },
];

export function getSpecializationsForClass(baseClass: string, level: number): SpecializationOption[] {
  return DH_SPECIALIZATIONS.filter(
    (s) => s.baseClass === baseClass && level >= s.minLevel
  );
}

export function getSpecializationById(id: string): SpecializationOption | undefined {
  return DH_SPECIALIZATIONS.find((s) => s.id === id);
}

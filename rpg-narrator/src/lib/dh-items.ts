// ============================================================
// DH-LITE Item Database — zbrane, brnenie, predmety s bonusmi
// Podľa DH-LITE.pdf
// ============================================================

export type ItemType = "weapon" | "armor" | "consumable" | "misc";

export interface ItemDefinition {
  name: string;
  type: ItemType;
  /** Poškození zbrane (napr. "1k6+SIL", "1k4") */
  damage?: string;
  /** Bonus k OB (brnenie) */
  obBonus?: number;
  /** Efekt (lektvary, kúzla) */
  effect?: string;
  /** Krátky popis */
  description?: string;
}

/** Databáza známych predmetov — lookup podľa názvu (case-insensitive, s toleranciou diakritiky) */
const ITEM_DB: ItemDefinition[] = [
  // Zbrane
  { name: "Dýka", type: "weapon", damage: "1k4", description: "Malá zbraň na blízko" },
  { name: "Meč", type: "weapon", damage: "1k6+SIL", description: "Útok na blízko, +oprava SIL k poškození" },
  { name: "Stříbrný meč", type: "weapon", damage: "1k6+SIL", description: "Účinný proti lykantropům" },
  { name: "Luk", type: "weapon", damage: "1k6", description: "Útok na dálku, OBR" },
  { name: "Kladivo", type: "weapon", damage: "1k8", description: "Těžká zbraň na blízko" },
  { name: "Sekera", type: "weapon", damage: "1k6+SIL", description: "Útok na blízko" },
  { name: "Kopí", type: "weapon", damage: "1k6+SIL", description: "Útok na blízko" },
  { name: "Kuše", type: "weapon", damage: "1k8", description: "Útok na dálku, OBR" },
  { name: "Štít", type: "armor", obBonus: 1, description: "+1 OB" },
  // Brnenie
  { name: "Kůže", type: "armor", obBonus: 2, description: "Lehké brnění, +2 OB" },
  { name: "Kožená zbroj", type: "armor", obBonus: 2, description: "+2 OB" },
  { name: "Kroužky", type: "armor", obBonus: 4, description: "Střední brnění, +4 OB" },
  { name: "Kroužková zbroj", type: "armor", obBonus: 4, description: "+4 OB" },
  { name: "Plát", type: "armor", obBonus: 6, description: "Těžké brnění, +6 OB" },
  { name: "Plátová zbroj", type: "armor", obBonus: 6, description: "+6 OB" },
  // Lektvary a spotřební
  { name: "Lektvar léčení", type: "consumable", effect: "1k6+1 HP", description: "Obnoví životy" },
  { name: "Lektvar síly", type: "consumable", effect: "+2 SIL 1 hod", description: "Dočasný bonus k síle" },
  { name: "Antidotum", type: "consumable", effect: "Odstraní jed", description: "Léčí otravu" },
  { name: "Bomba", type: "consumable", effect: "2k6 poškození v oblasti", description: "Alchymistická výbušnina" },
  // Misc
  { name: "Pochodeň", type: "misc", description: "Světlo, může zapálit" },
  { name: "Lano", type: "misc", description: "10 m" },
  { name: "Klíč", type: "misc", description: "Otevírá zámek" },
  { name: "Mapa", type: "misc", description: "Orientace v terénu" },
];

/** Normalizuje názov pre lookup (lowercase, bez diakritiky) */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Nájde definíciu predmetu podľa názvu */
export function getItemDefinition(itemName: string): ItemDefinition | undefined {
  const n = normalize(itemName);
  return ITEM_DB.find((i) => normalize(i.name) === n);
}

/** Vráti text bonusov pre zobrazenie (napr. "1k6+SIL · +2 OB") */
export function getItemBonusText(itemName: string): string | null {
  const def = getItemDefinition(itemName);
  if (!def) return null;
  const parts: string[] = [];
  if (def.damage) parts.push(`⚔️ ${def.damage} poškození`);
  if (def.obBonus) parts.push(`🛡️ +${def.obBonus} OB`);
  if (def.effect) parts.push(`✨ ${def.effect}`);
  if (parts.length === 0 && def.description) parts.push(def.description);
  return parts.length > 0 ? parts.join(" · ") : null;
}

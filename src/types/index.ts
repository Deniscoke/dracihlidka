// ============================================================
// RPG Narrator Engine — Core Types
// ============================================================

export interface Campaign {
  id: string;
  name: string;
  description: string;
  rulesetId: string; // e.g. "drd2", "generic", "custom"
  memorySummary?: string; // 1–3 sentence compressed memory, updated after each narration
  houseRules?: string; // user-provided campaign notes / house rules
  rulesPackText?: string; // user-editable plain-text rules context for AI
  /** 6-char uppercase code for sharing; only returned for owner's own campaigns */
  joinCode?: string;
  /** Whether a join-password is set — never expose the raw hash to clients */
  hasPassword?: boolean;
  /**
   * @deprecated Do not read from Supabase. Kept for localStorage backward-compat only.
   * Use hasPassword to check if a password is required.
   */
  passwordHash?: string;
  /** @deprecated See passwordHash */
  passwordSalt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  campaignId: string;
  title: string;
  summary: string;
  date: string;
  order: number;
  createdAt: string;
}

export interface Character {
  id: string;
  campaignId: string;
  name: string;
  race: string;
  class: string;
  /** Specializácia / upgrade z pravidiel (napr. Berserk, Druid) */
  specialization?: string;
  gender?: string;       // "Muž" | "Žena"
  level: number;
  hp?: number;           // hit points — undefined means "not tracked"
  maxHp?: number;
  xp?: number;
  /** DH-LITE stats: zivot, sila, obratnost, odolnost, inteligence, charisma */
  stats: Record<string, number>;
  statuses?: string[];   // e.g. ["Otrávený", "Neviditelný"]
  injuries?: string[];   // e.g. ["Zlomená ruka"]
  inventory?: string[];  // e.g. ["Meč", "Lektvar léčení"]
  notes: string;
  isNPC: boolean;
  portraitUrl?: string;  // AI-generated portrait URL (DALL-E 3)
  createdAt: string;
  updatedAt: string;
}

// ---- Narration Consequences ----

export interface CharacterDelta {
  characterName: string;
  characterId?: string;   // resolved after name→id mapping
  xpDelta?: number;
  hpDelta?: number;
  addStatuses?: string[];
  removeStatuses?: string[];
  addInjuries?: string[];
  removeInjuries?: string[];
  addItems?: string[];      // items gained
  removeItems?: string[];   // items lost / consumed
  addNotes?: string[];
}

export interface NarrationConsequences {
  eventSummary: string;
  deltas: CharacterDelta[];
  lootFound?: string[];       // items discovered in scene (not yet assigned)
  combatLog?: string;         // short combat description if applicable
  updatedCampaignSummary?: string; // optional campaign summary override
}

export interface MemoryEntry {
  id: string;
  campaignId: string;
  sessionId?: string;
  type: "note" | "event" | "lore" | "quest";
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

// Narration history
export interface NarrationEntry {
  id: string;
  campaignId: string;
  createdAt: string;
  mode: "mock" | "ai";
  userInput: string;
  narrationText: string;
  suggestedActions: string[];
  consequences?: NarrationConsequences; // deltas applied to characters
}

// ---- Campaign State — long-session world tracking ----

export interface CampaignState {
  id: string; // same as campaignId — 1:1 mapping
  campaignId: string;
  location?: string; // current place / area
  scene?: string; // short description of current scene
  party?: string[]; // active party member names
  npcs?: string[]; // recently-encountered NPC names
  threads?: string[]; // active story threads / quests
  flags?: Record<string, boolean | string>; // arbitrary world flags
  tone?: string; // e.g. "dark", "comedic", "epic"
  lastBeats?: string[]; // last N narrative beat types used (max 8)
  lastPhrases?: string[]; // last N opening phrases used (max 12)
  createdAt: string;
  updatedAt?: string;
}

// Future use — rules ingestion pipeline
export interface RulesChunk {
  id: string;
  rulesetId: string;
  source: string;        // filename / section
  content: string;       // paraphrased text
  embedding?: number[];  // future vector search
  tags: string[];
  createdAt: string;
}

// Schema versioning for localStorage
export interface StorageSchema {
  version: number;
  campaigns: Campaign[];
  sessions: Session[];
  characters: Character[];
  memories: MemoryEntry[];
  narrations: NarrationEntry[];
  campaignStates: CampaignState[];
}

export const CURRENT_SCHEMA_VERSION = 4;

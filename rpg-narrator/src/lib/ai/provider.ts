// ============================================================
// AI Narration Provider — contract for narration generation
// ============================================================

import type { CampaignState, NarrationConsequences } from "@/types";

export interface CompactNarrationEntry {
  userInput: string;
  narrationText: string;
  createdAt: string;
}

/** Compact character snapshot sent from client to API */
export interface CharacterSnapshot {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp?: number;
  maxHp?: number;
  xp?: number;
  statuses?: string[];
  injuries?: string[];
  inventory?: string[];
  notes: string;
  isNPC: boolean;
}

export interface NarrationRequest {
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string;
  memorySummary: string;
  houseRules: string;
  rulesPackText: string;  // user-editable plain-text rules context for AI
  recentEntries: CompactNarrationEntry[];
  relevantEntries: CompactNarrationEntry[]; // retrieved via similarity
  campaignState: CampaignState | null;
  characters: CharacterSnapshot[];          // campaign characters snapshot
  userInput: string;
}

export interface MapLocation {
  map: "world" | "ihienburgh";
  locationId: string;
  locationName: string;
}

export interface MapMarkerData {
  id: string;
  type: "enemy" | "city" | "poi" | "quest" | "npc";
  name: string;
  locationId: string;
  description: string;
  active: boolean;
}

/** Nepřítel na bojové mřížce */
export interface CombatEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
}

/** Bojová scéna — mřížková mapa (kostky = políčka) */
export interface CombatScene {
  gridCols: number;
  gridRows: number;
  enemies: CombatEnemy[];
  description: string;
}

export interface NarrationResponse {
  narrationText: string;
  suggestedActions: string[];  // exactly 3
  updatedMemorySummary: string; // 1–3 sentences
  updatedCampaignState: Partial<CampaignState> | null;
  consequences?: NarrationConsequences; // character deltas
  mapLocation?: MapLocation;     // current player position on the map
  mapMarkers?: MapMarkerData[];  // markers to add/update on the map
  /** Spustí bojový režim — zobrazí mřížkovou mapu */
  combatInitiated?: boolean;
  combatScene?: CombatScene;
}

export interface NarrationProvider {
  generate(request: NarrationRequest): Promise<NarrationResponse>;
}

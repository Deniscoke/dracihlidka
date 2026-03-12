// ============================================================
// Roster — postavy s campaignId === ROSTER_CAMPAIGN_ID patria do osobného rosteru
// ============================================================

export const ROSTER_CAMPAIGN_ID = "__roster__";

export function isRosterCharacter(campaignId: string): boolean {
  return campaignId === ROSTER_CAMPAIGN_ID;
}

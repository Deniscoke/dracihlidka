// ============================================================
// Othion — mapa světa pro AI vypravěče (DH-LITE)
// locationId používá AI v mapLocation
// ============================================================

export const OTHION_LOCATIONS_PROMPT = `
## MAPA SVĚTA OTHION — lokace (použij locationId v mapLocation)

Mapa "world" (hlavní svět):
- othion_hlavni_mesto — Hlavní město
- othion_les — Temný les
- othion_vesnice — Zapadlá vesnice
- othion_hory — Hory severu
- othion_bažina — Bažina
- othion_jeskyně — Jeskyně
- othion_ruiny — Staré ruiny
- othion_hrad — Opuštěný hrad
- othion_klášter — Klášter
- othion_taverna — Taverna
- othion_cesta — Cesta
- othion_most — Most přes řeku
- othion_pobřeží — Pobřeží
- othion_doly — Opuštěné doly

Mapa "ihienburgh" (region):
- ihienburgh_mesto — Ihienburgh
- ihienburgh_okoli — Okolí Ihienburghu
- ihienburgh_les — Les u Ihienburghu
- ihienburgh_hrad — Hrad
`.trim();

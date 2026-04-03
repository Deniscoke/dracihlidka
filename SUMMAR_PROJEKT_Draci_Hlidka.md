# Dračí Hlídka — Kompletný sumár projektu

> **Účel:** Tento dokument slúži ako plný kontext stavu projektu pre AI asistenty (ChatGPT, Claude). Obsahuje architektúru, implementované funkcie, technológie, dátové modely a zvyšujúce sa úlohy.

---

## 1. O projekte

**Dračí Hlídka** je RPG Narrator Engine — webová aplikácia pre správu stolových RPG kampaní s AI vypravěčom. Cieľová hra je **Dračí Hlídka Lite (DH-LITE)** — české/slovenské fantasy RPG s 6 povolaniami, rasami a pravidlami.

- **Jazyk UI:** čeština
- **Branding:** IndiWeb (badge na login stránke)
- **Port:** 3001 (dev), Vercel deployment

---

## 2. Technologický stack

| Kategória | Technológia |
|-----------|-------------|
| Framework | Next.js 16.1.6, React 19.2.3 |
| Styling | Tailwind CSS 4, vlastný design systém (CSS variables) |
| Backend | Next.js API Routes, Supabase (Auth, PostgreSQL, Realtime) |
| AI | OpenAI GPT-4o (narrácia), DALL·E 3 (portréty), OpenAI TTS |
| State | localStorage (client), Supabase (kampaně, členstvo, profily) |
| Deployment | Vercel |

### Environment premenné

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NARRATOR_AI_API_KEY          # OpenAI pre AI narrátora
NARRATOR_AI_MODEL            # voliteľné, default gpt-4o
```

---

## 3. Štruktúra projektu

```
DraciHlidka/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth layout
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── error/page.tsx
│   │   │   │   └── callback/route.ts
│   │   ├── (main)/           # Hlavné rozhranie (sidebar + header)
│   │   │   ├── app/
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── campaigns/page.tsx     # Zoznam kampaní
│   │   │   │   ├── campaigns/[id]/        # Detail kampaně
│   │   │   │   │   ├── page.tsx           # Přehled
│   │   │   │   │   ├── narrate/page.tsx   # AI vyprávění
│   │   │   │   │   ├── characters/page.tsx
│   │   │   │   │   ├── log/page.tsx       # Historie narrácií
│   │   │   │   │   ├── sessions/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── characters/page.tsx    # Osobní postavy (roster)
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── rules/page.tsx
│   │   │   │   └── sien-slavy/page.tsx    # Síň slávy
│   │   └── api/
│   │       ├── narrate/route.ts
│   │       ├── tts/route.ts
│   │       ├── generate-portrait/route.ts
│   │       ├── characters/route.ts
│   │       ├── profile/route.ts
│   │       ├── profiles/route.ts
│   │       └── hall-of-fame/route.ts
│   ├── components/
│   │   ├── layout/           # Sidebar, Header
│   │   ├── auth/             # AuthButton
│   │   └── ui/               # DHCharacterSheet, ClassSelector, TalkingNarrator, GameMap, DiceRoller, CombatMap, ...
│   ├── lib/
│   │   ├── ai/               # OpenAI provider, local provider, narrator
│   │   ├── campaigns/        # supabase-campaigns, campaign-content-live
│   │   ├── storage/          # localStorage repository
│   │   ├── supabase/         # client, server
│   │   ├── dh-*.ts           # dh-rules, dh-constants, dh-items, dh-combat, dh-progressions
│   │   ├── roster.ts
│   │   └── config.ts
│   ├── data/
│   │   └── othion-locations.ts
│   └── types/
│       └── index.ts
├── supabase/migrations/
│   ├── 20250313000000_campaigns_and_members.sql
│   └── 20250313100000_campaign_content_live.sql
├── public/
│   └── ilustrations/         # Obrázky, logo, wallpapery
├── Pravidla/                 # PDF pravidlá DH-LITE
├── package.json
├── next.config.ts
└── vercel.json
```

---

## 4. Autentifikácia a routing

### Middleware (`src/middleware.ts`)

- Ak nie je Supabase nakonfigurovaný → všetko povolené (lokálny vývoj)
- Neprihlásený na `/app` → redirect na `/` (login)
- Neprihlásený na iné chránené routy → redirect na `/` s `?next=`
- Prihlásený na `/` → redirect na `/app`
- Prihlásený na `/auth/login` → redirect na `/app`

### Auth flow

- **Login:** Google OAuth cez Supabase
- **Callback:** `/auth/callback` → upsert profil → redirect na `/app`
- **Odhlásenie:** `supabase.auth.signOut()` + reload

---

## 5. Dátové modely (types/index.ts)

### Campaign

```ts
{ id, name, description, rulesetId, memorySummary?, houseRules?, rulesPackText?, passwordHash?, passwordSalt?, createdAt, updatedAt }
```

### Session

```ts
{ id, campaignId, title, summary, date, order, createdAt }
```

### Character

```ts
{ id, campaignId, name, race, class, specialization?, gender?, level, hp?, maxHp?, xp?, stats, statuses?, injuries?, inventory?, notes, isNPC, portraitUrl?, createdAt, updatedAt }
```

### NarrationEntry

```ts
{ id, campaignId, mode: "mock"|"ai", userInput, narrationText, suggestedActions, consequences?, createdAt }
```

### NarrationConsequences

```ts
{ eventSummary, deltas: CharacterDelta[], lootFound?, combatLog?, updatedCampaignSummary? }
```

### CampaignState

```ts
{ id, campaignId, location?, scene?, party?, npcs?, threads?, flags?, tone?, lastBeats?, lastPhrases?, createdAt, updatedAt }
```

### Roster

- Postavy s `campaignId === "__roster__"` patria do osobného rosteru (nie do konkrétnej kampaně)
- Roster slúži ako „galéria“ postáv, ktoré môže hráč pridávať do kampaní

---

## 6. Storage vrstva

### localStorage (aktuálne aktívne)

- **Klúč:** `rpg-narrator-data` alebo `rpg-narrator-data:{userId}`
- **Repozitáre:** `campaignRepo`, `sessionRepo`, `characterRepo`, `memoryRepo`, `narrationRepo`, `campaignStateRepo`
- **Schéma:** `StorageSchema` s verziou (CURRENT_SCHEMA_VERSION = 4)
- **Migrácie:** v1→v2 (narrations), v2→v3 (memorySummary, houseRules), v3→v4 (campaignStates)

### Supabase

**Kampaně a členstvo** (`supabase-campaigns.ts`):

- `getMyCampaigns(userId)` — kampaně, kde je používateľ členom
- `createCampaign(userId, { name, description?, ... })` — vytvorí kampaň + owner v `campaign_members`
- `joinCampaign(userId, campaignId)` — volá `join_campaign(uuid)` v DB
- `getCampaignById(campaignId)` — detail kampaně (ak je členom)

**Živý obsah kampaně** (`campaign-content-live.ts`):

- `fetchNarrations`, `insertNarration`
- `fetchCharacters`, `insertCharacter`, `updateCharacter`, `deleteCharacter`
- `fetchSessions`, `insertSession`
- `isCampaignMember(campaignId, userId)`
- **Realtime:** tabuľky `narrations`, `characters`, `sessions`, `campaign_states` sú v `supabase_realtime` publication

**Dôležité:** Narrate stránka momentálne používa **iba localStorage**. `campaign-content-live` a Realtime **nie sú integrované** do narrate flow.

---

## 7. Supabase migrácie

### 20250313000000_campaigns_and_members.sql

- `campaigns` — id, name, description, ruleset_id, memory_summary, house_rules, rules_pack_text, password_hash, password_salt, created_by, created_at, updated_at
- `campaign_members` — campaign_id, user_id, role (owner|member)
- RLS pre campaigns a campaign_members
- Funkcia `join_campaign(p_campaign_id uuid)` — security definer, vracia JSON

### 20250313100000_campaign_content_live.sql

- `narrations` — campaign_id, mode, user_input, narration_text, suggested_actions, consequences, created_at
- `characters` — campaign_id, name, race, class, level, hp, max_hp, stats, statuses, injuries, inventory, notes, is_npc, portrait_url, ...
- `sessions` — campaign_id, title, summary, date, order
- `campaign_states` — campaign_id, location, scene, party, npcs, threads, flags, tone, last_beats, last_phrases
- `memory_entries` — campaign_id, session_id, type, title, content, tags
- RLS pre všetky tabuľky — len členovia kampaně môžu čítať/písať
- Realtime publication pre narrations, characters, sessions, campaign_states

### schema-profiles.sql (manuálne v SQL Editore)

- `profiles` — id, display_name, avatar_url, email, last_seen_at
- Trigger `handle_new_user` na auth.users
- RLS pre profiles

---

## 8. API routes

| Endpoint | Metóda | Popis |
|----------|--------|------|
| `/api/narrate` | POST | AI narrácia — prijíma prompt, campaignId, characters, memorySummary, rulesPackText, recentEntries |
| `/api/tts` | POST | OpenAI TTS — prečíta text hlasom (marin, cedar, onyx, ...) |
| `/api/generate-portrait` | POST | DALL·E 3 — generuje portrét postavy |
| `/api/characters` | GET | Zoznam postáv (owner=me) |
| `/api/profile` | GET/POST | Profil používateľa (upsert) |
| `/api/profiles` | GET | (alternatíva) |
| `/api/hall-of-fame` | GET | Zoznam profilov + postavy pre Síň slávy (503 ak nie je Supabase) |

---

## 9. AI Narrator

### Provider pattern

- `LocalProvider` — mock odpoveď (fallback)
- `OpenAIProvider` — GPT-4o, štruktúrovaný JSON výstup

### Výstup AI (JSON)

```ts
{
  narrationText: string,
  suggestedActions: string[],
  updatedMemorySummary: string,
  consequences: {
    eventSummary: string,
    deltas: CharacterDelta[],
    lootFound?: string[],
    combatLog?: string
  } | null,
  mapLocation: { map, locationId, locationName },
  mapMarkers: MapMarkerData[]
}
```

### Kontext pre AI (openai-provider.ts)

- Počet a mená postáv
- Atribúty, HP, XP, inventár, stavy, zranenia
- Pravidlá DH-LITE (rasy, povolania, schopnosti)
- Mapa světa Othion (lokácie)
- Pokyny pre boj, dropy, stavy, zranenia

---

## 10. Hlavné stránky a funkcie

### Dashboard (`/app`)

- Rotujúce wallpapery
- Karty: Kampaně, Pravidla, Postavy, Síň slávy
- Aktívne kampaně (z localStorage) — max 3, odkaz na všetky

### Kampaně (`/app/campaigns`)

- Zoznam kampaní zo Supabase (`getMyCampaigns`)
- Vytvorenie kampaně (názov, popis)
- Připojení ke kampani (UUID kód)
- Editácia existujúcich kampaní

### Narrate (`/app/campaigns/[id]/narrate`)

- **Režim:** local (mock) / ai
- Vstup: textové pole + hlasový vstup (Web Speech API)
- Výstup: narrácia, suggested actions, mapa, combat
- **Postavy:** načítané z localStorage, deltas z consequences sa aplikujú lokálne
- **Loot:** drag & drop do inventára postavy
- **Mapa:** GameMap s Othion lokáciami, mapMarkers
- **Combat:** CombatMap (mřížková mapa)
- **DiceRoller:** hod k20, k6, atď.
- **TalkingNarrator:** TTS prehrávanie (OpenAI TTS)
- **Jazyk TTS:** cs-CZ, sk-SK, en-US

### Postavy

- **Roster** (`/app/characters`): osobné postavy, ClassSelector, DHCharacterSheet
- **Kampaň** (`/app/campaigns/[id]/characters`): postavy v kampani, pridanie z rosteru
- **ClassSelector:** 6 povolaní (Válečník, Kouzelník, Hraničář, Alchymista, Zloděj, Klerik), hover popis
- **DHCharacterSheet:** tvorba postavy (ručná/náhodná), atribúty, AI portrét (DALL·E 3)
- **SpecializationModal:** specializácie od level 3 (Berserk, Paladin, Druid, ...)
- **LevelUpModal:** +1k6 HP, +1 atribút

### Profil (`/app/profile`)

- Avatar, display name, email
- Moje kampaně (zo Supabase)
- Moje postavy (API + localStorage roster merge)
- Odkaz na Síň slávy

### Síň slávy (`/app/sien-slavy`)

- Všetci hráči s profilom + ich postavy
- API `/api/hall-of-fame`

### Rules (`/app/rules`)

- Placeholder sekcie (Tvorba postavy, Boj a souboj, Mágia, Vybavení, Bestiář, Pravidla pro PJ)
- Právní poznámka — parafrázované zhrnutia

### Log (`/app/campaigns/[id]/log`)

- História narrácií z localStorage
- Rozbaliteľné položky s consequences

### Sessions (`/app/campaigns/[id]/sessions`)

- Zoznam sezení (placeholder / plánované)

### Settings (`/app/campaigns/[id]/settings`)

- House rules, rules pack text
- Placeholder pre bojové pravidlá

---

## 11. Design systém (globals.css)

- **Farby:** --bg-deep, --bg-main, --bg-panel, --bg-card, --text-primary, --text-muted, --accent-gold, --border-default
- **Triedy:** .dh-input, .dh-btn-primary, .dh-card
- **Font:** Georgia, serif
- **Téma:** medieval cozy — drevo, kov, pergamen, mosadz

---

## 12. DH-LITE špecifické

### Povolania (6)

Válečník, Kouzelník, Hraničář, Alchymista, Zloděj, Klerik

### Rasy

Člověk, Trpaslík, Elf, Barbar, Obr, Gnóm, Půlčík

### Atribúty

sila, obratnost, odolnost, inteligence, charisma

### Specializácie (dh-progressions.ts)

- Válečník: Berserk (3), Paladin (4)
- Hraničář: Druid (3), Łucznik (4)
- Alchymista: Toxik (3), Vynálezce (4)
- Kouzelník: Čaroděj (3), ...
- Zloděj: ...
- Klerik: ...

### Mapa Othion (othion-locations.ts)

- world: othion_hlavni_mesto, othion_les, othion_vesnice, ...
- ihienburgh: ihienburgh_mesto, ihienburgh_okoli, ...

---

## 13. Zvyšujúce sa úlohy / známe stavy

### Živá party room (NIE JE INTEGROVANÉ)

- Migrácia `campaign_content_live` existuje
- `campaign-content-live.ts` má plný CRUD + `isCampaignMember`
- **Chýba:** Narrate stránka nepoužíva Supabase pre narrácie/postavy
- **Potrebné:** V narrate stránke overiť `isCampaignMember`, pri členstve použiť `insertNarration` a načítavať/ukladať postavy cez campaign-content-live namiesto localStorage

### OAuth redirect

- Po prihlásení cez Google redirect ide na `window.location.origin` — na Vercel treba nastaviť v Supabase Dashboard správne redirect URL (napr. `https://xxx.vercel.app/auth/callback`)

### Roster vs Supabase characters

- Roster je v localStorage
- API `/api/characters` vracia postavy z Supabase (ak existujú)
- Profil merguje obe zdroje
- V kampani sa postavy pridávajú z rosteru (localStorage) — nie zo Supabase characters tabuľky kampaně

### Pravidlá DH-LITE

- `Pravidla/DH-LITE.pdf` — zdroj
- `dh-rules.ts`, `dh-progressions.ts` — čiastočná integrácia
- Rules stránka je placeholder, plná integrácia pravidiel nie je

---

## 14. Súbory na pozornosť

| Súbor | Účel |
|-------|------|
| `src/lib/storage/index.ts` | Exportuje localStorage repo (nie Supabase) |
| `src/lib/campaigns/index.ts` | Exportuje supabase-campaigns, hasSupabase() |
| `src/lib/campaigns/campaign-content-live.ts` | Supabase CRUD pre narrácie, postavy, sessions — nepoužíva sa v narrate |
| `src/app/(main)/app/campaigns/[id]/narrate/page.tsx` | Hlavná narrate logika — všetko cez campaignRepo, narrationRepo, characterRepo (localStorage) |
| `src/middleware.ts` | Auth redirecty |
| `src/lib/ai/openai-provider.ts` | Kontext a prompt pre AI |
| `src/types/index.ts` | Všetky typy |

---

## 15. Deployment (Vercel)

- Root directory: koreň projektu (nie rpg-narrator — štruktúra je plochá)
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NARRATOR_AI_API_KEY`
- Supabase: v SQL Editore spustiť migrácie + schema-profiles.sql
- OAuth: v Supabase Auth nastaviť redirect URL na Vercel doménu

---

*Sumár vygenerovaný pre kontext AI. Posledná aktualizácia: marec 2025.*

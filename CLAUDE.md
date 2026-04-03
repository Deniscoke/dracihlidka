# Dračí Hlídka — Developer & AI Collaboration Guide

## Project Overview

Next.js 16 App Router + Supabase + OpenAI application. Czech-language AI-powered RPG narrator for the DH-LITE tabletop system.

**Stack:** TypeScript strict, React 19, Tailwind 4, Supabase (PostgreSQL + RLS + Realtime), OpenAI GPT-4o / DALL-E 3 / TTS

---

## Architecture

### Storage — Two Sources of Truth

The app operates in two modes depending on env vars:

| Mode | Condition | Storage |
|------|-----------|---------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | PostgreSQL via Supabase RLS |
| **Local** | Env vars absent | `localStorage` (`rpg-narrator-data:<userId>`) |

**Critical:** Never mix the two. Each component checks `SB_AVAILABLE` at the top of the file.

- Supabase client (browser): `src/lib/supabase/client.ts`
- Supabase client (server/SSR): `src/lib/supabase/server.ts`
- LocalStorage repos: `src/lib/storage/local-storage.ts` (schema v4)
- Live Supabase CRUD (campaign content): `src/lib/campaigns/campaign-content-live.ts`

### AI Provider Pattern

All AI narration goes through a common interface:

```
NarrationProvider (src/lib/ai/provider.ts)
  ├── OpenAIProvider  → GPT-4o with structured JSON output
  └── LocalProvider   → Mock responses for local dev
```

The active provider is selected in `POST /api/narrate` based on `mode` param and `NARRATOR_AI_API_KEY`.

### Route Structure

```
src/app/
  (auth)/auth/        ← login, callback, error pages
  (main)/app/         ← all authenticated app pages
    campaigns/[id]/
      narrate/page.tsx   ← 1200+ line main game screen (client component)
      characters/        ← character management
      log/               ← narration history
      sessions/          ← session notes
      settings/          ← campaign config
  api/
    narrate/           ← GPT-4o narration (auth + rate-limited)
    tts/               ← OpenAI TTS (auth + rate-limited)
    generate-portrait/ ← DALL-E 3 (auth + rate-limited)
    campaigns/join/    ← SECURE join with password verification
    characters/        ← character CRUD with MAX_CHARACTERS=5 limit
```

---

## Security Boundaries

### Passwords on Campaigns are UI Locks Only

`campaign.password_hash` is NOT a security control. The Supabase RLS policy
`"Owners can add members"` allows any authenticated user to add themselves to
any campaign. The password is purely a UX deterrent for casual join-guessing.

**Do NOT add client-side bypass logic** — the join password check MUST go
through `POST /api/campaigns/join` (server route with PBKDF2 verification).

### Dangerous Functions — Removed

`joinCampaign()` and `joinCampaignByCode()` were removed from
`src/lib/campaigns/supabase-campaigns.ts` because they inserted `campaign_members`
rows without verifying the campaign password. Always use `POST /api/campaigns/join`.

### Auth Guards on All AI Endpoints

All three expensive endpoints check auth before spending API credits:
- `POST /api/narrate` — Supabase auth + campaign membership + **10 req/min** rate limit
- `POST /api/tts` — Supabase auth + **20 req/min** rate limit
- `POST /api/generate-portrait` — Supabase auth + **5 req/min** rate limit

Rate limiting is in-memory (`src/lib/rate-limit.ts`). Effective per process; not
guaranteed across Vercel serverless instances.

### Never Expose Password Fields in SELECT

`fetchCampaign()` in `campaign-content-live.ts` explicitly excludes `password_hash`
and `password_salt` from its SELECT. Do not add them back. `getMyCampaigns()` in
`supabase-campaigns.ts` may read them but must only expose `hasPassword: boolean`.

---

## AI Output — Validation Chain

AI consequences (CharacterDelta) are sanitized at two levels:

1. **`sanitizeConsequences()` in `openai-provider.ts`** — type checks, numeric bounds
   (`xpDelta` clamped to ±500, `hpDelta` to ±100), string array length limits (10 items, 100 chars each)
2. **`applyCharacterDeltas()` in `narrate/page.tsx`** — fetches fresh characters from
   Supabase before applying to avoid stale-closure race conditions; HP clamped against `maxHp`

---

## Input Validation Limits (`/api/narrate`)

| Field | Limit |
|-------|-------|
| `prompt` | 2000 chars |
| `campaignTitle` | 200 chars |
| `campaignDescription` | 1000 chars |
| `memorySummary` | 4000 chars |
| `houseRules` | 3000 chars |
| `rulesPackText` | 6000 chars |
| `diceRolls` | 5 entries max |
| `campaignId` | UUID v4 format required |

---

## Dead Code — Do Not Resurrect

These files were deleted (had zero imports, conflicting types):
- `src/lib/db/repo.ts` — old generic repo (replaced by storage/local-storage.ts)
- `src/lib/db/supabase.ts` — used wrong non-NEXT_PUBLIC_ env vars
- `src/lib/db/types.ts` — stale NarrationEntry with wrong column names
- `src/lib/narrator/index.ts` — different interface, not used anywhere

The `rpg-narrator/` directory is excluded from TypeScript compilation via `tsconfig.json`.

---

## Hall of Fame Known Limitation

`GET /api/hall-of-fame` uses the anon Supabase key with no user session context.
The `characters` table RLS requires campaign membership, so characters queries
return empty. Fixing this requires either a `service_role` key (security risk) or
a new RLS policy granting public read on non-sensitive character columns.

---

## Testing

```bash
npm test          # run all tests once (vitest run)
npm run test:watch  # watch mode
```

Tests live in `src/lib/__tests__/`. Currently covers:
- `narrate-validation.test.ts` — validateDiceRolls (dice sequence rules), validateNarrateBody (required fields, UUID format, length limits)
- `rate-limit.test.ts` — checkRateLimit (window reset, counter isolation, retryAfter)
- `password.test.ts` — hashPassword/verifyPassword round-trip, wrong password rejection, unicode

Tests use Vitest with Node environment (no DOM, no Supabase mock needed).

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
NARRATOR_AI_API_KEY=              # OpenAI key for narrate + TTS + portrait
NARRATOR_AI_MODEL=gpt-4o          # optional, defaults to gpt-4o
```

App runs on port 3001 in dev (`npm run dev`).

---

## Supabase Migrations

Migration files live in `supabase/migrations/`. Always apply via Supabase CLI or the
MCP Supabase tool — never hand-edit production tables. Key migration:
`20250313000000_campaigns_and_members.sql` defines RLS policies.

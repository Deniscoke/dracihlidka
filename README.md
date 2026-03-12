# Dračí Hlídka — RPG Narrator Engine

RPG engine pre Dračí Hlídku s AI narrátorom, správou kampaní a postáv.

## Štruktúra

- `rpg-narrator/` — Next.js aplikácia
- `Pravidla/` — PDF pravidlá DH-LITE

## Lokálny vývoj

```bash
npm install
npm run dev
```

Aplikácia beží na http://localhost:3001

## Deployment na Vercel

1. Push na GitHub
2. Import projektu vo Vercel
3. **Root Directory:** nastav na `rpg-narrator`
4. **Environment Variables:** pridaj `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

## Potrebné env premenné

- `NEXT_PUBLIC_SUPABASE_URL` — URL Supabase projektu
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key z Supabase
- `NARRATOR_AI_API_KEY` — OpenAI API kľúč (pre AI narrátora)

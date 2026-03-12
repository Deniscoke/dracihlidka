# Google prihlásenie — krok za krokom

Tento návod nastaví prihlásenie cez Google v aplikácii Dračí Hlídka pomocou Supabase.

---

## Krok 1: Vytvor Supabase projekt

1. Choď na [supabase.com](https://supabase.com) a prihlás sa.
2. Klikni **New Project**.
3. Vyplň názov (napr. `draci-hlidka`), heslo databázy a región.
4. Po vytvorení otvor **Project Settings** → **API** a skopíruj:
   - **Project URL** (napr. `https://xxxxx.supabase.co`)
   - **anon public** kľúč (v sekcii Project API keys)

---

## Krok 2: Zapni Google provider v Supabase

1. V Supabase Dashboard: **Authentication** → **Providers**.
2. Nájdi **Google** a zapni ho.
3. Zostaneš potrebovať **Client ID** a **Client Secret** z Google Cloud — vráť sa sem po Kroku 3.

---

## Krok 3: Vytvor Google OAuth aplikáciu

1. Choď na [Google Cloud Console](https://console.cloud.google.com/).
2. Vytvor nový projekt alebo vyber existujúci.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Ak sa pýta na OAuth consent screen:
   - **User Type**: External (pre verejné prihlásenie).
   - Vyplň názov aplikácie, e‑mail podpory.
   - V **Scopes** pridaj: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
5. Pri vytváraní OAuth client ID:
   - **Application type**: Web application.
   - **Authorized JavaScript origins**:
     - `http://localhost:3001` (lokálny vývoj)
     - `https://tvoja-domena.sk` (produkcia)
   - **Authorized redirect URIs**:
     - `https://TVOJ_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     - Nájdeš ho v Supabase: **Authentication** → **URL Configuration** → **Redirect URLs** (Supabase ti ukáže svoj callback URL).
6. Skopíruj **Client ID** a **Client Secret**.

---

## Krok 4: Doplň Google údaje do Supabase

1. Späť v Supabase: **Authentication** → **Providers** → **Google**.
2. Vlož **Client ID** a **Client Secret** z Google Cloud.
3. Ulož.

---

## Krok 5: Nastav Redirect URLs v Supabase

1. **Authentication** → **URL Configuration**.
2. **Site URL**: `http://localhost:3001` (pre vývoj) alebo `https://tvoja-domena.sk` (pre produkciu).
3. **Redirect URLs** — pridaj:
   - `http://localhost:3001/auth/callback`
   - `https://tvoja-domena.sk/auth/callback` (pre produkciu)

---

## Krok 6: Vytvor `.env.local` v projekte

V priečinku `rpg-narrator` vytvor súbor `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_anon_key
```

Hodnoty získaš z Supabase **Project Settings** → **API**.

---

## Krok 7: Reštartuj dev server

```powershell
cd C:\Users\Admin\Desktop\DraciHlidka
npm run dev
```

Otvor `http://localhost:3001` a v hlavičke klikni **Prihlásiť sa**.

---

## Rýchla kontrola

| Čo skontrolovať | Kde |
|-----------------|-----|
| Supabase URL a anon key | `.env.local` |
| Google Client ID + Secret | Supabase → Auth → Providers → Google |
| Redirect URI v Google | `https://xxx.supabase.co/auth/v1/callback` |
| Site URL v Supabase | `http://localhost:3001` |
| Redirect URLs v Supabase | `http://localhost:3001/auth/callback` |

---

## Bežné chyby

- **"redirect_uri_mismatch"** — redirect URI v Google Cloud sa musí presne zhodovať s tým, čo Supabase vracia (pozri Krok 3).
- **"Supabase nie je nakonfigurovaný"** — chýba `.env.local` alebo reštart servera po jeho vytvorení.
- **Prihlásenie funguje, ale údaje sa nestrácajú** — kampane sú uložené v `localStorage` pod kľúčom `rpg-narrator-data:USER_ID`. Pri prihlásení sa používa Supabase user ID.

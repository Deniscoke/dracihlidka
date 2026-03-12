# Profily a Sieň slávy — nastavenie

Tento návod rozširuje Google prihlásenie o profily hráčov, priradenie postáv k účtom a sieň slávy.

---

## Čo to pridáva

- **Profil** (`/profile`) — tvoj profil a zoznam tvojich postáv
- **Sieň slávy** (`/sien-slavy`) — všetci prihlásení hráči a ich postavy
- **Priradenie postáv** — keď vytvoríš postavu pri prihlásení, je priradená tvojmu účtu
- **Kampane** — (pripravené) budú zdieľané medzi všetkými hráčmi

---

## Krok 1: Spusti migráciu v Supabase

1. Otvor Supabase Dashboard → **SQL Editor**.
2. Najprv spusti `supabase-schema.sql` (ak ešte nebol).
3. Potom spusti `src/lib/db/schema-profiles.sql`:

```sql
-- Skopíruj obsah súboru src/lib/db/schema-profiles.sql
```

Tým vytvoríš tabuľku `profiles` a pridáš stĺpce `created_by` (kampane) a `owner_id` (postavy).

---

## Krok 2: RLS politiky

Migrácia už obsahuje RLS politiky. Ak Supabase hlási chyby pri čítaní/zápise, skontroluj v **Authentication** → **Policies**, či sú vytvorené.

---

## Ako to funguje

| Akcia | Výsledok |
|-------|----------|
| Prihlásenie cez Google | Vytvorí sa / aktualizuje záznam v `profiles` |
| Vytvorenie postavy | Postava sa uloží do localStorage a synchronizuje do Supabase s `owner_id` |
| Profil | Zobrazí tvoje postavy z Supabase (kde `owner_id` = ty) |
| Sieň slávy | Zobrazí všetky profily a ich postavy |

---

## Fallback

Ak Supabase nie je nakonfigurovaný alebo tabuľka `profiles` neexistuje:

- Profil stránka zobrazí prázdny zoznam postáv
- Sieň slávy zobrazí informáciu o chýbajúcej konfigurácii
- Prihlásenie cez Google funguje ako predtým (localStorage)

---

## Poznámky

- **Kampane** sú zatiaľ v localStorage. Pre plné zdieľanie kampaní medzi hráčmi bude potrebná ďalšia migrácia a API.
- **Postavy** sa synchronizujú do Supabase pri vytvorení (ak si prihlásený). Existujúce postavy v localStorage sa tam nedostanú automaticky.

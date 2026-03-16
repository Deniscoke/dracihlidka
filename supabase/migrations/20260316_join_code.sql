-- ============================================================
-- Add join_code and is_public to campaigns
-- ============================================================

-- join_code: 6-character uppercase alphanumeric, auto-generated
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS join_code text;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Backfill existing rows
UPDATE campaigns
  SET join_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  WHERE join_code IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE campaigns
  ALTER COLUMN join_code SET NOT NULL;

-- Unique constraint
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_join_code_unique;
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_join_code_unique UNIQUE (join_code);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_campaigns_join_code ON campaigns(join_code);

-- Trigger: auto-generate join_code on new campaigns
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_code text;
  v_attempts int := 0;
BEGIN
  -- Loop to handle (extremely unlikely) collisions
  LOOP
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM campaigns WHERE join_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      -- Fallback: use 8 chars to reduce collision probability
      v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      EXIT;
    END IF;
  END LOOP;
  NEW.join_code := v_code;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaigns_join_code ON campaigns;
CREATE TRIGGER trg_campaigns_join_code
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  WHEN (NEW.join_code IS NULL)
  EXECUTE FUNCTION public.generate_join_code();

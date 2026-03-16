-- Compound index for fast event log retrieval
-- Covers: .eq("campaign_id", ...).eq("type", "event").order("created_at", { ascending: false })
CREATE INDEX IF NOT EXISTS idx_memory_entries_campaign_type_date
  ON memory_entries(campaign_id, type, created_at DESC);

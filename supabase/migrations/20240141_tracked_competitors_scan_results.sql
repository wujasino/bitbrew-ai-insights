-- Backs the real competitor scan (scan-competitor.js): the last actual
-- trust score measured for this competitor, when it was measured, and — if
-- the last attempt failed — why, so the UI can say what actually happened
-- instead of silently showing a stale or missing number.
alter table tracked_competitors
  add column if not exists last_score integer,
  add column if not exists last_scanned_at timestamptz,
  add column if not exists last_scan_error text;

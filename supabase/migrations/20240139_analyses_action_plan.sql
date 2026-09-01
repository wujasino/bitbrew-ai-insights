-- Caches the AI-generated remediation checklist (generate-action-plan.js)
-- on the analysis it was generated for, so re-opening a low-score result
-- doesn't re-trigger a Claude call. Same pattern as audit_summary
-- (20240122) — nullable jsonb, no NOT NULL/default, generated lazily only
-- when a user actually views a low-scoring result.
alter table analyses add column if not exists action_plan jsonb;

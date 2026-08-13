-- Cached AI-generated narrative for the presentation-ready audit report
-- (see /audit/:id and generate-audit-summary.js). Generated once per
-- analysis and cached here so re-opening the report doesn't re-call the
-- LLM. Shape: { headline, businessImpact, narrative, competitivePosition,
-- recommendations: [{ title, description, priority }] }.
alter table analyses add column if not exists audit_summary jsonb;

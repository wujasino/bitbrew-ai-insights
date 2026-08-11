-- The "By AI model" widget on Home (src/components/home/HomeHub.tsx) was
-- fabricating per-model confidence numbers — cycling the 5 aggregate
-- dimension scores (authority/accuracy/mentions) across whichever models
-- happened to be unlocked, with no relation to what each model actually
-- said. The real per-model data (model, sentiment, association,
-- confidence) is already returned by runBrandScan() on every scan
-- (netlify/functions/_lib/runScan.js) but was never persisted — only the
-- 6 aggregate fields were saved, so it was lost as soon as the user left
-- the page. This column lets both the manual scan (useBrewing.ts) and the
-- scheduled re-scan (check-score-alerts.js) save it, so Home can show the
-- real thing instead of inventing one.

alter table analyses add column if not exists sources jsonb;

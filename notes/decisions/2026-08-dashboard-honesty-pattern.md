# The results-screen "honesty pattern" — AVE, source ID, gap analysis, hallucination alerts

Four features added to the results screen (`src/pages/Dashboard.tsx`), all built
around the same constraint that keeps recurring in this codebase: **never fabricate
a number or claim and present it as real**, even when a feature "should" have one.

- **AVE** (`AveEstimate.tsx`) — advertising value equivalent. No invented
  industry-average $/mention rate; the reader types their own assumption
  (persisted in localStorage), with an explicit caveat citing AMEC's Barcelona
  Principles (the real PR-industry standard that explicitly advises against using
  AVE as a success metric in the first place).
- **SourceIdentification** — deliberately does *not* claim to identify real
  citations/training sources. No model queried here exposes real citations for a
  plain chat-completion answer. What the data *can* honestly support: which of the
  6 models answered, and whether they answered with real signal (confidence ≥ 50)
  or were visibly guessing (confidence < 50).
- **VisibilityGapAnalysis** — same five real dimension scores `ResultsBreakdown`
  already shows, just read as a quantified point-distance to a 90% "Strong"
  benchmark instead of a plain-English recommendation. No new data invented.
- **HallucinationAlerts** — explicitly *not* a fact-check against ground truth
  (the scan has no source to verify against). Flags what the data itself can
  honestly support: a weak/critical `accuracy` band, or literal hedging language
  a model used in its own words ("I don't have specific information about...").

**Why this matters as a standing pattern:** this is the same discipline applied
throughout the session to marketing copy too (no fake usage-count stats, no
fabricated case studies, no invented industry benchmarks in the Agencies page ROI
calculator — see `AgencyRoiCalculator.tsx`'s own comment). The rule generalizes:
when a feature "needs" a number that doesn't actually exist in the data, either
let the user supply their own assumption, or narrow the claim to what the data
genuinely supports — never synthesize a plausible-looking number and present it
as fact.

**Performance note:** all five cards (AVE + these four) were later lazy-loaded as
a group in `Dashboard.tsx` — they're below-the-fold, none needed for first paint,
and splitting them out dropped the Dashboard chunk by ~13KB raw.

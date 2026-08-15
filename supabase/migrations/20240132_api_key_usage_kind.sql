-- Lets the per-key rate limit (_lib/apiKeyAuth.js checkRateLimitAndLog) count
-- POST /analyze and GET /analyses separately instead of one shared bucket —
-- otherwise hammering the read endpoint would burn through the scan
-- endpoint's much lower limit too. Applied directly to the database
-- already; this brings migration history in sync.

ALTER TABLE public.api_key_usage ADD COLUMN IF NOT EXISTS kind text not null default 'analyze';

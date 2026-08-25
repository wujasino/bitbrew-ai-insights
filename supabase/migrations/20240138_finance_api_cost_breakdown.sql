-- Itemized monthly cost per paid third-party API the app actually calls a
-- key for (as opposed to the single lump `monthly_fixed_costs` number),
-- so the tax/financial report can show where the fixed costs come from
-- instead of one opaque total.
--
-- Every value defaults to 0 — real prices aren't something to guess at in a
-- migration; an admin fills them in from each provider's own billing page.
-- Keys match the paid services this codebase actually holds an API key for:
-- OpenRouter (runScan.js), Anthropic (fallback scans + audit summaries +
-- chat), Voyage AI (Brand Knowledge embeddings), ElevenLabs (TTS), Resend
-- (transactional email) and Mailchimp (newsletter list). reCAPTCHA and
-- Google OAuth are free tiers and intentionally left out.

alter table public.company_finance_settings
  add column if not exists api_costs jsonb not null default '{
    "openrouter": 0,
    "anthropic": 0,
    "voyage": 0,
    "elevenlabs": 0,
    "resend": 0,
    "mailchimp": 0
  }'::jsonb;

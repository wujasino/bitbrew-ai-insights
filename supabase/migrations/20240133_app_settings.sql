-- Runtime feature flags, toggleable from the admin panel without a redeploy.
--
-- First use: `scanning_enabled`. When OpenRouter can't serve requests (no
-- credits, revoked key, provider outage) every scan fails, and the user gets
-- a generic "Analysis failed" error. Flipping this off instead makes the app
-- say so honestly and stops spending guest-limit allowance / API budget on
-- calls that are guaranteed to fail.
--
-- RLS is on with NO policies on purpose: nothing reaches this table with an
-- anon/authenticated JWT. Reads happen in service-role Netlify Functions
-- (analyze.js, api-analyze.js, check-score-alerts.js) and writes only via
-- toggle-scanning.js, which verifies profiles.is_admin first.

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

-- Default: scanning on, so an existing deployment behaves exactly as before
-- until an admin deliberately turns it off.
insert into public.app_settings (key, value)
values ('scanning_enabled', 'true'::jsonb)
on conflict (key) do nothing;

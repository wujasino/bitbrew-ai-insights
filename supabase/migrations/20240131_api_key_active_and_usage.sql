-- Supports the "Edit / Activity / Disable" menu on each API key row
-- (Developers.tsx): `active` lets a key be paused and re-enabled without
-- the permanent revoke (revoked_at) the trash icon already does, and
-- api_key_usage gives the "Activity" panel something real to show —
-- logged once per successful verifyApiKey() call in _lib/apiKeyAuth.js.
-- Applied directly to the database already; this brings migration
-- history in sync.

ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS active boolean not null default true;

CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id         uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS api_key_usage_api_key_id_created_at_idx ON public.api_key_usage(api_key_id, created_at desc);

alter table public.api_key_usage enable row level security;
drop policy if exists "User can view their own api key usage" on public.api_key_usage;
create policy "User can view their own api key usage" on public.api_key_usage
  for select to authenticated using (user_id = auth.uid());

-- Real backend for the API keys / webhooks UI (Developers.tsx), which was
-- previously a localStorage-only mockup (see the 20240128-era "Preview"
-- banners added to Developers.tsx / ApiDocs.tsx). This is the storage layer;
-- generation, revocation, and delivery all happen through service-role
-- Netlify functions — no insert/update/delete RLS policy exists for regular
-- users on any of these tables, mirroring how recovery_codes/notifications
-- already work in this app. Applied directly to the database already; this
-- brings migration history in sync.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  -- First few chars of the real secret, shown in the UI so a user can tell
  -- keys apart without ever seeing the full secret again after creation.
  prefix       text not null,
  -- SHA-256 of the full secret — the plaintext is returned once at creation
  -- and never stored, same pattern as recovery_codes.code_hash.
  key_hash     text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_hash_idx ON public.api_keys(key_hash);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  url        text not null,
  events     text[] not null default '{}',
  active     boolean not null default true,
  -- Unlike api_keys, this has to be retrievable in plaintext — the user
  -- needs it every time to verify the HMAC signature on an incoming
  -- delivery, not just to prove possession once like a bearer token.
  secret     text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS webhooks_user_id_idx ON public.webhooks(user_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id           uuid primary key default gen_random_uuid(),
  webhook_id   uuid not null references public.webhooks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  event        text not null,
  status_code  integer,
  ok           boolean not null default false,
  error        text,
  created_at   timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_id_created_at_idx ON public.webhook_deliveries(webhook_id, created_at desc);

alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

drop policy if exists "User can view their own api keys" on public.api_keys;
create policy "User can view their own api keys" on public.api_keys
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "User can view their own webhooks" on public.webhooks;
create policy "User can view their own webhooks" on public.webhooks
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "User can view their own webhook deliveries" on public.webhook_deliveries;
create policy "User can view their own webhook deliveries" on public.webhook_deliveries
  for select to authenticated using (user_id = auth.uid());

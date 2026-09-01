-- Backs admin-grant-temp-access.js: lets an admin grant an account a plan
-- for a fixed window (e.g. a 14-day Business trial for a prospect), then
-- have it automatically revert once expired (expire-temp-access.js, run
-- hourly). One active grant per user — re-granting before expiry extends
-- it rather than creating a second row, and previous_plan is only ever
-- set once (the plan before ANY temporary grant), so two grants in a row
-- can't lose track of what to revert to.
create table if not exists temporary_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  granted_plan text not null,
  previous_plan text not null,
  expires_at timestamptz not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists temporary_access_grants_expires_at_idx
  on temporary_access_grants (expires_at);

-- Service-role only, same pattern as app_settings (migration 20240133) —
-- RLS on with no policies at all, so it's unreachable with an anon/
-- authenticated JWT; only the two Functions above touch it.
alter table temporary_access_grants enable row level security;

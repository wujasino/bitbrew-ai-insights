-- Backs the /competitor-tracker page: lets a user record which named
-- competitors AI models should be checked against for one of their tracked
-- brands. Percentages shown in the UI are computed client-side by counting
-- literal (case-insensitive) mentions of competitor_name inside that
-- brand's own analyses.sources[].association text — real, already-stored
-- model output, never a fabricated figure.
create table if not exists tracked_competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Matches brandKey() in src/lib/analyses.ts (protocol/www/path/TLD
  -- stripped) so "presora", "Presora.app" and "https://www.presora.app/"
  -- share one competitor list instead of three.
  brand_key text not null,
  competitor_name text not null check (char_length(competitor_name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, brand_key, competitor_name)
);

create index if not exists tracked_competitors_user_brand_idx
  on tracked_competitors (user_id, brand_key);

alter table tracked_competitors enable row level security;

create policy "Users manage their own tracked competitors"
  on tracked_competitors
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

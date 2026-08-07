-- notifications: in-app alerts, written by netlify/functions/check-score-alerts.js
-- (the scheduled function) via the service role. The bell in AppNavbar
-- (avatar-notifications.tsx) reads this directly.
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  type        text        not null default 'score_alert' check (type in ('score_alert')),
  title       text        not null,
  body        text        not null,
  brand_name  text,
  metric      text        check (metric in ('sentiment', 'visibility', 'mentions')),
  data        jsonb
);

create index if not exists notifications_user_id_created_at_idx
  on notifications(user_id, created_at desc);

-- Only the owning user can read/update (mark read) their own notifications.
-- Inserts only ever happen via the service-role client in
-- check-score-alerts.js, so no insert policy is needed for regular users.
alter table notifications enable row level security;

create policy "User can view their own notifications" on notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "User can mark their own notifications read" on notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- check-score-alerts.js needs to know when each monitor was last checked to
-- respect brand_monitors.frequency (daily/weekly/monthly) — previously
-- nothing tracked this, so nothing could tell whether a monitor was "due".
alter table brand_monitors add column if not exists last_checked_at timestamptz;

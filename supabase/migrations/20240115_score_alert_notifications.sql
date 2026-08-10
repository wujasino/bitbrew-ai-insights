-- notifications: in-app alerts, written by netlify/functions/check-score-alerts.js
-- (the scheduled function) via the service role. The bell in AppNavbar
-- (avatar-notifications.tsx) reads this directly.
--
-- The `notifications` table itself is NOT created here — it already exists
-- (created manually in Supabase). Before running this, verify it has these
-- columns: id uuid pk, user_id uuid references auth.users(id), created_at
-- timestamptz, read_at timestamptz, type text, title text, body text,
-- brand_name text, metric text, data jsonb. This migration only adds the
-- index, RLS policies, and the brand_monitors column.

create index if not exists notifications_user_id_created_at_idx
  on notifications(user_id, created_at desc);

-- Only the owning user can read/update (mark read) their own notifications.
-- Inserts only ever happen via the service-role client in
-- check-score-alerts.js, so no insert policy is needed for regular users.
alter table notifications enable row level security;

drop policy if exists "User can view their own notifications" on notifications;
create policy "User can view their own notifications" on notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "User can mark their own notifications read" on notifications;
create policy "User can mark their own notifications read" on notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- check-score-alerts.js needs to know when each monitor was last checked to
-- respect brand_monitors.frequency (daily/weekly/monthly) — previously
-- nothing tracked this, so nothing could tell whether a monitor was "due".
alter table brand_monitors add column if not exists last_checked_at timestamptz;

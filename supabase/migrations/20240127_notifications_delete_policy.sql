-- Lets a user dismiss/delete their own notifications from the bell
-- (avatar-notifications.tsx) instead of only being able to mark them read.
-- Applied directly to the database already; this brings migration history
-- in sync.

drop policy if exists "User can delete their own notifications" on public.notifications;
create policy "User can delete their own notifications" on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- notifications_type_check only allowed the original 'score_alert' value
-- (from when check-score-alerts.js was the only writer to this table).
-- The new announcement broadcast (send-announcement.js / discord-announce.js
-- via _lib/broadcastAnnouncement.js) writes type: 'announcement', which the
-- constraint rejected outright — every send attempt failed with
-- "new row for relation "notifications" violates check constraint
-- "notifications_type_check"" and surfaced as a bare 500 to the caller.

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('score_alert', 'announcement'));

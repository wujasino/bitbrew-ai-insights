-- 20240124_announcement_notifications.sql added the 'announcement' notification
-- type (see broadcastAnnouncement.js, which inserts type: 'announcement') but
-- never widened notifications_type_check, which was still locked to
-- 'score_alert' from 20240115_score_alert_notifications.sql. Every announcement
-- broadcast was failing with "new row for relation notifications violates
-- check constraint notifications_type_check". Applied directly to the
-- database already — this migration just brings the repo history in sync.

ALTER TABLE public.notifications
  DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('score_alert', 'announcement'));

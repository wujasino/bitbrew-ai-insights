-- Lets a broadcast "announcement" notification (pricing changes, incidents,
-- policy updates) carry an expiry, so it drops out of the bell on its own
-- instead of sitting there forever once it's no longer relevant.
alter table public.notifications add column if not exists expires_at timestamptz;

-- Minimal admin flag so send-announcement.js (netlify function) can gate who
-- is allowed to broadcast to every user. No existing role/admin system to
-- hook into — this is deliberately just a boolean, not a full RBAC table,
-- since there's exactly one operator account.
alter table public.profiles add column if not exists is_admin boolean not null default false;

update public.profiles set is_admin = true where id = '6d18d50d-a81f-4bf7-8963-5bfef460a8bf';

-- protect_plan_changes() (20240104_security_hardening.sql) already stops a
-- signed-in user from setting their own `plan` column via the client
-- (profiles' UPDATE policy only checks auth.uid() = id, not which columns
-- changed). is_admin needs the exact same guard, or any user could run
-- supabase.from('profiles').update({ is_admin: true }) from the browser
-- console and grant themselves the ability to broadcast to every account.
CREATE OR REPLACE FUNCTION public.protect_plan_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.plan != OLD.plan AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change plan directly';
  END IF;
  IF NEW.is_admin != OLD.is_admin AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change admin status directly';
  END IF;
  RETURN NEW;
END;
$function$;

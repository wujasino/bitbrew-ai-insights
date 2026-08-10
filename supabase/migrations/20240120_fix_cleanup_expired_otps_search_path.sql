-- Found via Supabase security advisors: cleanup_expired_otps() had no
-- search_path set, unlike every other SECURITY DEFINER function in this
-- schema (e.g. register_otp_attempt already had SET search_path = public).
-- A mutable search_path on a SECURITY DEFINER function is a real, if
-- narrow, risk: it opens the door to search_path hijacking, where an
-- attacker-controlled schema earlier in the path could shadow the
-- unqualified objects the function body relies on.
--
-- CREATE OR REPLACE preserves ownership/grants, so this doesn't touch the
-- service_role-only EXECUTE lockdown from 20240118 — verified after
-- applying: proacl unchanged, proconfig now shows search_path=public.

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.password_reset_otps
  WHERE expires_at < now() - interval '10 minute';
END;
$function$;

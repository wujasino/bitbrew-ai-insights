-- CRITICAL FIX: no scan has been savable since migration 20240134.
--
-- protect_plan_changes() (BEFORE UPDATE on profiles, added in 20240134 to
-- close the credit/usage self-grant hole) blocks any change to
-- analyses_this_month/analyses_reset_at unless auth.role() = 'service_role'.
--
-- But enforce_analysis_limit() (BEFORE INSERT on analyses, pre-existing)
-- bumps that very counter on every successful scan:
--   UPDATE public.profiles SET analyses_this_month = analyses_this_month + 1
-- Despite being SECURITY DEFINER, this does NOT make auth.role() return
-- 'service_role' — auth.role() reads the request's JWT claim (a GUC set by
-- PostgREST for the whole request), which SECURITY DEFINER does not change.
-- It only changes which Postgres role executes the function body.
--
-- Net effect since 20240134: every authenticated user's scan insert into
-- `analyses` cascaded into this UPDATE, which protect_plan_changes()
-- rejected with `P0001: Cannot change usage counter directly`, aborting the
-- whole INSERT. analyze.js itself returned 200 (the scan ran fine) but the
-- browser's client-side insert of the result (useBrewing.ts) failed with a
-- generic 400 — so scans "worked" but nothing was ever saved: no new rows
-- in Reports, no id to open a report by, /audit/:id unreachable. This is
-- almost certainly why "audit nie działa" — there was nothing new to audit.
--
-- Fix: enforce_analysis_limit() sets a transaction-local GUC flag around
-- its own internal UPDATEs (the reset-to-0 on a new month, and the +1
-- bump). protect_plan_changes() allows analyses_this_month/
-- analyses_reset_at changes when that flag is set, in addition to
-- service_role. Scoped to only those two columns — plan/credits/is_admin/
-- custom_plan_price are untouched and still require service_role.
-- set_config(..., true) is transaction-local and cannot be set by a client
-- through the REST API (it isn't an exposed RPC), so this can't be abused
-- to fake the flag from outside.

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
  IF NEW.custom_plan_price_monthly IS DISTINCT FROM OLD.custom_plan_price_monthly AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change custom plan price directly';
  END IF;
  IF NEW.custom_plan_price_yearly IS DISTINCT FROM OLD.custom_plan_price_yearly AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change custom plan price directly';
  END IF;
  IF NEW.credits IS DISTINCT FROM OLD.credits AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change credits directly';
  END IF;
  -- Additionally allowed when enforce_analysis_limit() set the internal-write
  -- flag right before its own trusted increment/reset of this exact column.
  IF NEW.analyses_this_month IS DISTINCT FROM OLD.analyses_this_month
     AND auth.role() != 'service_role'
     AND coalesce(current_setting('presora.internal_usage_write', true), 'off') != 'on' THEN
    RAISE EXCEPTION 'Cannot change usage counter directly';
  END IF;
  IF NEW.analyses_reset_at IS DISTINCT FROM OLD.analyses_reset_at
     AND auth.role() != 'service_role'
     AND coalesce(current_setting('presora.internal_usage_write', true), 'off') != 'on' THEN
    RAISE EXCEPTION 'Cannot change usage reset date directly';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_analysis_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_plan      TEXT;
  analysis_count INT;
  plan_limit     INT;
  last_reset     TIMESTAMPTZ;
BEGIN
  SELECT plan, analyses_this_month, analyses_reset_at
  INTO user_plan, analysis_count, last_reset
  FROM public.profiles WHERE id = NEW.user_id;

  -- Scoped to this transaction only (set_config's third arg = true / "is
  -- local"); Postgres reverts it automatically at COMMIT or ROLLBACK, so
  -- there is nothing to reset by hand and no way it leaks into another
  -- request's transaction.
  PERFORM set_config('presora.internal_usage_write', 'on', true);

  IF last_reset IS NULL OR last_reset < date_trunc('month', now()) THEN
    UPDATE public.profiles
    SET analyses_this_month = 0, analyses_reset_at = now()
    WHERE id = NEW.user_id;
    analysis_count := 0;
  END IF;

  plan_limit := CASE user_plan
    WHEN 'free'         THEN 3
    WHEN 'starter'      THEN 5
    WHEN 'solo'         THEN 10
    WHEN 'growth'       THEN 50
    WHEN 'enterprise'   THEN 999999
    WHEN 'agency'       THEN 999999
    ELSE 3
  END;

  IF analysis_count >= plan_limit THEN
    RAISE EXCEPTION 'Analysis limit reached for plan: %', COALESCE(user_plan, 'free');
  END IF;

  UPDATE public.profiles
  SET analyses_this_month = analyses_this_month + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$function$;

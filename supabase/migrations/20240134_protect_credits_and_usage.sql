-- SECURITY FIX + auto-disable bookkeeping.
--
-- 1) protect_plan_changes() guarded `plan`, `is_admin` and the two
--    custom_plan_price columns, but NOT the columns that actually meter
--    paid usage:
--
--      * credits             — bought with real money (stripe-webhook.js's
--                              creditsFromPaymentLink) and granted by
--                              referrals (referral.js).
--      * analyses_this_month — the counter enforce_analysis_limit() compares
--                              against the plan's monthly cap.
--      * analyses_reset_at   — moving this backwards makes that same trigger
--                              zero the counter on the next insert.
--
--    profiles' UPDATE policy is `USING (auth.uid() = id)` with no column
--    restriction, so any signed-in user could run
--      supabase.from('profiles').update({ credits: 999999 })
--      supabase.from('profiles').update({ analyses_this_month: 0 })
--    from the browser console and help themselves to paid features. Same
--    class of hole the 20240128/20240129 migrations closed for the price
--    columns — the usage/credit columns were simply missed.
--
--    service_role is still allowed through, so stripe-webhook.js,
--    referral.js, enforce_analysis_limit() (SECURITY DEFINER) and the admin
--    Functions keep working unchanged.
--
-- 2) Seeds the app_settings keys the auto-disable watchdog uses (see
--    netlify/functions/_lib/appSettings.js).

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
  -- IS DISTINCT FROM, not !=, so a NULL on either side is still caught.
  IF NEW.credits IS DISTINCT FROM OLD.credits AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change credits directly';
  END IF;
  IF NEW.analyses_this_month IS DISTINCT FROM OLD.analyses_this_month AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change usage counter directly';
  END IF;
  IF NEW.analyses_reset_at IS DISTINCT FROM OLD.analyses_reset_at AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change usage reset date directly';
  END IF;
  RETURN NEW;
END;
$function$;

-- Watchdog state for the auto-disable feature. `provider_failures` counts
-- consecutive all-models-failed scans; `scanning_disabled_reason` records
-- whether the switch was flipped by a human or by the watchdog.
insert into public.app_settings (key, value)
values
  ('provider_failures', '{"count": 0}'::jsonb),
  ('scanning_disabled_reason', 'null'::jsonb)
on conflict (key) do nothing;

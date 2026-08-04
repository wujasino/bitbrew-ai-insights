-- ================================================================
-- Fix enforce_analysis_limit(): 'starter' and 'agency' plans were
-- falling through to the ELSE branch (limit 3, same as free).
--
-- 'starter' is a real, Stripe-purchasable plan (see
-- netlify/functions/_lib/stripePlans.js) that the Pricing page and
-- app UI both promise 5 analyses/month for — but this trigger had no
-- case for it, so paying Starter customers were silently capped at 3.
--
-- 'agency' is the plan value some manually-provisioned accounts have
-- instead of 'enterprise' (same tier — see PLAN_TIER/PLAN_LIMITS in
-- src/hooks/useAccountInfo.ts) — it was hitting the same ELSE branch,
-- capping what should be an unlimited-tier account at 3/month.
--
-- CREATE OR REPLACE is idempotent — safe to re-run.
-- ================================================================

CREATE OR REPLACE FUNCTION public.enforce_analysis_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan      TEXT;
  analysis_count INT;
  plan_limit     INT;
  last_reset     TIMESTAMPTZ;
BEGIN
  SELECT plan, analyses_this_month, analyses_reset_at
  INTO user_plan, analysis_count, last_reset
  FROM public.profiles WHERE id = NEW.user_id;

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
    WHEN 'solo_brew'    THEN 10
    WHEN 'growth'       THEN 50
    WHEN 'growth_roast' THEN 50
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

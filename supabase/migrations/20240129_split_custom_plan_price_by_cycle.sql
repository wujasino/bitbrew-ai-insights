-- Split the single custom_plan_price column (20240128) into monthly and
-- yearly variants, matching the billing-cycle toggle already on the
-- Pricing page (Monthly / Yearly −20%) — a negotiated Agency quote can
-- differ between the two the same way the list prices do.
--
-- Still informational/display only: does NOT change what Stripe actually
-- charges — that's still driven entirely by the subscription's price ID
-- (create-checkout.js / manage-subscription.js).
--
-- Applied directly to the database already; this brings migration history
-- in sync.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_plan_price;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_plan_price_monthly NUMERIC(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_plan_price_yearly NUMERIC(10,2);

COMMENT ON COLUMN public.profiles.custom_plan_price_monthly IS
  'Optional negotiated monthly price override (e.g. Agency plan quotes), informational only — does not affect the Stripe subscription amount actually charged.';
COMMENT ON COLUMN public.profiles.custom_plan_price_yearly IS
  'Optional negotiated yearly price override (e.g. Agency plan quotes), informational only — does not affect the Stripe subscription amount actually charged.';

-- protect_plan_changes() (20240104_security_hardening.sql) already stops a
-- signed-in user from setting their own `plan`/`is_admin` via the client —
-- profiles' UPDATE policy only checks auth.uid() = id, not which columns
-- changed. Both new columns need the exact same guard as the column they
-- replace, or any user could fake themselves a discounted quote from the
-- browser console.
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
  RETURN NEW;
END;
$function$;

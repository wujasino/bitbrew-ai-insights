-- Optional negotiated monthly price per account (e.g. Agency plan quotes,
-- which the Pricing page already advertises as "from $220" — variable by
-- customer). Informational/display only: it does NOT change what Stripe
-- actually charges — that's still driven entirely by the subscription's
-- price ID (see create-checkout.js / manage-subscription.js). Changing
-- what a customer is actually billed still requires a real Stripe-side
-- price change, not just this column.
--
-- Applied directly to the database already; this brings migration history
-- in sync.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_plan_price NUMERIC(10,2);

COMMENT ON COLUMN public.profiles.custom_plan_price IS
  'Optional negotiated monthly price override (e.g. Agency plan quotes), informational only — does not affect the Stripe subscription amount actually charged.';

-- protect_plan_changes() (20240104_security_hardening.sql) already stops a
-- signed-in user from setting their own `plan`/`is_admin` via the client —
-- profiles' UPDATE policy only checks auth.uid() = id, not which columns
-- changed. custom_plan_price needs the exact same guard, or any user could
-- run supabase.from('profiles').update({ custom_plan_price: 1 }) from the
-- browser console and fake a discounted price for themselves.
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
  IF NEW.custom_plan_price IS DISTINCT FROM OLD.custom_plan_price AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change custom plan price directly';
  END IF;
  RETURN NEW;
END;
$function$;

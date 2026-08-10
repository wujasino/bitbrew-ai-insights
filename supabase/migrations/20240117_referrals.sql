-- Referral program: every user gets a stable referral code and link
-- (presora.app/register?ref=CODE). Every successful signup through that
-- link is logged in `referrals`. Every 10 successful referrals unlocks one
-- reward claim (netlify/functions/referral.js) — a one-time 20%-off-next-
-- invoice Stripe coupon for subscribed users, or a bonus analysis-credit
-- pack for free-plan users who can't apply an invoice discount. One-time
-- (not recurring) so the cost per reward is bounded regardless of how long
-- the referrer stays subscribed afterwards.

alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists referral_rewards_claimed integer not null default 0;

-- Deterministic from the user's own id — no collision retry logic needed.
update profiles set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

create unique index if not exists profiles_referral_code_idx on profiles(referral_code);

create table if not exists referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid not null references auth.users(id) on delete cascade,
  referred_user_id  uuid not null unique references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now()
);

create index if not exists referrals_referrer_id_idx on referrals(referrer_id);

alter table referrals enable row level security;

drop policy if exists "User views own referrals" on referrals;
create policy "User views own referrals" on referrals
  for select
  to authenticated
  using (referrer_id = auth.uid());

-- Extends handle_new_user() (see 20240104_security_hardening.sql) to also
-- assign the new profile its own referral code, and — if they signed up
-- through someone else's referral link — record that referral. Both are
-- best-effort: a lookup failure or invalid/self-referral code must never
-- block account creation, so referral recording is wrapped so it can't
-- raise past the outer INSERT.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    upper(substr(replace(NEW.id::text, '-', ''), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
      SELECT id INTO v_referrer_id FROM public.profiles
      WHERE referral_code = upper(NEW.raw_user_meta_data->>'referral_code')
      LIMIT 1;

      IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.id THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id)
        VALUES (v_referrer_id, NEW.id)
        ON CONFLICT (referred_user_id) DO NOTHING;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

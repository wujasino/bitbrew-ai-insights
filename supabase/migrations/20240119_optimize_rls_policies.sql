-- Found via Supabase's performance advisors (mcp get_advisors) after the
-- security lockdown in 20240118. Two real, safe optimizations — no change
-- in who can access what, just how cheaply Postgres evaluates it:
--
-- 1. Duplicate RLS policies on profiles, brand_knowledge and recovery_codes
--    — leftovers from earlier iterations of the hand-maintained master SQL
--    script that renamed policies without dropping the old ones under
--    their old name. Each duplicate is a redundant policy check Postgres
--    has to run on every query against that table.
-- 2. auth.uid() called bare in RLS policies gets re-evaluated once per
--    row; wrapping it as (select auth.uid()) lets Postgres evaluate it
--    once per query as an InitPlan. See:
--    https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Applied directly via Supabase MCP and verified: all 15 auth_rls_initplan
-- warnings and all multiple_permissive_policies warnings are gone from
-- get_advisors(performance), with no regression on get_advisors(security).

drop policy if exists "Users see own profile" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "own brand knowledge" on brand_knowledge;
drop policy if exists "User owns recovery code" on recovery_codes;

alter policy "Users can insert own profile" on profiles
  with check ((select auth.uid()) = id);

alter policy "Users can delete own analyses" on analyses
  using (user_id = (select auth.uid()));
alter policy "Users can insert own analyses" on analyses
  with check ((select auth.uid()) = user_id);
alter policy "Users can view own analyses" on analyses
  using ((select auth.uid()) = user_id);

alter policy "User can view their own assistant conversations" on assistant_conversations
  using (user_id = (select auth.uid()));

alter policy "User reads own automation usage" on automation_usage
  using (user_id = (select auth.uid()));

alter policy "User owns brand monitor" on brand_monitors
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "User can view their own notifications" on notifications
  using (user_id = (select auth.uid()));
alter policy "User can mark their own notifications read" on notifications
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "Users manage own recovery codes" on recovery_codes
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "User views own referrals" on referrals
  using (referrer_id = (select auth.uid()));

-- 20240119_optimize_rls_policies.sql dropped the "own brand knowledge" policy
-- on brand_knowledge intending to recreate it with the optimized
-- (select auth.uid()) pattern, the same way it did for every other table in
-- that migration (profiles, analyses, brand_monitors, recovery_codes, ...) —
-- but the matching `alter policy` for brand_knowledge was never written.
--
-- Result: brand_knowledge kept RLS enabled with only the service_role policy
-- left standing. Every user-scoped query against the table (not service-role)
-- got silently blocked by RLS:
--   - BrandKnowledgeForm.tsx  SELECT (list fragments) and DELETE
--   - netlify/functions/ingest-knowledge.js  INSERT (saves via the caller's
--     own JWT, not the admin/service-role client)
-- so nothing could be saved, listed or removed once that migration ran.
--
-- Split into one policy per command (rather than a single FOR ALL policy)
-- to match what was actually applied to the live database while diagnosing
-- this outage, so a fresh environment built from these migration files ends
-- up in the same state as production instead of a redundant duplicate.

create policy "brand_knowledge: select own"
  on public.brand_knowledge
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "brand_knowledge: insert own"
  on public.brand_knowledge
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "brand_knowledge: update own"
  on public.brand_knowledge
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "brand_knowledge: delete own"
  on public.brand_knowledge
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

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

create policy "own brand knowledge"
  on public.brand_knowledge
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

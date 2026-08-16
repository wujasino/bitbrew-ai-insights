-- White-label branding for the client-ready audit at /audit/:id.
--
-- The Agency plan advertises a "white-label dashboard" (see Pricing.tsx and
-- salesKnowledge.js) but the audit export was hard-coded to Presora's
-- wordmark and contact.presora@gmail.com — meaning an agency that forwarded
-- the PDF to their own client sent that client to us instead of to them.
-- These four columns let the report carry the agency's identity instead.
--
-- Deliberately NOT added to protect_plan_changes(): unlike plan/credits/
-- analyses_*, these are the user's own display fields with no billing or
-- quota meaning. profiles' `USING (auth.uid() = id)` UPDATE policy is the
-- right level of protection for them — the same level avatar_url and
-- full_name already have.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_name          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_logo_url      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_website       TEXT;

-- Length caps so a pasted blob can't turn the report header into a wall of
-- text (or the logo <img> src into a multi-megabyte data: URI). The report
-- also truncates defensively on render.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS agency_name_length;
ALTER TABLE public.profiles ADD CONSTRAINT agency_name_length
  CHECK (agency_name IS NULL OR char_length(agency_name) <= 60);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS agency_contact_email_length;
ALTER TABLE public.profiles ADD CONSTRAINT agency_contact_email_length
  CHECK (agency_contact_email IS NULL OR char_length(agency_contact_email) <= 160);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS agency_website_length;
ALTER TABLE public.profiles ADD CONSTRAINT agency_website_length
  CHECK (agency_website IS NULL OR char_length(agency_website) <= 200);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS agency_logo_url_length;
ALTER TABLE public.profiles ADD CONSTRAINT agency_logo_url_length
  CHECK (agency_logo_url IS NULL OR char_length(agency_logo_url) <= 500);

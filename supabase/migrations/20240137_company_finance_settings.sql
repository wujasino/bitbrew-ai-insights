-- Internal business finance settings: tax rate, VAT rate, monthly fixed
-- costs (Sentry, Plausible, Cloudflare, etc.) — used to compute real net
-- profit/margin from revenue, not customer-facing data.
--
-- RLS is on with NO policies on purpose, same as app_settings: this is
-- financial data about the business itself, not any one user's account, so
-- nothing should reach it with an anon/authenticated JWT — only service-role
-- Netlify Functions should read/write it.

create table if not exists public.company_finance_settings (
  id                    uuid primary key default gen_random_uuid(),
  tax_rate_percent      numeric default 19.0, -- e.g. linear 19% or ryczałt 12%
  vat_rate_percent      numeric default 23.0, -- VAT in Poland
  monthly_fixed_costs   numeric default 0.0,  -- fixed costs (Sentry, Plausible, Cloudflare, etc.)
  updated_at            timestamptz default timezone('utc'::text, now())
);

alter table public.company_finance_settings enable row level security;

-- Seed row — 150 USD/month fixed costs as a starting estimate, editable later.
insert into public.company_finance_settings (tax_rate_percent, vat_rate_percent, monthly_fixed_costs)
values (19.0, 23.0, 150.0)
on conflict do nothing;

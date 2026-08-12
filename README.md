# Presora — E2E & API Test Suite

[Test runs →](https://github.com/wujasino/presora/actions)

Automated test suite for [Presora](https://presora.app), a production SaaS that
tracks brand visibility in AI-generated answers. Covers authentication, the core
analysis flow, Stripe subscription checkout, and API contracts.

**Stack:** Playwright · TypeScript · GitHub Actions

---

## What it does

- **Brand visibility audits** — scores a brand across authority, sentiment, recency, mentions and accuracy, with per-model breakdowns
- **RAG-grounded analysis** — brand knowledge is embedded (Voyage `voyage-3.5`) and stored in Supabase pgvector, then retrieved into the prompt so results stay specific instead of generic
- **AI assistant with tool calling** — a chat interface that configures monitoring (brand, competitors, cadence, alert thresholds) by writing to the database through structured tools, no forms required
- **Automations & monitoring** — recurring brand monitors with alert metrics and thresholds, one config per user
- **Embeddable score badge** — a public SVG endpoint (`/.netlify/functions/badge?brand=…`) that any site can drop in
- **Reports & PDF viewer** — audits rendered as shareable reports
- **Voice playback** — report narration via ElevenLabs multilingual TTS
- **Full account layer** — email + Google OAuth sign-in, OTP password reset, recovery codes, avatars, newsletter preferences
- **Billing** — Stripe checkout for monthly/yearly plans and credit packs, with webhook-driven plan sync
- **6 UI languages** — EN, PL, DE, ES, FR, IT

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query |
| Visualisation | Recharts, three.js / react-force-graph-3d, Framer Motion |
| Backend | Node.js on Netlify serverless functions (18 endpoints) |
| Data & Auth | Supabase — PostgreSQL, pgvector, Auth, Row-Level Security, Storage |
| AI | Anthropic Claude (analysis + tool-calling assistant), Voyage AI embeddings, ElevenLabs TTS |
| Payments | Stripe — checkout, customer portal, webhook-driven plan upgrades |
| Email | Resend (transactional), Mailchimp (newsletter) |
| Testing | Vitest + Testing Library (unit), Playwright (E2E) |
| Infra | Netlify CI/CD, custom domain & DNS, Google OAuth proxy redirect |

## Engineering highlights

- **RAG pipeline end-to-end** — ingestion function, chunking, Voyage embeddings, pgvector similarity search, context injection into the analysis prompt
- **Tool-calling agent** — the chat assistant reads and upserts monitoring config through typed tools, with the serverless function scoping every write to the JWT-verified user id
- **Defense in depth on data access** — RLS policies on every user-owned table (analyses, monitors, recovery codes, newsletter, rate limits), plus service-role functions that never trust a client-supplied user id
- **Layered rate limiting** — per-user windows and daily caps enforced in Postgres, with an in-memory limiter as a secondary guard, and a separate guest quota path for unauthenticated trials
- **Auth hardening** — OTP-based password reset with attempt lockout, one-time recovery codes, Google OAuth routed through a Netlify proxy so the Supabase project ref never leaks into the browser
- **Production security headers** — strict CSP with an explicit allow-list, HSTS preload, frame denial, MIME sniff protection, scoped Permissions-Policy
- **Cache strategy tuned per asset class** — immutable hashing for build output, revalidation for images, no-store for HTML
- **11 versioned SQL migrations** covering schema, policies, triggers and storage buckets
- **Shipped and debugged in production** across auth, serverless runtime limits, Stripe webhooks and third-party API failures

## Project structure

```
netlify/functions/   18 serverless endpoints (analyze, chat, ingest-knowledge,
                     stripe-webhook, badge, tts, auth/OTP, newsletter, …)
src/pages/           23 routes — Landing, Dashboard, Reports, Automations,
                     Pricing, Developers, ApiDocs, Settings, auth flows
src/lib/             Supabase client, auth, brand scoring, i18n + 6 locales
src/components/      shadcn/ui-based component layer
supabase/migrations/ schema, RLS policies, triggers, storage buckets
```

## Running locally

```bash
git clone https://github.com/wujasino/presora.git
cd presora
npm install --legacy-peer-deps
cp .env.example .env      # fill in the keys below
npx netlify dev           # app on :8888, functions included
```

Frontend-only (`npm run dev`, port 4000) works, but any route hitting `/.netlify/functions/*` needs `netlify dev`.

### Environment variables

| Group | Variables |
|-------|-----------|
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| AI | `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `ELEVENLABS_API_KEY` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_*_PRICE_ID` |
| Auth | `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Email | `RESEND_API_KEY`, `RESEND_FROM`, `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID` |
| Limits | `RATE_LIMIT_WINDOW_MS`, `MAX_REQUESTS_PER_WINDOW`, `MAX_REQUESTS_PER_DAY` |

### Tests

```bash
npm test              # Vitest unit tests
npx playwright test   # E2E
```

## Testing

Presora is a production SaaS handling authentication, LLM-driven analysis pipelines and Stripe subscriptions, so the test suite is built around the paths where a regression costs real money: sign-in, running an analysis, and checkout.

Stack
Layer	Tool
End-to-end (UI)	Playwright + TypeScript
API contract	Playwright APIRequestContext
CI	GitHub Actions (sharded, runs on every push and PR)
What is covered

Authentication — sign-in with valid credentials, rejection of bad passwords, redirect of unauthenticated users away from the dashboard, signup validation.

Dashboard — analyses list rendering, navigation into an analysis, mobile viewport navigation.

Brand analysis — the core product flow: submitting a brand, waiting on the LLM-backed pipeline, asserting a visibility score is returned; validation on empty input; deletion removing the record from the list.

Billing — pricing page renders all plans, plan selection redirects to Stripe Checkout, and a full payment with a Stripe test card returns to the success URL with an active subscription. Runs against Stripe test keys only.

API — response contracts for create/read/delete, 400 on invalid payloads, 404 on unknown ids, 401/403 for unauthenticated requests, and row-level isolation between accounts.

Design decisions

Authentication happens once. A setup project signs in through the UI and persists storageState; every other project depends on it. Tests that must run signed-out (auth.spec.ts) run in a separate project with no stored state.

No waitForTimeout anywhere. Analyses call external LLM APIs with variable latency, so the suite waits on the actual POST /api/analyses response and on element state rather than on fixed delays. This is what keeps the suite from flaking in CI.

Tests own their data. A seededAnalysis fixture creates a uniquely-named record through the API and deletes it in teardown, including after a failure. Tests can therefore run in parallel against the same account.

Role-based locators first. getByRole / getByLabel over CSS selectors, so the tests survive refactors and surface accessibility problems as failures.

Failures are debuggable. Traces on first retry, screenshots and video on failure, all uploaded as CI artifacts.

Running locally
bash
npm install
npx playwright install --with-deps chromium

cp .env.example .env.local   # fill in TEST_USER_EMAIL / TEST_USER_PASSWORD

npx playwright test                      # everything
npx playwright test --ui                 # interactive runner
npx playwright test --grep @checkout     # Stripe flow only
npx playwright test --grep-invert @slow  # skip the LLM-backed tests
npx playwright show-report

The config starts the dev server automatically. Set BASE_URL to run against a deployed preview instead.

Environment variables
Variable	Purpose
TEST_USER_EMAIL / TEST_USER_PASSWORD	Dedicated test account, never a real customer
BASE_URL	Optional; run against a preview deployment
FOREIGN_ANALYSIS_ID	Optional; enables the cross-account isolation test

## Security

Security policy and disclosure process: [SECURITY.md](SECURITY.md).

---

## About

Built by **Patryk Rybacki** — Full-Stack Developer (React · TypeScript · Node.js · Supabase).

- Live product: [presora.app](https://presora.app)
- LinkedIn: [patryk-rybacki](https://linkedin.com/in/patryk-rybacki-503599355)

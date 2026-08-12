# Presora — E2E & API Test Suite

[Test runs →](https://github.com/wujasino/presora/actions)

Automated test suite for [Presora](https://presora.app), a production SaaS that
tracks brand visibility in AI-generated answers. Covers authentication, the
dashboard's real data, subscription state in Settings, and the global command
palette — see [Testing](#testing) below for the full breakdown.

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
- **Public status page** — live health check of the app and Supabase Auth/DB reachability, no fabricated uptime numbers
- **Contact page** — a real form (name, email, subject, message) backed by its own rate-limited serverless endpoint

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query |
| Visualisation | Recharts, three.js / react-force-graph-3d, Framer Motion |
| Backend | Node.js on Netlify serverless functions (23 endpoints) |
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
- **Error monitoring & analytics ready, opt-in** — Sentry and Plausible are wired up but inert until `VITE_SENTRY_DSN` / `VITE_PLAUSIBLE_DOMAIN` are set, so nothing ships half-configured or points at a fake project

## Project structure

```
netlify/functions/   23 serverless endpoints (analyze, chat, ingest-knowledge,
                     stripe-webhook, badge, tts, auth/OTP, newsletter, …)
src/pages/           25 routes — Landing, Dashboard, Reports, Automations,
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
| Observability *(optional)* | `VITE_SENTRY_DSN` (error monitoring, off until set), `VITE_PLAUSIBLE_DOMAIN` (cookieless analytics, off until set) |

### Tests

```bash
npm test    # Vitest unit tests
npm run e2e # Playwright E2E — see "Testing" below for what's covered and how it's set up
```

## Testing

Presora is a production SaaS handling authentication, LLM-driven analysis pipelines and Stripe subscriptions, so the E2E suite is built around the paths where a regression costs real money: sign-in/sign-up, the dashboard's real data, and subscription state in Settings.

| Layer | Tool |
|-------|------|
| End-to-end (UI) | Playwright + TypeScript, Page Object Model |
| Unit | Vitest + Testing Library |
| CI | GitHub Actions, 2-way sharded, runs on every push and PR |

**What is covered** (45 tests × chromium + mobile-chrome, `e2e/`)

- **Authentication** — successful login, rejection of bad credentials, required-field validation, the forgot-password → OTP-code flow, signup (success, password-mismatch validation, "already registered" failure), and unauthenticated visitors getting redirected off protected routes.
- **Dashboard** — the real per-model AI confidence data (`analyses.sources`) rendering correctly, a `–` placeholder instead of a fabricated number when that data is missing, and the account menu/sign-out flow.
- **Settings** — a canceled subscription showing its status and a working *Resume* button, an active subscription showing no cancellation banner, the referral panel (happy path and a failed lookup degrading to an inline error instead of a crash), and tab navigation.
- **Command palette** — the ⌘K/Ctrl+K global search opens, filters, navigates, and closes on Escape, with an assertion that it never trips a Radix accessibility warning.
- **Public pages** — Landing, Pricing, About render with zero console errors.

**Design decisions**

- **No live backend or test account required.** The suite mocks Supabase Auth/REST and the Netlify Functions layer at the network level (`e2e/mocks/supabase.ts`) instead of hitting a real Supabase project — deterministic, runs in CI with zero secrets, and lets edge cases (a canceled subscription, a 500 from an API) be asserted directly rather than reproduced by hand. `auth.setup.ts` still drives the real login form once, against a mocked `/auth/v1/token` response, and persists the resulting session via `storageState` for every other spec to reuse.
- **PostgREST-shape-aware mocks.** supabase-js sends a different `Accept` header for `.single()`/`.maybeSingle()` queries and expects a bare object back, not an array — the mocks inspect that header and respond with the shape the caller actually expects.
- **Role-based locators first.** `getByRole` / `getByLabel` over CSS selectors, so the tests survive refactors and surface accessibility problems as failures — this is how two real bugs were found and fixed while building the suite (see below).
- **No `waitForTimeout` anywhere.** The suite waits on element state, URL changes, and mocked network responses rather than fixed delays.
- **Console-error fixture.** A shared `consoleIssues` fixture (`e2e/fixtures.ts`) collects uncaught page errors and `console.error` calls per test, so regressions that don't fail an assertion but do throw silently still get caught.
- **Failures are debuggable.** Traces on first retry, screenshots and video on failure, all uploaded as CI artifacts.

**Bugs found and fixed while building the suite**

- `Login.tsx`/`Register.tsx` had `<Label>` elements never associated to their `<Input>` via `htmlFor`/`id` — invisible to `getByLabel()` and to screen readers alike, despite looking correctly labeled.
- Signing out from a protected page could silently land on `/login` instead of the landing page: `signOut()` fires an auth-state-change partway through its own promise chain, which `ProtectedRoute` (still mounted at that moment) reacts to with its own redirect — a race the explicit `navigate('/')` call could lose non-deterministically.

**Running locally**

```bash
npm install
npx playwright install --with-deps chromium

# The suite never calls a real backend, so any non-empty Supabase URL/key
# unblocks the app's own startup check:
echo 'VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder' > .env.local

npm run e2e                        # everything (starts the dev server automatically)
npm run e2e:ui                     # interactive runner
npm run e2e:report                 # open the last HTML report
```

Set `BASE_URL` to point the suite at a deployed preview instead of the local dev server.

## Security

Security policy and disclosure process: [SECURITY.md](SECURITY.md).

---

## About

Built by **Patryk Rybacki** — Full-Stack Developer (React · TypeScript · Node.js · Supabase).

- Live product: [presora.app](https://presora.app)
- LinkedIn: [patryk-rybacki](https://linkedin.com/in/patryk-rybacki-503599355)

# Presora — AI Brand Visibility Platform

**Live:** [presora.app](https://presora.app)

Presora audits how a brand shows up inside AI assistants and AI-powered search. It runs structured visibility audits across multiple model perspectives, scores the brand on five dimensions, and turns the result into an actionable report — grounding every analysis in brand-specific context through a retrieval pipeline.

Designed, built, and shipped **solo**, from idea to production: product, architecture, code, billing, infra and go-to-market.

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

## Security

Security policy and disclosure process: [SECURITY.md](SECURITY.md).

## Screenshots

<img width="1240" alt="Presora — brand analysis view" src="https://github.com/user-attachments/assets/e45238ef-7152-431c-853a-151ef7202f15" />
<img width="1257" alt="Presora — report breakdown" src="https://github.com/user-attachments/assets/4cb08a9f-598a-4552-b469-a5f44e9ecc44" />
<img width="1056" alt="Presora — dashboard" src="https://github.com/user-attachments/assets/c0675723-40ee-4cb7-8321-bf9020e7a10f" />

---

## About

Built by **Patryk Rybacki** — Full-Stack Developer (React · TypeScript · Node.js · Supabase).

- Live product: [presora.app](https://presora.app)
- LinkedIn: [patryk-rybacki](https://linkedin.com/in/patryk-rybacki-503599355)

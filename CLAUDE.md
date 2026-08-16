# Presora

AI brand-visibility SaaS. React + TypeScript + Vite + Tailwind + shadcn/ui,
Netlify serverless functions, Supabase (Postgres + Auth + Storage).

## Brand palette (dark mode, app-wide)

- Background `#0B0F19` · Card `#111827` · Border `#334155`
- Text `#F8FAFC` · Muted text `#94A3B8`
- Primary / CTA / logo `#6366F1`, hover `#4F46E5`
- Secondary button (e.g. login) `#1E293B` bg + `#F8FAFC` text

Tokens live in `src/index.css` under `.dark`.

Decorative/repeating chrome (`.hero`, `.badge`, `.cta-box` gradients in
`src/index.css`, and `GradientMeshBg`'s hero orbs) was deliberately toned
down from indigo/violet to neutral graphite — indigo stayed reserved for
actionable elements: `--primary` (buttons, links, focus rings, the 1/2/3
step-number circles on Landing) and `.ai-presence-accent` (the chromatic
hero accent, the one signature moment — now on "Find out if it's yours."
after the hero headline was rewritten to lead with the stake). Don't
casually re-add indigo tints to background/wash classes; that's undoing an
intentional "vivid identity in some places, neutral everywhere else" split.

## Logo mark

New as of the "ribbon P" redesign (replaced the old solid-indigo glyph).
The source files the user provided (`public/presora-icon-512-dark.png`,
`public/presora-icon-512-white.png`) are flat opaque squares with the
glyph baked in at a dark charcoal color (~`rgb(50,51,56)`) — not directly
usable as an app icon, and that charcoal reads at under 2:1 contrast
against the app's dark backgrounds (effectively invisible).

Derived, actually-used assets:
- `public/presora-mark.png` — copy of `presora-icon-512-white.png`,
  used only for the JSON-LD Organization `"logo"` field in `index.html`
  (expects a plain/light background).
- `public/presora-mark-new.png` — the glyph alpha-masked out to a
  transparent PNG, original charcoal color. For light backgrounds.
- `public/presora-mark-new-dark.png` — same transparent glyph, recolored
  to `--foreground` (`#F8FAFC`). For dark backgrounds.
- `Wordmark.tsx` renders both of the last two, toggled via Tailwind's
  `dark:` variant (no theme hook needed) — mirrors `useFaviconTheme.ts`'s
  light/dark favicon swap, which now also uses the new mark (composited
  onto `#0F0F23` for the `-dark` favicon sizes, replacing the old
  indigo-era ones).

If new master logo files ever replace these again: re-extract the
transparent variants the same way (alpha = luminance-based masking
against the flat background) rather than trying to reuse the opaque
squares directly — see git history around "Use the new logo mark in the
navbar" for the exact approach.

## Landing page (`src/pages/Landing.tsx`)

Defaults to dark (via `ThemeProvider`'s `defaultTheme="dark"` in
`main.tsx`, same as the rest of the app) but is now toggleable — the
`Navbar` takes a `showThemeToggle` prop (only Landing passes it; other
pages using the shared `Navbar` like Terms/Privacy have dark-hardcoded
inline content and would break if toggled). Uses the same palette as the
rest of the app (see Brand palette above, incl. the indigo-vs-neutral
split) plus the `"mono"` `GradientMeshBg` orb variant for the hero
(grayscale — was `"indigo"`, changed together with the palette toning).
`.font-landing` sets Plus Jakarta Sans for body/paragraph text only;
headings (`.font-display`) deliberately fall through to the app-wide
Space Grotesk instead of being overridden, so headings read as the same
family as the wordmark next to the logo mark.

Landing-specific CSS classes with hand-picked colors (`.hero`, `.badge`,
`.cta-box`, `.ai-presence-accent*` in `src/index.css`) each need both a
base (light) and `.dark` override — previously they were dark-only since
the page force-applied `.dark` regardless of the resolved theme.
`useForceDarkTheme()` was removed when the toggle was added; don't
re-add hardcoded dark-only colors on Landing without a light pairing.

## Landing-page copy rules

Two claims were deliberately left out of the marketing copy and must not be
reintroduced casually:

- **No usage numbers.** "X brands scanned this week" was requested and
  declined: the real figure is single-digit (4 scans in the last 7 days, 14
  total), so publishing it signals the opposite of traction. The hero trust
  bar carries product facts (models queried, ~15s) instead — see the "real
  product facts, not invented usage stats" comment there.
- **No unbuilt integrations.** The "Powered by leading AI models" strip used
  to list Slack, HubSpot, Zapier, Google Analytics, Semrush and Notion.
  Nothing in `netlify/functions` talks to any of them. It now lists the six
  models `runScan.js` actually queries.

Model tiering is stated in four places and they must agree: `src/lib/plans.ts`
(authoritative), `AI_MODELS` in `Landing.tsx`, `src/lib/faq.ts`, and the
JSON-LD in `index.html`. Free = ChatGPT; Starter and Solo add Claude and
Gemini; Business = all six.

The before/after figures (`BEFORE`/`AFTER` in `Landing.tsx`) are illustrative
and labelled as such both in the section badge and in a caption under the
numbers. Don't relabel them as a case study without a real, attributable
customer.

`contact.presora@gmail.com` is still the live address. A switch to
`hello@presora.app` is wanted but deferred until that mailbox actually
receives mail — changing it early loses customer email silently.

## Wordmark font

`.font-wordmark` (in `src/index.css`) uses **Space Grotesk** at semibold
(600) — chosen to pair with the new "ribbon P" logo mark's geometric-but-
fluid shape; Michroma's rigid, blocky letterforms (the previous choice,
matched to the old Rimac-Nevera-style glyph) read as too robotic next to
it. Space Grotesk is already loaded app-wide for `.font-display`
(headings), so this doesn't add a new font fetch, and it now also drives
the Landing hero headline (see Landing page section above) for a
consistent mark+wordmark+headline family. Rendered uppercase via
`Wordmark.tsx` (`uppercase tracking-wide font-semibold`). Loaded via the
main Google Fonts `<link>` in `index.html`. Previously tried Michroma,
Fraunces (Casko substitute) and Satoshi (via Fontshare) — all replaced.

## Social assets

`public/social/presora-avatar.png` (1024×1024, solid indigo gradient bg)
and `presora-banner.png` (1500×500, X/Twitter header size, dark navy +
dot-grid + glow, wordmark in Unbounded font) — regenerate via a Playwright
HTML render (see git history around the "Add social media avatar and
banner assets" commit for the approach) if the palette or copy changes.

## Enterprise SSO (SAML 2.0)

Foundation only — no UI entry point is wired up yet (removed on purpose,
"sam kod, bez przycisku"). `src/lib/samlAuth.ts` exports
`signInWithSSODomain(domain)`, and `Login.tsx` has a ready `sso` mode panel
(domain input → redirects to the IdP) that isn't linked from anywhere in
the visible UI — re-add a button/link calling `switchMode('sso', 1)` when
this is ready to ship.

Supabase Auth acts as the SAML Service Provider. Presora's SP metadata URL
(give this to a customer's IdP admin to set up trust) is:
`https://wxwdymchrmhxeiccnzg.supabase.co/auth/v1/sso/saml/metadata`

To actually register a connection for a customer's domain: the Supabase
project needs the SSO add-on enabled (Team/Enterprise), then run
`supabase sso add --type saml --metadata-url <their IdP metadata URL>
--domains their-company.com` via the Supabase CLI with project-linked
credentials — not doable from this sandbox (no CLI auth, no real project
ref access beyond what's hardcoded in `netlify.toml`'s redirect).

## Feature flags (`app_settings`)

Runtime toggles an admin flips without a redeploy, in `public.app_settings`
(key/jsonb, migration `20240133`). RLS is on with **no policies** — it's
unreachable with an anon/authenticated JWT; only service-role Functions
touch it.

- `scanning_enabled` — master kill-switch for brand scanning. Read via
  `netlify/functions/_lib/appSettings.js`'s `isScanningEnabled()` in
  `analyze.js`, `api-analyze.js` and `check-score-alerts.js`; written only
  by `toggle-scanning.js` (verifies `profiles.is_admin`). UI at
  `/admin/settings`.
- `isScanningEnabled()` **fails open** on a missing row or query error —
  it's a deliberate off-switch, not a security control, so a DB hiccup must
  never take scanning down by itself.
- In `analyze.js` the check sits *before* the guest-limit RPC on purpose, so
  a paused scanner never burns a visitor's free allowance. Verified: with
  the flag off, zero OpenRouter calls and the guest counter untouched.
- **`openrouter_enabled`** (checkbox in `/admin/settings`, independent of the
  main switch) — skips OpenRouter entirely and goes straight to the direct
  Anthropic fallback in `runScan.js`. Added while OpenRouter's balance was
  empty: without it, every scan still paid OpenRouter's ~20s timeout across
  6 models before falling through anyway, and recorded six 402s per scan in
  `provider_failures.lastError`, burying the signal. Flip back on the moment
  OpenRouter is topped up — no redeploy, it's a stored flag like the others.
  **Only helps if `ANTHROPIC_API_KEY` is actually valid on this deploy** —
  it does not create a working provider, it just stops wasting time on a
  known-broken one.
- **Auto-pause is OFF by default** (`auto_disable_enabled`, checkbox in
  `/admin/settings`). Changed on the owner's explicit instruction: with an
  outage that lasts — an unpaid balance rather than a blip — auto-pausing
  turned every scan into "temporarily paused" and only an admin could undo
  it. Failures are still counted and recorded; the flag only controls whether
  the switch flips by itself. Turning it back on is one checkbox.
- **Watchdog**: `recordScanOutcome()` counts consecutive all-models-failed
  scans in `provider_failures` and flips `scanning_enabled` off at
  `AUTO_DISABLE_THRESHOLD` (3), recording why in `scanning_disabled_reason`
  (`source: 'auto' | 'manual'`). A success resets the streak. It never
  re-enables itself — auto-recovery would flap (enable → fail → disable) and
  each cycle costs real users a broken scan; an admin turns it back on once
  the cause is fixed, which also clears the counter.
- `getScanSettings()` reads all three keys in one query and hands the count
  to `recordScanOutcome()`, so the happy path adds no extra round-trip.

## Plan values must agree in three places

`enforce_analysis_limit()`'s CASE, `VALID_PLANS` in
`netlify/functions/admin-update-user.js`, and `PLAN_LIMITS` in
`src/hooks/useAccountInfo.ts`. A plan value missing from the trigger's CASE
hits its `ELSE 3` — the account is capped at 3 analyses a month with no
error and no sign of it in the UI.

This drifted once already: migration `20240126` removed the `solo_brew` and
`growth_roast` branches as dead code, but `VALID_PLANS` kept accepting them,
so an admin could set a plan that silently capped the account at 3. Fixed —
the live list is free / starter / solo / growth / enterprise / agency.

Running the old full-migration script from the Supabase SQL editor will
re-add those dead branches (it predates `20240126`) — it is not a safe
"re-sync" tool; prefer the numbered migrations in `supabase/migrations/`.

## Diagnosing a failed scan

`runBrandScan()` returns `failures` (per-model rejection messages) and
`keyConfigured` alongside the result. `analyze.js` and `api-analyze.js` build
the error from them, `recordScanOutcome()` stores it in
`app_settings.provider_failures.lastError` (1000 chars), and
`/admin/settings` renders it under the failure count — while a streak is
building, not only after the watchdog has already paused scanning.

Before this, every cause collapsed into "All model providers failed or
OPENROUTER_API_KEY is not configured", which cannot tell apart a missing key
(401), an empty balance (402), a retired model id (400) and a rate limit
(429) — four problems with four different fixes. Verified all five paths,
plus that one succeeding model still yields a real scan rather than a
fallback.

Note the sandbox proxy blocks `openrouter.ai`, and `OPENROUTER_API_KEY` only
exists in Netlify's environment, so the provider cannot be tested from here —
read the recorded `lastError` instead of guessing.

## Provider redundancy in `runBrandScan()`

OpenRouter was a single point of failure with a single balance: when its
credits ran out every model returned 402 and brand scanning — the product —
stopped, with nothing in the code able to help.

`runBrandScan()` now falls back to **Anthropic directly**
(`api.anthropic.com/v1/messages`, `ANTHROPIC_API_KEY`, already used by
`generate-audit-summary.js`, `assistant.js` and `chat.js`) whenever
OpenRouter produced no result at all — including when `OPENROUTER_API_KEY`
is absent entirely, which is why the fallback sits *outside* that key's
branch. Same prompt, same JSON contract, so it's a genuine scan from one
model rather than a degraded one. `usedFallbackProvider: true` marks it.

It only runs when OpenRouter returned nothing, so a healthy scan never pays
for a second provider, and a partial OpenRouter result is left alone.

Verified across the matrix: OpenRouter OK / OpenRouter 402 + Anthropic OK /
OpenRouter 402 with no Anthropic key / both 402 / no OpenRouter key at all.
Only the cases where *every* provider fails still produce `isFallback`.

The watchdog stays — but it can now only trip when every provider is down,
which is a real outage rather than one vendor's billing.

## A missing report must say so

`loadStoredAnalysis()` used to answer a failed lookup with a silent
`setStatus('idle')`. With `?id=` in the URL the page then rendered 24
characters — "Back / AI Audit / Analyze" — no message, no way back. Opening a
report that had been deleted (or belonged to another account; RLS makes those
indistinguishable, deliberately) looked exactly like the app being broken.

It now sets `notFound` plus an explanatory error, and `Dashboard` renders it
with the same neutral treatment as the paused state — clock icon, no "Try
again" (retrying cannot help), and links to Reports and Home.

Worth remembering after any cleanup of `analyses`: deleting rows invalidates
every bookmark and history entry pointing at them.

## Which provider keys are actually configured

A quick, non-invasive check without access to the Netlify environment: the
stored `audit_summary` headlines. `generate-audit-summary.js` only falls back
to `deterministicSummary()` when `ANTHROPIC_API_KEY` is unset, and that
template always reads `"<brand>'s AI visibility is <tier> — trust score
<n>/100"`. Every stored summary matching that shape means the key is missing,
not that Claude wrote a dull headline.

Confirmed that way on 2026-08-16: **ANTHROPIC_API_KEY is not set on the
deploy**, which is also why the direct-Anthropic scan fallback never ran —
`runBrandScan` now records "No fallback provider: ANTHROPIC_API_KEY is not
set on this deploy" instead of skipping it in silence.

## Read-only mode when scanning is paused

`netlify/functions/scan-status.js` is a **public** GET returning only
`{ enabled }` — `app_settings` is service-role-only and `toggle-scanning.js`
requires `is_admin`, so the UI had no way to know the switch was off until a
scan had already failed. It deliberately never returns the failure count,
the provider's error text, or who flipped it: those quote OpenRouter's
billing messages and belong behind the admin check.

`useScanStatus()` fails open — a blip must never make the app claim scanning
is down when it isn't. `analyze.js` re-checks the real flag server-side on
every scan, so this is advisory only.

While paused, HomeHub shows a banner pointing at stored reports, the "Run
new scan" CTA becomes an inert "Scanning paused" chip, the re-scan section
and the per-model "Enable & rescan" actions are replaced with static text,
and the scan screen offers "View your saved reports" instead of a dead-end
error. Everything already scanned keeps working — the app degrades to
read-only rather than looking broken.

**The deterministic fallback is never surfaced as a real result.** When every
model fails, `analyze.js` errors rather than showing fabricated scores; that
is the point of the `isFallback` check and must not be relaxed to "keep the
product usable" during an outage.

## `app_settings.value` is `jsonb NOT NULL`

Never write JS `null` to it — PostgREST turns that into SQL NULL and the
insert fails with `23502`. "No value" is expressed by **deleting the row**;
`getScanSettings()` and `toggle-scanning`'s GET both read a missing key as
`null`, and rows still holding the seeded JSON `null` read the same way.

This bit once, silently: `toggle-scanning` wrote the counter reset and
`scanning_disabled_reason: null` as **one array upsert** whose result was
never checked. Enabling scanning therefore left `provider_failures.count`
at 3, so the next failed scan immediately re-tripped the threshold and
switched scanning back off — the exact flapping the watchdog exists to
prevent. `/admin/settings` hid it further by setting the counter to 0
optimistically instead of trusting the response.

Found in `edge_logs`: `POST | 400 | .../rest/v1/app_settings?on_conflict=key`.
Worth grepping those logs for non-2xx after touching any Function — a
swallowed PostgREST error is invisible everywhere else.

## Admin account management

All three admin pages (`/admin/announcements`, `/admin/settings`,
`/admin/pricing`) are linked from the sidebar's Admin section, shown only
when `useIsAdmin()` is true. `/admin/settings` and `/admin/pricing` existed
as routes for a while with **no nav entry at all** — reachable only by typing
the URL, which is why the credit editor looked missing. If you add an admin
route, add its `NavItem` in `Sidebar.tsx` in the same change.

`/admin/settings` (`AdminSettings.tsx`) → `admin-update-user.js`: look an
account up by email and change `plan`, `credits`, or reset the monthly usage
counter. All three are service-role-only writes gated on the caller's
`profiles.is_admin`.

**Why they're service-role-only** (migration `20240134`): `profiles`' UPDATE
policy is `USING (auth.uid() = id)` with no column restriction, and
`protect_plan_changes()` originally guarded only `plan`/`is_admin`/the price
columns. `credits` (bought via Stripe payment links, granted by referrals)
and `analyses_this_month`/`analyses_reset_at` (what
`enforce_analysis_limit()` meters against) were left open — any signed-in
user could grant themselves credits or zero their usage from the browser
console. The trigger now guards all of them. Don't add a new paid-usage
column to `profiles` without adding it to that trigger too.

## Client-ready audit (`/audit/:id`)

The Agency-plan deliverable agencies mail to their own clients as a PDF, so
it has to stand on its own without the reader ever seeing Presora.

- **White-label** (migration `20240135`, applied to the live DB): verified
  under an `authenticated` JWT that an owner can write their own branding,
  that another user's row returns 0 rows (RLS), that `credits` in the *same*
  UPDATE still raises `Cannot change credits directly`, and that the 60-char
  `agency_name_length` CHECK fires. `profiles.agency_{name,logo_url,
  contact_email,website}` drive the letterhead, the "Prepared by" line and
  the closing CTA. Edited at **`/audit-branding`** (`AuditBranding.tsx`, its
  own page under the sidebar's *Tools* section, next to Reports — it
  configures a deliverable, not an account preference, so it deliberately
  isn't a Settings tab), read by `useAuditBranding.ts`. Without it a forwarded PDF sent the
  agency's client to `contact.presora@gmail.com` — i.e. to us, not to them.
- `useAuditBranding` is deliberately **not** folded into the shared
  `['profile-flags']` select: selecting a column that doesn't exist is a hard
  Postgres error (42703), and a missing migration must only downgrade the
  letterhead to Presora's, never break the report. The `/audit-branding` page surfaces
  that same error loudly instead, since that's where it's actionable.
- `agency_logo_url`/`agency_website` are http(s)-only on read (`safeHttpUrl`)
  — they land in an `<img src>`/`<a href>` on a page that gets printed and
  mailed onward.
- The branding columns are intentionally **not** in
  `protect_plan_changes()`: they're display fields like `avatar_url`, with no
  billing or quota meaning.
- **Print**: `@page { margin: 16mm 14mm }` and heading `break-after: avoid`
  live in `src/index.css`; individual cards opt out of splitting via the
  `NO_SPLIT` class in `AuditReport.tsx`. Verified no no-split block exceeds
  one A4 page (the tallest, the methodology card, is ~493px of ~1002px
  usable) — an oversized one would force a blank page.
- The methodology + limitations section is load-bearing, not filler: a
  professional reader's first question is where the number comes from, and
  stating what the method *can't* do is what makes the rest credible.

## Typechecking gotcha

`npx tsc --noEmit` **silently checks nothing** — the root `tsconfig.json`
has `"files": []` and only project references. Use
`npx tsc -p tsconfig.app.json --noEmit`. (This is how a missing
`Label` import slipped into `Onboarding.tsx` earlier.) Three pre-existing
errors in `ai-prompt-box.tsx` and `cookie-banner-1.tsx` are expected noise.

## Scan integrity (`useBrewing.ts`)

Nine of the first fourteen rows in `analyses` were duplicates — the same
brand and score written two or three times 0.4-1.8s apart. `startBrewing`
had no in-flight guard, and three call sites could reach it (the
`brandFromUrl` effect, the re-scan button, a `setTimeout` retry).

- `inFlight` is a **ref**, not state: two calls in the same tick must not
  both read a stale `false`. Released in a `finally` (so a failed scan
  doesn't wedge the hook) and in `reset()`.
- `canonicalBrandName()` is applied on save; `brandKey()` is the comparison
  key that makes "presora", "Presora.app" and "https://www.presora.app/" one
  brand. `brandKey` strips protocol, `www.`, path and TLD.
- `brandKey()`, `canonicalBrandName()` and `dedupeAnalyses()` live in
  `src/lib/analyses.ts` — pure functions, no React or Supabase imports.
  `dedupeAnalyses` used to be exported from `HomeHub.tsx`, which meant
  `Reports.tsx` importing it dragged recharts and the whole Home screen into
  the Reports chunk (8kB now, and no `HomeHub-*.js` chunk at all — HomeHub
  merges into `Dashboard`, its only renderer).

**A stack trace naming a chunk is not naming a file.** The console error
`Analyze request failed ... at HomeHub-*.js` came from `useBrewing.ts`,
which Rollup had placed in a chunk it happened to name after HomeHub.
Confirm with `grep -c "netlify/functions/analyze" dist/assets/<chunk>.js`
before trusting the name.
- **Deltas compare against the previous scan of the same brand**, not the
  previous row. Comparing `analyses[0]` to `analyses[1]` regardless of brand
  is why one score showed two different deltas on two different days. The
  sparkline is filtered the same way.
- The historical duplicates **have been deleted** (5 rows, keeping the
  earliest of each group; 14 -> 9). Checked first that nothing has a foreign
  key onto `analyses` and that none of the deleted copies carried an
  `audit_summary` or `sources`. `dedupeAnalyses()` stays regardless — it is
  the read-side safety net, and the guard is what prevents new ones.
- Deleting scans does **not** decrement `profiles.analyses_this_month` — the
  trigger only ever increments it. After the duplicate cleanup the counters
  were realigned to the real per-month row count (16 -> 9 and 61 -> 0);
  every account involved was on an unlimited tier, so no quota was granted
  or taken away.

Score bands are 75/60 across `HomeHub.tsx` (`barColor`, `bandOf`,
`scoreColor`) and `AuditReport.tsx`. They were 70/50 on Home, which painted
a 70 and a 73 the same green as a 95 on the screen whose job is saying what
to fix first.

## Locale dictionaries (`src/lib/locales/*.ts`)

~248 of the 396 keys in `en.ts` (and their counterparts in the five other
languages) are currently unreferenced — mostly `settings_*`, `pricing_*`,
`tier_*`, `cookie_*`, `footer_*`, `newsletter_*`, `credits_*`. **This is
intentional; do not "clean them up".** Those sections were rewritten with
English copy inlined in the components, so the keys went dead because the
pages stopped being translated, not because the content disappeared. They
are finished translations in six languages, kept for whenever those pages
get localised again — deleting them means retranslating from scratch.

The `faq_q*`/`faq_a*` keys *were* removed (commit `04e67eb`): the FAQ now
has a single source of truth in `src/lib/faq.ts`, so those were true
duplicates rather than shelved translations.

Note when auditing usage: `t()` is also called with template literals, so
any key starting with `dim_`, `rec_`, `sentiment_` or `source_` is live
even though no string literal in the codebase matches it.

## Known sandbox limitations

- No real internet in this dev/test sandbox except through the proxy —
  `fonts.googleapis.com` and `fonts.gstatic.com` work fine via `curl` and
  in Playwright/Chromium. If a webfont looks wrong in a screenshot, don't
  assume proxy flakiness — check for a stale/corrupted cached font file in
  `/tmp` first (re-`curl` it fresh) before suspecting the network.
- Supabase MCP has **write** access (verified: `apply_migration` applied
  20240133/20240134 successfully). It's been read-only in some earlier
  sessions when the connector wasn't authorised — if `list_tables` errors,
  fall back to handing the user SQL for the Dashboard editor, but try
  first rather than assuming.
- Useful pattern for proving an RLS/trigger hole before and after a fix:
  `BEGIN; SET LOCAL request.jwt.claims = '{"sub":"...","role":"authenticated"}';
  <attack>; ROLLBACK;`. Note `auth.role()` reads the **JWT claim**, not the
  Postgres session role — `SET LOCAL ROLE service_role` alone won't make
  `auth.role()` return `service_role`, and a leftover claim from an earlier
  statement in the same transaction will silently skew the next test.
- GitHub PR for this branch has been merged mid-session more than once —
  always check `git log origin/main` before pushing; if merged, restart
  from `origin/main` and cherry-pick any unmerged commits back on top.

## Notes vault

`notes/` is also set up as an Obsidian vault (paired with the Obsidian Git
plugin on the user's machine) for longer-form/browsable notes. This file
(`CLAUDE.md`) is for things Claude should remember automatically every
session — use `notes/` for anything meant to be read as prose in Obsidian.

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
step-number circles on Landing) and `.ai-presence-accent` (the "AI
visibility audit" chromatic hero accent, the one signature moment). Don't
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
- **Watchdog**: `recordScanOutcome()` counts consecutive all-models-failed
  scans in `provider_failures` and flips `scanning_enabled` off at
  `AUTO_DISABLE_THRESHOLD` (3), recording why in `scanning_disabled_reason`
  (`source: 'auto' | 'manual'`). A success resets the streak. It never
  re-enables itself — auto-recovery would flap (enable → fail → disable) and
  each cycle costs real users a broken scan; an admin turns it back on once
  the cause is fixed, which also clears the counter.
- `getScanSettings()` reads all three keys in one query and hands the count
  to `recordScanOutcome()`, so the happy path adds no extra round-trip.

## Admin account management

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
  the closing CTA. Edited under Settings → **Audit branding** (Agency-gated
  tab), read by `useAuditBranding.ts`. Without it a forwarded PDF sent the
  agency's client to `contact.presora@gmail.com` — i.e. to us, not to them.
- `useAuditBranding` is deliberately **not** folded into the shared
  `['profile-flags']` select: selecting a column that doesn't exist is a hard
  Postgres error (42703), and a missing migration must only downgrade the
  letterhead to Presora's, never break the report. The Settings tab surfaces
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

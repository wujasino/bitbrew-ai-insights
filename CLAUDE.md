# Presora

AI brand-visibility SaaS. React + TypeScript + Vite + Tailwind + shadcn/ui,
Netlify serverless functions, Supabase (Postgres + Auth + Storage).

## Brand palette (dark mode, app-wide)

- Background `#0B0F19` · Card `#111827` · Border `#334155`
- Text `#F8FAFC` · Muted text `#94A3B8`
- Primary / CTA / logo `#6366F1`, hover `#4F46E5`
- Secondary button (e.g. login) `#1E293B` bg + `#F8FAFC` text

Tokens live in `src/index.css` under `.dark`. Logo mark is a single indigo
glyph (`public/presora-mark-indigo.png`) — no more light/dark swap.

## Landing page (`src/pages/Landing.tsx`)

Forces **dark** theme via `useForceDarkTheme()` regardless of visitor
preference, using the same indigo palette as the rest of the app (see
Brand palette above) plus an "indigo" `GradientMeshBg` orb variant for the
hero. Uses Plus Jakarta Sans (`.font-landing` font scope).

## Wordmark font

`.font-wordmark` (in `src/index.css`) uses **Fraunces** at max optical
size (`opsz` axis maxed out) as a free stand-in for Casko (PP Casko is a
paid font, not on Google Fonts) — a sharp, high-contrast display serif.
Loaded via the main Google Fonts `<link>` in `index.html`; no separate
Fontshare dependency anymore (Satoshi was dropped).

## Social assets

`public/social/presora-avatar.png` (1024×1024, solid indigo gradient bg)
and `presora-banner.png` (1500×500, X/Twitter header size, dark navy +
dot-grid + glow, wordmark in Unbounded font) — regenerate via a Playwright
HTML render (see git history around the "Add social media avatar and
banner assets" commit for the approach) if the palette or copy changes.

## Known sandbox limitations

- No real internet in this dev/test sandbox except through the proxy —
  `fonts.googleapis.com` and `fonts.gstatic.com` work fine via `curl` and
  in Playwright/Chromium. If a webfont looks wrong in a screenshot, don't
  assume proxy flakiness — check for a stale/corrupted cached font file in
  `/tmp` first (re-`curl` it fresh) before suspecting the network.
- Supabase MCP tools are read-only here; schema/data changes need SQL run
  manually by the user via the Supabase Dashboard SQL editor.
- GitHub PR for this branch has been merged mid-session more than once —
  always check `git log origin/main` before pushing; if merged, restart
  from `origin/main` and cherry-pick any unmerged commits back on top.

## Notes vault

`notes/` is also set up as an Obsidian vault (paired with the Obsidian Git
plugin on the user's machine) for longer-form/browsable notes. This file
(`CLAUDE.md`) is for things Claude should remember automatically every
session — use `notes/` for anything meant to be read as prose in Obsidian.

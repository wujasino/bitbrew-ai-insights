# Deploy via GitHub Actions instead of Netlify's own build

**Why:** approaching Netlify's free-tier monthly build-minute cap (235/300 builds)
— every push/merge to `main` was triggering a Netlify build, and hitting the cap
would have paused deploys entirely.

**Approach:** `.github/workflows/deploy.yml` builds on GitHub Actions (`npm run
build`), then deploys the pre-built `dist/` straight to the existing Netlify site
via `netlify-cli deploy --prod --no-build`. Netlify still serves the same domain,
Functions, and `netlify.toml` redirects/headers — it just never runs its own build
for this repo anymore. Netlify's own "Stop builds" toggle (Site configuration →
Build & deploy → Continuous deployment) was also switched on so it doesn't
duplicate-build the same push.

**Gotcha hit along the way:** a git-linked Netlify site rejects
`netlify deploy --prod` via API/CLI ("Production deploys from API are disabled for
this site") until the repo is **unlinked** from git in Netlify's dashboard. Had to
unlink before the CLI deploy would work at all.

**Gotcha #2 — missing env vars:** Netlify's own build used to auto-inject
`VITE_*` env vars from Site configuration → Environment variables. GitHub Actions
has no equivalent — every `import.meta.env.VITE_*` reference in `src/` had to be
added explicitly as a GitHub repo secret and passed through in the workflow's
`env:` block, or the shipped bundle throws "Missing Supabase env vars" at import
time (`src/lib/supabase.ts` has no fallback, by design — see
[[2026-08-supabase-lite-client]]). First deploy after switching broke production
this way; fixed by adding all 15 `VITE_*` secrets.

**Rule of thumb going forward:** any new `import.meta.env.VITE_*` reference added
anywhere in `src/` needs a matching line added to `deploy.yml`'s Build step env
block, or it'll silently be `undefined` in the production bundle.

# reCAPTCHA v3 + a DDoS/abuse audit across all Netlify functions

**Trigger:** asked to "protect the database and the site from DDoS." Important
correction made up front: no website can close a visitor's browser or kick them to
their desktop — browsers are sandboxed precisely so no page can control the host
OS. That specific ask isn't a matter of effort, it's not physically possible.

**What real protection looks like here:**

1. **Audited every Netlify function for abuse protection.** Almost all already had
   it — in-memory per-IP throttles, DB-backed attempt counters (e.g.
   `verify-reset-otp.js` caps brute-force OTP guesses at 8 attempts), or
   per-API-key limits (`api-analyze.js`) — just under different naming
   conventions than a literal "rate limit" grep catches, so an initial pass
   looked worse than it actually was.
2. **One real gap found:** `referral.js`'s `claim` action had no cap. It requires
   a real auth token (not anonymously abusable at volume), but a single account
   could still spam it and hammer the Stripe API on every call. Added the same
   in-memory-per-instance throttle pattern already used elsewhere (3
   attempts/minute per user id).
3. **`badge.js` deliberately left alone** — stateless, no DB/external calls,
   already `Cache-Control: max-age=3600`. Adding a rate-limit check there would
   mean adding a DB write to a currently zero-I/O function, making it *more*
   attackable, not less.
4. **reCAPTCHA v3 added** to the three most scriptable-abuse-prone public forms:
   registration, the contact form, forgot-password OTP request. Invisible,
   score-based, fails open everywhere (missing site key → no token sent; missing
   `RECAPTCHA_SECRET_KEY` server-side → verification skipped) so a
   misconfigured/blocked widget never locks a real visitor out.
   - `src/lib/recaptcha.ts` — lazy-loads Google's v3 script, resolves a
     per-action token.
   - Registration is special: `supabase.auth.signUp()` is called straight from
     the browser with no backend function in front of it, so a standalone
     `verify-recaptcha.js` pre-flight function gates it instead.

**Scope note, worth remembering:** true volumetric DDoS (raw traffic flooding) is
an infrastructure-layer concern — Netlify's/Supabase's own edge protections, not
something application code can address. What rate limits + reCAPTCHA actually
protect against is *targeted abuse of specific expensive or sensitive operations*
(AI calls, OTP guessing, credit/reward claims, form spam) — that's the realistic
threat model for a Netlify Functions + Supabase stack, and it's a different
problem from "someone floods the network."

**Setup still needed outside the repo** (can't be done from here):
- `VITE_RECAPTCHA_SITE_KEY` as a GitHub repo secret (public value, safe)
- `RECAPTCHA_SECRET_KEY` as a Netlify environment variable (private)

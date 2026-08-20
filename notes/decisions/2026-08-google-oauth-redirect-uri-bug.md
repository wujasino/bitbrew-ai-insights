# Google sign-in broke after the www domain switch — redirect_uri drift

**Symptom:** `Failed to load resource: 400 () /.netlify/functions/google-token-exchange` +
`Google callback error: Error: Invalid redirect_uri` in the browser console. Google
sign-in stopped working entirely on production.

**Root cause:** [[2026-08-www-primary-domain]] made `presora.app` (apex) start
redirecting to `www.presora.app`. That exposed a pre-existing drift: the two halves
of the Google OAuth PKCE flow each computed `redirect_uri` a different way —

- `signInWithGoogle()` (authorize step, `src/lib/googleAuth.ts`): preferred
  `VITE_SITE_URL` over `window.location.origin`.
- `GoogleCallback.tsx` (token-exchange step): used `window.location.origin` alone.

Google requires these two values to match byte-for-byte or the exchange fails. The
two happened to agree before the domain redirect existed; once real traffic could
land on either `presora.app` or `www.presora.app`, they didn't always match anymore.

**Fix:** one exported `getGoogleRedirectUri()` in `googleAuth.ts`, used by both call
sites — can't drift by construction now. Also hardened
`netlify/functions/google-token-exchange.js`'s own `ALLOWED_REDIRECT_URIS` allowlist
to strip a trailing slash from `VITE_SITE_URL` before comparing (a
`"https://www.presora.app/"` vs `"https://www.presora.app"` mismatch there would
400 every sign-in identically to a genuinely wrong redirect_uri, from the outside).

**Lesson:** any two places that must independently derive the *same* URL/value for a
security check (OAuth redirect_uri, webhook signatures, etc.) should share one
function, not two independent copies that "happen" to agree — the day they stop
agreeing is usually far away from the day the shared assumption was made, and the
failure mode by then gives no hint about *why*.

See also: [[2026-08-www-primary-domain]]

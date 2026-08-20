# Email templates were years behind the site's actual brand

`src/email-templates/*.html` (reference copies meant to be pasted into Supabase
Auth's Email Templates dashboard — Supabase doesn't read them from git) had drifted
from the live site in three ways, found and fixed one layer at a time:

1. **Wrong domain** — linked `https://presora.app` (no www) instead of the
   canonical `https://www.presora.app` used everywhere else (see
   [[2026-08-www-primary-domain]]).
2. **Wrong logo** — `presora-mark-indigo.png`, the old solid-indigo glyph from
   before the "ribbon P" redesign. Swapped to the current mark.
3. **Logo loaded as an external image** — many email clients block/strip
   remotely-hosted images by default, so the logo often never rendered at all.
   Fixed by embedding it as a `data:image/png;base64,...` URI directly in each
   `<img src>` instead.
4. **`unsubscribe-newsletter.js`'s confirmation page** was on a completely
   different, older palette (`#0f0f0f`/`#1a1a1a`/`#2a2a2a`, cream `#F7F1DD` text)
   — disconnected from the current brand tokens everywhere else
   (`#0B0F19`/`#111827`/`#334155`/`#F8FAFC`/`#94A3B8`/`#6366F1`).

**The bigger catch:** fixing the reference `.html` files alone changed nothing in
production. `newsletter.js` and `send-reset-otp.js` build their *actual* sent
email HTML **inline** in the function itself (self-contained, no filesystem
reads — explicit design choice, see their own comments) — they never read from
`src/email-templates/`. Both still had the old logo URL and bare domain until
fixed separately. Lesson: when "the email template" turns out to live in two
places (a reference copy + an inlined real one), fixing only the reference copy
gives a false sense of the bug being closed.

**New reference templates added** for Supabase slots that had none: MFA method
added/removed (Presora supports TOTP MFA, so these are genuinely live), Email
address changed (the post-change notification to the *old* address — distinct
from `change-email.html`, which is the click-to-confirm link sent to the *new*
address), and Magic Link/OTP (added on request even though `signInWithOtp()` isn't
called anywhere in the codebase yet — filled in for whenever it might be).

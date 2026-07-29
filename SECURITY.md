# Security Policy

Presora is a hosted SaaS product. There are no released versions to support —
[presora.app](https://presora.app) always runs the latest code from `main`, and every fix
ships to all users at once.

## Reporting a vulnerability

Please report security issues privately. **Do not open a public GitHub issue.**

- **Email:** contact.presora@gmail.com
- **GitHub:** [private security advisory](https://github.com/wujasino/presora/security/advisories/new)

Helpful things to include: affected endpoint or page, steps to reproduce, impact, and any
proof-of-concept. Screenshots or a short recording are welcome.

### What to expect

| Stage | Timeline |
|-------|----------|
| Acknowledgement of your report | within 48 hours |
| Initial assessment and severity triage | within 5 business days |
| Fix for critical issues | as fast as possible, typically days |
| Fix for lower-severity issues | next regular release cycle |
| Follow-up once resolved | you'll be told what shipped |

Presora is maintained by one person, so there is no paid bug bounty. Valid reports are
credited by name in the release notes if you'd like — just say so in your report.

## Scope

**In scope**
- `presora.app` and its subdomains
- The serverless API under `/.netlify/functions/*`
- This repository's source code
- Authentication, session handling, and account recovery flows
- Billing and subscription logic
- Data isolation between accounts

**Out of scope**
- Findings in third-party services (Supabase, Netlify, Stripe, Anthropic, Voyage,
  ElevenLabs, Resend, Mailchimp) — report those to the vendor
- Denial of service, volumetric, or brute-force testing against production
- Social engineering, phishing, or physical attacks
- Missing security headers with no demonstrated impact
- Automated scanner output without a working proof-of-concept
- Reports that require a fully compromised device or browser

## Testing guidelines

If you're probing for issues, please:

- Use your own account and your own test data
- Never access, modify, or exfiltrate another user's data — if you find a way to, stop and report it
- Don't run load tests, fuzzers, or scanners against production
- Use Stripe test mode; do not attempt real transactions

Research conducted in good faith and within these guidelines will not be pursued.

## Measures already in place

Documented so you don't spend time on ground that's already covered:

- Row-Level Security on every user-owned table, with serverless functions scoping writes
  to a JWT-verified user id rather than a client-supplied one
- Per-user and per-window rate limiting, plus a separate quota path for guest usage
- OTP-based password reset with attempt lockout, and one-time recovery codes
- Stripe webhook signature verification on every incoming event
- Google OAuth routed through a proxy redirect so the Supabase project reference stays
  out of the browser
- Strict Content-Security-Policy with an explicit allow-list, HSTS with preload,
  `X-Frame-Options: DENY`, MIME-sniff protection, and a scoped Permissions-Policy
- Secrets held in environment variables only; nothing sensitive is committed to the repo

## Disclosure

Please give a fix a reasonable window before publishing. Coordinated disclosure is the
default, and you'll be kept in the loop on timing.

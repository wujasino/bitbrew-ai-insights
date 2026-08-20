# www.presora.app as the primary domain (fixing a Google Search Console noindex report)

**Problem found:** Google Search Console's Page Indexing report showed two issues,
both only on the bare `presora.app` (no www) apex domain:

- "Page contains a redirect" — `presora.app/pricing/`, `presora.app/regulamin-newslettera/`
- "Excluded by noindex tag" — `presora.app/about`, `/contact`, `/login`, `/docs/api`,
  `/pricing`, `/regulamin-newslettera`

**Diagnosis:** every canonical tag, the sitemap, and all JSON-LD in this app already
consistently pointed at `https://www.presora.app`. But Netlify automatically stamps
`X-Robots-Tag: noindex` on any domain that isn't the site's configured **primary
domain** — and `presora.app` (apex) wasn't set as primary, `www.presora.app` was
supposed to be but the apex alias wasn't correctly deferring to it. Google was
crawling the apex directly (probably from an old backlink or someone typing it
without www) and seeing the noindex header, regardless of what the page's own HTML
said.

**Fix:** set `www.presora.app` as the Primary domain in Netlify's Domain management
— done in the Netlify dashboard, not fixable from the repo (this setting isn't in
`netlify.toml`). Apex now 301-redirects to www.

**Side effect worth remembering:** this domain-redirect change is what exposed
[[2026-08-google-oauth-redirect-uri-bug]] — Google sign-in broke because two code
paths computed `redirect_uri` differently and had silently agreed by coincidence
until real traffic started landing on both domains.

**Follow-up cleanup:** a leftover `bitbrew.pl` domain (the product's old name,
before the rebrand to Presora) was still attached to the Netlify site as a domain
alias, so link previews sometimes showed the old brand/domain instead of Presora.
Removed from Netlify's domain settings and its DNS records — nothing in the
codebase ever referenced "bitbrew" (confirmed via full-repo grep), so this was
purely a leftover infra attachment, not a code bug.

/**
 * Cloudflare Worker entry point for the static site.
 *
 * Workers Static Assets' `_redirects` file only supports proxy (200)
 * redirects to *relative* paths — unlike classic Cloudflare Pages, it
 * rejects any rule pointing at an external origin ("Proxy (200) redirects
 * can only point to relative paths"). Since netlify/functions/*.js stays on
 * Netlify (see CLAUDE.md's "Hosting split" section), the app still needs
 * same-origin /.netlify/functions/* and /api/v1/* paths to resolve
 * somewhere — this script does that proxying itself, in real code, instead
 * of a declarative redirects file.
 *
 * Everything else falls through to env.ASSETS.fetch(), which serves the
 * built dist/ files (SPA fallback handled by wrangler.toml's
 * `not_found_handling`).
 */

const NETLIFY_ORIGIN = 'https://presora-app.netlify.app';
const SUPABASE_AUTH_CALLBACK = 'https://wxwdymchrmhxeiccnzg.supabase.co/auth/v1/callback';

function proxy(request, targetUrl) {
  const upstream = new URL(targetUrl);
  return fetch(new Request(upstream, request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www → apex redirect. Netlify's own "primary domain" setting used to
    // do this; that config lived on Netlify's side, not in this repo, and
    // stopped applying once the DNS records moved to Cloudflare Custom
    // Domains, so it has to be replicated here now that both hostnames
    // point at this Worker independently.
    if (url.hostname === 'www.presora.app') {
      url.hostname = 'presora.app';
      return Response.redirect(url.toString(), 301);
    }

    // Google OAuth proxy — hides the Supabase project ID.
    if (url.pathname === '/auth/callback') {
      const target = new URL(SUPABASE_AUTH_CALLBACK);
      target.search = url.search;
      return proxy(request, target);
    }

    // Netlify Functions — reverse-proxied so the browser still sees a
    // same-origin /.netlify/functions/* path.
    if (url.pathname.startsWith('/.netlify/functions/')) {
      return proxy(request, NETLIFY_ORIGIN + url.pathname + url.search);
    }

    // Public API (ApiDocs.tsx) — same proxy target, its own clean path.
    if (url.pathname === '/api/v1/analyze') {
      return proxy(request, NETLIFY_ORIGIN + '/.netlify/functions/api-analyze' + url.search);
    }
    if (url.pathname === '/api/v1/analyses') {
      return proxy(request, NETLIFY_ORIGIN + '/.netlify/functions/api-analyses' + url.search);
    }

    return env.ASSETS.fetch(request);
  },
};

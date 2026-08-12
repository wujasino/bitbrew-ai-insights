import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocaleProvider } from './lib/locale';
import { ThemeProvider } from 'next-themes';
import { supabase } from './lib/supabase';
import * as Sentry from '@sentry/react';

// Off until VITE_SENTRY_DSN is set — no account exists for this project yet,
// so this stays a no-op rather than shipping a broken/empty DSN. Add the env
// var (Sentry project settings → Client Keys) to turn on error monitoring.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// Same pattern as Sentry above — off until VITE_PLAUSIBLE_DOMAIN is set (no
// account exists yet). Plausible over GA4: cookieless, no consent banner
// required under GDPR, one <script> tag, no vendor SDK to bundle.
if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

// Belt-and-suspenders session refresh: supabase-js already auto-refreshes
// the access token on a timer, but that timer is paused while the tab is
// hidden/frozen (mobile browsers routinely discard background tabs for
// hours). Without this, a user who reopens a long-dormant tab can hit the
// first API call with an already-expired token before the timer catches up,
// which looks exactly like "I got logged out for no reason". getSession()
// transparently refreshes if the stored token is stale, so this is a no-op
// most of the time and cheap either way.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession();
  }
});

// Self-XSS protection
if (typeof console !== 'undefined') {
  const stop = [
    '%cSTOP!',
    'color:#FF0000;font-size:48px;font-weight:bold;-webkit-text-stroke:2px black',
  ];
  const warn = [
    '%cTo jest funkcja przeglądarki przeznaczona dla deweloperów.\nJeśli ktoś kazał Ci tu coś wkleić, aby uzyskać dostęp do Twojego konta — jest to atak (Self-XSS).\nNIE wklejaj żadnego kodu.',
    'font-size:14px;color:#333;',
  ];
  console.log(...stop);
  console.log(...warn);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="bb_theme">
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </ThemeProvider>
);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocaleProvider } from './lib/locale';
import { ThemeProvider } from 'next-themes';
import { supabase } from './lib/supabase';

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

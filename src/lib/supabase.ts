import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

// Explicit even though these match the client's own defaults — spelled out
// so "why do I get logged out" is never blamed on this file again: the
// session (incl. refresh token) is persisted in localStorage and silently
// refreshed in the background for as long as Supabase's own refresh-token
// lifetime allows (a project-level Auth setting, not something this app
// controls). The "Remember me" checkbox on Login.tsx is unrelated — it only
// pre-fills the email field and tweaks landing-page copy for returning
// visitors, it has never affected how long a session lasts.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
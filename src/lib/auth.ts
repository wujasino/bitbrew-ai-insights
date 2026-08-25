import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { getRecaptchaToken } from './recaptcha';

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string;
};

// Transient: Supabase Auth is momentarily overloaded/rate-limiting (a real
// traffic spike, e.g. many people signing up/in at once) or the request
// never reached it (network blip). Distinct from a real rejection like
// "Invalid login credentials" / "User already registered", which must never
// be retried — retrying those just re-shows the same answer after a delay.
const isTransientAuthError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  if (status === 429 || (typeof status === 'number' && status >= 500)) return true;
  const message = (error as { message?: string })?.message || '';
  return /rate limit|failed to fetch|network/i.test(message);
};

export async function registerUser(email: string, password: string, referralCode?: string) {
  // signUp() below goes straight from the browser to Supabase — no backend
  // function of ours sits in front of it to hook a reCAPTCHA check into, so
  // this pre-flight call to verify-recaptcha.js gates registration as a
  // separate step instead. Throws the same shape signUp()'s own errors do
  // (a message string) so callers don't need a special case for it.
  const recaptchaToken = await getRecaptchaToken('register');
  const verifyRes = await fetch('/.netlify/functions/verify-recaptcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: recaptchaToken, action: 'register' }),
  });
  const verifyData = await verifyRes.json().catch(() => ({ ok: true }));
  if (verifyRes.ok && verifyData.ok === false) {
    throw new Error('reCAPTCHA verification failed. Please try again.');
  }

  // referral_code lands in raw_user_meta_data, which handle_new_user() reads
  // to record the referral atomically at account-creation time — see
  // supabase/migrations/20240117_referrals.sql.
  const options = referralCode ? { data: { referral_code: referralCode } } : undefined;
  const attemptSignUp = () => supabase.auth.signUp({ email, password, options });
  let { data, error } = await attemptSignUp();
  if (error && isTransientAuthError(error)) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    ({ data, error } = await attemptSignUp());
  }
  if (error) throw error;
  return data;
}

export async function loginUser(email: string, password: string) {
  const attempt = () => supabase.auth.signInWithPassword({ email, password });
  let { data, error } = await attempt();
  if (error && isTransientAuthError(error)) {
    // One retry after a short delay is enough to ride out a brief spike
    // without making a real credential failure feel slow.
    await new Promise(resolve => setTimeout(resolve, 1200));
    ({ data, error } = await attempt());
  }
  if (error) throw error;
  return data;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || null,
    name: user.user_metadata?.name
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

export async function logout() {
  await supabase.auth.signOut();
}

// Like logout(), but also drops every cached query (session-user, profile,
// plan, etc.) so a stale account's data can't leak into the next login on
// this browser — see Login.tsx's "already signed in" handling.
export async function logoutAndClearSession() {
  await supabase.auth.signOut();
  queryClient.clear();
}

export default { registerUser, loginUser, getAuthUser, isAuthenticated, logout, logoutAndClearSession };
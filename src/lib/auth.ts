import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { getRecaptchaToken } from './recaptcha';

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string;
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
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throw error;
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
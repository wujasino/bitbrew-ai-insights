import { supabase } from './supabase';

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string;
};

export async function registerUser(email: string, password: string, referralCode?: string) {
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

export default { registerUser, loginUser, getAuthUser, isAuthenticated, logout };
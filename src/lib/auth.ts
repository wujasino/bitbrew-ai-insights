import { supabase } from './supabase';

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string;
};

export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
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

/**
 * Whether the current session still needs a TOTP challenge before it's
 * fully trusted (AAL2). True for a verified-but-unchallenged factor
 * regardless of which login path created the session (password, Google, a
 * stale token) — this is the single place that closes the "sign in via
 * Google skips 2FA" gap, so callers besides ProtectedRoute should route
 * through it too rather than re-deriving AAL state themselves.
 */
export async function needsMfaChallenge(): Promise<{ required: boolean; factorId?: string }> {
  const { data: mfaData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !mfaData) return { required: false };
  if (mfaData.nextLevel !== 'aal2' || mfaData.currentLevel === 'aal2') return { required: false };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactor = factors?.totp?.find(f => f.status === 'verified');
  if (!totpFactor) return { required: false };
  return { required: true, factorId: totpFactor.id };
}

export async function logout() {
  await supabase.auth.signOut();
}

export default { registerUser, loginUser, getAuthUser, isAuthenticated, logout };
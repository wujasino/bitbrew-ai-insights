import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Keep in sync with the Pricing page copy AND the real enforcement in
 * enforce_analysis_limit() (supabase/migrations/20240112_fix_analysis_limit_tiers.sql)
 * — these numbers used to say Solo:30/Growth:120, which didn't match either
 * the 10/50 the Pricing page promises or what the database actually allows.
 */
export const PLAN_LIMITS: Record<string, number> = {
  Free: 3,
  Starter: 5,
  Solo: 10,
  Growth: 50,
  Enterprise: 999999,
  Agency: 999999, // some accounts have this stored instead of 'Enterprise' (same tier, matches the Pricing page's "Agency" tier)
};

/** Friendly display name per plan — keep in sync with Pricing.tsx's tier names. */
export const PLAN_LABELS: Record<string, string> = {
  Free: 'Free',
  Starter: 'Starter',
  Solo: 'Solo',
  Growth: 'Business',
  Enterprise: 'Agency',
  Agency: 'Agency', // some accounts have this stored instead of 'Enterprise'
};

/** Numeric plan tier — gates feature access (charts, sources, model roster). */
export const PLAN_TIER: Record<string, number> = {
  free: 0,
  starter: 1,
  solo: 1,
  growth: 2,
  enterprise: 2,
  agency: 2, // some accounts have this stored instead of 'enterprise' (same tier, matches the Pricing page's "Agency" tier)
};
export const tierOf = (plan: string) => PLAN_TIER[plan.toLowerCase()] ?? 0;

/**
 * True only for the Agency tier specifically — Growth/Business shares the
 * same numeric PLAN_TIER (2) but doesn't unlock agency-only features like
 * the client-ready audit export, so tierOf() alone can't gate this.
 */
export const isAgencyPlan = (plan: string) => {
  const p = plan.toLowerCase();
  return p === 'agency' || p === 'enterprise';
};

export interface SessionUser {
  id: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

const toSessionUser = (session: { user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null): SessionUser => ({
  id: session?.user?.id ?? null,
  email: session?.user?.email ?? null,
  name: (session?.user?.user_metadata?.full_name as string | undefined) ?? null,
  avatar: (session?.user?.user_metadata?.avatar_url as string | undefined) ?? null,
});

const fetchSessionUser = async (): Promise<SessionUser> => {
  const { data: { session } } = await supabase.auth.getSession();
  return toSessionUser(session);
};

/**
 * Cached by react-query (keyed globally, not per-component) so auth state
 * doesn't flash back to signed-out every time a component using it remounts
 * — every protected route wraps its own AppShell instance instead of
 * sharing one via a layout route, so the sidebar/navbar/widgets that read
 * this all remount on every navigation. Stays live across sign-in/sign-out
 * (e.g. after an OAuth redirect) by pushing auth state changes straight into
 * the query cache instead of waiting for a remount to refetch.
 */
export const useSessionUser = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['session-user'], queryFn: fetchSessionUser });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData<SessionUser>(['session-user'], toSessionUser(session));
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return query;
};

const fetchPlan = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single();
  return data?.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free';
};

/**
 * Waits for useSessionUser to resolve before firing — querying before the
 * session is known would otherwise get treated as "signed out" and that
 * wrong answer would stick in the react-query cache instead of
 * self-correcting on the next remount like the old per-component state did.
 */
export const usePlan = () => {
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const userId = sessionUser?.id ?? null;
  return useQuery({
    queryKey: ['profile-plan', userId],
    queryFn: () => fetchPlan(userId as string),
    enabled: !userLoading && !!userId,
    placeholderData: 'Free',
  });
};

const fetchIsAdmin = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
  return data?.is_admin ?? false;
};

/**
 * Gates the /admin/announcements broadcast tool. Deliberately has no
 * placeholderData (unlike usePlan's 'Free') — a `false` placeholder would
 * be indistinguishable from a real "not admin" answer and would redirect
 * an actual admin away before the real value loads. isLoading stays true
 * (data stays undefined) until the query genuinely resolves.
 */
export const useIsAdmin = () => {
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const userId = sessionUser?.id ?? null;
  return useQuery({
    queryKey: ['profile-is-admin', userId],
    queryFn: () => fetchIsAdmin(userId as string),
    enabled: !userLoading && !!userId,
  });
};

const fetchAnalysesUsedThisMonth = async (userId: string) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());
  return count ?? 0;
};

export const useAnalysesUsedThisMonth = () => {
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const userId = sessionUser?.id ?? null;
  return useQuery({
    queryKey: ['analyses-used-this-month', userId],
    queryFn: () => fetchAnalysesUsedThisMonth(userId as string),
    enabled: !userLoading && !!userId,
    placeholderData: 0,
  });
};


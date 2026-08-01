import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/** Keep in sync across every place that reads/limits credits by plan. */
export const PLAN_LIMITS: Record<string, number> = {
  Free: 3,
  Starter: 5,
  Solo: 30,
  Growth: 120,
  Enterprise: 9999,
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

const fetchHasScanHistory = async (userId: string) => {
  // Fail open on a query error — don't lock out a returning user with real
  // history just because of a transient network blip.
  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return error ? true : (count ?? 0) > 0;
};

/**
 * Same caching + gating rationale as usePlan. Getting this one wrong is the
 * most visible: RequireScanHistory redirects /dashboard -> /brand-visibility
 * whenever this reads false, so a premature "signed out" read getting
 * cached here sent returning users with real history to the scan screen
 * every time they clicked Home, instead of the dashboard hub.
 */
export const useHasScanHistory = () => {
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const userId = sessionUser?.id ?? null;
  return useQuery({
    queryKey: ['has-scan-history', userId],
    queryFn: () => fetchHasScanHistory(userId as string),
    enabled: !userLoading && !!userId,
  });
};

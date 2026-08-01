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

const fetchPlan = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'Free';
  const { data } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single();
  return data?.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free';
};

/**
 * Cached by react-query (keyed globally, not per-component) so the plan
 * doesn't flash back to the 'Free' default every time a component using it
 * remounts — every protected route wraps its own AppShell instance instead
 * of sharing one via a layout route, so the sidebar/navbar/widgets that read
 * this all remount on every navigation.
 */
export const usePlan = () => useQuery({ queryKey: ['profile-plan'], queryFn: fetchPlan });

const fetchAnalysesUsedThisMonth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', startOfMonth.toISOString());
  return count ?? 0;
};

export const useAnalysesUsedThisMonth = () =>
  useQuery({ queryKey: ['analyses-used-this-month'], queryFn: fetchAnalysesUsedThisMonth });

export interface SessionUser {
  email: string | null;
  name: string | null;
  avatar: string | null;
}

const fetchSessionUser = async (): Promise<SessionUser> => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    email: session?.user?.email ?? null,
    name: session?.user?.user_metadata?.full_name ?? null,
    avatar: session?.user?.user_metadata?.avatar_url ?? null,
  };
};

/**
 * Same caching rationale as usePlan, plus stays live across sign-in/sign-out
 * (e.g. after an OAuth redirect) by pushing auth state changes straight into
 * the query cache instead of waiting for a remount to refetch.
 */
export const useSessionUser = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['session-user'], queryFn: fetchSessionUser });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData<SessionUser>(['session-user'], {
        email: session?.user?.email ?? null,
        name: session?.user?.user_metadata?.full_name ?? null,
        avatar: session?.user?.user_metadata?.avatar_url ?? null,
      });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return query;
};

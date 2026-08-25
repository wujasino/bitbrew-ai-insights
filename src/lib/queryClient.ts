import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Tracked outside React (a plain module-level pub-sub) so any component can
// read "is the backend actually reachable right now" without prop-drilling
// it down from wherever the failing query lives — flipped by the
// QueryCache's global onError/onSuccess below, not tied to one query.
//
// Most queryFns in this codebase already swallow Supabase's own {error}
// responses and fail open with a default value (see fetchProfileFlags,
// useScanStatus, etc.) — a query actually throwing up to here is a strong
// signal of real connectivity failure (network down, Supabase unreachable),
// not a normal "not found"/RLS-denied case, which are handled as component
// state elsewhere (see loadStoredAnalysis's notFound handling) rather than
// as a thrown react-query error.
type BackendHealthListener = (healthy: boolean) => void;
const healthListeners = new Set<BackendHealthListener>();
let backendHealthy = true;

const setBackendHealthy = (healthy: boolean) => {
  if (backendHealthy === healthy) return;
  backendHealthy = healthy;
  healthListeners.forEach(listener => listener(healthy));
};

export const subscribeBackendHealth = (listener: BackendHealthListener) => {
  healthListeners.add(listener);
  return () => { healthListeners.delete(listener); };
};

export const getBackendHealthy = () => backendHealthy;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => setBackendHealthy(false),
    onSuccess: () => setBackendHealthy(true),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Long enough that the persisted cache below still has something to
      // show, read-only, through a multi-hour outage — not just the default
      // 5 minutes, which would otherwise evict everything long before a
      // real incident resolves.
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    },
  },
});

// Read-only offline cache (Line 3): survives a full page reload/browser
// restart during an outage, so a visitor sees their last-known dashboard
// state instead of a blank loading screen or a crash. Cleared explicitly on
// logout (see logoutAndClearSession in auth.ts) so a signed-out browser
// never keeps a previous account's cached data in localStorage.
export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'presora-query-cache',
});

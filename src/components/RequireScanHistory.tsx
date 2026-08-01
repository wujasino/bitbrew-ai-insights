import { Navigate } from 'react-router-dom';
import { useHasScanHistory } from '@/hooks/useAccountInfo';

// Gate for the Home/Reports hub (/dashboard): a user who has never run a
// scan has nothing to see there, so send them to /brand-visibility to run
// their first one instead of showing an empty hub. Assumes the caller has
// already verified authentication (wrap with ProtectedRoute).
const RequireScanHistory = ({ children }: { children: JSX.Element }) => {
  // isPending (not isLoading) — this query is gated on the session being
  // known (see useHasScanHistory), so isLoading can read false while we're
  // still waiting on that gate to open. isPending reflects "no answer yet"
  // regardless of why, which is what determines whether it's safe to act
  // on `hasScanned` below.
  const { data: hasScanned = false, isPending } = useHasScanHistory();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!hasScanned) {
    return <Navigate to="/brand-visibility" replace />;
  }

  return children;
};

export default RequireScanHistory;

import { Navigate } from 'react-router-dom';
import { useHasScanHistory } from '@/hooks/useAccountInfo';

// Gate for the Home/Reports hub (/dashboard): a user who has never run a
// scan has nothing to see there, so send them to /brand-visibility to run
// their first one instead of showing an empty hub. Assumes the caller has
// already verified authentication (wrap with ProtectedRoute).
const RequireScanHistory = ({ children }: { children: JSX.Element }) => {
  const { data: hasScanned = false, isLoading } = useHasScanHistory();

  if (isLoading) {
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

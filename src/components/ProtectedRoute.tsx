import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { needsMfaChallenge } from '@/lib/auth';
import { MfaChallengeGate } from '@/components/MfaChallengeGate';

type Phase = 'loading' | 'authenticated' | 'mfa-required' | 'unauthenticated' | 'error';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setPhase('unauthenticated');
          return;
        }

        // Enforce AAL2 here — the one gate every protected route passes through,
        // regardless of whether the session came from password login, Google,
        // or a stale token, so a verified TOTP factor can't be skipped.
        const mfa = await needsMfaChallenge();
        if (mfa.required && mfa.factorId) {
          setMfaFactorId(mfa.factorId);
          setPhase('mfa-required');
          return;
        }

        setPhase('authenticated');
        setError(null);
      } catch (err) {
        setError('Error checking session. Check the browser console.');
        setPhase('error');
      }
    };

    checkSession();
  }, []);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Configuration error</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">Sprawdź plik <code className="bg-secondary p-1 rounded">.env</code></p>
        </div>
      </div>
    );
  }

  if (phase === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (phase === 'mfa-required') {
    return <MfaChallengeGate factorId={mfaFactorId} onVerified={() => setPhase('authenticated')} />;
  }

  return children;
};

export default ProtectedRoute;


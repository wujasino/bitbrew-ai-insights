import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  factorId: string;
  onVerified: () => void;
}

/** Full-page TOTP prompt shown by ProtectedRoute when a session is authenticated
 * at AAL1 but the account has a verified factor requiring AAL2 — the same gate
 * regardless of whether the session came from password login, Google, or a
 * stale token, so 2FA can't be skipped by using a different sign-in path. */
export function MfaChallengeGate({ factorId, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyErr) throw verifyErr;
      onVerified();
    } catch {
      setError('Invalid code. Check your app and try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/60 p-8 space-y-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-display text-foreground">Two-factor verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-3">
          <Input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className="h-11 text-center text-xl tracking-widest font-bold"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
            Verify
          </Button>
        </form>
      </div>
    </div>
  );
}

export default MfaChallengeGate;

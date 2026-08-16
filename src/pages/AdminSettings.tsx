import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Power, Tag, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useIsAdmin } from '@/hooks/useAccountInfo';
import { Button } from '@/components/ui/button';

/**
 * Admin kill-switch for brand scanning (app_settings.scanning_enabled).
 * Turning it off makes the app tell users scanning is paused instead of
 * letting every scan fail on the model calls — useful when OpenRouter
 * can't serve requests (no credits, revoked key, provider outage).
 */
const AdminSettings = () => {
  const { data: isAdmin = false, isLoading } = useIsAdmin();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const authedFetch = useCallback(async (init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You must be signed in.');
    const res = await fetch('/.netlify/functions/toggle-scanning', {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(init?.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setStatus('loading');
    authedFetch()
      .then((json) => {
        setEnabled(json.enabled);
        setUpdatedAt(json.updatedAt);
        setStatus('idle');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [isAdmin, authedFetch]);

  const toggle = async (next: boolean) => {
    setStatus('saving');
    setMessage('');
    try {
      await authedFetch({ method: 'POST', body: JSON.stringify({ enabled: next }) });
      setEnabled(next);
      setUpdatedAt(new Date().toISOString());
      setStatus('ok');
      setMessage(next ? 'Scanning is back on.' : 'Scanning paused for all users.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Power className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-2xl font-display text-foreground">Scanning</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6 ml-12">
          Pause brand scanning across the whole app. Users get an honest
          "scanning is paused" message instead of a failed scan, guests don't
          burn their free allowance, and scheduled re-scans are skipped.
        </p>

        <div className="rounded-2xl border border-border bg-card/60 p-6">
          {status === 'loading' || enabled === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading current state…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <p className="text-sm font-medium text-foreground">
                      {enabled ? 'Scanning is enabled' : 'Scanning is paused'}
                    </p>
                  </div>
                  {updatedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last changed {new Date(updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant={enabled ? 'outline' : 'default'}
                  disabled={status === 'saving'}
                  onClick={() => toggle(!enabled)}
                  className="gap-1.5 shrink-0"
                >
                  {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {enabled ? 'Pause scanning' : 'Enable scanning'}
                </Button>
              </div>

              {message && (
                <div className={`mt-4 flex items-start gap-2 text-sm ${status === 'error' ? 'text-destructive' : 'text-emerald-500'}`}>
                  {status === 'error'
                    ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{message}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm">
          <Link to="/admin/pricing" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Tag className="w-3.5 h-3.5" /> Custom plan price
          </Link>
          <Link to="/admin/announcements" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

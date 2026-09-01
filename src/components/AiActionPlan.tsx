import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ActionStep {
  title: string;
  description: string;
}

interface ActionPlan {
  whyIgnored: string;
  steps: ActionStep[];
  quickWin: string;
}

/**
 * "Twój automatyczny plan naprawczy AI (Beta)" — renders directly under the
 * red "AI recommends your competitors" alert in Dashboard's ScoreHero
 * (only shown there, so only ever mounted when score < 60). Calls
 * generate-action-plan.js once per analysis; the function itself caches
 * the result on the row, so revisiting the same report is a plain read.
 *
 * The per-step checkboxes are decorative only (plain HTML, no onChange,
 * never persisted) — the point is the psychological to-do-list effect the
 * spec asked for, not a real tracked task list.
 */
export const AiActionPlan = ({ analysisId }: { analysisId: string }) => {
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlan(null);
    setError(false);
    setLoading(true);

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setLoading(false); setError(true); }
        return;
      }
      try {
        const res = await fetch('/.netlify/functions/generate-action-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ analysisId }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled) setPlan(data.plan);
      } catch (err) {
        console.error('AiActionPlan: failed to generate plan:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [analysisId]);

  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.4 }}
      className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Twój automatyczny plan naprawczy AI
        </p>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          Beta
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generuję plan naprawczy…
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground/90 mb-1">🛑 Dlaczego AI Cię pomija?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{plan.whyIgnored}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/90 mb-2">🛠️ Plan naprawczy (krok po kroku)</p>
            <ul className="space-y-2">
              {plan.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  {/* Decorative only — no onChange, nothing persisted. */}
                  <input
                    type="checkbox"
                    aria-hidden="true"
                    tabIndex={-1}
                    readOnly
                    className={cn(
                      'mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-border accent-primary cursor-default'
                    )}
                  />
                  <span className="text-xs text-foreground/90 leading-relaxed">
                    <span className="font-medium">{i + 1}. {step.title}:</span>{' '}
                    <span className="text-muted-foreground">{step.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/90 mb-1">💡 Szybka wygrana</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{plan.quickWin}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AiActionPlan;

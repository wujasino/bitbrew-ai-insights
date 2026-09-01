import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2, Zap, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Priority = 'high' | 'medium' | 'low';

interface ActionStep {
  title: string;
  description: string;
  priority?: Priority;
  category?: string;
}

interface ActionPlan {
  whyIgnored: string;
  steps: ActionStep[];
  quickWin: string;
}

const PRIORITY_STYLE: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High priority', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' },
  medium: { label: 'Medium priority', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' },
  low: { label: 'Low priority', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25' },
};

const StepRow = ({ step, index }: { step: ActionStep; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  // Decorative only — local UI state, never persisted or sent anywhere.
  // The strike-through on check is the psychological "done" cue the design
  // asked for, not a real tracked task.
  const [done, setDone] = useState(false);
  const priority = step.priority && PRIORITY_STYLE[step.priority] ? step.priority : null;

  return (
    <li className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={done}
          onChange={() => setDone((v) => !v)}
          className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-border accent-primary cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {priority && (
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide border', PRIORITY_STYLE[priority].className)}>
                {PRIORITY_STYLE[priority].label}
              </span>
            )}
            {step.category && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border/60">
                {step.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs font-medium text-foreground/90', done && 'line-through text-muted-foreground')}>
              {index + 1}. {step.title}
            </span>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')} />
          </div>
          {expanded && (
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          )}
        </button>
      </div>
    </li>
  );
};

/**
 * "AI Action Plan & GEO Recommendations (Beta)" — renders directly under
 * the red "AI recommends your competitors" alert in Dashboard's ScoreHero
 * (only mounted when score < 60). Calls generate-action-plan.js once per
 * analysis; the function itself caches the result on the row, so revisiting
 * the same report is a plain read.
 *
 * Two-column layout (checklist left, Quick Win pinned right) per the
 * requested design — checkboxes and the expand/collapse per step are local
 * UI state only, never persisted; the point is the to-do-list feel, not a
 * real tracked task list.
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
      <div className="flex items-center gap-2 mb-0.5">
        <ClipboardList className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">AI Action Plan &amp; GEO Recommendations</p>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          Beta
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Prioritized checklist generated by AI to improve your brand visibility in LLMs.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generuję plan naprawczy…
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* Left column (~70%) — why-ignored + checklist */}
          <div className="lg:col-span-7 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground/90 mb-1">🛑 Dlaczego AI Cię pomija?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{plan.whyIgnored}</p>
            </div>
            <ul className="space-y-2">
              {plan.steps.map((step, i) => (
                <StepRow key={i} step={step} index={i} />
              ))}
            </ul>
          </div>

          {/* Right column (~30%) — Quick Win, pinned */}
          <div className="lg:col-span-3">
            <div className="h-full rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-foreground/90">Quick Win</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{plan.quickWin}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AiActionPlan;

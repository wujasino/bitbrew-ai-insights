import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlan, useAnalysesUsedThisMonth, useSessionUser } from '@/hooks/useAccountInfo';

const DISMISSED_KEY = 'presora_trial_banner_dismissed';

/* Keep in sync with PLAN_LIMITS in Profile.tsx */
const FREE_MONTHLY_LIMIT = 10;
const GUEST_FREE_ANALYSES = 3;

type State =
  | { kind: 'loading' }
  | { kind: 'guest' }
  | { kind: 'free'; remaining: number }
  | { kind: 'paid' };

export const TrialBanner = () => {
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem(DISMISSED_KEY));
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const { data: plan, isLoading: planLoading } = usePlan();
  const { data: used = 0, isLoading: usedLoading } = useAnalysesUsedThisMonth();

  // These are all react-query cached, so this stays correct instead of
  // flashing back to a loading/guest state every time TrialBanner remounts.
  let state: State;
  if (userLoading) {
    state = { kind: 'loading' };
  } else if (!sessionUser?.email) {
    state = { kind: 'guest' };
  } else if (planLoading || usedLoading) {
    state = { kind: 'loading' };
  } else if (plan !== 'Free') {
    state = { kind: 'paid' };
  } else {
    state = { kind: 'free', remaining: Math.max(FREE_MONTHLY_LIMIT - used, 0) };
  }

  const visible = !dismissed && state.kind !== 'loading' && state.kind !== 'paid';

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const renderMessage = () => {
    switch (state.kind) {
      case 'guest':
        return (
          <>
            Testujesz Presora — masz <strong>{GUEST_FREE_ANALYSES} darmowe analizy</strong> bez rejestracji.{' '}
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Załóż konto i odbierz {FREE_MONTHLY_LIMIT}/miesiąc <ArrowRight className="w-3 h-3" />
            </Link>
          </>
        );
      case 'free':
        return (
          <>
            Plan <strong>Free</strong> — zostało Ci{' '}
            <strong>{state.remaining} z {FREE_MONTHLY_LIMIT}</strong> analiz w tym miesiącu.{' '}
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Zwiększ limit <ArrowRight className="w-3 h-3" />
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-primary/90 via-primary to-indigo-600 text-primary-foreground text-sm">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
              <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="leading-snug">{renderMessage()}</span>
              <button
                onClick={dismiss}
                aria-label="Zamknij"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

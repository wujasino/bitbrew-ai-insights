import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_LIMITS, PLAN_LABELS, usePlan, useAnalysesUsedThisMonth, useSessionUser } from '@/hooks/useAccountInfo';

/**
 * Account status shown on the pricing control bar: a credit-usage meter and the
 * current plan with a billing shortcut. Renders nothing for signed-out visitors.
 */
export const CreditsUsageWidget = () => {
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const { data: plan = 'Free' } = usePlan();
  const { data: used = 0 } = useAnalysesUsedThisMonth();

  if (userLoading || !sessionUser?.email) return null;

  const limit = PLAN_LIMITS[plan] ?? 3;
  const unlimited = limit >= 9999;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="w-full max-w-[280px] rounded-xl border border-[hsl(var(--glass-border))] bg-card/60 divide-y divide-[hsl(var(--glass-border))] text-xs">
      {/* Credit usage meter */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-muted-foreground">Credits used</span>
          <span className="font-medium text-foreground font-data whitespace-nowrap">
            {used} / {unlimited ? '∞' : limit}{!unlimited && ` (${pct}%)`}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-[width]', pct >= 90 ? 'bg-red-500' : 'bg-primary')}
            style={{ width: `${unlimited ? 100 : pct}%` }}
          />
        </div>
      </div>

      {/* Current plan + billing shortcut */}
      <Link
        to="/settings?tab=billing"
        className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors rounded-b-xl"
      >
        <span className="text-muted-foreground">
          Plan · <span className="text-foreground font-medium">{PLAN_LABELS[plan] ?? plan}</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </Link>
    </div>
  );
};

export default CreditsUsageWidget;

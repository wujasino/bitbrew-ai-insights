import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Bot, FileText, ArrowRight, ArrowUpRight, ArrowUp, ArrowDown,
  Lock, Sparkles, CalendarClock, ShieldCheck, Smile, Target, AtSign, Clock, RefreshCw, Plus,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CreditsUsageWidget } from '@/components/CreditsUsageWidget';
import { usePlan, tierOf, useSessionUser } from '@/hooks/useAccountInfo';
import { MODEL_CATALOG, loadModelPrefs, saveModelPrefs } from '@/lib/models';
import { BrandScanInput } from '@/components/BrandScanInput';
import { brandKey } from '@/hooks/useBrewing';

interface Analysis {
  id: string;
  brand_name: string;
  trust_score: number;
  authority: number;
  sentiment: number;
  recency: number;
  mentions: number;
  accuracy: number;
  created_at: string;
  sources: { model: string; sentiment: string; association: string; confidence: number }[] | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Collapses the duplicate rows a pre-fix double-submit left behind: the same
 * brand, the same score, written two or three times within ~2 seconds. Those
 * rows are indistinguishable to a reader but made every delta below them
 * wrong — a scan compared against its own duplicate reads "No change", and
 * the one after it compares against the wrong baseline.
 *
 * Keys on the normalised brand (so "presora" and "Presora.app" are one
 * brand) plus the score, and treats rows within the window as one scan.
 * Newest wins, since the list is already sorted descending.
 */
const DUPLICATE_WINDOW_MS = 10_000;

export const dedupeAnalyses = <T extends { brand_name: string; trust_score: number; created_at: string }>(rows: T[]): T[] => {
  const out: T[] = [];
  for (const row of rows) {
    const isDupe = out.some(kept =>
      brandKey(kept.brand_name) === brandKey(row.brand_name) &&
      kept.trust_score === row.trust_score &&
      Math.abs(new Date(kept.created_at).getTime() - new Date(row.created_at).getTime()) < DUPLICATE_WINDOW_MS
    );
    if (!isDupe) out.push(row);
  }
  return out;
};

const DIMENSIONS: { key: keyof Pick<Analysis, 'authority' | 'sentiment' | 'accuracy' | 'mentions' | 'recency'>; label: string; Icon: typeof ShieldCheck }[] = [
  { key: 'authority', label: 'Authority', Icon: ShieldCheck },
  { key: 'sentiment', label: 'Sentiment', Icon: Smile },
  { key: 'accuracy', label: 'Accuracy', Icon: Target },
  { key: 'mentions', label: 'Mentions', Icon: AtSign },
  { key: 'recency', label: 'Recency', Icon: Clock },
];

// Matches scoreColor()'s 75/60 bands below. Was 70/50, which painted a 70
// Mentions and a 73 Accuracy the same green as a 95 — on a screen selling
// "what to fix first", every bar being green is the one thing it must not do.
const barColor = (s: number) => (s >= 75 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500');

// Same score → status band thresholds as ResultsBreakdown.tsx, kept in sync
// so "Strong"/"Needs work"/"Critical" mean the same thing everywhere.
type Band = 'strong' | 'moderate' | 'critical';
const bandOf = (score: number): Band => (score >= 75 ? 'strong' : score >= 60 ? 'moderate' : 'critical');
const BAND_COLOR: Record<Band, string> = { strong: '#10b981', moderate: '#f59e0b', critical: '#ef4444' };
const BAND_LABEL: Record<Band, string> = { strong: 'Strong', moderate: 'Needs work', critical: 'Critical' };

/* ── Visibility health ring — at-a-glance donut of how many of the 5
   dimensions are Strong/Needs work/Critical, with the overall score in
   the center. Complements the linear dimension strip in the score card. */
const HealthRing = ({ analysis }: { analysis: Analysis }) => {
  const counts = useMemo(() => {
    const c: Record<Band, number> = { strong: 0, moderate: 0, critical: 0 };
    DIMENSIONS.forEach(({ key }) => { c[bandOf(analysis[key])] += 1; });
    return c;
  }, [analysis]);
  const data = (['strong', 'moderate', 'critical'] as Band[])
    .filter(b => counts[b] > 0)
    .map(b => ({ band: b, value: counts[b] }));

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--glass-border))] bg-card/60 px-3 py-2.5">
      <div className="relative w-11 h-11 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={14} outerRadius={20} paddingAngle={3} stroke="none">
              {data.map(d => <Cell key={d.band} fill={BAND_COLOR[d.band]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-data font-semibold text-foreground">
          {analysis.trust_score}
        </span>
      </div>
      <div className="text-xs leading-tight">
        <p className="text-muted-foreground mb-1">Dimension health</p>
        {/* Spelled out rather than three coloured dots with bare counts —
            "5 · 0 · 0" told the reader nothing without a legend. */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['strong', 'moderate', 'critical'] as Band[]).map(b => (
            <span key={b} className="inline-flex items-center gap-1 text-muted-foreground whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: BAND_COLOR[b] }} />
              {counts[b]} {BAND_LABEL[b].toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── 5-dimension mini breakdown — fills the score card with the data the
   analyses row already has, instead of leaving it visually empty next to
   the taller "By AI model" card. ────────────────────────────────────── */
const DimensionStrip = ({ analysis }: { analysis: Analysis }) => (
  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-border">
    {DIMENSIONS.map(({ key, label, Icon }) => {
      const v = Math.round(analysis[key]);
      return (
        <div key={key}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{label}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-1">
            <div className={cn('h-full rounded-full', barColor(v))} style={{ width: `${v}%` }} />
          </div>
          <span className="text-xs font-data font-semibold tabular-nums text-foreground">{v}%</span>
        </div>
      );
    })}
  </div>
);

const scoreColor = (s: number) =>
  s >= 75 ? 'text-emerald-600 dark:text-emerald-400'
    : s >= 60 ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

/* ── Mini sparkline ─────────────────────────────────────────────────── */
/* A bare polyline with no axis, no dates and no scale said nothing. It now
   names what it covers, anchors the ends with their values, and exposes each
   point on hover. */
const Sparkline = ({ points }: { points: { trust_score: number; created_at: string }[] }) => {
  if (points.length < 2) return null;
  const values = points.map(p => p.trust_score);
  const w = 120, h = 32, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const coord = (v: number, i: number) => ({
    x: pad + (i / (values.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  });
  const pts = values.map((v, i) => { const c = coord(v, i); return `${c.x.toFixed(1)},${c.y.toFixed(1)}`; }).join(' ');

  return (
    <div className="flex flex-col items-end gap-0.5">
      <svg width={w} height={h} className="overflow-visible" role="img"
           aria-label={`Trust score across the last ${points.length} scans of this brand`}>
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => {
          const c = coord(v, i);
          return (
            <circle key={i} cx={c.x} cy={c.y} r={i === values.length - 1 ? 3 : 5}
                    fill={i === values.length - 1 ? 'hsl(var(--primary))' : 'transparent'}>
              <title>{`${v}/100 — ${formatDate(points[i].created_at)}`}</title>
            </circle>
          );
        })}
      </svg>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        last {points.length} scans · {min}–{max}
      </span>
    </div>
  );
};

/* ── Delta pill (semantic colours: up = green, down = red) ──────────── */
const Delta = ({ value, since }: { value: number | null; since?: string }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">First scan</span>;
  // "vs <date>" everywhere a delta appears — "down 6 pts" against an unstated
  // baseline is unreadable, and it was the same complaint on the score card
  // and in the recent-reports list.
  const vs = since ? <span className="text-xs text-muted-foreground ml-1.5">vs {formatDate(since)}</span> : null;
  if (value === 0) return <span className="text-xs text-muted-foreground">No change{vs}</span>;
  const up = value > 0;
  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5',
        up ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
           : 'text-red-700 bg-red-500/10 dark:text-red-400'
      )}>
        {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(value)} pts
      </span>
      {vs}
    </span>
  );
};

const HomeHub = () => {
  const navigate = useNavigate();
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const { data: plan = 'Free' } = usePlan();
  const planTier = tierOf(plan);
  const visibleModels = MODEL_CATALOG.filter(m => m.tier <= planTier);
  const lockedModels = MODEL_CATALOG.filter(m => m.tier > planTier);

  // Reuse the already-cached (react-query) session instead of calling
  // supabase.auth.getUser() here — getUser() re-verifies the token with a
  // network round trip to the Auth server on every mount, which was making
  // this the slowest thing on the page. getSession() (what useSessionUser
  // uses) reads the already-validated local session instead.
  const { data: sessionUser, isLoading: userLoading } = useSessionUser();
  const userId = sessionUser?.id ?? null;

  useEffect(() => {
    if (userLoading) return;
    if (!userId) { setAnalysesLoading(false); return; }
    let active = true;
    setAnalysesLoading(true);
    supabase
      .from('analyses')
      .select('id, brand_name, trust_score, authority, sentiment, recency, mentions, accuracy, created_at, sources')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (active) { setAnalyses(dedupeAnalyses((data as Analysis[]) ?? [])); setAnalysesLoading(false); }
      });
    return () => { active = false; };
  }, [userId, userLoading]);

  const loading = userLoading || analysesLoading;

  const latest = analyses[0] ?? null;

  /**
   * Previous scan **of the same brand**, not simply the previous row.
   *
   * This compared analyses[0] against analyses[1] regardless of brand, so a
   * Coca-Cola scan could be diffed against a Tesla one. That's why the same
   * score showed two different deltas on two different days: the baseline was
   * whatever happened to be scanned before it.
   */
  const previousForLatest = useMemo(() => {
    if (!latest) return null;
    const key = brandKey(latest.brand_name);
    return analyses.slice(1).find(a => brandKey(a.brand_name) === key) ?? null;
  }, [latest, analyses]);

  const delta = latest && previousForLatest ? latest.trust_score - previousForLatest.trust_score : null;

  // Sparkline must track one brand too — a line hopping between brands is a
  // shape with no meaning.
  const sparkPoints = useMemo(() => {
    if (!latest) return [];
    const key = brandKey(latest.brand_name);
    return analyses
      .filter(a => brandKey(a.brand_name) === key)
      .slice(0, 8)
      .reverse();
  }, [analyses, latest]);

  // Plan-unlocked models with no confidence data in the latest scan — either
  // deselected in Settings' model picker, or (for older rows) the scan
  // predates `sources` being persisted at all. Surfaced below so "why does
  // this only show 3 of 6 models" is self-explanatory instead of a silent
  // row of dashes.
  const skippedVisibleModels = useMemo(
    () => (latest ? visibleModels.filter(m => !latest.sources?.some(s => s.model === m.label)) : []),
    [latest, visibleModels]
  );

  const runScan = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    navigate(`/brand-visibility?brand=${encodeURIComponent(v)}`);
  };

  /**
   * Turns a skipped model back on and immediately re-runs the scan.
   *
   * "3 of 6 available models weren't queried — review your selection in
   * Settings" was 11px of grey text pointing at a different page, for what is
   * the most consequential fact on the screen: the picture of the brand is
   * incomplete. One click does the whole thing instead.
   */
  const enableModelsAndRescan = (ids: string[]) => {
    if (!latest) return;
    const prefs = loadModelPrefs();
    saveModelPrefs({ selected: Array.from(new Set([...prefs.selected, ...ids])) });
    runScan(latest.brand_name);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── Header: title + credits/plan at a glance ────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-display text-foreground">Home</h1>
              {/* Running a scan is the whole product and had no button
                  anywhere on this page — only a sidebar link and a card at
                  the very bottom. */}
              <Link
                to="/brand-visibility"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Search className="w-3.5 h-3.5" /> Run new scan
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">Your AI visibility, at a glance.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            {latest && <HealthRing analysis={latest} />}
            <CreditsUsageWidget />
          </div>
        </div>

        {/* ── State: loading / empty / populated ──────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl border border-border bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : !latest ? (
          <EmptyState onScan={runScan} onDemo={() => runScan('Nike')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
            {/* Score card — the reason people come back */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI visibility score</p>
                  <p className="text-lg font-semibold text-foreground">{latest.brand_name}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="w-3.5 h-3.5" /> {formatDate(latest.created_at)}
                </div>
              </div>
              <div className="flex items-end gap-4">
                <span className={cn('text-5xl font-display font-semibold tabular-nums leading-none', scoreColor(latest.trust_score))}>
                  {latest.trust_score}
                </span>
                <span className="text-lg text-muted-foreground mb-1">/100</span>
                <div className="mb-1"><Delta value={delta} since={previousForLatest?.created_at} /></div>
                <div className="ml-auto mb-0.5"><Sparkline points={sparkPoints} /></div>
              </div>

              <DimensionStrip analysis={latest} />

              <Link
                to={`/brand-visibility?id=${latest.id}`}
                className="mt-5 inline-flex items-center gap-1 text-sm text-primary font-medium hover:gap-1.5 transition-all w-fit"
              >
                View full report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Per-model breakdown + upsell */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card/60 p-6"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">By AI model</p>
              <div className="space-y-2.5">
                {visibleModels.map((m) => {
                  // Real per-model confidence from the scan, when this report has it
                  // (sources wasn't persisted before this was added — older rows are
                  // null). Never fabricate a number for a model that wasn't actually
                  // queried; show "–" instead of a misleading fake bar.
                  const source = latest.sources?.find(s => s.model === m.label);
                  const conf = source ? Math.max(0, Math.min(100, Math.round(source.confidence))) : null;
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className={cn('text-sm w-20 shrink-0', conf !== null ? 'text-foreground' : 'text-muted-foreground')}>{m.label}</span>
                      {conf !== null ? (
                        <>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${conf}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">{conf}</span>
                        </>
                      ) : (
                        <button
                          onClick={() => enableModelsAndRescan([m.id])}
                          className="flex-1 inline-flex items-center justify-end gap-1 text-xs text-primary hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Enable &amp; rescan
                        </button>
                      )}
                    </div>
                  );
                })}
                {lockedModels.map(m => (
                  <Link key={m.id} to="/pricing" className="flex items-center gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-sm text-muted-foreground w-20 shrink-0">{m.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" />
                    <Lock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
              {skippedVisibleModels.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                  <p className="text-xs text-foreground">
                    Incomplete picture — {skippedVisibleModels.length} of {visibleModels.length} models
                    you already pay for weren't asked about {latest.brand_name}.
                  </p>
                  <button
                    onClick={() => enableModelsAndRescan(skippedVisibleModels.map(m => m.id))}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <RefreshCw className="w-3 h-3" /> Enable all &amp; rescan
                  </button>
                </div>
              )}
              {lockedModels.length > 0 && (
                <Link to="/pricing" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Unlock all {MODEL_CATALOG.length} models <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </motion.div>
          </div>
        )}

        {/* ── Recent reports ──────────────────────────────────────── */}
        {!loading && analyses.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent reports</h2>
              <Link to="/reports" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border overflow-hidden">
              {analyses.slice(0, 5).map((a, i) => {
                const prev = analyses.slice(i + 1).find(p => brandKey(p.brand_name) === brandKey(a.brand_name));
                const d = prev ? a.trust_score - prev.trust_score : null;
                return (
                  <Link
                    key={a.id}
                    to={`/brand-visibility?id=${a.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors group"
                  >
                    <span className={cn('text-lg font-display font-semibold tabular-nums w-10', scoreColor(a.trust_score))}>{a.trust_score}</span>
                    <span className="text-sm text-foreground font-medium flex-1 min-w-0 truncate">{a.brand_name}</span>
                    <Delta value={d} since={prev?.created_at} />
                    <span className="hidden sm:block text-xs text-muted-foreground w-24 text-right">{formatDate(a.created_at)}</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Continue where you left off ──────────────────────────
            Replaces a "Tools" block that repeated Brand Scan / Automations /
            Reports — the three entries already sitting in the sidebar two
            inches to the left. Half a screen that added nothing. This offers
            the next action on brands already scanned instead. */}
        {!loading && latest && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Continue where you left off</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => runScan(latest.brand_name)}
                className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 text-left transition-all duration-200 hover:border-primary/60 hover:-translate-y-0.5"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 shrink-0">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">Re-scan {latest.brand_name}</h3>
                  <p className="text-xs text-muted-foreground">Last scanned {formatDate(latest.created_at)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:translate-x-1" />
              </button>

              <Link
                to="/automations"
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Track it automatically</h3>
                  <p className="text-xs text-muted-foreground truncate">Set up weekly monitoring by chat.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Empty state: one screen, one CTA, plus a demo ──────────────────── */
const EmptyState = ({ onScan, onDemo }: { onScan: (brand: string) => void; onDemo: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-border bg-card/40 p-10 sm:p-14 text-center mb-10"
  >
    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
      <Sparkles className="w-6 h-6 text-primary" />
    </div>
    <h2 className="text-xl sm:text-2xl font-display text-foreground mb-2">No scans yet</h2>
    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
      Run your first scan to see how AI models describe your brand — a visibility score, a per-model breakdown, and what to do next.
    </p>
    <BrandScanInput onSubmit={onScan} className="max-w-md mx-auto" />
    <button
      onClick={onDemo}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
    >
      or see a sample — Nike demo <ArrowRight className="w-3 h-3" />
    </button>
  </motion.div>
);

export default HomeHub;
export { HomeHub };

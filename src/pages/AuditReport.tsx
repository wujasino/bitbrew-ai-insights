import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Smile, Target, AtSign, Clock, Printer, ArrowLeft, Loader2, AlertTriangle, Sparkles, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/button';
import { usePlan, isAgencyPlan } from '@/hooks/useAccountInfo';

interface AnalysisRow {
  id: string;
  brand_name: string;
  trust_score: number;
  authority: number;
  sentiment: number;
  recency: number;
  mentions: number;
  accuracy: number;
  created_at: string;
  sources: { model: string; sentiment: string; confidence: number }[] | null;
  audit_summary: AuditSummary | null;
}

interface AuditSummary {
  headline: string;
  businessImpact: string;
  narrative: string;
  competitivePosition: string;
  recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
}

const DIMENSIONS: { key: keyof AnalysisRow; Icon: typeof ShieldCheck; name: string }[] = [
  { key: 'authority', Icon: ShieldCheck, name: 'Authority' },
  { key: 'sentiment', Icon: Smile, name: 'Sentiment' },
  { key: 'accuracy', Icon: Target, name: 'Accuracy' },
  { key: 'mentions', Icon: AtSign, name: 'Mentions' },
  { key: 'recency', Icon: Clock, name: 'Recency' },
];

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const scoreColor = (s: number) =>
  s >= 75 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500';

const scoreLabel = (s: number) => (s >= 75 ? 'Strong' : s >= 50 ? 'Developing' : 'Needs attention');

// Same 75/50 bands as scoreColor(), applied to the dimension bars/icon chips
// and the score's own "Strong/Developing/Needs attention" pill. "mid" is
// amber, not the app's --primary (graphite, buttons/links only) — the
// score needs 3 visually distinct tiers, and graphite would look like "no
// color" between the emerald/red tiers.
const BAND_STYLE = {
  strong: { bar: 'bg-emerald-500 print:bg-black/70', chip: 'bg-emerald-500/10 text-emerald-500 print:bg-transparent print:text-black/70', pill: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', ring: 'border-emerald-500 text-emerald-500 print:border-black/20' },
  mid: { bar: 'bg-amber-500 print:bg-black/70', chip: 'bg-amber-500/10 text-amber-500 print:bg-transparent print:text-black/70', pill: 'bg-amber-500/10 text-amber-500 border-amber-500/20', ring: 'border-amber-500 text-amber-500 print:border-black/20' },
  low: { bar: 'bg-red-500 print:bg-black/70', chip: 'bg-red-500/10 text-red-500 print:bg-transparent print:text-black/70', pill: 'bg-red-500/10 text-red-500 border-red-500/20', ring: 'border-red-500 text-red-500 print:border-black/20' },
} as const;
const bandOf = (s: number) => (s >= 75 ? BAND_STYLE.strong : s >= 50 ? BAND_STYLE.mid : BAND_STYLE.low);

const SENTIMENT_STYLE: Record<string, string> = {
  positive: 'text-emerald-500',
  neutral: 'text-amber-500',
  negative: 'text-red-500',
};
const sentimentDotClass = (sentiment: string) => {
  const key = sentiment.toLowerCase();
  return key.includes('positive') ? 'bg-emerald-500' : key.includes('negative') ? 'bg-red-500' : 'bg-amber-500';
};
const sentimentTextClass = (sentiment: string) => {
  const key = sentiment.toLowerCase();
  return SENTIMENT_STYLE[key] ?? (key.includes('positive') ? SENTIMENT_STYLE.positive : key.includes('negative') ? SENTIMENT_STYLE.negative : SENTIMENT_STYLE.neutral);
};

const AuditReport = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const { data: plan = 'Free' } = usePlan();
  const canAccess = isAgencyPlan(plan);

  useEffect(() => {
    (async () => {
      if (!id) return;
      // Client-ready audit export is an Agency-plan feature — direct-link
      // access from a non-agency account stops here (server-side enforced
      // too: generate-audit-summary.js rejects non-agency callers).
      if (!canAccess) { setLoading(false); return; }
      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('id, brand_name, trust_score, authority, sentiment, recency, mentions, accuracy, created_at, sources, audit_summary')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError('This report could not be found, or you don\'t have access to it.');
        setLoading(false);
        return;
      }
      setAnalysis(data as AnalysisRow);
      setLoading(false);

      if (!data.audit_summary) {
        setGenerating(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/.netlify/functions/generate-audit-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ analysisId: id }),
          });
          const json = await res.json();
          if (res.ok) {
            setAnalysis(prev => prev ? { ...prev, audit_summary: json.summary } : prev);
          }
        } catch {
          // Non-fatal — the score/dimension breakdown below still renders
          // without the narrative section.
        } finally {
          setGenerating(false);
        }
      }
    })();
  }, [id, canAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Client-ready audits are an Agency-plan feature</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Upgrade to Agency to export a branded, print-ready AI visibility audit for your clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pricing" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            See Agency plan
          </Link>
          <Link to="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to reports</Link>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Link to="/reports" className="text-sm text-primary hover:underline">Back to reports</Link>
      </div>
    );
  }

  const summary = analysis.audit_summary;

  return (
    <div className="min-h-screen print:min-h-0 print:h-auto bg-background print:bg-white">
      {/* Screen-only toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reports
        </Link>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
        </Button>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 print:py-6 print:px-0">
        {/* Cover */}
        <div className="flex items-center justify-between mb-6 print:mb-6">
          <Wordmark className="text-xl print:!text-black" />
          <p className="text-xs text-muted-foreground print:text-black/60">
            AI Visibility Audit · {new Date(analysis.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-primary/40 via-border to-transparent print:from-black/30 print:via-black/10 mb-8" />

        <h1 className="text-3xl sm:text-4xl font-display text-foreground print:text-black mb-2">
          {analysis.brand_name}
        </h1>
        <p className="text-sm text-muted-foreground print:text-black/70 mb-8">
          How ChatGPT, Claude, Gemini and other AI models see this brand right now.
        </p>

        {/* Headline score */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 print:bg-transparent print:border-black/15 p-6 mb-8 flex items-center gap-6">
          <div className={`print:hidden absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${scoreColor(analysis.trust_score).replace('text-', 'bg-')}`} />
          <div className={`relative shrink-0 w-24 h-24 rounded-full border-4 flex items-center justify-center ${bandOf(analysis.trust_score).ring}`}>
            <span className="text-3xl font-display font-bold tabular-nums">{analysis.trust_score}</span>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60">Trust score / 100</p>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${bandOf(analysis.trust_score).pill} print:border-black/20 print:bg-transparent print:text-black/70`}>
                {scoreLabel(analysis.trust_score)}
              </span>
            </div>
            {generating ? (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Writing executive summary…
              </p>
            ) : summary ? (
              <p className="text-base font-medium text-foreground print:text-black mt-1">{summary.headline}</p>
            ) : null}
          </div>
        </div>

        {/* Business impact + narrative */}
        {summary && (
          <div className="space-y-5 mb-10">
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-1.5">Why this matters</h2>
              <p className="text-sm text-foreground/90 print:text-black leading-relaxed">{summary.businessImpact}</p>
            </section>
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-1.5">What the numbers show</h2>
              <p className="text-sm text-foreground/90 print:text-black leading-relaxed">{summary.narrative}</p>
            </section>
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-1.5">Competitive position</h2>
              <p className="text-sm text-foreground/90 print:text-black leading-relaxed">{summary.competitivePosition}</p>
            </section>
          </div>
        )}

        {/* Dimension breakdown */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-3">Dimension breakdown</h2>
          <div className="space-y-3">
            {DIMENSIONS.map(({ key, Icon, name }) => {
              const value = analysis[key] as number;
              const band = bandOf(value);
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${band.chip}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-foreground print:text-black w-24 shrink-0">{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted print:bg-black/10 overflow-hidden">
                    <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${value}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground print:text-black w-10 text-right tabular-nums">{value}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Per-model breakdown */}
        {analysis.sources && analysis.sources.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-3">By AI model</h2>
            <div className="space-y-2">
              {analysis.sources.map(s => (
                <div key={s.model} className="flex items-center justify-between text-sm rounded-xl border border-border/60 print:border-black/10 px-4 py-3">
                  <span className="text-foreground print:text-black font-medium">{s.model}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground print:text-black/60">
                    <span className={`w-1.5 h-1.5 rounded-full print:hidden ${sentimentDotClass(s.sentiment)}`} />
                    <span className={`${sentimentTextClass(s.sentiment)} print:text-black/70 font-medium`}>{s.sentiment}</span>
                    · {Math.round(s.confidence)}% confidence
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {summary && summary.recommendations?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60 mb-3">Recommended next steps</h2>
            <div className="space-y-3">
              {summary.recommendations.map((rec, i) => (
                <div key={i} className="rounded-xl border border-border print:border-black/15 p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-semibold text-foreground print:text-black">{rec.title}</p>
                    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border print:border-black/20 print:bg-transparent print:text-black/70 ${PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.medium}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground print:text-black/70 leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Closing CTA */}
        <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] print:border-black/15 print:bg-transparent p-6 text-center">
          <Sparkles className="w-5 h-5 text-primary print:text-black/60 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground print:text-black mb-1">Ready to close this gap?</p>
          <p className="text-sm text-muted-foreground print:text-black/70 mb-4">
            Get in touch to discuss a plan for improving {analysis.brand_name}'s visibility across AI models.
          </p>
          <a href="mailto:contact.presora@gmail.com" className="print:hidden inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Mail className="w-3.5 h-3.5" /> contact.presora@gmail.com
          </a>
          <p className="hidden print:block text-sm text-black">contact.presora@gmail.com</p>
        </section>

        <p className="text-center text-xs text-muted-foreground/60 print:text-black/40 mt-10">
          Generated by Presora — presora.app
        </p>
      </main>
    </div>
  );
};

export default AuditReport;

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Smile, Target, AtSign, Clock, Printer, ArrowLeft, Loader2, AlertTriangle, Sparkles, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/button';

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
  s >= 75 ? 'text-emerald-500' : s >= 50 ? 'text-primary' : 'text-red-500';

const AuditReport = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!id) return;
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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
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
    <div className="min-h-screen bg-background print:bg-white">
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
        <div className="flex items-center justify-between mb-10 print:mb-8">
          <Wordmark className="text-xl print:!text-black" />
          <p className="text-xs text-muted-foreground print:text-black/60">
            AI Visibility Audit · {new Date(analysis.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display text-foreground print:text-black mb-2">
          {analysis.brand_name}
        </h1>
        <p className="text-sm text-muted-foreground print:text-black/70 mb-8">
          How ChatGPT, Claude, Gemini and other AI models see this brand right now.
        </p>

        {/* Headline score */}
        <div className="rounded-2xl border border-border bg-card/60 print:bg-transparent print:border-black/15 p-6 mb-8 flex items-center gap-6">
          <div className={`text-5xl font-display font-bold tabular-nums ${scoreColor(analysis.trust_score)}`}>
            {analysis.trust_score}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/60">Trust score / 100</p>
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
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground print:text-black/60 shrink-0" />
                  <span className="text-sm text-foreground print:text-black w-24 shrink-0">{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted print:bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-primary print:bg-black/70" style={{ width: `${value}%` }} />
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
                <div key={s.model} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 print:border-black/10">
                  <span className="text-foreground print:text-black">{s.model}</span>
                  <span className="text-muted-foreground print:text-black/60">{s.sentiment} · {Math.round(s.confidence)}% confidence</span>
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

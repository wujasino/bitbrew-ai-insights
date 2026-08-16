import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Presentation, ArrowRight, Sparkles, FileText, Send, CheckCircle2,
  Building2, Printer, Mail, ShieldCheck, ClipboardList, Palette,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const STEPS = [
  {
    Icon: ClipboardList,
    title: '1. Run the scan',
    desc: 'Enter a prospect\'s brand name. Presora queries GPT-4o, Claude and Gemini in parallel and scores the result across 5 dimensions in about 15 seconds.',
  },
  {
    Icon: Sparkles,
    title: '2. AI writes the narrative',
    desc: 'An executive summary, competitive read and prioritized recommendations get generated automatically — no report-writing required on your end.',
  },
  {
    Icon: Printer,
    title: '3. Brand it and send',
    desc: 'Set your logo and contact details once under Tools → Audit Branding — every audit carries them from then on. Print to PDF and attach it to your outreach email, or the proposal you\'re already sending.',
  },
];

const INCLUDED = [
  'Your logo, name and contact details on it — not ours',
  'Headline AI visibility score (0–100) with executive summary',
  'Business-impact narrative — why the score matters to their revenue',
  '5-dimension breakdown: authority, sentiment, accuracy, mentions, recency',
  'What each AI model actually associates the brand with, quoted',
  'Prioritized, ranked recommendations — the specific fixes to pitch',
  'A methodology section that answers "where does this number come from?"',
  'Clean, print-ready PDF layout — no watermarked screenshots',
];

const Agencies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="pt-28 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-6 uppercase tracking-wider">
                <Building2 className="w-3 h-3" /> For agencies & consultants
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-[1.1] text-balance">
                Turn one scan into a service you can sell{' '}
                <span className="text-primary">this week</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                Run a Presora scan on a prospect's brand, and it generates a client-ready
                AI visibility audit — the kind of report that sells the follow-up work itself.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Create your first audit
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('sample')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  See a sample audit
                </button>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4">
                Scanning is free, no card required. Exporting the client-ready PDF audit
                needs the{' '}
                <Link to="/pricing" className="text-primary hover:underline">Agency plan</Link>.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 uppercase tracking-wider">
                How it works
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">From scan to sent proposal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map(({ Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card/60 p-6"
                >
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sample audit preview ────────────────────────────────── */}
        <section id="sample" className="py-16 px-4 border-t border-border scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 uppercase tracking-wider">
                What you hand the prospect
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">A report that argues its own case</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
                Not a dashboard screenshot. A standalone, printable document built to be read by
                someone who has never seen Presora.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-foreground">Nike — AI Visibility Audit</span>
                <span className="text-xs text-muted-foreground">Generated by Presora</span>
              </div>
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <div className="text-5xl font-bold text-primary tabular-nums">62</div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Trust score / 100</p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    Nike AI visibility is developing — there's a closeable gap
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                {[
                  { name: 'Authority', v: 70 }, { name: 'Sentiment', v: 55 },
                  { name: 'Accuracy', v: 65 }, { name: 'Mentions', v: 80 }, { name: 'Recency', v: 40 },
                ].map(d => (
                  <div key={d.name} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-muted-foreground shrink-0">{d.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${d.v}%` }} />
                    </div>
                    <span className="w-7 text-right text-foreground font-medium">{d.v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500">high priority</span>
                  <span className="text-sm font-semibold text-foreground">Refresh recency signals</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Publish recent, citable content so models have current material to draw from.
                </p>
              </div>
            </motion.div>
            <p className="text-center text-xs text-muted-foreground/60 mt-4">
              Illustrative preview — every field is generated live from the actual scan.
            </p>
          </div>
        </section>

        {/* ── What's included ─────────────────────────────────────── */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 uppercase tracking-wider">
                What's included
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Every audit includes</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {INCLUDED.map(item => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl border border-border bg-card/40 p-4">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who it's for ────────────────────────────────────────── */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 uppercase tracking-wider">
                Built for
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Who this is for</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { Icon: Building2, title: 'SEO & GEO agencies', desc: 'Add an "AI visibility audit" line item to every new-business pitch, backed by real numbers.' },
                { Icon: Palette, title: 'Marketing consultants', desc: 'Show a prospect exactly where they\'re invisible to AI before you propose the fix.' },
                { Icon: Send, title: 'Freelancers & solos', desc: 'One scan, one export, one email — no design work, no report template to maintain.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-card/60 p-6 text-center">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="py-20 px-4 cta-box">
          <div className="max-w-2xl mx-auto text-center glass-card p-12">
            <Presentation className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Your next audit is one scan away</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Create a free account and run a scan on your next prospect — then upgrade to
              Agency to open it as a client-ready audit from Reports.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                See Agency plan
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> No credit card to start</span>
              <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-primary" /> Unlimited free scans</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-8">
              Questions first? <a href="mailto:contact.presora@gmail.com" className="text-primary hover:underline inline-flex items-center gap-1"><Mail className="w-3 h-3" />contact.presora@gmail.com</a>
              {' · '}
              <Link to="/pricing" className="text-primary hover:underline">See pricing</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Agencies;

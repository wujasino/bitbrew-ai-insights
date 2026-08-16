import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, BarChart3, Shield, ChevronDown, HelpCircle, Mail, TrendingUp, ArrowRight, Globe, ShieldCheck, Clock, Search, PenLine, Sparkles, MessageSquare, Rocket, LineChart, Building2, Tag } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BrandScanInput } from '@/components/BrandScanInput';
import { ScanResultPreview } from '@/components/ScanResultPreview';
import { CookiePanel } from '@/components/ui/cookie-banner-1';
import { SalesChatWidget } from '@/components/ui/sales-chat-widget';
import { NewsletterSignup } from '@/components/ui/newsletter-signup';
import { GradientMeshBg } from '@/components/ui/gradient-mesh-bg';
import { FAQ_EN } from '@/lib/faq';
import { PricingCards } from '@/components/ui/pricing-cards';
import { PLANS } from '@/lib/plans';

/* ── AI models actually queried ────────────────────────────────────
   Mirrors OPENROUTER_MODELS in netlify/functions/_lib/runScan.js — these
   are the six models a scan really hits, in tier order.

   This block used to list Slack, HubSpot, Zapier, Google Analytics, Semrush
   and Notion under the heading "Powered by leading AI models". None of them
   are AI models, and none of them are integrations that exist: nothing in
   netlify/functions talks to any of those services. Promising integrations
   that aren't built is the most expensive kind of copy to be caught on, so
   the logos are gone rather than relabelled. */
const AI_MODELS = [
  { name: 'ChatGPT (GPT-4o)', vendor: 'OpenAI', color: '#10a37f', tier: 'All plans' },
  { name: 'Claude', vendor: 'Anthropic', color: '#d97757', tier: 'Starter and up' },
  { name: 'Gemini', vendor: 'Google', color: '#4285f4', tier: 'Starter and up' },
  { name: 'Perplexity', vendor: 'Perplexity AI', color: '#20808d', tier: 'Business' },
  { name: 'Mistral', vendor: 'Mistral AI', color: '#ff7000', tier: 'Business' },
  { name: 'Llama 3', vendor: 'Meta', color: '#0866ff', tier: 'Business' },
];

/* ── Before / After data ──────────────────────────────────────────── */
const BEFORE = { mentions: '1 / 10', sentiment: '34', recommend: '8%' };
const AFTER  = { mentions: '7 / 10', sentiment: '81', recommend: '63%' };

/* ── Testimonials ─────────────────────────────────────────────────── */
/* Verifiable facts about how the product actually works — not customer
   quotes. Presora doesn't have public case studies yet, and inventing
   testimonials to fill the space would be dishonest, so this trades a
   "social proof" slot for a "how this actually works" one instead. */
const TRUST_POINTS = [
  {
    Icon: Shield,
    title: 'Your data is walled off from everyone else\'s',
    desc: 'Your scans, notes and account details are separated at the database itself — not just hidden by the app. Another customer cannot reach your data even if something goes wrong in the software.',
    iconBg: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-400',
  },
  {
    Icon: Eye,
    title: 'Your data isn\'t used to train models',
    desc: 'What you tell us about your brand is sent to the AI companies only to produce your result — never to teach their models, and never shared with anyone else.',
    iconBg: 'bg-primary/10 border-primary/20 text-primary',
  },
  {
    Icon: ShieldCheck,
    title: 'Full control over your data',
    desc: 'Download everything, or delete your account for good, whenever you like — straight from Settings. No emailing support to ask.',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-background font-landing">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Navbar showThemeToggle landingCta />

      <main id="main-content">
      {/* ── Urgency strip ─────────────────────────────────────────── */}
      <div className="w-full bg-card border-b border-border px-4 py-2.5 flex items-center justify-center gap-2 text-center">
        <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs text-foreground/90">
          AI models are already shaping brand reputations. Is yours represented accurately?
        </p>
      </div>

      {/* ── Hero + Why (shared animated background) ───────────────── */}
      <GradientMeshBg className="relative" variant="mono">
        <section className="hero pt-24 sm:pt-32 pb-10 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-7 font-data uppercase tracking-wider">
                <Search className="w-3 h-3" /> For brands that want to be found
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-zinc-900 dark:text-zinc-50 mb-5 leading-[1.1]">
                AI recommends one brand.{' '}
                <span className="ai-presence-accent" data-text="Find out if it's yours.">
                  <span className="ai-presence-accent-text">Find out if it's yours.</span>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
                Get your brand's AI visibility audit — what ChatGPT, Claude and Gemini
                actually say about you, how you compare to rivals, and a clear plan to
                become the answer they give.
              </p>
              <p className="text-sm text-foreground/70 max-w-xl mx-auto mb-10">
                The only AI visibility tool that shows you{' '}
                <span className="text-foreground font-medium">the actual answer, not just a number.</span>
              </p>
            </motion.div>

            <motion.div
              id="hero-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl mx-auto"
            >
              <BrandScanInput
                placeholder="yourbrand.com"
                suggestions={['Tesla', 'Apple', 'Nike']}
                onSubmit={(brand) => navigate(`/brand-visibility?brand=${encodeURIComponent(brand)}`)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <button
                onClick={() => document.getElementById('sample-report')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
              >
                Or see a sample report first <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Risk reversal, at the point of decision. These three used to
                  live only in the closing CTA at the very bottom of the page —
                  i.e. after the visitor had already decided. */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-xs text-muted-foreground">
                {[
                  { icon: Zap, label: 'Free — no credit card' },
                  { icon: ShieldCheck, label: '14-day money-back guarantee' },
                  { icon: Clock, label: 'Cancel anytime, one click' },
                ].map((g) => (
                  <span key={g.label} className="inline-flex items-center gap-1.5">
                    <g.icon className="w-3.5 h-3.5 text-primary" />
                    {g.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* scroll hint */}
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => document.getElementById('why-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-8 mx-auto flex flex-col items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <span className="text-[10px] uppercase tracking-[0.25em]">Learn more</span>
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-sm text-muted-foreground mb-5 sm:mb-6">How it works</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { title: 'Enter your brand', desc: 'Type a brand name or URL — any niche, any language.' },
                { title: 'We ask the AI', desc: 'ChatGPT, Claude, Gemini and others all get asked about you at the same time.' },
                { title: 'Get your score', desc: 'See your score out of 100, what each assistant said, and what to fix first.' },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-2 sm:p-4">
                  <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2 sm:mb-3 text-sm sm:text-2xl font-display shadow-lg shadow-primary/20">
                    {idx + 1}
                  </div>
                  <div className="text-xs sm:text-base font-medium text-foreground">{step.title}</div>
                  <div className="hidden sm:block text-xs text-muted-foreground mt-1">{step.desc}</div>
                </div>
              ))}
            </div>

            {/* ── Trust bar — real product facts, not invented usage stats ── */}
            <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground leading-tight">Up to 6 AI models</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">ChatGPT, Claude &amp; Gemini — plus 3 more on Business</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-9 bg-[hsl(var(--glass-border))]" />

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground leading-tight">~15 seconds</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">to get your AI visibility score</div>
                </div>
              </div>
            </div>

            {/* ── Proof teaser: shows the actual output, not just a promise ── */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => document.getElementById('sample-report')?.scrollIntoView({ behavior: 'smooth' })}
              className="group mt-8 mx-auto flex items-center gap-3 sm:gap-4 rounded-2xl border border-[hsl(var(--glass-border))] bg-card/60 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm hover:border-primary/40 hover:bg-card/80 transition-colors text-left"
            >
              <span className="shrink-0 inline-flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-base sm:text-lg font-display font-semibold text-emerald-600 dark:text-emerald-400 leading-none">78</span>
                <span className="text-[8px] uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 leading-none mt-0.5">/100</span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs sm:text-sm font-medium text-foreground">
                  Sample: Tesla scored 78 — recommended by ChatGPT &amp; Claude
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:gap-1.5 transition-all mt-0.5">
                  See the full report <ArrowRight className="w-3 h-3" />
                </span>
              </span>
            </motion.button>
          </div>
        </section>

        {/* ── Why: short, punchy — not a manifesto ──────────────────── */}
        <section id="manifest" className="py-20 px-4 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-5 font-data uppercase tracking-wider">
                Why it matters
              </span>
              <h2 className="text-3xl sm:text-4xl font-display text-foreground leading-[1.15] mb-4">
                AI gives one answer, not ten blue links.{' '}
                <span className="text-primary">Miss it, and the customer never sees you.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                A search page let people pick from ten results. AI picks one — from whatever it already knows about your category. Presora shows you exactly where you stand, with the raw model answers behind every score.
              </p>
              <button
                onClick={() => document.getElementById('hero-input')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                See how AI sees your brand
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </section>


        {/* ── Sample report: what you get after a scan ──────────────── */}
        <section id="sample-report" className="py-20 px-4 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
                What you get
              </span>
              <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
                Your report, seconds after scanning
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                One visibility score, a breakdown across five signals, how each AI model talks about you, and the single highest-impact action to take next.
              </p>
            </motion.div>

            <ScanResultPreview />
          </div>
        </section>

        {/* ── Features bento ──────────────────────────────────────── */}
        <section id="why-section" className="py-24 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
                What's inside
              </span>
              <h2 className="text-3xl sm:text-4xl font-display text-foreground">
                What Presora actually does
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(160px,auto)]">
              {/* Large card — feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className="md:col-span-7 glass-card-hover rounded-2xl border border-[hsl(var(--glass-border))] p-8 flex flex-col justify-between bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Real-time AI analysis</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">We ask several AI assistants at once, and show you how each one describes your brand.</p>
                </div>
                <div className="mt-6 flex gap-2">
                  {['ChatGPT', 'Claude', 'Gemini'].map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{m}</span>
                  ))}
                </div>
              </motion.div>

              {/* Small card — feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -6, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className="md:col-span-5 glass-card-hover rounded-2xl border border-[hsl(var(--glass-border))] p-8 flex flex-col justify-between bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Sentiment tracking</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Track how positive, negative or neutral AI models are about your brand over time.</p>
                </div>
                <div className="mt-6 flex items-end gap-1 h-10 opacity-60">
                  {[3, 5, 4, 7, 6, 8, 7, 9, 8, 10].map((v, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-primary/50" style={{ height: `${v * 10}%` }} />
                  ))}
                </div>
              </motion.div>

              {/* Small card — feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -6, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className="md:col-span-5 glass-card-hover rounded-2xl border border-[hsl(var(--glass-border))] p-8 flex flex-col justify-between bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Competitor comparison</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">See how your brand stacks up against competitors in AI model responses.</p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="text-3xl font-display text-primary">94<span className="text-base text-muted-foreground">/100</span></div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
                  </div>
                </div>
              </motion.div>

              {/* Large card — feature 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -6, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className="md:col-span-7 glass-card-hover rounded-2xl border border-[hsl(var(--glass-border))] p-8 flex flex-col justify-between bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Brand knowledge base</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">Feed AI models accurate information about your brand to improve their responses.</p>
                </div>
                <div className="mt-6 space-y-2">
                  {[['Your brand', 78], ['Competitor A', 52], ['Competitor B', 61]].map(([label, val]) => (
                    <div key={label as string} className="flex items-center gap-3 text-xs">
                      <span className="w-24 text-muted-foreground shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-muted-foreground w-6 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </GradientMeshBg>

      {/* ── Before / After case study ─────────────────────────────── */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              Illustrative example
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              What improving AI visibility looks like
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              A worked example of the numbers this report tracks, and how they move
              once a brand acts on its recommendations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Before */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                  Before
                </span>
                <span className="text-xs text-muted-foreground">— baseline Presora scan</span>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">AI mentions</div>
                  <div className="text-3xl font-display text-red-400">{BEFORE.mentions}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[10%] rounded-full bg-red-400/60" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Positive tone</div>
                  <div className="text-3xl font-display text-red-400">{BEFORE.sentiment}<span className="text-base text-muted-foreground">/100</span></div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[34%] rounded-full bg-red-400/60" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Recommendations</div>
                  <div className="text-3xl font-display text-red-400">{BEFORE.recommend}</div>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                  After
                </span>
                <span className="text-xs text-muted-foreground">— after 14 days of fixes</span>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">AI mentions</div>
                  <div className="text-3xl font-display text-primary">{AFTER.mentions}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[70%] rounded-full bg-primary/70" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Positive tone</div>
                  <div className="text-3xl font-display text-primary">{AFTER.sentiment}<span className="text-base text-muted-foreground">/100</span></div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[81%] rounded-full bg-primary/70" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Recommendations</div>
                  <div className="text-3xl font-display text-primary">{AFTER.recommend}</div>
                </div>
              </div>
              {/* glow */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            </div>
          </motion.div>

          {/* Said plainly next to the numbers, not just in the badge above:
              unattributed before/after figures read as invented and cost more
              credibility than they buy. */}
          <p className="text-center text-xs text-muted-foreground/70 mt-6 max-w-xl mx-auto">
            Illustrative figures showing how these metrics relate, not results from a
            named customer. Your own numbers come from a real scan — run one above.
          </p>
        </div>
      </section>

      {/* ── Action, not just a report ─────────────────────────────── */}
      <section className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Action, not just a report
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Know you're invisible? That's step one.<br />
              <span className="text-primary">Here's what to publish next.</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Every scan ends with a ranked, plain-English action plan: the specific pages, comparisons and mentions that move AI models to recommend you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: the problem framed simply */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 flex flex-col justify-center gap-5"
            >
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
                A customer asks AI:
              </div>
              <p className="text-xl font-display text-foreground leading-snug">
                “What are the best {' '}
                <span className="text-primary">project management tools</span>{' '}
                for small teams?”
              </p>
              <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
                AI names 5 competitors. Your brand isn't one of them.
                <span className="block mt-2 text-foreground/80">Presora finds out <span className="text-primary font-medium">why</span>, and hands you the fix.</span>
              </div>
            </motion.div>

            {/* Right: the auto-generated action plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-data uppercase tracking-wider text-muted-foreground">Your action plan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">Auto-generated</span>
              </div>
              {[
                { icon: PenLine, impact: 'High impact', title: 'Publish a comparison page', desc: 'Create a “vs. alternatives” page — AI models cite these when recommending tools.' },
                { icon: Globe, impact: 'High impact', title: 'Get listed in 3 category roundups', desc: 'You’re missing from the “best-of” articles AI reads. We name which ones.' },
                { icon: MessageSquare, impact: 'Medium', title: 'Seed 2 review mentions', desc: 'Reddit & G2 threads shape how AI describes your reliability.' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-[hsl(var(--glass-border))] bg-card/40 p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <a.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{a.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-primary/10 text-primary/80 shrink-0">{a.impact}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Who is it for ─────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              Who is it for?
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Who uses Presora?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Built for the people who own the brand story — not just SEO specialists. If you care how AI describes your reputation and recommends your products, this is for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Rocket,
                title: 'Startups & Founders',
                desc: 'Building your brand from scratch and want to know if AI mentions you at all — and what it says. Find out before your customers ask ChatGPT.',
                tags: ['Brand awareness', 'Early traction', 'Competitor gap'],
                iconBg: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-400',
                border: 'border-indigo-400/20 hover:border-indigo-400/40',
              },
              {
                icon: LineChart,
                title: 'Brand Managers',
                desc: 'Already tracking brand in traditional media? Time to add the AI channel. Show your leadership how the brand is doing in AI answers.',
                tags: ['Sentiment tracking', 'Weekly digest', 'CSV export'],
                iconBg: 'bg-primary/10 border-primary/20 text-primary',
                border: 'border-primary/30 hover:border-primary/50',
                featured: true,
              },
              {
                icon: Building2,
                title: 'Marketing Agencies',
                desc: 'Offer clients a new service: AI visibility audit. Generate branded reports and compare client brands against competitors.',
                tags: ['Multi-brand', 'API access', 'Competitor compare'],
                iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
                border: 'border-emerald-500/20 hover:border-emerald-500/40',
                link: '/agencies',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className={`relative rounded-2xl p-7 flex flex-col gap-4 bg-card/60 backdrop-blur-sm border shadow-lg shadow-primary/5 ${card.border} ${card.featured ? 'ring-1 ring-primary/30' : ''}`}
              >
                {card.featured && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Most popular
                  </span>
                )}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${card.iconBg}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {card.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-[hsl(var(--glass-border))]">
                      {tag}
                    </span>
                  ))}
                </div>
                {card.link && (
                  <Link to={card.link} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5 transition-all">
                    See the agency workflow <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-display text-foreground mb-1">The AI models we query</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Every scan asks these models the same questions about your brand, at the same time.
              Free covers ChatGPT; Starter and Solo add Claude and Gemini; Business unlocks all six.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {AI_MODELS.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[hsl(var(--glass-border))] bg-card/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span className="text-foreground">{m.name}</span>
                <span className="text-[11px] text-muted-foreground/60">{m.tier}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Chat-based setup ──────────────────────────────────────────
          Was buried as a single row in the comparison table below ("Set up
          monitoring by chatting, not forms") despite being the clearest thing
          Presora does that competitors don't. It's a real feature, not a
          roadmap item: /automations posts to netlify/functions/chat.js, which
          writes the schedule and model selection into brand_monitors. */}
      <section className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" /> No forms
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Set up monitoring by just saying it
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No settings screens, no cron syntax, no checkbox matrix. Describe what you
              want watched in a sentence and Presora sets it up.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-4 items-start"
          >
            {/* Mock exchange — the shape of a real /automations conversation */}
            <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-card/60 backdrop-blur-xl p-5 space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                  Watch my brand weekly on ChatGPT and Claude, and tell me if my score drops
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted/60 text-foreground px-4 py-2.5 text-sm">
                  Done. Scanning every Monday across ChatGPT and Claude — you'll get an
                  alert if the score falls more than 5 points.
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Monitor active · next scan Monday
              </div>
            </div>

            <div className="space-y-4">
              {[
                { Icon: Clock, title: 'Any schedule, in plain words', desc: '“every Monday”, “twice a month”, “first of the quarter” — no cron, no dropdowns.' },
                { Icon: Sparkles, title: 'Pick models by naming them', desc: 'Say which assistants matter to you and only those get queried.' },
                { Icon: TrendingUp, title: 'Alerts you describe, not configure', desc: 'Tell it what counts as bad news and it watches for exactly that.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
              <Link
                to="/automations"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline pt-1"
              >
                See how automations work <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Presora vs. other AI visibility tools
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every AI visibility tracker will show you a score. Here's what's actually different about how Presora gets there.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--glass-border))]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--glass-border))]">
                    <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider w-[35%]">Feature</th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground/50">Typical AI tracker</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center bg-primary/5 border-x border-primary/20">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-primary">Presora</span>
                        <span className="text-[10px] text-primary/60 font-normal">AI-native</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Visibility across ChatGPT, Claude, Gemini',    others: true,  bb: true  },
                    { feature: 'AI Visibility Score (0–100)',                  others: true,  bb: true  },
                    { feature: 'Raw model answers behind every metric',        others: false, bb: true  },
                    { feature: 'Set up monitoring by chatting, not forms',     others: false, bb: true  },
                    { feature: 'Competitor comparison in AI answers',          others: 'varies', bb: true  },
                    { feature: 'Free plan with real usage (no trial only)',    others: 'varies', bb: true  },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-[hsl(var(--glass-border))] last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-6 py-3.5 text-sm text-foreground">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center">
                        {typeof row.others === 'boolean' ? (
                          row.others
                            ? <span className="text-emerald-400 text-base">✓</span>
                            : <span className="text-muted-foreground/30 text-base">—</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.others}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center bg-primary/5 border-x border-primary/20">
                        {typeof row.bb === 'boolean' ? (
                          row.bb
                            ? <span className="text-primary text-base font-bold">✓</span>
                            : <span className="text-muted-foreground/30 text-base">—</span>
                        ) : (
                          <span className="text-sm font-semibold text-primary">{row.bb}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-muted-foreground/40 mt-4">
              Most AI visibility trackers stop at a score. Presora shows the exact question we asked and the answer we got back, so you can check it yourself.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              Trust & security
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Built to be trusted with your brand data
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Early-stage product, built security-first. Here's exactly how your data is handled.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRUST_POINTS.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                whileTap={{ scale: 0.985 }}
                className="rounded-2xl border border-[hsl(var(--glass-border))] p-7 flex flex-col gap-4 bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${t.iconBg}`}>
                  <t.Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/70 mt-8">
            <Link to="/status" className="hover:text-foreground transition-colors underline underline-offset-2">Live system status</Link>
            {' · '}
            <Link to="/polityka-prywatnosci" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy policy</Link>
          </p>
        </div>
      </section>

      {/* ── CTA box ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 cta-box">
        <div className="max-w-2xl mx-auto text-center glass-card p-12">
          <h2 className="text-2xl font-display text-foreground mb-3">Run your first analysis</h2>
          <p className="text-muted-foreground text-sm mb-8">Start monitoring your AI brand presence today — free, no card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => document.getElementById('hero-input')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4">No credit card required</p>

          {/* Risk-reversal guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs text-muted-foreground">
            {[
              { icon: ShieldCheck, label: '14-day money-back guarantee' },
              { icon: Clock, label: 'Cancel anytime, one click' },
              { icon: Zap, label: 'Results in under 15 seconds' },
            ].map((g) => (
              <span key={g.label} className="inline-flex items-center gap-1.5">
                <g.icon className="w-3.5 h-3.5 text-primary" />
                {g.label}
              </span>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-8 border-t border-[hsl(var(--glass-border))]">
            {[
              { icon: '🔒', label: 'SSL / TLS', sub: 'Encrypted connection' },
              { icon: '🇪🇺', label: 'GDPR Ready', sub: 'EU-compliant data' },
              { icon: '💳', label: 'Secure payments', sub: 'SSL-encrypted checkout' },
              { icon: '🔐', label: '2FA', sub: 'Account protection' },
            ].map(badge => (
              <div key={badge.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[hsl(var(--glass-border))] bg-card/40">
                <span className="text-lg">{badge.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 border-t border-[hsl(var(--glass-border))]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              Contact
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground">
              Get in touch
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
              Questions about plans, agencies or the API? We reply to everything.
            </p>
          </motion.div>
          {/* A 4000-character message box mid-landing interrupted the flow for
              the 99% who came to scan, not to write. The form itself lives on
              /contact — this is just the doorway. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Send us a message <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:contact.presora@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              <Mail className="w-4 h-4" /> contact.presora@gmail.com
            </a>
          </motion.div>
        </div>
      </section>


      {/* ── Pricing ──────────────────────────────────────────────────
          The landing page had no pricing at all — a visitor had to guess
          whether the product even had plans. Cards come from @/lib/plans so
          these prices can't drift from /pricing or from Stripe checkout.
          Every CTA goes to /register: nobody is signed in here, and the
          checkout on /pricing requires a session anyway. */}
      <section id="pricing" className="py-24 px-4 border-t border-[hsl(var(--glass-border))] scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              <Tag className="w-3 h-3" /> Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto">
              Start free — three brand analyses, no card required. Upgrade only when
              you want to track more brands, more often.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <PricingCards
              plans={PLANS}
              billingCycle={billingCycle}
              onCycleChange={setBillingCycle}
              onPlanSelect={() => navigate('/register')}
            />
          </motion.div>

          <p className="text-center text-xs text-muted-foreground/70 mt-8">
            Cancel anytime, no contracts.{' '}
            <Link to="/pricing" className="text-primary hover:underline">
              Compare every plan in detail
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs badge rounded-lg mb-4 font-data uppercase tracking-wider">
              <HelpCircle className="w-3 h-3" /> FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-foreground">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto">
              Everything you need to know before your first scan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[hsl(var(--glass-border))] bg-card/40 backdrop-blur-xl divide-y divide-[hsl(var(--glass-border))] overflow-hidden"
          >
            <Accordion type="single" collapsible className="w-full">
              {FAQ_EN.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`q${idx + 1}`}
                  className="border-0 border-b border-[hsl(var(--glass-border))] last:border-b-0 px-6"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:no-underline py-5 [&>svg]:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5 pr-6">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium">Still have questions?</p>
            </div>
            <a
              href="mailto:contact.presora@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Contact us
              <Mail className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="pt-4 pb-14 px-4">
        <div className="max-w-xl mx-auto">
          <NewsletterSignup
            onSubmit={async (email) => {
              await fetch('/.netlify/functions/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });
            }}
          />
        </div>
      </section>
      </main>

      <Footer />

      <CookiePanel privacyHref="/polityka-prywatnosci" termsHref="/regulamin" />
      <SalesChatWidget />
    </div>
  );
};

export default Landing;

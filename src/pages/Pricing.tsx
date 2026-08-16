import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Clock, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PricingCards } from '@/components/ui/pricing-cards';
import { USD, PLANS } from '@/lib/plans';
import { CreditsUsageWidget } from '@/components/CreditsUsageWidget';
import { ContactForm } from '@/components/ui/contact-form';
import { useSessionUser } from '@/hooks/useAccountInfo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingCredits, setLoadingCredits] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showContactSalesDialog, setShowContactSalesDialog] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const { data: sessionUser } = useSessionUser();
  const isLoggedIn = !!sessionUser?.id;

  const prices = USD;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success'))  setMessage('Payment successful! Your plan has been activated.');
    if (params.get('canceled')) setMessage('Payment was cancelled.');
  }, []);

  const confirmDowngrade = async () => {
    setDowngrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/.netlify/functions/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || 'Could not cancel the subscription. Please try again.');
        return;
      }
      setShowDowngradeDialog(false);
      window.location.href = '/dashboard';
    } finally {
      setDowngrading(false);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      if (isLoggedIn) { setShowDowngradeDialog(true); return; }
      window.location.href = '/register';
      return;
    }
    if (planId === 'enterprise') {
      setShowContactSalesDialog(true);
      return;
    }

    setLoading(planId);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/register?plan=' + planId; return; }

      const priceMap: Record<string, { monthly?: string; yearly?: string }> = {
        starter: {
          monthly: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
          yearly: import.meta.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID,
        },
        solo: {
          monthly: import.meta.env.VITE_STRIPE_SOLO_PRICE_ID,
          yearly: import.meta.env.VITE_STRIPE_SOLO_YEARLY_PRICE_ID,
        },
        growth: {
          monthly: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID,
          yearly: import.meta.env.VITE_STRIPE_GROWTH_YEARLY_PRICE_ID,
        },
      };
      const priceId = priceMap[planId]?.[billingCycle];

      if (!priceId) { setMessage('Stripe is not configured. Please contact support.'); return; }

      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        let err = `HTTP ${response.status}`;
        try { const d = await response.json(); err = d.error || err; } catch { /* ignore */ }
        console.error('Checkout error:', err);
        setMessage(`Error: ${err}`);
        return;
      }

      const data = await response.json();
      if (!data?.url) { setMessage(data?.error || 'Could not create payment session.'); return; }
      window.location.href = data.url;
    } catch {
      setMessage('Connection error. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const creditPacks = [
    { id: 'credits_20',  label: '20 extra analyses',  price: prices.credits_20,  analyses: 20,  popular: false },
    { id: 'credits_50',  label: '50 extra analyses',  price: prices.credits_50,  analyses: 50,  popular: true  },
    { id: 'credits_120', label: '120 extra analyses', price: prices.credits_120, analyses: 120, popular: false },
  ];

  const handleCreditsBuy = async (packId: string) => {
    setLoadingCredits(packId);
    setMessage('');
    try {
      const linkMap: Record<string, string> = {
        credits_20:  import.meta.env.VITE_STRIPE_CREDITS_20  ?? '',
        credits_50:  import.meta.env.VITE_STRIPE_CREDITS_50  ?? '',
        credits_120: import.meta.env.VITE_STRIPE_CREDITS_120 ?? '',
      };
      const baseUrl = linkMap[packId];
      if (!baseUrl) { setMessage('Stripe link not configured for this credit pack.'); return; }

      const url = new URL(baseUrl);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        url.searchParams.set('client_reference_id', user.id);
        if (user.email) url.searchParams.set('prefilled_email', user.email);
      }
      window.location.href = url.toString();
    } catch {
      setMessage('Connection error. Please try again.');
    } finally {
      setLoadingCredits(null);
    }
  };

  const plans = PLANS;

  const faqItems = [
    { q: 'Can I cancel anytime?',             a: 'Yes — cancel at any time and keep access until the end of your billing period.' },
    { q: 'What happens if I exceed my limit?', a: 'If you hit your plan limit, you can upgrade instantly or purchase additional analysis credits.' },
    { q: 'Can I change plans later?',          a: 'Absolutely — switch plans anytime without losing your existing data.' },
    { q: 'Will I receive a VAT invoice?',      a: 'Yes — every payment automatically generates a VAT invoice sent to your email. EU companies can enter their VAT number at checkout to receive a B2B invoice.' },
    { q: 'How do you handle my company data?', a: 'Brand context you upload stays in your private workspace. We never train AI models on your data and never share it with third parties beyond the AI providers required to run an analysis. We are fully GDPR compliant.' },
    { q: 'Can I change plans mid-billing cycle?', a: 'Yes — upgrading takes effect immediately and is prorated. Downgrading applies at the end of the current billing period, so you always get what you paid for.' },
    { q: 'Need help choosing a plan?',         a: 'Our team is available by email and happy to help you pick the best option for your brand.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Downgrade dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <DialogTitle>Switch to Free plan</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to switch to the Free plan?
              <ul className="mt-3 space-y-1.5 text-sm">
                {[
                  'You will lose access to advanced LLM sources (Claude, Gemini and more)',
                  'Your limit will drop to 3 analyses per month',
                  'Analysis history and CSV export will be disabled',
                ].map(bullet => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">*</span> {bullet}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground/70">Your subscription will be cancelled — access continues until the end of the current billing period.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" disabled={downgrading} onClick={() => setShowDowngradeDialog(false)}>
              Stay on current plan
            </Button>
            <Button variant="destructive" className="flex-1" disabled={downgrading} onClick={confirmDowngrade}>
              {downgrading ? 'Cancelling...' : 'Yes, switch to Free'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Sales dialog — Agency plan */}
      <Dialog open={showContactSalesDialog} onOpenChange={setShowContactSalesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Talk to sales about the Agency plan</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Tell us about your agency and what you need — a real person replies within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <ContactForm defaultSubject="Agency plan inquiry" compact />
        </DialogContent>
      </Dialog>

      <div className="pb-20 px-4 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="text-center pt-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary mb-4 uppercase tracking-wider">
            Subscription
          </span>
          <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Subscription</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Choose the plan that fits — upgrade, downgrade or cancel anytime.
          </p>
        </div>

        {message && (
          <p className="mt-6 mb-2 text-center text-sm text-primary font-medium">{message}</p>
        )}

        {/* Control bar — left: billing-cycle toggle, right: usage + billing */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-8 pb-8">
          {/* Left: billing cycle */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-[hsl(var(--glass-border))] bg-muted/40 w-fit">
            {(['monthly', 'yearly'] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === cycle
                    ? 'bg-background text-foreground shadow-sm border border-input'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                {cycle === 'yearly' && (
                  <span className="ml-1.5 text-[10px] font-semibold text-primary">−20%</span>
                )}
              </button>
            ))}
          </div>

          {/* Right: credit usage + billing */}
          <CreditsUsageWidget />
        </div>

        {/* Pricing cards */}
        <PricingCards
          plans={plans}
          billingCycle={billingCycle}
          onCycleChange={setBillingCycle}
          onPlanSelect={(planId) => handlePlanSelect(planId)}
          loadingPlan={loading}
          showBillingToggle={false}
        />

        {/* How long this takes everyone else vs Presora */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-display text-foreground">How long this takes everyone else</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Checking how AI models describe your brand the old way takes days or weeks. Presora does it before you can blink.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { method: 'Manually querying models', time: '2–3 days', note: 'Asking each model, prompt by prompt, and tallying the answers yourself.' },
              { method: 'Marketing agency audit', time: '2–4 weeks', note: 'Brief, research and a presentation — plus a four-figure invoice.' },
              { method: 'Traditional monitoring tools', time: 'Hours to set up', note: 'They track social media and search engines — not what AI actually says.' },
            ].map(item => (
              <div key={item.method} className="rounded-2xl border border-[hsl(var(--glass-border))] bg-background/70 p-5">
                <p className="text-2xl font-display text-foreground">{item.time}</p>
                <p className="text-sm font-medium text-foreground mt-2">{item.method}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.note}</p>
              </div>
            ))}
            {/* Presora — the payoff */}
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 flex flex-col">
              <p className="text-2xl font-display text-primary">~15 seconds</p>
              <p className="text-sm font-semibold text-foreground mt-2">Presora</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Every model queried in parallel, scored, and turned into a prioritized action plan — automatically.</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                <Check className="w-3.5 h-3.5" /> Repeatable every month
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ — collapsible */}
        <motion.div
          className="mt-20 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-display text-foreground text-center mb-8">
            Frequently asked questions
          </h2>
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-[hsl(var(--glass-border))] bg-card/40 divide-y divide-[hsl(var(--glass-border))] overflow-hidden"
          >
            {faqItems.map((item, idx) => (
              <AccordionItem key={item.q} value={`faq-${idx}`} className="border-none px-5">
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Credit packs */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-display text-foreground">Need more analyses?</h2>
            </div>
            <p className="text-sm text-muted-foreground">Top up your account with one-time credit packs — no plan change required.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-xl border p-6 flex flex-col gap-4 transition-all ${
                  pack.popular
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-[hsl(var(--glass-border))] bg-background/80'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 bg-primary text-primary-foreground rounded-full whitespace-nowrap">
                    Best value
                  </span>
                )}
                <div>
                  <p className="text-3xl font-display text-foreground">{pack.price}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pack.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-2">One-time credit top-up</p>
                </div>
                <Button
                  onClick={() => handleCreditsBuy(pack.id)}
                  disabled={loadingCredits === pack.id}
                  variant={pack.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  {loadingCredits === pack.id ? 'Loading...' : 'Buy pack'}
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Social proof */}
        <div className="mt-16">
          <div className="rounded-3xl border border-[hsl(var(--glass-border))] bg-card/60 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-primary mb-3">
              Built for the AI era
            </p>
            <h2 className="text-2xl font-display text-foreground max-w-2xl mx-auto">
              Stay ahead of AI-driven reputation and search shifts.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
              {[
                { title: 'GEO-first approach', desc: 'Built around Generative Engine Optimization — the new standard for brand visibility in the AI era.' },
                { title: '3 leading AI models', desc: 'Coverage across ChatGPT, Claude and Gemini — the assistants your customers ask for recommendations.' },
                { title: 'Track over time', desc: 'Repeatable monthly audits show whether your optimization is actually working.' },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-[hsl(var(--glass-border))] bg-background/60 p-5">
                  <p className="text-sm font-semibold text-foreground mb-1.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

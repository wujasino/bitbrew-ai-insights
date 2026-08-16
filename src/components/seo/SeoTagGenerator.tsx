import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormState {
  brandName: string;
  pageTitle: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
  logoUrl: string;
  sameAs: string;
}

const EMPTY: FormState = {
  brandName: '', pageTitle: '', description: '', pageUrl: '', imageUrl: '', logoUrl: '', sameAs: '',
};

const CounterLabel = ({ label, value, recommended }: { label: string; value: string; recommended: [number, number] }) => {
  const len = value.length;
  const inRange = len > 0 && len >= recommended[0] && len <= recommended[1];
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <span className={cn('text-[10px] font-data', len === 0 ? 'text-muted-foreground' : inRange ? 'text-emerald-500' : 'text-amber-500')}>
        {len} chars {len > 0 && !inRange ? `(aim ${recommended[0]}–${recommended[1]})` : ''}
      </span>
    </div>
  );
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Pure client-side generator — no Google account, no API call. Produces
 * ready-to-paste <head> tags (title/description/canonical/OG/Twitter) plus
 * a JSON-LD Organization block, since structured data is what actually
 * makes Google eligible to show rich results, not just the meta tags.
 */
export const SeoTagGenerator = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<FormState>) => { setForm(prev => ({ ...prev, ...patch })); setCopied(false); };

  const sameAsList = useMemo(
    () => form.sameAs.split('\n').map(s => s.trim()).filter(Boolean),
    [form.sameAs]
  );

  const snippet = useMemo(() => {
    const title = form.pageTitle.trim() || form.brandName.trim();
    const desc = form.description.trim();
    const url = form.pageUrl.trim();
    const image = form.imageUrl.trim();
    const lines: string[] = [];
    if (title) lines.push(`<title>${escapeHtml(title)}</title>`);
    if (desc) lines.push(`<meta name="description" content="${escapeHtml(desc)}">`);
    if (url) lines.push(`<link rel="canonical" href="${escapeHtml(url)}">`);
    if (title || desc || url || image) {
      lines.push('<meta property="og:type" content="website">');
      if (title) lines.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
      if (desc) lines.push(`<meta property="og:description" content="${escapeHtml(desc)}">`);
      if (url) lines.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
      if (image) lines.push(`<meta property="og:image" content="${escapeHtml(image)}">`);
      lines.push('<meta name="twitter:card" content="summary_large_image">');
      if (title) lines.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
      if (desc) lines.push(`<meta name="twitter:description" content="${escapeHtml(desc)}">`);
      if (image) lines.push(`<meta name="twitter:image" content="${escapeHtml(image)}">`);
    }

    if (form.brandName.trim() || url || form.logoUrl.trim() || sameAsList.length > 0) {
      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
      };
      if (form.brandName.trim()) jsonLd.name = form.brandName.trim();
      if (url) jsonLd.url = url;
      if (form.logoUrl.trim()) jsonLd.logo = form.logoUrl.trim();
      if (sameAsList.length > 0) jsonLd.sameAs = sameAsList;
      lines.push('<script type="application/ld+json">');
      lines.push(JSON.stringify(jsonLd, null, 2));
      lines.push('</script>');
    }

    return lines.join('\n');
  }, [form, sameAsList]);

  const hasAnything = snippet.length > 0;

  const handleCopy = async () => {
    if (!hasAnything) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="glass-card p-5 space-y-4">
        <div>
          <Label htmlFor="seo-brand" className="text-xs text-muted-foreground">Brand / organisation name</Label>
          <Input id="seo-brand" value={form.brandName} onChange={(e) => set({ brandName: e.target.value })} placeholder="Acme Inc." className="mt-1" />
        </div>
        <div>
          <CounterLabel label="Page title" value={form.pageTitle} recommended={[15, 60]} />
          <Input value={form.pageTitle} onChange={(e) => set({ pageTitle: e.target.value })} placeholder="Acme Inc. — Cloud accounting for small teams" className="mt-1" />
        </div>
        <div>
          <CounterLabel label="Meta description" value={form.description} recommended={[50, 160]} />
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder="A one-sentence summary of the page, written for someone who has never heard of you."
            className="mt-1 w-full bg-background/60 border border-[hsl(var(--glass-border))] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 px-3 py-2 resize-none focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div>
          <Label htmlFor="seo-url" className="text-xs text-muted-foreground">Page URL (canonical)</Label>
          <Input id="seo-url" value={form.pageUrl} onChange={(e) => set({ pageUrl: e.target.value })} placeholder="https://acme.com/" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="seo-image" className="text-xs text-muted-foreground">Social preview image URL</Label>
          <Input id="seo-image" value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://acme.com/og-image.png" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="seo-logo" className="text-xs text-muted-foreground">Logo URL (for structured data)</Label>
          <Input id="seo-logo" value={form.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://acme.com/logo.png" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="seo-sameas" className="text-xs text-muted-foreground">Social profile URLs (one per line, optional)</Label>
          <textarea
            id="seo-sameas"
            value={form.sameAs}
            onChange={(e) => set({ sameAs: e.target.value })}
            rows={3}
            placeholder={'https://x.com/acme\nhttps://linkedin.com/company/acme'}
            className="mt-1 w-full bg-background/60 border border-[hsl(var(--glass-border))] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 px-3 py-2 resize-none focus:outline-none focus:border-primary/40 transition-colors font-data"
          />
        </div>
      </div>

      <div className="glass-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Generated tags</p>
          <Button size="sm" variant="outline" onClick={handleCopy} disabled={!hasAnything} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="flex-1 overflow-auto text-xs font-data bg-background/60 border border-[hsl(var(--glass-border))] rounded-xl p-4 whitespace-pre-wrap break-words text-foreground/80 min-h-[280px]">
          {hasAnything ? snippet : 'Fill in the fields on the left — the tags to paste into your page\'s <head> will show up here.'}
        </pre>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Paste this inside your page's <code className="font-data">&lt;head&gt;</code>. This doesn't touch your Google account or Search Console — it only prepares the tags; you (or your CMS) still publish them.
        </p>
      </div>
    </div>
  );
};

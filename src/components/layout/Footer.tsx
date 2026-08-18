import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';

// lucide-react doesn't ship a TikTok glyph — hand-drawn to match the stroke
// weight/viewBox of the lucide icons it sits next to in the socials row.
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const LINKS = [
  { label: 'About', to: '/about' },
  { label: 'For Agencies', to: '/agencies' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'API Docs', to: '/docs/api' },
  { label: 'Contact', to: '/contact' },
  { label: 'Status', to: '/status' },
  { label: 'Privacy Policy', to: '/polityka-prywatnosci' },
  { label: 'Terms of Service', to: '/regulamin' },
];

// Only profiles that actually exist. The Twitter/LinkedIn/GitHub entries
// removed here pointed at placeholder handles that were never registered —
// a dead social icon in the footer reads as an abandoned product.
const SOCIALS = [
  { href: 'https://www.instagram.com/presora.app', Icon: Instagram, label: 'Instagram' },
  { href: 'https://www.tiktok.com/@presora.app', Icon: TikTokIcon, label: 'TikTok' },
];

export const Footer = () => {
  return (
    <footer className="border-t border-[hsl(var(--glass-border))] bg-card/20 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 w-fit shrink-0">
          <Wordmark className="text-2xl" />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map(({ label, to }) => (
            <Link key={label} to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {SOCIALS.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-9 h-9 rounded-xl border border-[hsl(var(--glass-border))] bg-card/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[hsl(var(--glass-border))] text-center">
        <p className="text-xs text-muted-foreground/60">© 2026 Presora. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';

const LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'API Docs', to: '/docs/api' },
  { label: 'Contact', to: '/contact' },
  { label: 'Status', to: '/status' },
  { label: 'Privacy Policy', to: '/polityka-prywatnosci' },
  { label: 'Terms of Service', to: '/regulamin' },
];

const SOCIALS = [
  { href: 'https://twitter.com/presora_ai', Icon: Twitter, label: 'Twitter/X' },
  { href: 'https://linkedin.com/company/presora', Icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://github.com/presora-ai', Icon: Github, label: 'GitHub' },
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

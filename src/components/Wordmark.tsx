import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// The woven "p" mark comes in a dark-ink version (for light backgrounds) and a
// cream version (for dark backgrounds) — same glyph, sized to match visually.
const MARK_LIGHT = '/percelyze-logo.png';
const MARK_DARK = '/presora-logo-cream-square.png';

/** The Presora app icon — woven "p" mark, swapped for contrast with the active theme. */
const Mark = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme();
  return (
    <img
      src={resolvedTheme === 'light' ? MARK_LIGHT : MARK_DARK}
      alt=""
      aria-hidden="true"
      className={cn('rounded-[22%] shrink-0 object-contain', className)}
    />
  );
};

interface WordmarkProps {
  className?: string;
  /** Render only the mark, no "presora" text — used in collapsed nav states. */
  iconOnly?: boolean;
}

/**
 * Brand lockup used across the app in place of a text-only logo.
 * Size/alignment is controlled by the caller via `className`.
 */
export const Wordmark = ({ className, iconOnly }: WordmarkProps) => {
  if (iconOnly) {
    return <Mark className={cn('h-6 w-6', className)} />;
  }
  return (
    <span className={cn('inline-flex items-center gap-2 font-wordmark font-bold tracking-tight text-foreground lowercase', className)}>
      <Mark className="h-[1.2em] w-[1.2em]" />
      presora
    </span>
  );
};

export default Wordmark;

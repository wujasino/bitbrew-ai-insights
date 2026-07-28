import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// The "P" mark comes in a black version (for light backgrounds) and a
// white version (for dark backgrounds) — same glyph, sized to match visually.
const MARK_LIGHT = '/presora-mark.png';
const MARK_DARK = '/presora-mark-white.png';

/**
 * Reads contrast need straight off the <html> element's `.dark` class instead
 * of next-themes' resolvedTheme — pages like the landing page force light by
 * toggling that class directly (see useForceLightTheme), which next-themes'
 * own state doesn't see, so resolvedTheme would report stale/wrong contrast.
 */
const useIsDark = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

/** The Presora app icon — woven "p" mark, swapped for contrast with the active theme. */
const Mark = ({ className }: { className?: string }) => {
  const isDark = useIsDark();
  return (
    <img
      src={isDark ? MARK_DARK : MARK_LIGHT}
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
      <Mark className="h-[2.2em] w-[2.2em]" />
      <span className="text-2xl leading-none">presora</span>
    </span>
  );
};

export default Wordmark;

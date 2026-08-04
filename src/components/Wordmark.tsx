import { cn } from '@/lib/utils';

// Brand-indigo glyph — reads clearly on both light and dark backgrounds,
// so no theme-based swap is needed.
const MARK_INDIGO = '/presora-mark-indigo.png';

/** The Presora app icon — woven "p" mark in brand indigo. */
const Mark = ({ className }: { className?: string }) => (
  <img
    src={MARK_INDIGO}
    alt=""
    aria-hidden="true"
    className={cn('rounded-[22%] shrink-0 object-contain', className)}
  />
);

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
    <span className={cn('inline-flex items-center gap-2 font-wordmark font-normal tracking-wide text-foreground uppercase', className)}>
      <Mark className="h-[2.2em] w-[2.2em]" />
      <span className="text-xl leading-none">presora</span>
    </span>
  );
};

export default Wordmark;

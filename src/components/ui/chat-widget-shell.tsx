import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatWidgetShellProps {
  title: string;
  messages: ChatMsg[];
  loading: boolean;
  error: string;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
  suggestions?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Positioning classes for the fixed wrapper — lets callers avoid colliding with other floating UI (e.g. the cookie banner). */
  positionClassName?: string;
}

// Shared visual chrome (launcher button, panel, message list, input) for
// the two support-bot chat widgets: sales/FAQ (no auth) and result
// interpreter (authenticated, per-scan). Callers own the actual
// send-a-message logic — this component only renders state it's given.
export function ChatWidgetShell({
  title,
  messages,
  loading,
  error,
  input,
  onInputChange,
  onSend,
  suggestions,
  open,
  onOpenChange,
  positionClassName = 'bottom-24 right-6',
}: ChatWidgetShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(input);
  };

  return (
    <div className={cn('fixed z-40 flex flex-col items-end gap-3', positionClassName)}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[min(92vw,380px)] h-[min(70vh,560px)] flex flex-col rounded-2xl border border-[hsl(var(--glass-border))] bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--glass-border))] bg-card/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{title}</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              {messages.length === 1 && !loading && suggestions && suggestions.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSend(s)}
                      className="text-left text-xs text-muted-foreground hover:text-foreground border border-[hsl(var(--glass-border))] rounded-lg px-3 py-2 transition-colors active:scale-[0.98]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[hsl(var(--glass-border))]">
              <input
                id="chat-widget-input"
                name="message"
                type="text"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Ask a question"
                maxLength={2000}
                className="flex-1 h-9 px-3 rounded-lg bg-background border border-[hsl(var(--glass-border))] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-[0.96]"
                aria-label="Send"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => onOpenChange(!open)}
        whileTap={{ scale: 0.94 }}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-[#4F46E5] transition-colors"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default ChatWidgetShell;

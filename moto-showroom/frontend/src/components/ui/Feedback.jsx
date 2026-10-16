import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { cn, STATUS } from '../../lib/format';

const TONE_CLASSES = {
  green: 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/25 dark:text-emerald-300 dark:ring-emerald-400/25',
  amber: 'bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:text-amber-300 dark:ring-amber-400/25',
  red: 'bg-red-500/10 text-red-700 ring-red-600/25 dark:text-red-300 dark:ring-red-400/25',
  blue: 'bg-sky-500/10 text-sky-700 ring-sky-600/25 dark:text-sky-300 dark:ring-sky-400/25',
  violet: 'bg-violet-500/10 text-violet-700 ring-violet-600/25 dark:text-violet-300 dark:ring-violet-400/25',
  zinc: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/25 dark:text-zinc-300 dark:ring-zinc-400/25',
  orange: 'bg-ignite/10 text-ignite-700 ring-ignite/30 dark:text-ignite-400',
};

export function Badge({ tone = 'zinc', children, className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONE_CLASSES[tone] || TONE_CLASSES.zinc,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** <StatusBadge kind="booking" value="pending" /> */
export function StatusBadge({ kind, value, className }) {
  const [label, tone] = STATUS[kind]?.[value] || [value, 'zinc'];
  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  );
}

export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 className={cn('h-5 w-5 animate-spin text-ignite', className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-lg bg-zinc-200 dark:bg-white/[0.06]', className)}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/[0.06]" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-fog">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-fog">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className, compact = false }) {
  const offline = error?.code === 'network_error';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-500/25 bg-red-500/[0.06] px-6 text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="mb-3 h-7 w-7 text-tail" aria-hidden />
      <h3 className="font-bold">{offline ? 'Server not reachable' : 'Could not load this section'}</h3>
      <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-fog">{error?.message || 'Unexpected error.'}</p>
      {onRetry && (
        <button onClick={() => onRetry()} className="a-btn btn-sm mt-4">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

export function Tooltip({ label, children, side = 'top' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function DemoNotice({ children, className }) {
  return (
    <p
      className={cn(
        'rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-800 dark:text-amber-200',
        className
      )}
    >
      {children}
    </p>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';

/** Page-number pagination driven by API meta { page, pages, total, page_size }. */
export function Pagination({ meta, onPage, className }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages } = meta;
  const nums = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:opacity-40';
  return (
    <nav className={cn('flex flex-wrap items-center justify-between gap-3', className)} aria-label="Pagination">
      <p className="text-sm text-zinc-500 dark:text-fog tabular">
        Showing {(page - 1) * meta.page_size + 1}–{Math.min(page * meta.page_size, meta.total)} of {meta.total}
      </p>
      <div className="flex items-center gap-1">
        <button
          className={cn(btn, 'hover:bg-zinc-100 dark:hover:bg-white/10')}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1 text-zinc-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                btn,
                'tabular',
                n === page ? 'bg-ignite text-white' : 'hover:bg-zinc-100 dark:hover:bg-white/10'
              )}
            >
              {n}
            </button>
          )
        )}
        <button
          className={cn(btn, 'hover:bg-zinc-100 dark:hover:bg-white/10')}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/** Underlined tabs with an animated indicator. tabs: [{ value, label, count? }] */
export function Tabs({ tabs, value, onChange, className, layoutId = 'tab-indicator' }) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-white/10', className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-zinc-900 dark:text-bone' : 'text-zinc-500 hover:text-zinc-800 dark:text-fog dark:hover:text-bone'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded bg-zinc-100 px-1.5 text-xs tabular dark:bg-white/10">{t.count}</span>
            )}
            {active && <motion.span layoutId={layoutId} className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-ignite" />}
          </button>
        );
      })}
    </div>
  );
}

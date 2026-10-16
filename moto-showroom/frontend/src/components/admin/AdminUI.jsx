import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/format';
import { EmptyState, ErrorState, Skeleton } from '../ui/Feedback';

export function PageHeader({ title, description, crumbs = [], actions }) {
  return (
    <div className="mb-6">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-fog">
        <Link to="/admin/dashboard" className="hover:text-zinc-900 dark:hover:text-bone">Admin</Link>
        {crumbs.map((c) => (
          <span key={c.label} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {c.to ? <Link to={c.to} className="hover:text-zinc-900 dark:hover:text-bone">{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 dark:text-bone">{title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500 dark:text-fog">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default', to }) {
  const body = (
    <div className="a-card h-full p-4 transition-colors hover:border-zinc-300 dark:hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-500 dark:text-fog">{label}</p>
        {Icon && (
          <span className={cn('rounded-lg p-1.5', tone === 'accent' ? 'bg-ignite/10 text-ignite' : 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-fog')}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="font-cond mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500 dark:text-fog">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

/**
 * Responsive table. columns: [{ key, label, render?(row), className?, align? }]
 */
export function DataTable({ columns, rows, loading, error, onRetry, empty, rowKey = 'id', onRowClick, skeletonRows = 6 }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} className="m-4" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-white/10 dark:text-fog">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('whitespace-nowrap px-4 py-3 font-semibold', c.align === 'right' && 'text-right', c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-white/5">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5"><Skeleton className="h-4 w-full max-w-[10rem]" /></td>
                  ))}
                </tr>
              ))
            : rows.map((r) => (
                <tr
                  key={r[rowKey]}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn(
                    'border-b border-zinc-100 last:border-0 dark:border-white/5',
                    onRowClick && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-middle', c.align === 'right' && 'text-right', c.className)}>
                      {c.render ? c.render(r) : r[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (empty || <EmptyState title="Nothing here yet" text="Try changing the search or filters." />)}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-zinc-200 p-3 dark:border-white/10 sm:flex-row sm:items-center">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="a-input sm:max-w-xs"
      />
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, label }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="a-input w-auto">
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-white/5">
      <dt className="text-zinc-500 dark:text-fog">{label}</dt>
      <dd className="text-right font-medium">{children ?? '—'}</dd>
    </div>
  );
}

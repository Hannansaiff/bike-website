import { useId } from 'react';
import { cn } from '../../lib/format';

/**
 * Form primitives. `variant="public"` uses the dark showroom input style,
 * `variant="admin"` (default) works in both admin light and dark themes.
 */
export function Field({ label, error, hint, required, children, className, htmlFor }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700 dark:text-bone/85">
          {label}
          {required && <span className="ml-0.5 text-ignite" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500 dark:text-fog">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass = (variant, error) =>
  cn(variant === 'public' ? 'p-input' : 'a-input', error && '!border-red-500 focus:!ring-red-500/25');

export function Input({ label, error, hint, required, variant, className, id, ...props }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={fid}>
      <input
        id={fid}
        aria-invalid={!!error}
        aria-required={required}
        className={inputClass(variant, error)}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ label, error, hint, required, variant, className, id, rows = 4, ...props }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={fid}>
      <textarea id={fid} rows={rows} aria-invalid={!!error} className={inputClass(variant, error)} {...props} />
    </Field>
  );
}

export function Select({ label, error, hint, required, variant, className, id, options = [], placeholder, ...props }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={fid}>
      <select id={fid} aria-invalid={!!error} className={cn(inputClass(variant, error), 'pr-8')} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description, name, disabled }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-xs text-zinc-500 dark:text-fog">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        name={name}
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-ignite' : 'bg-zinc-300 dark:bg-steel'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}

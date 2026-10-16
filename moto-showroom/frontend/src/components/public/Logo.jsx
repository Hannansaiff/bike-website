import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

/** Tachometer mark + wordmark from settings (logo_text or uploaded logo URL). */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#23252b" />
      <path d="M6 21a10 10 0 0 1 20 0" fill="none" stroke="#f4f4f1" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22.5 13.5 26 21" stroke="#e5172f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 21 22 12" stroke="#ff5b1f" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="21" r="2.2" fill="#ff5b1f" />
    </svg>
  );
}

export default function Logo({ settings, to = '/', className, sub }) {
  const text = settings?.logo_text || 'REVZONE';
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)} aria-label={`${settings?.business_name || text} home`}>
      {settings?.logo_url ? (
        <img src={settings.logo_url} alt="" className="h-8 w-auto" />
      ) : (
        <LogoMark />
      )}
      <span className="leading-none">
        <span className="font-display block text-lg tracking-tight">{text}</span>
        {sub && <span className="mt-0.5 block text-[11px] font-medium text-fog">{sub}</span>}
      </span>
    </Link>
  );
}

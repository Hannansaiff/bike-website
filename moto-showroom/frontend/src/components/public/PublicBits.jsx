import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { cn } from '../../lib/format';
import { SmartImage } from '../ui/Media';

export function SectionHeader({ title, text, link, linkLabel = 'View all', className }) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        {text && <p className="mt-3 text-fog">{text}</p>}
      </div>
      {link && (
        <Link to={link} className="btn-ghost">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function PageHero({ title, text, children }) {
  return (
    <section className="border-b border-white/10 bg-black">
      <div className="container-site py-14 sm:py-20">
        <h1 className="font-display text-4xl sm:text-6xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg text-fog">{text}</p>}
        {children}
      </div>
    </section>
  );
}

/** Floating tray showing bikes picked for comparison. */
export function CompareTray() {
  const { compare, removeCompare, clearCompare } = useShop();
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-carbon/95 backdrop-blur-xl no-print"
          aria-label="Compare tray"
        >
          <div className="container-site flex flex-wrap items-center gap-3 py-3">
            <p className="text-sm font-semibold">Compare ({compare.length}/3)</p>
            <ul className="flex flex-1 flex-wrap gap-2">
              {compare.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-graphite py-1 pl-1 pr-2">
                  <SmartImage src={c.image} alt="" className="h-8 w-11 rounded" />
                  <span className="max-w-[9rem] truncate text-xs font-medium">{c.name}</span>
                  <button onClick={() => removeCompare(c.id)} aria-label={`Remove ${c.name}`} className="text-fog hover:text-bone">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={clearCompare} className="btn-ghost btn-sm">Clear</button>
            <button
              onClick={() => navigate('/compare')}
              disabled={compare.length < 2}
              className="btn-primary btn-sm"
              title={compare.length < 2 ? 'Pick at least two bikes' : undefined}
            >
              Compare now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

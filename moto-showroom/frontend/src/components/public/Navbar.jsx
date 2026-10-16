import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, LogIn, Menu, User, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/format';
import Logo from './Logo';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/bikes', label: 'Bikes' },
  { to: '/categories', label: 'Categories', dropdown: true },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About us' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

const linkClass = ({ isActive }) =>
  cn(
    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-bone' : 'text-bone/65 hover:text-bone'
  );

function ActiveBar({ show }) {
  return show ? <motion.span layoutId="nav-active" className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-ignite" /> : null;
}

export default function Navbar() {
  const { settings, categories } = useSite();
  const { favourites } = useShop();
  const { customer } = useAuth();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const catRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setCatOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!catOpen) return undefined;
    const close = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setCatOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [catOpen]);

  const path = location.pathname;
  const isActive = (l) => (l.end ? path === l.to : path.startsWith(l.to));

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled ? 'border-white/10 bg-carbon/85 backdrop-blur-xl' : 'border-transparent bg-carbon/40 backdrop-blur'
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn-light">
        Skip to content
      </a>
      <nav className="container-site flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Logo settings={settings} />

        <ul className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) =>
            l.dropdown ? (
              <li key={l.to} className="relative" ref={catRef}>
                <button
                  className={linkClass({ isActive: isActive(l) }) + ' inline-flex items-center gap-1'}
                  aria-expanded={catOpen}
                  aria-haspopup="true"
                  onClick={() => setCatOpen((v) => !v)}
                >
                  {l.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', catOpen && 'rotate-180')} />
                  <ActiveBar show={isActive(l)} />
                </button>
                <AnimatePresence>
                  {catOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-1/2 top-full mt-3 w-[30rem] -translate-x-1/2 rounded-2xl border border-white/10 bg-graphite p-2 shadow-lift"
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            to={`/categories/${c.slug}`}
                            className="rounded-xl px-3 py-2.5 hover:bg-white/[0.06] focus:bg-white/[0.06]"
                          >
                            <span className="block text-sm font-semibold text-bone">{c.name}</span>
                            <span className="line-clamp-1 text-xs text-fog">{c.description}</span>
                          </Link>
                        ))}
                      </div>
                      <Link
                        to="/categories"
                        className="mt-1 block rounded-xl px-3 py-2 text-sm font-semibold text-ignite hover:bg-white/[0.06]"
                      >
                        View all categories
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ) : (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                  <ActiveBar show={isActive(l)} />
                </NavLink>
              </li>
            )
          )}
        </ul>

        <div className="flex items-center gap-1.5">
          <Link to="/favourites" className="btn-icon relative text-bone/80 hover:bg-white/10 hover:text-bone" aria-label={`Favourites (${favourites.length})`}>
            <Heart className="h-5 w-5" />
            {favourites.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ignite px-1 text-[10px] font-bold text-white tabular">
                {favourites.length}
              </span>
            )}
          </Link>
          <Link
            to={customer ? '/account' : '/login'}
            className="btn-icon text-bone/80 hover:bg-white/10 hover:text-bone"
            aria-label={customer ? 'My account' : 'Sign in'}
          >
            {customer ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          </Link>
          <Link to="/book" className="btn-primary ml-1 hidden sm:inline-flex">
            Book a test ride
          </Link>
          <button
            className="btn-icon text-bone hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/10 bg-carbon lg:hidden"
          >
            <ul className="container-site space-y-1 py-4">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cn('block rounded-lg px-3 py-2.5 text-base font-medium', isActive ? 'bg-white/[0.07] text-bone' : 'text-bone/70')
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="grid grid-cols-2 gap-2 pt-3">
                <Link to="/book" className="btn-primary">
                  Book a test ride
                </Link>
                <Link to="/track-booking" className="btn-ghost">
                  Track booking
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

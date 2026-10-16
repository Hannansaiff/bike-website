import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BarChart3, Bell, Bike, Boxes, CalendarCheck, ExternalLink, FileText, Image, Inbox, LayoutDashboard,
  LogOut, Menu, Moon, Receipt, RotateCcw, Settings, ShieldCheck, Sun, Tags, BadgePercent, Users, Layers, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { storage } from '../lib/storage';
import { bookingsApi, enquiriesApi, systemApi } from '../lib/services';
import { cn, timeAgo } from '../lib/format';
import { LogoMark } from '../components/public/Logo';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export const ADMIN_NAV = [
  { group: 'Overview', items: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  ] },
  { group: 'Catalogue', items: [
    { to: '/admin/bikes', label: 'Motorcycles', icon: Bike, module: 'bikes' },
    { to: '/admin/categories', label: 'Categories', icon: Layers, module: 'categories' },
    { to: '/admin/brands', label: 'Brands', icon: Tags, module: 'brands' },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes, module: 'inventory' },
  ] },
  { group: 'Sales', items: [
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, module: 'bookings' },
    { to: '/admin/sales', label: 'Sales & invoices', icon: Receipt, module: 'sales' },
    { to: '/admin/customers', label: 'Customers', icon: Users, module: 'customers' },
    { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox, module: 'enquiries' },
    { to: '/admin/offers', label: 'Offers', icon: BadgePercent, module: 'offers' },
  ] },
  { group: 'Website', items: [
    { to: '/admin/content', label: 'Content', icon: FileText, module: 'content' },
    { to: '/admin/gallery', label: 'Gallery', icon: Image, module: 'gallery' },
  ] },
  { group: 'System', items: [
    { to: '/admin/staff', label: 'Staff & roles', icon: ShieldCheck, module: 'staff' },
    { to: '/admin/activity-logs', label: 'Activity log', icon: Activity, module: 'activity-logs' },
    { to: '/admin/settings', label: 'Settings', icon: Settings, module: 'settings' },
  ] },
];

function Sidebar({ onNavigate }) {
  const { canAccess } = useAuth();
  const { settings } = useSite();
  return (
    <div className="flex h-full flex-col bg-carbon text-bone">
      <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-5 py-5" onClick={onNavigate}>
        <LogoMark />
        <span>
          <span className="font-display block text-base">{settings?.logo_text || 'REVZONE'}</span>
          <span className="block text-[11px] text-fog">Showroom manager</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Admin">
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((i) => canAccess(i.module));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <p className="px-3 pb-1.5 text-xs font-semibold text-fog/80">{g.group}</p>
              <ul className="space-y-0.5">
                {items.map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-white/[0.08] text-bone' : 'text-bone/65 hover:bg-white/[0.04] hover:text-bone'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <motion.span layoutId="admin-nav" className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded bg-ignite" />}
                          <i.icon className={cn('h-4 w-4', isActive && 'text-ignite')} />
                          {i.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fog hover:bg-white/5 hover:text-bone">
          <ExternalLink className="h-4 w-4" /> View public website
        </a>
      </div>
    </div>
  );
}

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [open, setOpen]);
  return ref;
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useOutsideClose(open, setOpen);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    Promise.all([
      bookingsApi.list({ status: 'pending', page_size: 5 }),
      enquiriesApi.list({ status: 'new', page_size: 5 }),
    ])
      .then(([b, e]) => {
        if (!alive) return;
        setItems([
          ...b.data.map((x) => ({ id: `b${x.id}`, to: '/admin/bookings', text: `${x.type_label} request ${x.reference} from ${x.name}`, at: x.created_at })),
          ...e.data.map((x) => ({ id: `e${x.id}`, to: '/admin/enquiries', text: `Enquiry: ${x.subject} (${x.name})`, at: x.created_at })),
        ].sort((a, c) => (a.at < c.at ? 1 : -1)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="btn-icon relative hover:bg-zinc-100 dark:hover:bg-white/10" aria-label={`Notifications (${items.length})`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {items.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ignite" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="a-card absolute right-0 z-50 mt-2 w-80 overflow-hidden shadow-lift"
          >
            <p className="border-b border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-white/10">Needs attention</p>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-fog">You're all caught up.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link to={n.to} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-white/5">
                      {n.text}
                      <span className="block text-xs text-zinc-500 dark:text-fog">{timeAgo(n.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu({ onReset }) {
  const { admin, adminLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  const navigate = useNavigate();
  const initials = (admin?.user?.name || 'A').split(' ').map((s) => s[0]).join('').slice(0, 2);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-zinc-100 dark:hover:bg-white/10" aria-expanded={open} aria-label="Profile menu">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ignite text-xs font-bold text-white">{initials}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{admin?.user?.name}</span>
          <span className="block text-xs text-zinc-500 dark:text-fog">{admin?.user?.role_label}</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="a-card absolute right-0 z-50 mt-2 w-60 p-1.5 shadow-lift"
          >
            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-fog">{admin?.user?.email}</p>
            <button onClick={() => { setOpen(false); onReset(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/5">
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </button>
            <button onClick={() => { adminLogout(); navigate('/admin/login'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout() {
  const { admin } = useAuth();
  const { settings, refresh } = useSite();
  const toast = useToast();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => storage.get('rz_admin_theme') || settings?.default_theme || 'dark');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => storage.set('rz_admin_theme', theme), [theme]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const doReset = async () => {
    try {
      await systemApi.resetDemo();
      await refresh();
      setResetKey((k) => k + 1);
      toast.success('Demo data restored to the original sample dataset');
    } catch (e) {
      toast.error(e.message);
    }
    setConfirmReset(false);
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-[#1b1c21] dark:text-bone">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 lg:block">
          <Sidebar />
        </aside>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}
              >
                <button onClick={() => setMobileOpen(false)} className="btn-icon absolute right-3 top-4 z-10 text-bone hover:bg-white/10" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur dark:border-white/10 dark:bg-[#1b1c21]/85 sm:px-6">
            <button className="btn-icon hover:bg-zinc-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 sm:inline">
              Demo mode · in-memory data
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                className="btn-icon hover:bg-zinc-100 dark:hover:bg-white/10"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Notifications />
              <ProfileMenu onReset={() => setConfirmReset(true)} />
            </div>
          </header>
          <motion.main
            key={location.pathname + resetKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-[96rem] p-4 sm:p-6"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="All changes made in this demo (bikes, bookings, sales, content…) will be replaced with the original sample dataset."
        confirmLabel="Reset data"
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

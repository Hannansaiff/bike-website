import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import { CompareTray } from '../components/public/PublicBits';
import { useSite } from '../context/SiteContext';
import { ErrorState } from '../components/ui/Feedback';

export default function PublicLayout() {
  const location = useLocation();
  const { error, refresh, settings } = useSite();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (settings?.business_name) document.title = `${settings.business_name} – ${settings.tagline || 'Motorcycle Showroom'}`;
  }, [settings]);

  return (
    <div className="dark min-h-screen bg-carbon text-bone">
      <Navbar />
      {error && (
        <div className="container-site pt-6">
          <ErrorState error={error} onRetry={refresh} compact />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CompareTray />
    </div>
  );
}

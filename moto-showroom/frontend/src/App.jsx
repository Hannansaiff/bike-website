import { Component, lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import PublicLayout from './layouts/PublicLayout';
import { useAuth } from './context/AuthContext';
import { Spinner, EmptyState } from './components/ui/Feedback';
import Home from './pages/public/Home';
import Bikes from './pages/public/Bikes';
import BikeDetail from './pages/public/BikeDetail';
import { Book, TrackBooking } from './pages/public/Booking';
import { About, Categories, Compare, Contact, Favourites, GalleryPage, NotFound, Offers } from './pages/public/Pages';
import { Account, Login, Register } from './pages/public/Account';

// Admin is code-split so public visitors never download dashboard code.
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminSales = lazy(() => import('./pages/admin/Sales'));
const Invoice = lazy(() => import('./pages/admin/Sales').then((m) => ({ default: m.Invoice })));
const AdminContent = lazy(() => import('./pages/admin/Content'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const ActivityLogs = lazy(() => import('./pages/admin/Reports').then((m) => ({ default: m.ActivityLogs })));
const Settings = lazy(() => import('./pages/admin/Settings'));
const mod = (name) => lazy(() => import('./pages/admin/Modules').then((m) => ({ default: m[name] })));
const AdminBikes = mod('AdminBikes');
const AdminCategories = mod('AdminCategories');
const AdminBrands = mod('AdminBrands');
const AdminOffers = mod('AdminOffers');
const AdminGallery = mod('AdminGallery');
const AdminStaff = mod('AdminStaff');
const AdminEnquiries = mod('AdminEnquiries');
const AdminCustomers = mod('AdminCustomers');

/** Frontend-only role check (UX). Real authorization must happen in FastAPI. */
function RequireModule({ module, children }) {
  const { canAccess } = useAuth();
  if (canAccess(module)) return children;
  return (
    <EmptyState icon={ShieldCheck} title="Not available for your role"
      text="Your demo role doesn't include this module. Sign in as the Owner/Admin to see everything."
      action={<Link to="/admin/dashboard" className="btn-primary">Back to dashboard</Link>} />
  );
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold">Something broke on this page</h1>
          <p className="mt-2 max-w-md text-sm text-fog">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn-primary mt-5" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Loading = () => <div className="flex min-h-[50vh] items-center justify-center"><Spinner className="h-8 w-8" /></div>;

const ADMIN_ROUTES = [
  ['dashboard', Dashboard, 'dashboard'], ['bikes', AdminBikes, 'bikes'], ['categories', AdminCategories, 'categories'],
  ['brands', AdminBrands, 'brands'], ['bookings', AdminBookings, 'bookings'], ['customers', AdminCustomers, 'customers'],
  ['sales', AdminSales, 'sales'], ['sales/:id/invoice', Invoice, 'sales'], ['inventory', AdminInventory, 'inventory'],
  ['offers', AdminOffers, 'offers'], ['gallery', AdminGallery, 'gallery'], ['content', AdminContent, 'content'],
  ['enquiries', AdminEnquiries, 'enquiries'], ['staff', AdminStaff, 'staff'], ['reports', Reports, 'reports'],
  ['activity-logs', ActivityLogs, 'activity-logs'], ['settings', Settings, 'settings'],
];

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="bikes" element={<Bikes />} />
            <Route path="bikes/:slug" element={<BikeDetail />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<Bikes />} />
            <Route path="offers" element={<Offers />} />
            <Route path="about" element={<About />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="contact" element={<Contact />} />
            <Route path="book" element={<Book />} />
            <Route path="track-booking" element={<TrackBooking />} />
            <Route path="compare" element={<Compare />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {ADMIN_ROUTES.map(([path, Page, module]) => (
              <Route key={path} path={path} element={<RequireModule module={module}><Suspense fallback={<Loading />}><Page /></Suspense></RequireModule>} />
            ))}
            <Route path="*" element={<NotFound admin />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

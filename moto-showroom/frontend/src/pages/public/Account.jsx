import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../lib/services';
import { rules } from '../../lib/validation';
import { formatDate, formatPKR, formatTime } from '../../lib/format';
import { PageHero } from '../../components/public/PublicBits';
import { DemoNotice, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { FormError, Input } from '../../components/ui/Form';
import { Tabs } from '../../components/ui/Navigation';
import { SmartImage } from '../../components/ui/Media';

export function Login() {
  const { customerLogin, customer } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ email: '', password: '' }, { email: [rules.required('Email'), rules.email()], password: [rules.required('Password')] });
  if (customer) return <Navigate to="/account" replace />;
  return (
    <div className="container-site flex justify-center py-16">
      <form onSubmit={form.submit(async (v) => { await customerLogin(v.email, v.password); navigate('/account'); })} noValidate className="p-card w-full max-w-md space-y-4 p-7">
        <h1 className="font-display text-3xl">Sign in</h1>
        <DemoNotice>Demo login. Try <b>ahmed.1@example.com</b> / <b>demo1234</b>. Not real authentication.</DemoNotice>
        <FormError message={form.formError} />
        <Input variant="public" name="email" type="email" label="Email" autoComplete="email" value={form.values.email} onChange={form.handleChange} error={form.errors.email} />
        <Input variant="public" name="password" type="password" label="Password" autoComplete="current-password" value={form.values.password} onChange={form.handleChange} error={form.errors.password} />
        <button className="btn-primary w-full" disabled={form.submitting}>{form.submitting ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-center text-sm text-fog">New here? <Link to="/register" className="text-ignite-400 hover:underline">Create an account</Link></p>
      </form>
    </div>
  );
}

export function Register() {
  const { customerRegister, customer } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ name: '', phone: '', email: '', city: '', password: '' }, {
    name: [rules.required('Full name'), rules.minLen(3, 'Full name')],
    phone: [rules.required('Phone'), rules.phone()],
    email: [rules.required('Email'), rules.email()],
    password: [rules.required('Password'), rules.minLen(6, 'Password')],
  });
  if (customer) return <Navigate to="/account" replace />;
  return (
    <div className="container-site flex justify-center py-16">
      <form onSubmit={form.submit(async (v) => { await customerRegister(v); navigate('/account'); })} noValidate className="p-card w-full max-w-md space-y-4 p-7">
        <h1 className="font-display text-3xl">Create account</h1>
        <DemoNotice>Demo accounts live in server memory and disappear when the backend restarts.</DemoNotice>
        <FormError message={form.formError} />
        {[['name', 'Full name', 'text'], ['phone', 'Mobile number', 'tel'], ['email', 'Email', 'email'], ['city', 'City (optional)', 'text'], ['password', 'Password', 'password']].map(([n, l, t]) => (
          <Input key={n} variant="public" name={n} type={t} label={l} value={form.values[n]} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors[n]} />
        ))}
        <button className="btn-primary w-full" disabled={form.submitting}>{form.submitting ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-fog">Already registered? <Link to="/login" className="text-ignite-400 hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}

function BookingList({ items }) {
  if (!items.length) return <EmptyState title="Nothing here yet" action={<Link to="/book" className="btn-primary">Book a test ride</Link>} />;
  return (
    <ul className="divide-y divide-white/10">
      {items.map((b) => (
        <li key={b.id} className="flex flex-wrap items-center gap-4 py-4">
          <SmartImage src={b.bike_image} alt="" className="h-14 w-20 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{b.bike_name}</p>
            <p className="text-sm text-fog">{b.type_label} – {formatDate(b.preferred_date)} at {formatTime(b.preferred_time)} – <span className="font-cond">{b.reference}</span></p>
          </div>
          <StatusBadge kind="booking" value={b.status} />
        </li>
      ))}
    </ul>
  );
}

export function Account() {
  const { customer, customerLogout, saveCustomer } = useAuth();
  const { favourites } = useShop();
  const toast = useToast();
  const [tab, setTab] = useState('bookings');
  const { data, loading, error, reload } = useApi(() => authApi.accountOverview(), [customer?.token], { enabled: !!customer });
  const c = customer?.customer || {};
  const form = useForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', city: c.city || '' }, {
    name: [rules.required('Name')], phone: [rules.required('Phone'), rules.phone()], email: [rules.required('Email'), rules.email()],
  });
  useEffect(() => {
    if (error?.status === 401) customerLogout(); // stale demo token (e.g. backend restarted)
  }, [error, customerLogout]);
  if (!customer) return <Navigate to="/login" replace />;
  const saveProfile = form.submit(async (v) => {
    const { data: res } = await authApi.updateProfile(v);
    saveCustomer(res);
    toast.success('Profile updated');
    reload({ silent: true });
  });

  return (
    <>
      <PageHero title={`Hello, ${c.name?.split(' ')[0] || 'rider'}`} text="Your bookings, test rides, purchases and saved bikes in one place.">
        <button onClick={customerLogout} className="btn-ghost mt-6"><LogOut className="h-4 w-4" /> Sign out</button>
      </PageHero>
      <div className="container-site py-10">
        <DemoNotice className="mb-6">Demo account area. Favourites are stored in this browser; everything else comes from the demo API.</DemoNotice>
        <Tabs value={tab} onChange={setTab} layoutId="account-tabs" tabs={[
          { value: 'bookings', label: 'Bookings', count: data?.bookings.length },
          { value: 'rides', label: 'Test rides', count: data?.test_rides.length },
          { value: 'purchases', label: 'Purchases', count: data?.sales.length },
          { value: 'enquiries', label: 'Enquiries', count: data?.enquiries.length },
          { value: 'favourites', label: 'Favourites', count: favourites.length },
          { value: 'profile', label: 'Profile' },
        ]} />
        <div className="pt-6">
          {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Skeleton className="h-48" /> : (
            <>
              {tab === 'bookings' && <BookingList items={data.bookings} />}
              {tab === 'rides' && <BookingList items={data.test_rides} />}
              {tab === 'purchases' && (data.sales.length ? (
                <ul className="divide-y divide-white/10">
                  {data.sales.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div><p className="font-semibold">{s.bike_name}</p><p className="text-sm text-fog">{s.invoice_no} – {formatDate(s.sale_date)}</p></div>
                      <div className="text-right"><p className="font-cond font-bold">{formatPKR(s.selling_price)}</p><StatusBadge kind="payment" value={s.payment_status} /></div>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="No purchases yet" />)}
              {tab === 'enquiries' && (data.enquiries.length ? (
                <ul className="divide-y divide-white/10">
                  {data.enquiries.map((e) => (
                    <li key={e.id} className="py-4"><div className="flex justify-between gap-3"><p className="font-semibold">{e.subject}</p><StatusBadge kind="enquiry" value={e.status} /></div><p className="mt-1 text-sm text-fog">{e.message}</p></li>
                  ))}
                </ul>
              ) : <EmptyState title="No enquiries" action={<Link to="/contact" className="btn-primary">Contact us</Link>} />)}
              {tab === 'favourites' && (favourites.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">{favourites.map((f) => <li key={f.id}><Link to={`/bikes/${f.slug}`} className="p-card flex items-center gap-3 p-3 hover:border-white/25"><SmartImage src={f.image} alt="" className="h-12 w-16 rounded" />{f.name}</Link></li>)}</ul>
              ) : <EmptyState title="No favourites saved" />)}
              {tab === 'profile' && (
                <form onSubmit={saveProfile} noValidate className="grid max-w-xl gap-4 sm:grid-cols-2">
                  <FormError message={form.formError} />
                  {[['name', 'Full name'], ['phone', 'Mobile number'], ['email', 'Email'], ['city', 'City']].map(([n, l]) => (
                    <Input key={n} variant="public" name={n} label={l} value={form.values[n]} onChange={form.handleChange} error={form.errors[n]} />
                  ))}
                  <button className="btn-primary sm:col-span-2 sm:justify-self-start" disabled={form.submitting}>Save profile</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

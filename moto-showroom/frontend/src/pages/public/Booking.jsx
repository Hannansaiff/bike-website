import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Copy, Search, Store, ShoppingBag } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { bikesApi, bookingsApi } from '../../lib/services';
import { rules } from '../../lib/validation';
import { cn, formatDate, formatDateTime, formatTime, todayISO, BOOKING_TYPES } from '../../lib/format';
import { PageHero } from '../../components/public/PublicBits';
import { FormError, Input, Select, Textarea } from '../../components/ui/Form';
import { ErrorState, StatusBadge } from '../../components/ui/Feedback';
import { SmartImage } from '../../components/ui/Media';

const TYPE_OPTIONS = [
  { value: 'test_ride', label: 'Test ride', icon: CalendarCheck, text: 'Ride the bike with a staff member.' },
  { value: 'showroom_visit', label: 'Showroom visit', icon: Store, text: 'See it in person and talk options.' },
  { value: 'purchase_enquiry', label: 'Purchase enquiry', icon: ShoppingBag, text: 'Get pricing, payment and delivery details.' },
];

function timeSlots(open = '10:00', close = '20:00') {
  const out = [];
  let [h, m] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  while (h < ch || (h === ch && m <= cm)) {
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h += 1; m -= 60; }
  }
  return out;
}

function Confirmation({ booking, onAnother }) {
  const toast = useToast();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-card mx-auto max-w-xl p-8 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
      <h2 className="font-display mt-4 text-3xl">Request received</h2>
      <p className="mt-2 text-fog">The showroom will call you to confirm. Keep this reference to track your booking.</p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="font-cond rounded-xl border border-ignite/40 bg-ignite/10 px-5 py-3 text-3xl font-bold tracking-wide text-ignite-400">{booking.reference}</span>
        <button className="btn-icon border border-white/15 hover:bg-white/10" aria-label="Copy reference"
          onClick={() => { navigator.clipboard?.writeText(booking.reference); toast.success('Reference copied'); }}>
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-6 space-y-2 rounded-xl bg-black/30 p-4 text-left text-sm">
        <div className="flex justify-between"><dt className="text-fog">Motorcycle</dt><dd className="font-semibold">{booking.bike_name}</dd></div>
        <div className="flex justify-between"><dt className="text-fog">Type</dt><dd>{booking.type_label}</dd></div>
        <div className="flex justify-between"><dt className="text-fog">When</dt><dd>{formatDate(booking.preferred_date)} at {formatTime(booking.preferred_time)}</dd></div>
        <div className="flex justify-between"><dt className="text-fog">Status</dt><dd><StatusBadge kind="booking" value={booking.status} /></dd></div>
      </dl>
      <p className="mt-4 text-xs text-fog">A booking is a request – it doesn't reserve or sell the motorcycle.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to={`/track-booking?ref=${booking.reference}`} className="btn-light">Track this booking</Link>
        <button onClick={onAnother} className="btn-ghost">Make another booking</button>
      </div>
    </motion.div>
  );
}

export function Book() {
  const [params] = useSearchParams();
  const { customer } = useAuth();
  const { settings } = useSite();
  const bikes = useApi(() => bikesApi.list({ page_size: 100, sort: 'name', availability: 'available,reserved,sold,out_of_stock,upcoming' }), []);
  const [done, setDone] = useState(null);
  const c = customer?.customer;
  const initial = {
    bike_id: params.get('bike') || '', booking_type: params.get('type') || 'test_ride',
    name: c?.name || '', phone: c?.phone || '', email: c?.email || '', preferred_date: todayISO(1), preferred_time: '11:00', message: '',
  };
  const form = useForm(initial, (v) => ({
    bike_id: [rules.required('Motorcycle')],
    booking_type: [rules.required('Booking type')],
    name: [rules.required('Full name'), rules.minLen(3, 'Full name')],
    phone: [rules.required('Phone number'), rules.phone()],
    email: [rules.email()],
    preferred_date: [rules.required('Preferred date'), rules.notPastDate(), rules.custom((d) => (d > todayISO(90) ? 'Bookings can be made up to 90 days ahead' : ''))],
    preferred_time: [rules.required('Preferred time'), rules.custom((t) => (v.preferred_date === todayISO(0) && t <= new Date().toTimeString().slice(0, 5) ? 'Please choose a later time today' : ''))],
    message: [rules.maxLen(1000, 'Message')],
  }));
  const { values, errors, handleChange, handleBlur, setField } = form;
  const selected = bikes.data?.find((b) => String(b.id) === String(values.bike_id));

  const submit = form.submit(async (v) => {
    const { data } = await bookingsApi.create({ ...v, bike_id: Number(v.bike_id), email: v.email || null });
    setDone(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return (
    <>
      <PageHero title="Book a test ride or visit" text="Choose a motorcycle and a time that suits you. We'll confirm by phone." />
      <div className="container-site py-12">
        {done ? (
          <Confirmation booking={done} onAnother={() => { setDone(null); form.reset(initial); }} />
        ) : bikes.error ? (
          <ErrorState error={bikes.error} onRetry={bikes.reload} />
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <FormError message={form.formError} />
              <fieldset>
                <legend className="mb-3 text-sm font-semibold">What would you like to do?</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {TYPE_OPTIONS.map((t) => {
                    const disabled = t.value === 'test_ride' && selected?.availability === 'upcoming';
                    return (
                      <button key={t.value} type="button" disabled={disabled} onClick={() => setField('booking_type', t.value)} aria-pressed={values.booking_type === t.value}
                        className={cn('rounded-xl border p-4 text-left transition-colors disabled:opacity-40',
                          values.booking_type === t.value ? 'border-ignite bg-ignite/10' : 'border-white/10 hover:border-white/30')}>
                        <t.icon className="h-5 w-5 text-ignite" />
                        <span className="mt-2 block font-semibold">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-fog">{disabled ? 'Not available for upcoming models' : t.text}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <Select variant="public" name="bike_id" label="Motorcycle" required value={values.bike_id} onChange={handleChange} onBlur={handleBlur} error={errors.bike_id}
                placeholder={bikes.loading ? 'Loading motorcycles…' : 'Choose a motorcycle'}
                options={(bikes.data || []).map((b) => ({ value: b.id, label: `${b.name} (${b.model_year}) – ${b.availability_label}` }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input variant="public" name="name" label="Full name" required autoComplete="name" value={values.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} />
                <Input variant="public" name="phone" label="Phone number" required type="tel" autoComplete="tel" placeholder="0300-1234567" value={values.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} />
                <Input variant="public" name="email" label="Email (optional)" type="email" autoComplete="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} className="sm:col-span-2" />
                <Input variant="public" name="preferred_date" label="Preferred date" required type="date" min={todayISO(0)} max={todayISO(90)} value={values.preferred_date} onChange={handleChange} onBlur={handleBlur} error={errors.preferred_date} />
                <Select variant="public" name="preferred_time" label="Preferred time" required value={values.preferred_time} onChange={handleChange} onBlur={handleBlur} error={errors.preferred_time}
                  options={timeSlots(settings?.booking_open_time, settings?.booking_close_time).map((t) => ({ value: t, label: formatTime(t) }))} />
              </div>
              <Textarea variant="public" name="message" label="Message (optional)" value={values.message} onChange={handleChange} onBlur={handleBlur} error={errors.message} placeholder="Anything we should prepare?" />
              <button type="submit" className="btn-primary w-full py-3 text-base sm:w-auto" disabled={form.submitting}>
                {form.submitting ? 'Sending request…' : 'Send booking request'}
              </button>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="p-card overflow-hidden">
                {selected ? (
                  <>
                    <SmartImage src={selected.image} alt={selected.name} className="aspect-[4/3]" />
                    <div className="p-5">
                      <p className="text-sm text-fog">{selected.brand?.name}</p>
                      <p className="text-xl font-bold">{selected.name}</p>
                      <div className="mt-2"><StatusBadge kind="availability" value={selected.availability} /></div>
                    </div>
                  </>
                ) : (
                  <p className="p-6 text-sm text-fog">Pick a motorcycle to see it here.</p>
                )}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-fog">
                <li>Bring your CNIC and a valid driving licence for test rides.</li>
                <li>A booking doesn't reserve stock – staff reserve units after confirming.</li>
                <li>Already booked? <Link to="/track-booking" className="text-ignite-400 hover:underline">Track your booking</Link>.</li>
              </ul>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}

export function TrackBooking() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);
  const form = useForm({ reference: params.get('ref') || '', phone: '' }, {
    reference: [rules.required('Booking reference')],
    phone: [rules.required('Phone number'), rules.phone()],
  });
  const submit = form.submit(async (v) => {
    setResult(null);
    const { data } = await bookingsApi.track(v.reference.trim().toUpperCase(), v.phone);
    setResult(data);
  });
  return (
    <>
      <PageHero title="Track your booking" text="Enter the reference from your confirmation and the phone number you booked with." />
      <div className="container-site grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={submit} noValidate className="p-card space-y-4 self-start p-6">
          <FormError message={form.formError} />
          <Input variant="public" name="reference" label="Booking reference" placeholder="BK-2610-1234" required value={form.values.reference} onChange={form.handleChange} error={form.errors.reference} />
          <Input variant="public" name="phone" label="Phone number" type="tel" placeholder="0300-1234567" required value={form.values.phone} onChange={form.handleChange} error={form.errors.phone} />
          <button className="btn-primary w-full" disabled={form.submitting}><Search className="h-4 w-4" /> {form.submitting ? 'Looking up…' : 'Find booking'}</button>
          <p className="text-xs text-fog">Signed in? Your full history is in <Link to="/account" className="text-ignite-400 hover:underline">My account</Link>.</p>
        </form>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-cond text-2xl font-bold text-ignite-400">{result.reference}</p>
                <p className="mt-1 text-lg font-semibold">{result.bike_name}</p>
                <p className="text-sm text-fog">{BOOKING_TYPES[result.booking_type]} on {formatDate(result.preferred_date)} at {formatTime(result.preferred_time)}</p>
              </div>
              <StatusBadge kind="booking" value={result.status} />
            </div>
            <h3 className="mt-6 text-sm font-semibold">Status history</h3>
            <ol className="mt-3 space-y-3 border-l border-white/15 pl-4">
              {result.status_history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-ignite" />
                  <p className="text-sm font-medium"><StatusBadge kind="booking" value={h.to} /> <span className="ml-2 text-fog">{formatDateTime(h.at)}</span></p>
                  {h.note && <p className="mt-1 text-sm text-fog">{h.note}</p>}
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>
    </>
  );
}

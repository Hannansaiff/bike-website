import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bike, Boxes, CalendarCheck, CalendarClock, CheckCircle2, Receipt, Users, Wallet } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { analyticsApi } from '../../lib/services';
import { formatDate, formatNumber, formatPKR, formatPKRShort, formatTime, timeAgo, todayISO } from '../../lib/format';
import { PageHeader, StatCard } from '../../components/admin/AdminUI';
import { ChartCard, Donut, HBar, RevenueChart, StackedBars } from '../../components/admin/Charts';
import { DemoNotice, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '6 months', days: 180 },
  { label: '12 months', days: 365 },
];

export function DateRange({ from, to, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-zinc-300 p-0.5 dark:border-white/15">
        {RANGES.map((r) => {
          const active = from === todayISO(-r.days) && to === todayISO(0);
          return (
            <button key={r.days} onClick={() => onChange(todayISO(-r.days), todayISO(0))}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${active ? 'bg-ignite text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-fog dark:hover:bg-white/10'}`}>
              {r.label}
            </button>
          );
        })}
      </div>
      <input type="date" className="a-input w-auto py-1.5 text-xs" value={from} max={to} onChange={(e) => onChange(e.target.value, to)} aria-label="From date" />
      <input type="date" className="a-input w-auto py-1.5 text-xs" value={to} min={from} onChange={(e) => onChange(from, e.target.value)} aria-label="To date" />
    </div>
  );
}

function ListCard({ title, to, children, empty }) {
  return (
    <section className="a-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <h2 className="font-bold">{title}</h2>
        {to && <Link to={to} className="text-xs font-semibold text-ignite hover:underline">Open</Link>}
      </div>
      {empty ? <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-fog">{empty}</p> : <ul className="divide-y divide-zinc-100 dark:divide-white/5">{children}</ul>}
    </section>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState({ from: todayISO(-180), to: todayISO(0) });
  const { data: d, loading, error, reload } = useApi(() => analyticsApi.dashboard({ date_from: range.from, date_to: range.to }), [range.from, range.to]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Live figures computed from the current demo data."
        actions={<DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />} />
      {error ? <ErrorState error={error} onRetry={reload} /> : loading && !d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="space-y-6">
          <DemoNotice>Revenue and payment figures are sample data generated for demonstration – not real transactions.</DemoNotice>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Demo revenue (range)" value={formatPKRShort(d.cards.revenue)} hint={`${formatPKR(d.cards.collected)} collected`} icon={Wallet} tone="accent" to="/admin/sales" />
            <StatCard label="Completed sales" value={d.cards.completed_sales} hint={`${formatPKR(d.cards.outstanding)} outstanding`} icon={Receipt} to="/admin/sales" />
            <StatCard label="Pending bookings" value={d.cards.pending_bookings} hint={`${d.cards.confirmed_bookings} confirmed`} icon={CalendarCheck} to="/admin/bookings" />
            <StatCard label="Customers" value={formatNumber(d.cards.total_customers)} icon={Users} to="/admin/customers" />
            <StatCard label="Motorcycle models" value={d.cards.total_models} hint={`${d.cards.total_units} physical units`} icon={Bike} to="/admin/bikes" />
            <StatCard label="Available units" value={d.cards.available_units} icon={Boxes} to="/admin/inventory" />
            <StatCard label="Reserved units" value={d.cards.reserved_units} icon={CalendarClock} to="/admin/inventory" />
            <StatCard label="Sold units (all time)" value={d.cards.sold_units} icon={CheckCircle2} to="/admin/inventory" />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard title="Sales trend" subtitle="Monthly demo revenue" className="xl:col-span-2"><RevenueChart data={d.sales_trend} /></ChartCard>
            <ChartCard title="Inventory status" subtitle="All physical units"><Donut data={d.inventory_distribution} /></ChartCard>
            <ChartCard title="Booking trend" subtitle="Requests received per month" className="xl:col-span-2">
              <StackedBars data={d.booking_trend} keys={['test_ride', 'showroom_visit', 'purchase_enquiry']}
                labels={{ test_ride: 'Test rides', showroom_visit: 'Visits', purchase_enquiry: 'Enquiries' }} />
            </ChartCard>
            <ChartCard title="Popular brands" subtitle="Sales in range"><HBar data={d.popular_brands} /></ChartCard>
            <ChartCard title="Stock by category" subtitle="Unsold units" className="xl:col-span-3"><HBar data={d.category_distribution} height={300} color="#38bdf8" /></ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <ListCard title="Upcoming test rides" to="/admin/bookings" empty={!d.upcoming_test_rides.length && 'No upcoming test rides.'}>
              {d.upcoming_test_rides.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate font-semibold">{b.name}</p><p className="truncate text-xs text-zinc-500 dark:text-fog">{b.bike_name}</p></div>
                  <div className="text-right text-xs"><p className="font-semibold">{formatDate(b.preferred_date)}</p><p className="text-zinc-500 dark:text-fog">{formatTime(b.preferred_time)}</p></div>
                </li>
              ))}
            </ListCard>
            <ListCard title="Recent bookings" to="/admin/bookings" empty={!d.recent_bookings.length && 'No bookings yet.'}>
              {d.recent_bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate font-semibold">{b.name} <span className="font-normal text-zinc-500 dark:text-fog">– {b.type_label}</span></p><p className="truncate text-xs text-zinc-500 dark:text-fog">{b.bike_name}</p></div>
                  <StatusBadge kind="booking" value={b.status} />
                </li>
              ))}
            </ListCard>
            <ListCard title="Recent sales" to="/admin/sales" empty={!d.recent_sales.length && 'No sales yet.'}>
              {d.recent_sales.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate font-semibold">{s.bike_name}</p><p className="truncate text-xs text-zinc-500 dark:text-fog">{s.customer_name} – {s.invoice_no}</p></div>
                  <p className="font-cond font-bold">{formatPKRShort(s.selling_price)}</p>
                </li>
              ))}
            </ListCard>
            <ListCard title="Low-stock warnings" to="/admin/inventory" empty={!d.low_stock.length && 'Stock levels look healthy.'}>
              {d.low_stock.map((r) => (
                <li key={r.bike_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><span className="truncate">{r.bike_name}</span></span>
                  <span className="font-cond whitespace-nowrap text-xs font-semibold">{r.in_stock} in stock / min {r.low_stock_threshold}</span>
                </li>
              ))}
            </ListCard>
            <ListCard title="Recent admin activity" to="/admin/activity-logs" empty={!d.recent_activity.length && 'No activity yet.'}>
              {d.recent_activity.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm"><p>{a.description}</p><p className="text-xs text-zinc-500 dark:text-fog">{a.actor} – {timeAgo(a.timestamp)}</p></li>
              ))}
            </ListCard>
          </div>
          {!d.cards.total_models && <EmptyState title="No data" />}
        </div>
      )}
    </div>
  );
}

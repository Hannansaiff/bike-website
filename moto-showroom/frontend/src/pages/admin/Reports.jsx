import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useSite } from '../../context/SiteContext';
import { analyticsApi, categoriesApi } from '../../lib/services';
import { PAYMENT_METHODS, formatDate, formatDateTime, formatPKR, todayISO } from '../../lib/format';
import { DataTable, FilterSelect, PageHeader, SearchBar, StatCard } from '../../components/admin/AdminUI';
import { ChartCard, Donut, HBar, RevenueChart, StackedBars } from '../../components/admin/Charts';
import { DemoNotice, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { Pagination, Tabs } from '../../components/ui/Navigation';
import { DateRange } from './Dashboard';

const KINDS = [
  { value: 'sales', label: 'Sales' }, { value: 'inventory', label: 'Inventory' }, { value: 'bookings', label: 'Bookings' },
  { value: 'customers', label: 'Customers' }, { value: 'popularity', label: 'Product popularity' },
];

export default function Reports() {
  const [kind, setKind] = useState('sales');
  const [range, setRange] = useState({ from: todayISO(-365), to: todayISO(0) });
  const [category, setCategory] = useState('');
  const cats = useApi(() => categoriesApi.list({ all: true }), []);
  const { data: r, loading, error, reload } = useApi(
    () => analyticsApi.report(kind, { date_from: range.from, date_to: range.to, category_id: category }), [kind, range.from, range.to, category]);
  const usesDates = ['sales', 'bookings', 'customers'].includes(kind);
  const usesCategory = kind !== 'customers';

  return (
    <div>
      <PageHeader title="Reports" description="Print-friendly reports calculated from current demo data."
        actions={<button className="a-btn no-print" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print report</button>} />
      <Tabs className="no-print mb-4" value={kind} onChange={setKind} layoutId="report-tabs" tabs={KINDS} />
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        {usesDates && <DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />}
        {usesCategory && <FilterSelect label="Category" value={category} onChange={setCategory} options={(cats.data || []).map((c) => ({ value: c.id, label: c.name }))} />}
      </div>
      <h2 className="mb-4 hidden text-xl font-bold print:block">{KINDS.find((k) => k.value === kind).label} report – {usesDates ? `${formatDate(range.from)} to ${formatDate(range.to)}` : formatDate(todayISO(0))}</h2>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading || !r ? <Skeleton className="h-96" /> : (
        <div className="space-y-5">
          {kind === 'sales' && (
            <>
              <DemoNotice>All monetary values are sample figures.</DemoNotice>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Completed sales" value={r.totals.sales} hint={`${r.totals.reversed} reversed`} />
                <StatCard label="Net revenue" value={formatPKR(r.totals.net)} hint={`Discounts ${formatPKR(r.totals.discounts)}`} />
                <StatCard label="Collected" value={formatPKR(r.totals.collected)} />
                <StatCard label="Outstanding" value={formatPKR(r.totals.outstanding)} hint={`Average sale ${formatPKR(r.totals.average_sale)}`} />
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <ChartCard title="Revenue by month" className="xl:col-span-2"><RevenueChart data={r.by_month} /></ChartCard>
                <ChartCard title="Collected by payment method"><Donut money data={r.by_payment_method.map((m) => ({ ...m, name: PAYMENT_METHODS[m.name] || m.name }))} /></ChartCard>
              </div>
              <div className="a-card overflow-hidden"><DataTable rows={r.rows} columns={[
                { key: 'invoice_no', label: 'Invoice', render: (s) => <span className="font-cond">{s.invoice_no}</span> },
                { key: 'sale_date', label: 'Date', render: (s) => formatDate(s.sale_date) },
                { key: 'customer_name', label: 'Customer' }, { key: 'bike_name', label: 'Motorcycle' },
                { key: 'discount', label: 'Discount', align: 'right', render: (s) => <span className="font-cond">{formatPKR(s.discount)}</span> },
                { key: 'selling_price', label: 'Net', align: 'right', render: (s) => <span className="font-cond">{formatPKR(s.selling_price)}</span> },
                { key: 'status', label: 'Status', render: (s) => (s.status === 'reversed' ? <StatusBadge kind="sale" value="reversed" /> : <StatusBadge kind="payment" value={s.payment_status} />) },
              ]} /></div>
            </>
          )}
          {kind === 'inventory' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Units in stock" value={r.totals.in_stock} /><StatCard label="Reserved" value={r.totals.reserved} />
                <StatCard label="Stock cost value" value={formatPKR(r.totals.stock_cost_value)} /><StatCard label="Retail value" value={formatPKR(r.totals.stock_retail_value)} />
              </div>
              <ChartCard title="Units by category"><StackedBars data={r.by_category} xKey="name" keys={['in_stock', 'reserved', 'sold']} labels={{ in_stock: 'In stock', reserved: 'Reserved', sold: 'Sold' }} height={300} /></ChartCard>
              <div className="a-card overflow-hidden"><DataTable rows={r.rows} rowKey="bike_id" columns={[
                { key: 'bike_name', label: 'Model' }, { key: 'category_name', label: 'Category' },
                { key: 'in_stock', label: 'In stock', align: 'right' }, { key: 'reserved', label: 'Reserved', align: 'right' }, { key: 'sold', label: 'Sold', align: 'right' },
                { key: 'stock_cost_value', label: 'Cost value', align: 'right', render: (x) => <span className="font-cond">{formatPKR(x.stock_cost_value)}</span> },
                { key: 'availability', label: 'Status', render: (x) => <StatusBadge kind="availability" value={x.availability} /> },
              ]} /></div>
            </>
          )}
          {kind === 'bookings' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Bookings" value={r.totals.bookings} /><StatCard label="Completed" value={r.totals.completed} />
                <StatCard label="Pending" value={r.totals.pending} /><StatCard label="Completion rate" value={`${r.totals.completion_rate}%`} hint="Completed ÷ closed bookings" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="By status"><Donut data={r.by_status} /></ChartCard>
                <ChartCard title="By type"><HBar data={r.by_type} /></ChartCard>
              </div>
              <div className="a-card overflow-hidden"><DataTable rows={r.rows} columns={[
                { key: 'reference', label: 'Reference', render: (b) => <span className="font-cond">{b.reference}</span> },
                { key: 'name', label: 'Customer' }, { key: 'bike_name', label: 'Motorcycle' }, { key: 'type_label', label: 'Type' },
                { key: 'preferred_date', label: 'Date', render: (b) => formatDate(b.preferred_date) },
                { key: 'status', label: 'Status', render: (b) => <StatusBadge kind="booking" value={b.status} /> },
              ]} /></div>
            </>
          )}
          {kind === 'customers' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Customers" value={r.totals.customers} /><StatCard label="New in range" value={r.totals.new_in_range} />
                <StatCard label="Buyers" value={r.totals.buyers} /><StatCard label="Lifetime value (demo)" value={formatPKR(r.totals.lifetime_value)} />
              </div>
              <ChartCard title="Customers by city"><HBar data={r.by_city} color="#a78bfa" /></ChartCard>
              <div className="a-card overflow-hidden"><DataTable rows={r.rows} columns={[
                { key: 'name', label: 'Customer' }, { key: 'city', label: 'City' },
                { key: 'total_bookings', label: 'Bookings', align: 'right' }, { key: 'total_purchases', label: 'Purchases', align: 'right' },
                { key: 'total_spent', label: 'Spent', align: 'right', render: (c) => <span className="font-cond">{formatPKR(c.total_spent)}</span> },
                { key: 'last_activity', label: 'Last activity', render: (c) => formatDate(c.last_activity) },
              ]} /></div>
            </>
          )}
          {kind === 'popularity' && (
            <>
              <ChartCard title="Top 10 by popularity score" subtitle="Score = views + bookings × 15 + sales × 40">
                <HBar data={r.top.map((b) => ({ name: b.name, value: b.score }))} height={360} />
              </ChartCard>
              <div className="a-card overflow-hidden"><DataTable rows={r.rows} columns={[
                { key: 'name', label: 'Model' }, { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category' },
                { key: 'views', label: 'Views', align: 'right' }, { key: 'bookings', label: 'Bookings', align: 'right' }, { key: 'sales', label: 'Sales', align: 'right' },
                { key: 'score', label: 'Score', align: 'right', render: (b) => <span className="font-cond font-bold">{b.score}</span> },
              ]} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ActivityLogs() {
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const { data, meta, loading, error, reload } = useApi(() => analyticsApi.activity({ q: dq, entity, action, page, page_size: 20 }), [dq, entity, action, page]);
  const opt = (arr) => arr.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));
  return (
    <div>
      <PageHeader title="Activity log" description="Administrative actions in this demo session. Stored in memory: not tamper-proof and cleared on restart." />
      <div className="a-card overflow-hidden">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search descriptions or people…">
          <FilterSelect label="Record" value={entity} onChange={(v) => { setEntity(v); setPage(1); }} options={opt(['bike', 'booking', 'sale', 'inventory', 'customer', 'offer', 'content', 'category', 'brand', 'staff member', 'settings', 'system'])} />
          <FilterSelect label="Action" value={action} onChange={(v) => { setAction(v); setPage(1); }} options={opt(['create', 'update', 'delete', 'price_change', 'status_change', 'stock_change', 'sale', 'payment', 'reversal', 'content', 'login', 'reset'])} />
        </SearchBar>
        <DataTable loading={loading} error={error} onRetry={reload} rows={data || []} columns={[
          { key: 'timestamp', label: 'When', render: (a) => <span className="whitespace-nowrap text-xs">{formatDateTime(a.timestamp)}</span> },
          { key: 'action', label: 'Action', render: (a) => <span className="capitalize">{a.action.replace(/_/g, ' ')}</span> },
          { key: 'entity', label: 'Record', render: (a) => <span className="capitalize">{a.entity}{a.entity_id ? ` #${a.entity_id}` : ''}</span> },
          { key: 'description', label: 'Description' },
          { key: 'actor', label: 'By' },
        ]} />
        <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={meta} onPage={setPage} /></div>
      </div>
    </div>
  );
}

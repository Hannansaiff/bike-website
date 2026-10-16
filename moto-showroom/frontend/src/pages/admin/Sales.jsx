import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, Eye, FileText, Plus, Printer, Undo2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { bikesApi, customersApi, inventoryApi, salesApi } from '../../lib/services';
import { rules } from '../../lib/validation';
import { PAYMENT_METHODS, STATUS, formatDate, formatDateTime, formatPKR, todayISO } from '../../lib/format';
import { DataTable, DetailRow, FilterSelect, PageHeader, SearchBar, StatCard } from '../../components/admin/AdminUI';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DemoNotice, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { FormError, Input, Select, Textarea } from '../../components/ui/Form';
import { Pagination, Tabs } from '../../components/ui/Navigation';

const methodOptions = Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }));
const deliveryOptions = Object.entries(STATUS.delivery).map(([value, [label]]) => ({ value, label }));

function NewSale({ onClose, onCreated }) {
  const toast = useToast();
  const bikes = useApi(() => bikesApi.list({ admin: true, page_size: 100, sort: 'name', availability: 'available,reserved,discontinued' }), []);
  const customers = useApi(() => customersApi.list({ page_size: 100, sort: 'name' }), []);
  const [mode, setMode] = useState('existing');
  const form = useForm(
    { bike_id: '', unit_id: '', customer_id: '', nc_name: '', nc_phone: '', nc_email: '', sale_date: todayISO(0), discount: '', advance_payment: '0', payment_method: 'cash', delivery_status: 'pending', notes: '' },
    (v) => ({
      bike_id: [rules.required('Motorcycle')],
      unit_id: [rules.required('Inventory unit')],
      ...(mode === 'existing' ? { customer_id: [rules.required('Customer')] } : {
        nc_name: [rules.required('Customer name'), rules.minLen(3, 'Customer name')],
        nc_phone: [rules.required('Phone'), rules.phone()], nc_email: [rules.email()],
      }),
      sale_date: [rules.required('Sale date'), rules.notFutureDate()],
      discount: [rules.number('Discount', { min: 0 }), rules.custom((d) => (bike && Number(d) > bike.price ? 'Discount cannot exceed the list price' : ''))],
      advance_payment: [rules.number('Advance', { min: 0 }), rules.custom((a) => (Number(a) > selling ? 'Advance cannot exceed the selling price' : ''))],
    })
  );
  const { values, errors, handleChange, setField } = form;
  const bike = bikes.data?.find((b) => String(b.id) === String(values.bike_id));
  const units = useApi(() => inventoryApi.units({ bike_id: values.bike_id, page_size: 100 }), [values.bike_id], { enabled: !!values.bike_id });
  const sellable = (units.data || []).filter((u) => u.status !== 'sold');

  useEffect(() => {
    if (bike) { setField('discount', String(bike.pricing.discount)); setField('unit_id', ''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bike?.id]);

  const list = bike?.price || 0;
  const discount = Number(values.discount) || 0;
  const selling = Math.max(0, list - discount);
  const advance = Number(values.advance_payment) || 0;

  const submit = form.submit(async (v) => {
    const body = {
      unit_id: Number(v.unit_id), bike_id: Number(v.bike_id), sale_date: v.sale_date, discount,
      discount_note: bike?.pricing.offer && discount === bike.pricing.discount ? bike.pricing.offer.title : 'Manual discount',
      advance_payment: advance, payment_method: v.payment_method, delivery_status: v.delivery_status, notes: v.notes,
    };
    if (mode === 'existing') body.customer_id = Number(v.customer_id);
    else body.new_customer = { name: v.nc_name, phone: v.nc_phone, email: v.nc_email || null };
    const { data } = await salesApi.create(body);
    toast.success(`Sale ${data.invoice_no} recorded – unit marked sold`);
    onCreated(data);
  });

  return (
    <Modal open onClose={onClose} title="Record a sale" description="Simulated transaction – no payment gateway is involved." size="xl"
      footer={<><button className="a-btn" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={form.submitting}>{form.submitting ? 'Recording…' : 'Record sale'}</button></>}>
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <FormError message={form.formError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select name="bike_id" label="Motorcycle" required value={values.bike_id} onChange={handleChange} error={errors.bike_id}
              options={(bikes.data || []).filter((b) => b.stock.in_stock + b.stock.reserved > 0).map((b) => ({ value: b.id, label: `${b.name} (${b.stock.in_stock + b.stock.reserved} units)` }))} />
            <Select name="unit_id" label="Inventory unit" required value={values.unit_id} onChange={handleChange} error={errors.unit_id}
              placeholder={!values.bike_id ? 'Choose a motorcycle first' : units.loading ? 'Loading…' : sellable.length ? 'Choose unit' : 'No sellable units'}
              options={sellable.map((u) => ({ value: u.id, label: `#${u.id} ${u.color} – ${u.chassis_no || 'no chassis'}${u.status === 'reserved' ? ' (reserved)' : ''}` }))} />
          </div>
          <div>
            <Tabs value={mode} onChange={setMode} layoutId="cust-mode" tabs={[{ value: 'existing', label: 'Existing customer' }, { value: 'new', label: 'New customer' }]} />
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {mode === 'existing' ? (
                <Select name="customer_id" label="Customer" required className="sm:col-span-2" value={values.customer_id} onChange={handleChange} error={errors.customer_id}
                  options={(customers.data || []).map((c) => ({ value: c.id, label: `${c.name} – ${c.phone}` }))} />
              ) : (
                <>
                  <Input name="nc_name" label="Full name" required value={values.nc_name} onChange={handleChange} error={errors.nc_name} />
                  <Input name="nc_phone" label="Mobile" required placeholder="0300-1234567" value={values.nc_phone} onChange={handleChange} error={errors.nc_phone} />
                  <Input name="nc_email" label="Email" type="email" className="sm:col-span-2" value={values.nc_email} onChange={handleChange} error={errors.nc_email} />
                </>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="sale_date" type="date" label="Sale date" required max={todayISO(0)} value={values.sale_date} onChange={handleChange} error={errors.sale_date} />
            <Input name="discount" type="number" min="0" label="Discount (PKR)" value={values.discount} onChange={handleChange} error={errors.discount}
              hint={bike?.pricing.offer ? `Default from offer: ${bike.pricing.offer.title}` : 'No active offer for this model'} />
            <Input name="advance_payment" type="number" min="0" label="Advance / amount paid now (PKR)" value={values.advance_payment} onChange={handleChange} error={errors.advance_payment} />
            <Select name="payment_method" label="Payment method" placeholder={undefined} value={values.payment_method} onChange={handleChange} options={methodOptions} />
            <Select name="delivery_status" label="Delivery" placeholder={undefined} value={values.delivery_status} onChange={handleChange} options={deliveryOptions} />
          </div>
          <Textarea name="notes" label="Notes" rows={2} value={values.notes} onChange={handleChange} />
        </div>
        <aside className="a-card h-max p-4">
          <h3 className="font-bold">Summary</h3>
          <dl className="mt-3">
            <DetailRow label="List price"><span className="font-cond">{formatPKR(list)}</span></DetailRow>
            <DetailRow label="Discount"><span className="font-cond">− {formatPKR(discount)}</span></DetailRow>
            <DetailRow label="Selling price"><span className="font-cond text-base font-bold">{formatPKR(selling)}</span></DetailRow>
            <DetailRow label="Paid now"><span className="font-cond">{formatPKR(advance)}</span></DetailRow>
            <DetailRow label="Balance"><span className="font-cond font-bold text-ignite">{formatPKR(Math.max(0, selling - advance))}</span></DetailRow>
          </dl>
          <p className="mt-3 text-xs text-zinc-500 dark:text-fog">Payment status is set automatically: unpaid, partially paid or paid.</p>
        </aside>
      </form>
    </Modal>
  );
}

function SaleDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data: s, loading, error, reload, setData } = useApi(() => salesApi.get(id), [id]);
  const [pay, setPay] = useState({ amount: '', method: 'cash', note: '' });
  const [reversing, setReversing] = useState(false);
  const [reason, setReason] = useState('');
  const act = async (fn, msg) => {
    try { const { data } = await fn(); setData(data); toast.success(msg); onChanged(); return true; } catch (e) { toast.error(e.message); return false; }
  };
  return (
    <Modal open onClose={onClose} title={s ? `Sale ${s.invoice_no}` : 'Sale'} size="lg">
      {error ? <ErrorState error={error} onRetry={reload} /> : loading || !s ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <dl className="a-card p-4">
              <DetailRow label="Status">{s.status === 'reversed' ? <StatusBadge kind="sale" value="reversed" /> : <StatusBadge kind="payment" value={s.payment_status} />}</DetailRow>
              <DetailRow label="Customer">{s.customer_name}</DetailRow>
              <DetailRow label="Motorcycle">{s.bike_name}</DetailRow>
              <DetailRow label="Unit">#{s.unit?.id} {s.unit?.chassis_no}</DetailRow>
              <DetailRow label="Sale date">{formatDate(s.sale_date)}</DetailRow>
              <DetailRow label="List price"><span className="font-cond">{formatPKR(s.list_price)}</span></DetailRow>
              <DetailRow label="Discount"><span className="font-cond">{formatPKR(s.discount)}</span></DetailRow>
              <DetailRow label="Selling price"><span className="font-cond font-bold">{formatPKR(s.selling_price)}</span></DetailRow>
              <DetailRow label="Paid"><span className="font-cond">{formatPKR(s.amount_paid)}</span></DetailRow>
              <DetailRow label="Balance"><span className="font-cond font-bold">{formatPKR(s.balance)}</span></DetailRow>
              <DetailRow label="Sold by">{s.sold_by}</DetailRow>
            </dl>
            {s.reversal && <DemoNotice className="mt-3">Reversed on {formatDate(s.reversal.date)} by {s.reversal.actor}: {s.reversal.reason}. Refund recorded: {formatPKR(s.reversal.refunded_amount)}.</DemoNotice>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/admin/sales/${s.id}/invoice`} className="btn-primary btn-sm"><FileText className="h-4 w-4" /> View invoice</Link>
              <button className="a-btn btn-sm" onClick={() => act(() => salesApi.update(s.id, { archived: !s.archived }), s.archived ? 'Sale unarchived' : 'Sale archived')}>
                <Archive className="h-4 w-4" /> {s.archived ? 'Unarchive' : 'Archive'}
              </button>
              {s.status === 'completed' && <button className="a-btn btn-sm text-red-600" onClick={() => setReversing(true)}><Undo2 className="h-4 w-4" /> Reverse sale</button>}
            </div>
          </div>
          <div className="space-y-5">
            <section>
              <h3 className="text-sm font-bold">Delivery</h3>
              <select className="a-input mt-2" value={s.delivery_status} disabled={s.status !== 'completed'}
                onChange={(e) => act(() => salesApi.update(s.id, { delivery_status: e.target.value }), 'Delivery status updated')} aria-label="Delivery status">
                {deliveryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </section>
            <section>
              <h3 className="text-sm font-bold">Payments (simulated)</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {s.payments.map((p, i) => <li key={i} className="flex justify-between rounded bg-zinc-50 px-2 py-1.5 dark:bg-white/5"><span>{formatDate(p.date)} – {PAYMENT_METHODS[p.method]}</span><span className="font-cond font-semibold">{formatPKR(p.amount)}</span></li>)}
                {!s.payments.length && <li className="text-zinc-500 dark:text-fog">No payments recorded.</li>}
              </ul>
              {s.status === 'completed' && s.balance > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input type="number" min="1" max={s.balance} placeholder={`Up to ${s.balance}`} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} aria-label="Payment amount" />
                  <select className="a-input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} aria-label="Payment method">
                    {methodOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button className="btn-primary btn-sm col-span-2" disabled={!(Number(pay.amount) > 0)}
                    onClick={async () => {
                      if (Number(pay.amount) > s.balance) { toast.error(`Payment exceeds the balance of ${formatPKR(s.balance)}`); return; }
                      if (await act(() => salesApi.addPayment(s.id, { amount: Number(pay.amount), method: pay.method, note: pay.note }), 'Payment recorded')) setPay({ amount: '', method: 'cash', note: '' });
                    }}>Record payment</button>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      <ConfirmDialog open={reversing} title="Reverse this sale?" confirmLabel="Reverse sale"
        message="The sale stays in history marked as reversed, the payment is marked refunded and the unit returns to stock."
        onCancel={() => setReversing(false)}
        onConfirm={async () => {
          if (reason.trim().length < 5) { toast.error('Enter a reason of at least 5 characters'); return; }
          if (await act(() => salesApi.reverse(s.id, reason.trim()), 'Sale reversed – unit returned to stock')) { setReversing(false); setReason(''); }
        }}>
        <Textarea className="mt-3" rows={2} label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </Modal>
  );
}

export default function AdminSales() {
  const [q, setQ] = useState('');
  const [payStatus, setPayStatus] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const dq = useDebounce(q);
  const list = useApi(() => salesApi.list({ q: dq, payment_status: payStatus, date_from: range.from, date_to: range.to, include_archived: archived, page, page_size: 15 }),
    [dq, payStatus, range.from, range.to, archived, page]);
  const totals = list.meta?.totals;
  return (
    <div>
      <PageHeader title="Sales & invoices" description="Completed sales are never deleted – archive or reverse them instead."
        actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Record sale</button>} />
      {totals && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Sales (filtered)" value={totals.count} />
          <StatCard label="Net value (demo)" value={formatPKR(totals.gross)} />
          <StatCard label="Collected (demo)" value={formatPKR(totals.collected)} />
          <StatCard label="Outstanding (demo)" value={formatPKR(totals.outstanding)} tone="accent" />
        </div>
      )}
      <div className="a-card overflow-hidden">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search invoice, customer or bike…">
          <FilterSelect label="Payment" value={payStatus} onChange={(v) => { setPayStatus(v); setPage(1); }} options={Object.entries(STATUS.payment).map(([value, [label]]) => ({ value, label }))} />
          <input type="date" className="a-input w-auto" aria-label="From date" value={range.from} onChange={(e) => { setRange({ ...range, from: e.target.value }); setPage(1); }} />
          <input type="date" className="a-input w-auto" aria-label="To date" value={range.to} onChange={(e) => { setRange({ ...range, to: e.target.value }); setPage(1); }} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#ff5b1f]" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Include archived</label>
        </SearchBar>
        <DataTable loading={list.loading} error={list.error} onRetry={list.reload} rows={list.data || []} onRowClick={(r) => setViewing(r.id)}
          columns={[
            { key: 'invoice_no', label: 'Invoice', render: (s) => <span className="font-cond font-semibold">{s.invoice_no}{s.archived && <span className="ml-1 text-xs text-zinc-500">(archived)</span>}</span> },
            { key: 'sale_date', label: 'Date', render: (s) => formatDate(s.sale_date) },
            { key: 'customer_name', label: 'Customer' },
            { key: 'bike_name', label: 'Motorcycle' },
            { key: 'selling_price', label: 'Amount', align: 'right', render: (s) => <span className="font-cond font-semibold">{formatPKR(s.selling_price)}</span> },
            { key: 'balance', label: 'Balance', align: 'right', render: (s) => <span className="font-cond">{formatPKR(s.balance)}</span> },
            { key: 'status', label: 'Payment', render: (s) => (s.status === 'reversed' ? <StatusBadge kind="sale" value="reversed" /> : <StatusBadge kind="payment" value={s.payment_status} />) },
            { key: 'delivery', label: 'Delivery', render: (s) => <StatusBadge kind="delivery" value={s.delivery_status} /> },
            { key: '_a', label: <span className="sr-only">Actions</span>, align: 'right', render: (s) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => setViewing(s.id)} aria-label="Open sale"><Eye className="h-4 w-4" /></button>
                <Link to={`/admin/sales/${s.id}/invoice`} className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Invoice"><FileText className="h-4 w-4" /></Link>
              </div>
            ) },
          ]} />
        <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={list.meta} onPage={setPage} /></div>
      </div>
      {creating && <NewSale onClose={() => setCreating(false)} onCreated={(sale) => { setCreating(false); list.reload({ silent: true }); setViewing(sale.id); }} />}
      {viewing && <SaleDetail id={viewing} onClose={() => setViewing(null)} onChanged={() => list.reload({ silent: true })} />}
    </div>
  );
}

export function Invoice() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(() => salesApi.invoice(id), [id]);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading) return <Skeleton className="h-[80vh]" />;
  const { sale: s, dealer } = data;
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/admin/sales" className="a-btn btn-sm"><ArrowLeft className="h-4 w-4" /> Back to sales</Link>
        <button className="btn-primary btn-sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print invoice</button>
      </div>
      <article className="print-area mx-auto max-w-3xl rounded-xl bg-white p-8 text-zinc-900 shadow-lift sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-ignite pb-6">
          <div>
            <p className="font-display text-3xl">{dealer.logo_text || dealer.name}</p>
            <p className="mt-1 text-sm text-zinc-500">{dealer.tagline}</p>
            <p className="mt-3 max-w-xs text-xs text-zinc-600">{dealer.address}<br />{dealer.phones?.join(' / ')}<br />{dealer.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">Invoice</p>
            <p className="font-cond mt-1 text-lg">{s.invoice_no}</p>
            <p className="mt-1 text-sm text-zinc-500">Date: {formatDate(s.sale_date)}</p>
            <p className="mt-2 inline-block rounded border border-zinc-300 px-2 py-0.5 text-xs font-bold">{s.status === 'reversed' ? 'REVERSED / REFUNDED' : STATUS.payment[s.payment_status][0]}</p>
          </div>
        </header>
        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div><p className="text-xs font-bold text-zinc-500">Billed to</p><p className="mt-1 font-semibold">{s.customer?.name}</p><p className="text-sm text-zinc-600">{s.customer?.phone}<br />{s.customer?.email}<br />{s.customer?.city}</p></div>
          <div><p className="text-xs font-bold text-zinc-500">Motorcycle</p><p className="mt-1 font-semibold">{s.bike_name}</p>
            <p className="text-sm text-zinc-600">Model year {s.bike?.model_year} – {s.bike?.condition === 'used' ? 'Pre-owned' : 'New'}<br />Chassis: {s.unit?.chassis_no || '—'}<br />Engine: {s.unit?.engine_no || '—'}<br />Colour: {s.unit?.color}</p></div>
        </section>
        <table className="w-full text-sm">
          <thead><tr className="border-y border-zinc-200 text-left text-xs text-zinc-500"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody className="font-cond">
            <tr className="border-b border-zinc-100"><td className="py-2">{s.bike_name} – list price</td><td className="py-2 text-right">{formatPKR(s.list_price)}</td></tr>
            <tr className="border-b border-zinc-100"><td className="py-2">Discount{s.discount_note && ` (${s.discount_note})`}</td><td className="py-2 text-right">− {formatPKR(s.discount)}</td></tr>
            <tr className="border-b border-zinc-200 text-base font-bold"><td className="py-2">Total</td><td className="py-2 text-right">{formatPKR(s.selling_price)}</td></tr>
            {s.payments.map((p, i) => <tr key={i}><td className="py-1.5 text-zinc-600">Payment {formatDate(p.date)} – {PAYMENT_METHODS[p.method]}</td><td className="py-1.5 text-right text-zinc-600">− {formatPKR(p.amount)}</td></tr>)}
            <tr className="text-base font-bold"><td className="py-2">Balance due</td><td className="py-2 text-right">{formatPKR(s.status === 'reversed' ? 0 : s.balance)}</td></tr>
          </tbody>
        </table>
        <section className="mt-8 border-t border-zinc-200 pt-4">
          <p className="text-xs font-bold text-zinc-500">Terms</p>
          <p className="mt-1 whitespace-pre-line text-xs text-zinc-600">{data.terms}</p>
          <p className="mt-6 text-center text-sm font-medium">{data.footer}</p>
          <p className="mt-2 text-center text-[11px] text-zinc-400">Demonstration invoice generated {formatDateTime(new Date().toISOString())} – no legal or tax value.</p>
        </section>
      </article>
    </div>
  );
}

import { useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { bookingsApi } from '../../lib/services';
import { BOOKING_TYPES, STATUS, formatDate, formatDateTime, formatTime } from '../../lib/format';
import { DataTable, DetailRow, FilterSelect, PageHeader, SearchBar } from '../../components/admin/AdminUI';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DemoNotice, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { Input, Textarea } from '../../components/ui/Form';
import { Pagination, Tabs } from '../../components/ui/Navigation';

function BookingDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data: b, loading, error, reload, setData } = useApi(() => bookingsApi.get(id), [id]);
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [resched, setResched] = useState(null);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      setData(data);
      toast.success(msg);
      onChanged();
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={b ? `Booking ${b.reference}` : 'Booking'} size="lg">
      {error ? <ErrorState error={error} onRetry={reload} /> : loading || !b ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <dl className="a-card p-4">
              <DetailRow label="Status"><StatusBadge kind="booking" value={b.status} /></DetailRow>
              <DetailRow label="Type">{b.type_label}</DetailRow>
              <DetailRow label="Motorcycle">{b.bike_name}</DetailRow>
              <DetailRow label="Customer">{b.name}</DetailRow>
              <DetailRow label="Phone"><a href={`tel:${b.phone}`} className="text-ignite">{b.phone}</a></DetailRow>
              <DetailRow label="Email">{b.email || '—'}</DetailRow>
              <DetailRow label="Preferred">{formatDate(b.preferred_date)} at {formatTime(b.preferred_time)}</DetailRow>
              <DetailRow label="Submitted">{formatDateTime(b.created_at)}</DetailRow>
            </dl>
            {b.message && <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-white/5">“{b.message}”</p>}
            <DemoNotice className="mt-3">Changing a booking never changes stock. Reserve units in Inventory; record purchases in Sales.</DemoNotice>
          </div>
          <div className="space-y-5">
            <section>
              <h3 className="text-sm font-bold">Update status</h3>
              {b.allowed_transitions.length ? (
                <>
                  <Input className="mt-2" placeholder="Optional note for the history" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} aria-label="Status note" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {b.allowed_transitions.map((s) => (
                      <button key={s} disabled={busy} className={s === 'rejected' || s === 'cancelled' ? 'a-btn btn-sm text-red-600' : 'btn-primary btn-sm'}
                        onClick={async () => { if (await run(() => bookingsApi.setStatus(b.id, s, statusNote), `Booking marked ${s}`)) setStatusNote(''); }}>
                        Mark {STATUS.booking[s][0].toLowerCase()}
                      </button>
                    ))}
                  </div>
                </>
              ) : <p className="mt-1 text-sm text-zinc-500 dark:text-fog">This booking is closed – no further status changes.</p>}
            </section>
            {b.allowed_transitions.length > 0 && (
              <section>
                <h3 className="text-sm font-bold">Reschedule</h3>
                {resched ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input type="date" value={resched.date} onChange={(e) => setResched({ ...resched, date: e.target.value })} aria-label="New date" />
                    <Input type="time" value={resched.time} onChange={(e) => setResched({ ...resched, time: e.target.value })} aria-label="New time" />
                    <button className="a-btn btn-sm" onClick={() => setResched(null)}>Cancel</button>
                    <button className="btn-primary btn-sm" disabled={busy}
                      onClick={async () => { if (await run(() => bookingsApi.update(b.id, { preferred_date: resched.date, preferred_time: resched.time }), 'Booking rescheduled')) setResched(null); }}>Save</button>
                  </div>
                ) : <button className="a-btn btn-sm mt-2" onClick={() => setResched({ date: b.preferred_date, time: b.preferred_time })}>Change date or time</button>}
              </section>
            )}
            <section>
              <h3 className="text-sm font-bold">Staff notes</h3>
              <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                {b.notes.map((n, i) => <li key={i} className="rounded-lg bg-zinc-50 p-2 text-sm dark:bg-white/5">{n.text}<span className="block text-xs text-zinc-500 dark:text-fog">{n.actor} – {formatDateTime(n.at)}</span></li>)}
                {!b.notes.length && <li className="text-sm text-zinc-500 dark:text-fog">No notes yet.</li>}
              </ul>
              <Textarea className="mt-2" rows={2} placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" />
              <button className="a-btn btn-sm mt-2" disabled={!note.trim() || busy}
                onClick={async () => { if (await run(() => bookingsApi.addNote(b.id, note.trim()), 'Note added')) setNote(''); }}>Add note</button>
            </section>
            <section>
              <h3 className="text-sm font-bold">Status history</h3>
              <ol className="mt-2 space-y-1.5 text-sm">
                {b.status_history.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2"><StatusBadge kind="booking" value={h.to} /><span className="text-xs text-zinc-500 dark:text-fog">{formatDateTime(h.at)} – {h.actor}{h.note && ` – ${h.note}`}</span></li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminBookings() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [view, setView] = useState('list');
  const dq = useDebounce(q);
  const list = useApi(() => bookingsApi.list({ q: dq, status, booking_type: type, date_from: range.from, date_to: range.to, page, page_size: 15 }), [dq, status, type, range.from, range.to, page]);
  const hist = useApi(() => bookingsApi.history({ page_size: 50 }), [view], { enabled: view === 'history' });
  const reset = () => setPage(1);

  return (
    <div>
      <PageHeader title="Bookings" description="Test rides, showroom visits and purchase enquiries." />
      <Tabs className="mb-4" value={view} onChange={setView} layoutId="bk-view" tabs={[{ value: 'list', label: 'Requests' }, { value: 'history', label: 'Status history' }]} />
      {view === 'list' ? (
        <div className="a-card overflow-hidden">
          <SearchBar value={q} onChange={(v) => { setQ(v); reset(); }} placeholder="Search reference, name, phone, bike…">
            <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} options={Object.entries(STATUS.booking).map(([value, [label]]) => ({ value, label }))} />
            <FilterSelect label="Type" value={type} onChange={(v) => { setType(v); reset(); }} options={Object.entries(BOOKING_TYPES).map(([value, label]) => ({ value, label }))} />
            <input type="date" className="a-input w-auto" aria-label="Preferred date from" value={range.from} onChange={(e) => { setRange({ ...range, from: e.target.value }); reset(); }} />
            <input type="date" className="a-input w-auto" aria-label="Preferred date to" value={range.to} onChange={(e) => { setRange({ ...range, to: e.target.value }); reset(); }} />
          </SearchBar>
          <DataTable
            loading={list.loading} error={list.error} onRetry={list.reload} rows={list.data || []} onRowClick={(r) => setViewing(r.id)}
            columns={[
              { key: 'reference', label: 'Reference', render: (b) => <span className="font-cond font-semibold">{b.reference}</span> },
              { key: 'name', label: 'Customer', render: (b) => <div><p className="font-medium">{b.name}</p><p className="text-xs text-zinc-500 dark:text-fog">{b.phone}</p></div> },
              { key: 'bike_name', label: 'Motorcycle' },
              { key: 'type_label', label: 'Type' },
              { key: 'when', label: 'Preferred', render: (b) => <span className="whitespace-nowrap text-xs">{formatDate(b.preferred_date)}, {formatTime(b.preferred_time)}</span> },
              { key: 'status', label: 'Status', render: (b) => <StatusBadge kind="booking" value={b.status} /> },
              { key: '_a', label: <span className="sr-only">Actions</span>, align: 'right', render: (b) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => setViewing(b.id)} aria-label="Open booking"><Eye className="h-4 w-4" /></button>
                  <button className="btn-icon h-8 w-8 text-red-600 hover:bg-red-500/10" onClick={() => setDeleting(b)} aria-label="Delete booking"><Trash2 className="h-4 w-4" /></button>
                </div>
              ) },
            ]}
          />
          <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={list.meta} onPage={setPage} /></div>
        </div>
      ) : (
        <div className="a-card overflow-hidden">
          <DataTable loading={hist.loading} error={hist.error} onRetry={hist.reload} rows={(hist.data || []).map((h, i) => ({ ...h, _k: i }))} rowKey="_k"
            columns={[
              { key: 'at', label: 'When', render: (h) => <span className="text-xs">{formatDateTime(h.at)}</span> },
              { key: 'reference', label: 'Booking', render: (h) => <span className="font-cond">{h.reference}</span> },
              { key: 'customer', label: 'Customer' },
              { key: 'change', label: 'Change', render: (h) => <span className="flex items-center gap-1.5">{h.from ? <StatusBadge kind="booking" value={h.from} /> : 'New'} <span aria-hidden>›</span> <StatusBadge kind="booking" value={h.to} /></span> },
              { key: 'actor', label: 'By' },
              { key: 'note', label: 'Note', render: (h) => h.note || '—' },
            ]} />
        </div>
      )}
      {viewing && <BookingDetail id={viewing} onClose={() => setViewing(null)} onChanged={() => list.reload({ silent: true })} />}
      <ConfirmDialog open={!!deleting} title="Delete booking?" message={`Booking ${deleting?.reference} will be removed. Consider cancelling instead to keep history.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try { await bookingsApi.remove(deleting.id); toast.success('Booking deleted'); list.reload({ silent: true }); } catch (e) { toast.error(e.message); }
          setDeleting(null);
        }} />
    </div>
  );
}

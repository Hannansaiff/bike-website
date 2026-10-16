import { useState } from 'react';
import { AlertTriangle, Lock, Pencil, Plus, Trash2, Unlock } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { bikesApi, inventoryApi } from '../../lib/services';
import { STATUS, formatDateTime, formatPKR } from '../../lib/format';
import { DataTable, FilterSelect, PageHeader, SearchBar, StatCard } from '../../components/admin/AdminUI';
import { RecordFormModal } from '../../components/admin/CrudPage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DemoNotice, StatusBadge } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Form';
import Modal from '../../components/ui/Modal';
import { Pagination, Tabs } from '../../components/ui/Navigation';
import { SmartImage } from '../../components/ui/Media';

export default function AdminInventory() {
  const toast = useToast();
  const [tab, setTab] = useState('summary');
  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [unitStatus, setUnitStatus] = useState('');
  const [bikeFilter, setBikeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(null);
  const [editing, setEditing] = useState(null);
  const [statusChange, setStatusChange] = useState(null);
  const [removing, setRemoving] = useState(null);
  const dq = useDebounce(q);

  const summary = useApi(() => inventoryApi.summary({ q: dq, low_stock_only: lowOnly }), [dq, lowOnly]);
  const units = useApi(() => inventoryApi.units({ q: dq, status: unitStatus, bike_id: bikeFilter, page, page_size: 15 }), [dq, unitStatus, bikeFilter, page], { enabled: tab === 'units' });
  const history = useApi(() => inventoryApi.history({ page, page_size: 20, bike_id: bikeFilter }), [page, bikeFilter], { enabled: tab === 'history' });
  const bikes = useApi(() => bikesApi.list({ admin: true, page_size: 100, sort: 'name' }), []);
  const bikeOpts = (bikes.data || []).filter((b) => b.listing_status !== 'upcoming').map((b) => ({ value: b.id, label: b.name }));
  const totals = summary.meta?.totals;

  const refreshAll = () => { summary.reload({ silent: true }); if (tab === 'units') units.reload({ silent: true }); };

  const addFields = [
    { name: 'bike_id', label: 'Motorcycle', type: 'select', options: bikeOpts, required: true, numeric: true, full: true },
    { name: 'quantity', label: 'Quantity', type: 'number', min: 1, max: 50, required: true },
    { name: 'purchase_cost', label: 'Purchase cost per unit (PKR)', type: 'number', min: 0 },
    { name: 'color', label: 'Colour' },
    { name: 'chassis_no', label: 'Chassis no. (single unit only)', hint: 'Use fictional values in demo',
      validate: (v, all) => (v && Number(all.quantity) > 1 ? 'Only when adding one unit' : '') },
    { name: 'engine_no', label: 'Engine no. (single unit only)', validate: (v, all) => (v && Number(all.quantity) > 1 ? 'Only when adding one unit' : '') },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
  ];
  const editFields = [
    { name: 'chassis_no', label: 'Chassis no.' }, { name: 'engine_no', label: 'Engine no.' },
    { name: 'color', label: 'Colour' }, { name: 'purchase_cost', label: 'Purchase cost (PKR)', type: 'number', min: 0 },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
  ];

  return (
    <div>
      <PageHeader title="Inventory" description="Physical units for each model. Sales mark units sold; staff reserve and release them here."
        actions={<button className="btn-primary" onClick={() => setAdding({ quantity: 1 })}><Plus className="h-4 w-4" /> Add stock</button>} />
      {totals && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Units in stock" value={totals.in_stock} />
          <StatCard label="Reserved" value={totals.reserved} />
          <StatCard label="Sold (history)" value={totals.sold} />
          <StatCard label="Low-stock models" value={totals.low_stock_models} icon={AlertTriangle} tone="accent" />
          <StatCard label="Stock value (cost)" value={formatPKR(totals.stock_cost_value)} hint={`Retail ${formatPKR(totals.stock_retail_value)}`} />
        </div>
      )}
      <Tabs className="mb-4" value={tab} onChange={(t) => { setTab(t); setPage(1); }} layoutId="inv-tabs"
        tabs={[{ value: 'summary', label: 'By model' }, { value: 'units', label: 'Individual units' }, { value: 'history', label: 'Stock history' }]} />

      <div className="a-card overflow-hidden">
        {tab !== 'history' && (
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={tab === 'units' ? 'Search model, chassis, engine no…' : 'Search model…'}>
            {tab === 'summary' ? (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#ff5b1f]" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label>
            ) : (
              <>
                <FilterSelect label="Status" value={unitStatus} onChange={(v) => { setUnitStatus(v); setPage(1); }} options={Object.entries(STATUS.unit).map(([value, [label]]) => ({ value, label }))} />
                <FilterSelect label="Model" value={bikeFilter} onChange={(v) => { setBikeFilter(v); setPage(1); }} options={bikeOpts} />
              </>
            )}
          </SearchBar>
        )}
        {tab === 'history' && (
          <div className="border-b border-zinc-200 p-3 dark:border-white/10">
            <FilterSelect label="Model" value={bikeFilter} onChange={(v) => { setBikeFilter(v); setPage(1); }} options={bikeOpts} />
          </div>
        )}

        {tab === 'summary' && (
          <DataTable loading={summary.loading} error={summary.error} onRetry={summary.reload} rows={summary.data || []} rowKey="bike_id"
            columns={[
              { key: 'image', label: '', render: (r) => <SmartImage src={r.image} alt="" className="h-10 w-14 rounded-md" /> },
              { key: 'bike_name', label: 'Model', render: (r) => <div><p className="font-semibold">{r.bike_name}</p><p className="text-xs capitalize text-zinc-500 dark:text-fog">{r.condition} – {r.listing_status}</p></div> },
              { key: 'in_stock', label: 'In stock', align: 'right', render: (r) => <span className={`font-cond font-bold ${r.is_low_stock ? 'text-amber-600 dark:text-amber-400' : ''}`}>{r.in_stock}{r.is_low_stock && <AlertTriangle className="ml-1 inline h-3.5 w-3.5" aria-label="Low stock" />}</span> },
              { key: 'reserved', label: 'Reserved', align: 'right' },
              { key: 'sold', label: 'Sold', align: 'right' },
              { key: 'availability', label: 'Shown as', render: (r) => <StatusBadge kind="availability" value={r.availability} /> },
              { key: 'value', label: 'Stock cost', align: 'right', render: (r) => <span className="font-cond">{formatPKR(r.stock_cost_value)}</span> },
              { key: '_a', label: <span className="sr-only">Actions</span>, align: 'right', render: (r) => r.listing_status !== 'upcoming' && (
                <button className="a-btn btn-sm" onClick={() => setAdding({ bike_id: String(r.bike_id), quantity: 1 })}>Add stock</button>
              ) },
            ]} />
        )}

        {tab === 'units' && (
          <>
            <DataTable loading={units.loading} error={units.error} onRetry={units.reload} rows={units.data || []}
              columns={[
                { key: 'id', label: 'Unit', render: (u) => <span className="font-cond">#{u.id}</span> },
                { key: 'bike_name', label: 'Model', render: (u) => <span className="font-medium">{u.bike_name}</span> },
                { key: 'ids', label: 'Chassis / engine', render: (u) => <span className="font-cond text-xs">{u.chassis_no || '—'}<br />{u.engine_no || '—'}</span> },
                { key: 'color', label: 'Colour' },
                { key: 'purchase_cost', label: 'Cost', align: 'right', render: (u) => <span className="font-cond">{u.purchase_cost ? formatPKR(u.purchase_cost) : '—'}</span> },
                { key: 'status', label: 'Status', render: (u) => <StatusBadge kind="unit" value={u.status} /> },
                { key: '_a', label: <span className="sr-only">Actions</span>, align: 'right', render: (u) => (
                  <div className="flex justify-end gap-1">
                    {u.status === 'in_stock' && <button className="a-btn btn-sm" onClick={() => setStatusChange({ unit: u, status: 'reserved', note: '' })}><Lock className="h-3.5 w-3.5" /> Reserve</button>}
                    {u.status === 'reserved' && <button className="a-btn btn-sm" onClick={() => setStatusChange({ unit: u, status: 'in_stock', note: '' })}><Unlock className="h-3.5 w-3.5" /> Release</button>}
                    {u.status === 'sold' && <span className="px-2 text-xs text-zinc-500 dark:text-fog">Locked (sold)</span>}
                    {u.status !== 'sold' && <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => setEditing(u)} aria-label="Edit unit"><Pencil className="h-4 w-4" /></button>}
                    {u.status === 'in_stock' && <button className="btn-icon h-8 w-8 text-red-600 hover:bg-red-500/10" onClick={() => setRemoving(u)} aria-label="Remove unit"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                ) },
              ]} />
            <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={units.meta} onPage={setPage} /></div>
          </>
        )}

        {tab === 'history' && (
          <>
            <DataTable loading={history.loading} error={history.error} onRetry={history.reload} rows={history.data || []}
              columns={[
                { key: 'timestamp', label: 'When', render: (h) => <span className="text-xs">{formatDateTime(h.timestamp)}</span> },
                { key: 'bike_name', label: 'Model' },
                { key: 'unit_id', label: 'Unit', render: (h) => <span className="font-cond">#{h.unit_id}</span> },
                { key: 'action', label: 'Action', render: (h) => <span className="capitalize">{h.action.replace(/_/g, ' ')}</span> },
                { key: 'change', label: 'Status', render: (h) => <span className="text-xs">{h.from_status ? STATUS.unit[h.from_status]?.[0] : '—'} › {h.to_status ? STATUS.unit[h.to_status]?.[0] : 'Removed'}</span> },
                { key: 'note', label: 'Note' },
                { key: 'actor', label: 'By' },
              ]} />
            <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={history.meta} onPage={setPage} /></div>
          </>
        )}
      </div>

      {adding && (
        <RecordFormModal open title="Add stock" fields={addFields} initial={adding} onClose={() => setAdding(null)} submitLabel="Add to stock"
          onSubmit={async (v) => {
            const body = { bike_id: Number(v.bike_id), quantity: Number(v.quantity), notes: v.notes || '' };
            if (v.purchase_cost !== '' && v.purchase_cost != null) body.purchase_cost = Number(v.purchase_cost);
            ['color', 'chassis_no', 'engine_no'].forEach((k) => { if (v[k]) body[k] = v[k]; });
            const { message } = await inventoryApi.addStock(body);
            toast.success(message);
            setAdding(null);
            refreshAll();
          }}>
          {() => <DemoNotice>Chassis and engine numbers must be fictional demo values. Duplicates are rejected.</DemoNotice>}
        </RecordFormModal>
      )}
      {editing && (
        <RecordFormModal open title={`Edit unit #${editing.id}`} fields={editFields} initial={editing} onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const body = { chassis_no: v.chassis_no || '', engine_no: v.engine_no || '', color: v.color || '', notes: v.notes || '' };
            if (v.purchase_cost !== '' && v.purchase_cost != null) body.purchase_cost = Number(v.purchase_cost);
            await inventoryApi.updateUnit(editing.id, body);
            toast.success('Unit updated');
            setEditing(null);
            refreshAll();
          }} />
      )}
      {statusChange && (
        <Modal open size="sm" title={statusChange.status === 'reserved' ? `Reserve unit #${statusChange.unit.id}` : `Release unit #${statusChange.unit.id}`}
          onClose={() => setStatusChange(null)}
          footer={<>
            <button className="a-btn" onClick={() => setStatusChange(null)}>Cancel</button>
            <button className="btn-primary" onClick={async () => {
              try {
                const body = { status: statusChange.status, note: statusChange.note };
                if (statusChange.booking) body.booking_id = Number(statusChange.booking);
                const { message } = await inventoryApi.setStatus(statusChange.unit.id, body);
                toast.success(message); setStatusChange(null); refreshAll();
              } catch (e) { toast.error(e.message); }
            }}>{statusChange.status === 'reserved' ? 'Reserve unit' : 'Release to stock'}</button>
          </>}>
          <div className="space-y-3">
            <p className="text-sm">{statusChange.unit.bike_name} – {statusChange.unit.chassis_no || 'no chassis no.'}</p>
            {statusChange.status === 'reserved' && (
              <Input label="Linked booking ID (optional)" type="number" value={statusChange.booking || ''} onChange={(e) => setStatusChange({ ...statusChange, booking: e.target.value })} />
            )}
            <Input label="Note" value={statusChange.note} onChange={(e) => setStatusChange({ ...statusChange, note: e.target.value })} placeholder="e.g. Advance received, hold till Friday" />
          </div>
        </Modal>
      )}
      <ConfirmDialog open={!!removing} title="Remove unit from stock?" message={`Unit #${removing?.id} of ${removing?.bike_name} will be removed. This is recorded in stock history.`}
        confirmLabel="Remove unit" onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          try { await inventoryApi.removeUnit(removing.id); toast.success('Unit removed'); refreshAll(); } catch (e) { toast.error(e.message); }
          setRemoving(null);
        }} />
    </div>
  );
}

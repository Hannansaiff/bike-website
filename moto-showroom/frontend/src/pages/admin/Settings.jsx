import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { settingsApi, systemApi } from '../../lib/services';
import { API_URL } from '../../lib/api';
import { PageHeader } from '../../components/admin/AdminUI';
import { FormFields, buildSchema, toPayload } from '../../components/admin/CrudPage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DemoNotice, Skeleton } from '../../components/ui/Feedback';
import { FormError } from '../../components/ui/Form';

const FIELDS = [
  { name: 'business_name', label: 'Business name', required: true, minLength: 2 },
  { name: 'tagline', label: 'Tagline' },
  { name: 'logo_text', label: 'Logo text', required: true },
  { name: 'currency', label: 'Currency', type: 'select', placeholder: '', options: [{ value: 'PKR', label: 'PKR – Pakistani Rupee' }], hint: 'PKR is the only supported currency in this phase.' },
  { name: 'logo_url', label: 'Logo image', type: 'image', hint: 'Optional – replaces the tachometer mark.' },
  { name: 'default_theme', label: 'Default admin theme', type: 'select', placeholder: '', options: [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }] },
  { name: 'default_low_stock_threshold', label: 'Default low-stock threshold', type: 'number', min: 0, max: 100 },
  { name: 'booking_open_time', label: 'Bookings open from', type: 'time', required: true },
  { name: 'booking_close_time', label: 'Bookings close at', type: 'time', required: true,
    validate: (v, all) => (v && all.booking_open_time && v <= all.booking_open_time ? 'Must be after the opening time' : '') },
  { name: 'invoice_prefix', label: 'Invoice prefix', required: true, validate: (v) => (v && !/^[A-Z]{2,6}$/.test(v) ? '2–6 capital letters' : '') },
  { name: 'invoice_footer', label: 'Invoice footer line' },
  { name: 'invoice_terms', label: 'Invoice terms', type: 'textarea', rows: 5 },
];

export default function Settings() {
  const { settings, refresh } = useSite();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const initial = useMemo(() => settings || {}, [settings]);
  const form = useForm(initial, buildSchema(FIELDS));
  useEffect(() => form.reset(initial), [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!settings) return <Skeleton className="h-96" />;
  const save = form.submit(async (v) => {
    await settingsApi.update(toPayload(FIELDS, v));
    await refresh();
    toast.success('Settings saved');
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Showroom identity, booking hours and invoice options." />
      <form onSubmit={save} noValidate className="a-card space-y-5 p-5">
        <FormError message={form.formError} />
        <FormFields fields={FIELDS} form={form} />
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
          <button type="button" className="a-btn" onClick={() => form.reset(initial)}>Cancel changes</button>
          <button className="btn-primary" disabled={form.submitting}>{form.submitting ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
      <section className="a-card space-y-3 p-5">
        <h2 className="font-bold">Demo environment</h2>
        <p className="text-sm text-zinc-600 dark:text-fog">API: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-white/10">{API_URL}</code> – Swagger docs at <a className="text-ignite hover:underline" href={API_URL.replace(/\/api$/, '') + '/docs'} target="_blank" rel="noreferrer">/docs</a></p>
        <DemoNotice>Data lives in backend memory and resets on restart. Sessions, favourites and theme are stored in this browser only.</DemoNotice>
        <button className="btn-danger" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</button>
      </section>
      <ConfirmDialog open={resetOpen} title="Reset all demo data?" confirmLabel="Reset data"
        message="Every change made in this session is replaced with the original sample dataset."
        onCancel={() => setResetOpen(false)}
        onConfirm={async () => {
          try { await systemApi.resetDemo(); await refresh(); toast.success('Demo data restored'); } catch (e) { toast.error(e.message); }
          setResetOpen(false);
        }} />
    </div>
  );
}

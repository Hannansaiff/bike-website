import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { rules } from '../../lib/validation';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import { FormError, Input, Select, Textarea, Toggle } from '../ui/Form';
import { Pagination } from '../ui/Navigation';
import { SmartImage } from '../ui/Media';
import { DataTable, FilterSelect, PageHeader, SearchBar } from './AdminUI';

/* ---------------------------------------------------------------------------
 * Field config → validation rules and inputs (shared by every admin form)
 * field: { name, label, type, required, options, min, max, hint, full, placeholder, rows }
 * types: text | email | url | textarea | number | select | toggle | date | time | list | image | color | multiselect
 * ------------------------------------------------------------------------- */
export function buildSchema(fields) {
  const schema = {};
  fields.forEach((f) => {
    const r = [];
    if (f.required) r.push(rules.required(f.label));
    if (f.type === 'number') r.push(rules.number(f.label, { min: f.min, max: f.max, integer: f.integer !== false }));
    if (f.type === 'email') r.push(rules.email());
    if (f.type === 'image' || f.type === 'url') r.push(rules.url());
    if (f.minLength) r.push(rules.minLen(f.minLength, f.label));
    if (f.phone) r.push(rules.phone());
    if (f.validate) r.push(rules.custom(f.validate));
    if (r.length) schema[f.name] = r;
  });
  return schema;
}

export function FormFields({ fields, form }) {
  const { values, errors, handleChange, handleBlur, setField } = form;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const common = {
          name: f.name,
          label: f.label,
          required: f.required,
          error: errors[f.name],
          hint: f.hint,
          className: f.full || ['textarea', 'list', 'image', 'multiselect'].includes(f.type) ? 'sm:col-span-2' : '',
          onBlur: handleBlur,
        };
        const v = values[f.name];
        switch (f.type) {
          case 'textarea':
            return <Textarea key={f.name} {...common} value={v ?? ''} onChange={handleChange} rows={f.rows || 4} placeholder={f.placeholder} />;
          case 'select':
            return (
              <Select key={f.name} {...common} value={v ?? ''} onChange={handleChange} options={f.options || []} placeholder={f.placeholder ?? 'Select…'} />
            );
          case 'toggle':
            return (
              <div key={f.name} className={common.className || 'self-end'}>
                <Toggle checked={!!v} onChange={(val) => setField(f.name, val)} label={f.label} description={f.hint} />
              </div>
            );
          case 'list':
            return (
              <Textarea
                key={f.name}
                {...common}
                hint={f.hint || 'One item per line'}
                value={Array.isArray(v) ? v.join('\n') : v ?? ''}
                onChange={(e) => setField(f.name, e.target.value.split('\n'))}
                rows={f.rows || 4}
              />
            );
          case 'image':
            return (
              <div key={f.name} className="grid gap-3 sm:col-span-2 sm:grid-cols-[1fr_8rem]">
                <Input {...common} className="" type="url" value={v ?? ''} onChange={handleChange} placeholder="https://… image URL"
                  hint={f.hint || 'Paste an image URL. File uploads need persistent storage (planned for production).'} />
                <SmartImage src={v} alt="Preview" className="aspect-[4/3] rounded-lg" />
              </div>
            );
          case 'multiselect':
            return (
              <fieldset key={f.name} className="sm:col-span-2">
                <legend className="mb-1.5 text-sm font-medium">{f.label}</legend>
                <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-white/10 sm:grid-cols-2">
                  {(f.options || []).map((o) => {
                    const list = v || [];
                    const checked = list.includes(o.value);
                    return (
                      <label key={o.value} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-white/5">
                        <input
                          type="checkbox"
                          className="accent-[#ff5b1f]"
                          checked={checked}
                          onChange={() => setField(f.name, checked ? list.filter((x) => x !== o.value) : [...list, o.value])}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
                {errors[f.name] && <p className="mt-1 text-xs text-red-500">{errors[f.name]}</p>}
              </fieldset>
            );
          case 'color':
            return <Input key={f.name} {...common} type="color" value={v || '#ff5b1f'} onChange={handleChange} className="[&_input]:h-10 [&_input]:p-1" />;
          default:
            return (
              <Input
                key={f.name}
                {...common}
                type={f.type === 'url' ? 'url' : f.type || 'text'}
                value={v ?? ''}
                onChange={handleChange}
                placeholder={f.placeholder}
                min={f.min}
                max={f.max}
                step={f.step}
              />
            );
        }
      })}
    </div>
  );
}

/** Convert form values to API payload using field types. */
export function toPayload(fields, values) {
  const out = {};
  fields.forEach((f) => {
    let v = values[f.name];
    if (f.type === 'number') v = v === '' || v === null || v === undefined ? null : Number(v);
    if (f.type === 'select' && f.numeric) v = v === '' ? null : Number(v);
    if (f.type === 'list') v = (v || []).map((s) => String(s).trim()).filter(Boolean);
    if (f.type === 'toggle') v = !!v;
    if ((f.type === 'email' || f.optional) && v === '') v = null;
    if (v !== null && v !== undefined) out[f.name] = v;
    else if (f.nullable) out[f.name] = null;
  });
  return out;
}

/** Create/edit modal shared by CrudPage and custom pages. */
export function RecordFormModal({ open, onClose, title, fields, initial, onSubmit, submitLabel = 'Save', size = 'lg', children }) {
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const form = useForm(initial, schema);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <button className="a-btn" onClick={onClose} type="button">Cancel</button>
          <button className="btn-primary" onClick={form.submit(onSubmit)} disabled={form.submitting} type="submit" form="record-form">
            {form.submitting ? 'Saving…' : submitLabel}
          </button>
        </>
      }
    >
      <form id="record-form" onSubmit={form.submit(onSubmit)} noValidate className="space-y-4">
        <FormError message={form.formError} />
        <FormFields fields={fields} form={form} />
        {children?.(form)}
      </form>
    </Modal>
  );
}

/**
 * Generic list + create/edit/delete page for simple modules.
 */
export default function CrudPage({
  title,
  description,
  entity = 'item',
  api,
  columns,
  fields,
  defaults,
  filters = [],
  searchPlaceholder,
  reorderable = false,
  canCreate = true,
  canDelete = true,
  toForm = (r) => r,
  mapPayload = (p) => p,
  onChanged,
  extraActions,
  pageSize = 12,
}) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState({});
  const [editing, setEditing] = useState(null); // null | 'new' | record
  const [deleting, setDeleting] = useState(null);
  const dq = useDebounce(q);

  const params = reorderable ? { q: dq, all: true, ...filterValues } : { q: dq, page, page_size: pageSize, ...filterValues };
  const { data, meta, loading, error, reload } = useApi(() => api.list(params), [dq, page, JSON.stringify(filterValues)]);
  const rows = data || [];

  const afterChange = async () => {
    await reload({ silent: true });
    onChanged?.();
  };

  const save = async (values) => {
    const payload = mapPayload(toPayload(fields, values), values);
    if (editing === 'new') {
      await api.create(payload);
      toast.success(`${entity} created`);
    } else {
      await api.update(editing.id, payload);
      toast.success(`${entity} saved`);
    }
    setEditing(null);
    afterChange();
  };

  const confirmDelete = async () => {
    try {
      await api.remove(deleting.id);
      toast.success(`${entity} deleted`);
      setDeleting(null);
      afterChange();
    } catch (e) {
      toast.error(e.message, `Could not delete ${entity.toLowerCase()}`);
      setDeleting(null);
    }
  };

  const move = async (index, dir) => {
    const ids = rows.map((r) => r.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try {
      await api.reorder(ids);
      afterChange();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const actionCol = {
    key: '_actions',
    label: <span className="sr-only">Actions</span>,
    align: 'right',
    render: (r) => {
      const index = rows.findIndex((x) => x.id === r.id);
      return (
        <div className="flex justify-end gap-1">
          {extraActions?.(r, afterChange)}
          {reorderable && !dq && (
            <>
              <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
            </>
          )}
          <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => setEditing(r)} aria-label={`Edit ${entity}`}>
            <Pencil className="h-4 w-4" />
          </button>
          {canDelete && (
            <button className="btn-icon h-8 w-8 text-red-600 hover:bg-red-500/10" onClick={() => setDeleting(r)} aria-label={`Delete ${entity}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    },
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate && (
            <button className="btn-primary" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> Add {entity.toLowerCase()}
            </button>
          )
        }
      />
      <div className="a-card overflow-hidden">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}…`}>
          {filters.map((f) => (
            <FilterSelect
              key={f.name}
              label={f.label}
              options={f.options}
              value={filterValues[f.name] || ''}
              onChange={(v) => { setFilterValues((s) => ({ ...s, [f.name]: v })); setPage(1); }}
            />
          ))}
        </SearchBar>
        <DataTable columns={[...columns, actionCol]} rows={rows} loading={loading} error={error} onRetry={reload} />
        {!reorderable && <div className="border-t border-zinc-200 p-3 dark:border-white/10"><Pagination meta={meta} onPage={setPage} /></div>}
      </div>

      {editing && (
        <RecordFormModal
          open
          onClose={() => setEditing(null)}
          title={editing === 'new' ? `Add ${entity.toLowerCase()}` : `Edit ${entity.toLowerCase()}`}
          fields={fields}
          initial={editing === 'new' ? { ...defaults } : { ...defaults, ...toForm(editing) }}
          onSubmit={save}
          submitLabel={editing === 'new' ? `Create ${entity.toLowerCase()}` : 'Save changes'}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${entity.toLowerCase()}?`}
        message={`This permanently removes "${deleting?.name || deleting?.title || deleting?.question || deleting?.subject || ''}" from the demo data.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

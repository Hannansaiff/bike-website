/**
 * Admin modules built on the generic CrudPage: motorcycles, categories, brands,
 * offers, gallery, banners, testimonials, FAQs, staff, enquiries, customers.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Star } from 'lucide-react';
import CrudPage from '../../components/admin/CrudPage';
import { DetailRow } from '../../components/admin/AdminUI';
import Modal from '../../components/ui/Modal';
import { Badge, DemoNotice, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { SmartImage } from '../../components/ui/Media';
import { Tabs } from '../../components/ui/Navigation';
import { useApi } from '../../hooks/useApi';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import {
  bannersApi, bikesApi, brandsApi, categoriesApi, customersApi, enquiriesApi, faqsApi, galleryApi, offersApi, staffApi, testimonialsApi,
} from '../../lib/services';
import { formatDate, formatDateTime, formatPKR, formatTime, ROLE_LABELS, STATUS, todayISO } from '../../lib/format';

const statusOptions = (kind) => Object.entries(STATUS[kind]).map(([value, [label]]) => ({ value, label }));
const thumb = (src) => <SmartImage src={src} alt="" className="h-10 w-14 rounded-md" />;
const yesNo = (v, on = 'Visible', off = 'Hidden') => <Badge tone={v ? 'green' : 'zinc'} dot>{v ? on : off}</Badge>;

/* ----------------------------- Motorcycles ------------------------------ */
export function AdminBikes() {
  const { refresh } = useSite();
  const cats = useApi(() => categoriesApi.list({ all: true }), []);
  const brands = useApi(() => brandsApi.list({ all: true }), []);
  const catOpts = (cats.data || []).map((c) => ({ value: c.id, label: c.active ? c.name : `${c.name} (inactive)` }));
  const brandOpts = (brands.data || []).map((b) => ({ value: b.id, label: b.active ? b.name : `${b.name} (inactive)` }));
  const api = useMemo(() => ({ ...bikesApi, list: (p) => bikesApi.list({ ...p, admin: true }) }), []);
  const fields = [
    { name: 'name', label: 'Model name', required: true, minLength: 2, full: true },
    { name: 'brand_id', label: 'Brand', type: 'select', options: brandOpts, required: true, numeric: true },
    { name: 'category_id', label: 'Category', type: 'select', options: catOpts, required: true, numeric: true },
    { name: 'price', label: 'Price (PKR)', type: 'number', required: true, min: 1, max: 100000000 },
    { name: 'model_year', label: 'Model year', type: 'number', required: true, min: 1980, max: 2035 },
    { name: 'condition', label: 'Condition', type: 'select', options: [{ value: 'new', label: 'New' }, { value: 'used', label: 'Used / pre-owned' }], required: true, placeholder: '' },
    { name: 'listing_status', label: 'Listing status', type: 'select', options: statusOptions('listing'), required: true, placeholder: '', hint: 'Availability is calculated from inventory units.' },
    { name: 'engine_cc', label: 'Engine capacity (cc)', type: 'number', required: true, min: 0, max: 3000, hint: 'Use 0 for electric' },
    { name: 'fuel_type', label: 'Fuel type', type: 'select', options: ['Petrol', 'Electric', 'Hybrid'].map((v) => ({ value: v, label: v })), required: true, placeholder: '' },
    { name: 'transmission', label: 'Transmission', required: true, placeholder: 'e.g. 5-Speed Manual' },
    { name: 'mileage', label: 'Mileage / range', placeholder: 'e.g. 40 km/l' },
    { name: 'max_power', label: 'Maximum power', placeholder: 'Leave empty if unknown' },
    { name: 'odometer_km', label: 'Odometer (km, used bikes)', type: 'number', min: 0 },
    { name: 'warranty', label: 'Warranty' },
    { name: 'registration', label: 'Registration details' },
    { name: 'low_stock_threshold', label: 'Low-stock alert at', type: 'number', min: 0, max: 100 },
    { name: 'featured', label: 'Featured on homepage lists', type: 'toggle' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'features', label: 'Features', type: 'list' },
    { name: 'colors', label: 'Colour options', type: 'list', rows: 3 },
    { name: 'images', label: 'Image URLs', type: 'list', rows: 3, hint: 'One image URL per line – the first is the cover image.',
      validate: (v) => ((v || []).filter((s) => s.trim()).some((s) => !/^(https?:\/\/|\/)/.test(s.trim())) ? 'Each image must be a URL starting with https://' : '') },
  ];
  return (
    <CrudPage
      title="Motorcycles" entity="Motorcycle" description="Catalogue models. Stock levels are managed in Inventory."
      api={api} fields={fields} onChanged={refresh}
      defaults={{ condition: 'new', listing_status: 'active', fuel_type: 'Petrol', model_year: new Date().getFullYear(), engine_cc: 125, low_stock_threshold: 2, featured: false, features: [], colors: [], images: [] }}
      toForm={(b) => ({ ...b, brand_id: String(b.brand_id), category_id: String(b.category_id) })}
      filters={[
        { name: 'category', label: 'Category', options: (cats.data || []).map((c) => ({ value: c.slug, label: c.name })) },
        { name: 'brand', label: 'Brand', options: (brands.data || []).map((b) => ({ value: b.slug, label: b.name })) },
        { name: 'condition', label: 'Condition', options: [{ value: 'new', label: 'New' }, { value: 'used', label: 'Used' }] },
        { name: 'availability', label: 'Availability', options: statusOptions('availability') },
      ]}
      columns={[
        { key: 'image', label: '', render: (b) => thumb(b.image) },
        { key: 'name', label: 'Model', render: (b) => <div><p className="font-semibold">{b.name}</p><p className="text-xs text-zinc-500 dark:text-fog">{b.brand?.name} – {b.category?.name} – {b.model_year}</p></div> },
        { key: 'price', label: 'Price', render: (b) => <div className="font-cond"><p className="font-semibold">{formatPKR(b.pricing.final_price)}</p>{b.pricing.discount > 0 && <p className="text-xs text-zinc-500 line-through">{formatPKR(b.price)}</p>}</div> },
        { key: 'stock', label: 'Stock', render: (b) => <span className="font-cond text-xs">{b.stock.in_stock} in / {b.stock.reserved} res / {b.stock.sold} sold</span> },
        { key: 'availability', label: 'Availability', render: (b) => <StatusBadge kind="availability" value={b.availability} /> },
        { key: 'featured', label: 'Featured', render: (b) => (b.featured ? <Star className="h-4 w-4 fill-ignite text-ignite" aria-label="Featured" /> : '') },
      ]}
      extraActions={(b) => (
        <Link to={`/bikes/${b.slug}`} target="_blank" className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="View on website"><Eye className="h-4 w-4" /></Link>
      )}
    />
  );
}

/* --------------------------- Categories / brands ------------------------- */
export function AdminCategories() {
  const { refresh } = useSite();
  return (
    <CrudPage
      title="Categories" entity="Category" description="Order and visibility here control public navigation. Inactive categories hide their bikes from the website."
      api={categoriesApi} reorderable onChanged={refresh} defaults={{ active: true }}
      fields={[
        { name: 'name', label: 'Name', required: true, minLength: 2 },
        { name: 'slug', label: 'URL slug', hint: 'Leave empty to generate from the name', optional: true,
          validate: (v) => (v && !/^[a-z0-9-]+$/.test(v) ? 'Use lowercase letters, numbers and hyphens' : '') },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'image', label: 'Image', type: 'image' },
        { name: 'active', label: 'Visible on website', type: 'toggle' },
      ]}
      columns={[
        { key: 'image', label: '', render: (c) => thumb(c.image) },
        { key: 'name', label: 'Category', render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-zinc-500 dark:text-fog">/{c.slug}</p></div> },
        { key: 'order', label: 'Order', render: (c) => <span className="font-cond">{c.order}</span> },
        { key: 'active', label: 'Status', render: (c) => yesNo(c.active, 'Active', 'Inactive') },
      ]}
    />
  );
}

export function AdminBrands() {
  const { refresh } = useSite();
  return (
    <CrudPage
      title="Brands" entity="Brand" api={brandsApi} reorderable onChanged={refresh} defaults={{ active: true, color: '#ff5b1f' }}
      fields={[
        { name: 'name', label: 'Name', required: true, minLength: 2 },
        { name: 'origin', label: 'Origin / note' },
        { name: 'color', label: 'Brand colour', type: 'color' },
        { name: 'slug', label: 'URL slug', optional: true, hint: 'Leave empty to generate' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'logo', label: 'Logo image', type: 'image' },
        { name: 'active', label: 'Active', type: 'toggle' },
      ]}
      columns={[
        { key: 'name', label: 'Brand', render: (b) => <span className="flex items-center gap-2"><span className="h-6 w-6 rounded" style={{ background: b.color }} /><span className="font-semibold">{b.name}</span></span> },
        { key: 'description', label: 'Description', render: (b) => <span className="line-clamp-1 text-zinc-500 dark:text-fog">{b.description}</span> },
        { key: 'active', label: 'Status', render: (b) => yesNo(b.active, 'Active', 'Inactive') },
      ]}
    />
  );
}

/* --------------------------------- Offers -------------------------------- */
export function AdminOffers() {
  const bikes = useApi(() => bikesApi.list({ admin: true, page_size: 100, sort: 'name' }), []);
  return (
    <CrudPage
      title="Offers" entity="Offer" description="Status is evaluated from the dates on every request. Expired offers stop applying automatically."
      api={offersApi}
      defaults={{ discount_type: 'percent', discount_value: 5, active: true, highlight: false, applies_to_all: false, bike_ids: [], start_date: todayISO(0), end_date: todayISO(30) }}
      filters={[{ name: 'status', label: 'Status', options: statusOptions('offer') }]}
      fields={[
        { name: 'title', label: 'Title', required: true, minLength: 3, full: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'discount_type', label: 'Discount type', type: 'select', placeholder: '', options: [{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount (PKR)' }, { value: 'none', label: 'No price change (perk)' }] },
        { name: 'discount_value', label: 'Discount value', type: 'number', min: 0, integer: false,
          validate: (v, all) => (all.discount_type === 'percent' && (Number(v) <= 0 || Number(v) > 90) ? 'Percentage must be between 1 and 90' : all.discount_type === 'fixed' && Number(v) <= 0 ? 'Enter an amount above zero' : '') },
        { name: 'start_date', label: 'Start date', type: 'date', required: true },
        { name: 'end_date', label: 'End date', type: 'date', required: true, validate: (v, all) => (v && all.start_date && v < all.start_date ? 'End date must be after the start date' : '') },
        { name: 'active', label: 'Active', type: 'toggle' },
        { name: 'highlight', label: 'Highlight on homepage', type: 'toggle' },
        { name: 'applies_to_all', label: 'Applies to all motorcycles', type: 'toggle' },
        { name: 'bike_ids', label: 'Eligible motorcycles', type: 'multiselect', options: (bikes.data || []).map((b) => ({ value: b.id, label: b.name })) },
        { name: 'banner', label: 'Banner image', type: 'image' },
      ]}
      mapPayload={(p, v) => ({ ...p, bike_ids: v.bike_ids || [], discount_value: Number(v.discount_value) || 0 })}
      columns={[
        { key: 'title', label: 'Offer', render: (o) => <div><p className="font-semibold">{o.title}</p><p className="text-xs text-zinc-500 dark:text-fog">{o.label}</p></div> },
        { key: 'discount', label: 'Discount', render: (o) => <span className="font-cond">{o.discount_type === 'percent' ? `${o.discount_value}%` : o.discount_type === 'fixed' ? formatPKR(o.discount_value) : 'Perk'}</span> },
        { key: 'dates', label: 'Valid', render: (o) => <span className="text-xs">{formatDate(o.start_date)} – {formatDate(o.end_date)}</span> },
        { key: 'bikes', label: 'Bikes', render: (o) => (o.applies_to_all ? 'All' : o.bikes.length) },
        { key: 'status', label: 'Status', render: (o) => <StatusBadge kind="offer" value={o.status} /> },
      ]}
    />
  );
}

/* --------------------------- Gallery & content lists --------------------- */
export function AdminGallery() {
  return (
    <CrudPage
      title="Gallery" entity="Image" api={galleryApi} reorderable defaults={{ visible: true, category: 'bikes' }}
      description="Images are referenced by URL. Permanent uploads need a storage service (see README)."
      fields={[
        { name: 'title', label: 'Title', required: true, minLength: 2 },
        { name: 'category', label: 'Group', type: 'select', placeholder: '', options: [{ value: 'showroom', label: 'Showroom' }, { value: 'bikes', label: 'Bikes' }, { value: 'events', label: 'Events' }] },
        { name: 'caption', label: 'Caption', full: true },
        { name: 'image', label: 'Image', type: 'image', required: true },
        { name: 'visible', label: 'Visible on website', type: 'toggle' },
      ]}
      columns={[
        { key: 'image', label: '', render: (g) => thumb(g.image) },
        { key: 'title', label: 'Title', render: (g) => <span className="font-semibold">{g.title}</span> },
        { key: 'category', label: 'Group', render: (g) => <span className="capitalize">{g.category}</span> },
        { key: 'visible', label: 'Visibility', render: (g) => yesNo(g.visible) },
      ]}
    />
  );
}

export function AdminBanners() {
  return (
    <CrudPage
      title="Promotional banners" entity="Banner" api={bannersApi} reorderable defaults={{ visible: true }}
      fields={[
        { name: 'title', label: 'Title', required: true, minLength: 2 },
        { name: 'cta_label', label: 'Button label' },
        { name: 'subtitle', label: 'Subtitle', full: true },
        { name: 'cta_link', label: 'Button link', placeholder: '/bikes', validate: (v) => (v && !/^(https?:\/\/|\/)/.test(v) ? 'Start with / or https://' : '') },
        { name: 'visible', label: 'Visible', type: 'toggle' },
        { name: 'image', label: 'Background image', type: 'image' },
      ]}
      columns={[
        { key: 'image', label: '', render: (b) => thumb(b.image) },
        { key: 'title', label: 'Banner', render: (b) => <div><p className="font-semibold">{b.title}</p><p className="text-xs text-zinc-500 dark:text-fog">{b.subtitle}</p></div> },
        { key: 'visible', label: 'Visibility', render: (b) => yesNo(b.visible) },
      ]}
    />
  );
}

export function AdminTestimonials() {
  return (
    <CrudPage
      title="Testimonials" entity="Testimonial" api={testimonialsApi} reorderable defaults={{ visible: true, rating: 5 }}
      fields={[
        { name: 'name', label: 'Customer name', required: true },
        { name: 'city', label: 'City' },
        { name: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, max: 5, required: true },
        { name: 'bike_label', label: 'Motorcycle' },
        { name: 'text', label: 'Testimonial', type: 'textarea', required: true, minLength: 10 },
        { name: 'visible', label: 'Visible', type: 'toggle' },
      ]}
      columns={[
        { key: 'name', label: 'Customer', render: (t) => <div><p className="font-semibold">{t.name}</p><p className="text-xs text-zinc-500">{t.city}</p></div> },
        { key: 'text', label: 'Quote', render: (t) => <span className="line-clamp-2 max-w-md">{t.text}</span> },
        { key: 'rating', label: 'Rating', render: (t) => `${t.rating}/5` },
        { key: 'visible', label: 'Visibility', render: (t) => yesNo(t.visible) },
      ]}
    />
  );
}

export function AdminFaqs() {
  return (
    <CrudPage
      title="FAQs" entity="FAQ" api={faqsApi} reorderable defaults={{ visible: true }}
      fields={[
        { name: 'question', label: 'Question', required: true, minLength: 5, full: true },
        { name: 'answer', label: 'Answer', type: 'textarea', required: true, minLength: 5 },
        { name: 'visible', label: 'Visible', type: 'toggle' },
      ]}
      columns={[
        { key: 'question', label: 'Question', render: (f) => <span className="font-semibold">{f.question}</span> },
        { key: 'visible', label: 'Visibility', render: (f) => yesNo(f.visible) },
      ]}
    />
  );
}

/* ---------------------------------- Staff -------------------------------- */
export function AdminStaff() {
  const roles = useApi(() => staffApi.roles(), []);
  return (
    <div className="space-y-6">
      <CrudPage
        title="Staff & roles" entity="Staff member" api={staffApi} defaults={{ role: 'sales', active: true }}
        description="Demo staff accounts. Every demo account signs in with password admin123."
        fields={[
          { name: 'name', label: 'Full name', required: true, minLength: 3 },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone' },
          { name: 'role', label: 'Role', type: 'select', placeholder: '', options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { name: 'active', label: 'Active (can sign in)', type: 'toggle' },
        ]}
        columns={[
          { key: 'name', label: 'Name', render: (s) => <div><p className="font-semibold">{s.name}</p><p className="text-xs text-zinc-500 dark:text-fog">{s.email}</p></div> },
          { key: 'role', label: 'Role', render: (s) => ROLE_LABELS[s.role] },
          { key: 'joined_at', label: 'Joined', render: (s) => formatDate(s.joined_at) },
          { key: 'active', label: 'Status', render: (s) => yesNo(s.active, 'Active', 'Disabled') },
        ]}
      />
      <section className="a-card p-5">
        <h2 className="font-bold">Role permissions (prepared structure)</h2>
        <DemoNotice className="mt-2">These permissions only shape the admin menu in this demo. In production FastAPI must check them on every request.</DemoNotice>
        {roles.loading ? <Skeleton className="mt-4 h-32" /> : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(roles.data || {}).map(([key, r]) => (
              <div key={key} className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
                <p className="font-semibold">{r.label}</p>
                <ul className="mt-2 flex flex-wrap gap-1">
                  {r.modules.map((m) => <li key={m}><Badge tone={m === '*' ? 'orange' : 'zinc'}>{m === '*' ? 'Everything' : m}</Badge></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------- Enquiries ------------------------------ */
export function AdminEnquiries() {
  return (
    <CrudPage
      title="Contact enquiries" entity="Enquiry" api={enquiriesApi} canCreate={false}
      description="Messages from the public contact form."
      filters={[{ name: 'status', label: 'Status', options: statusOptions('enquiry') }]}
      fields={[
        { name: 'status', label: 'Status', type: 'select', placeholder: '', options: statusOptions('enquiry') },
        { name: 'notes', label: 'Internal notes', type: 'textarea' },
      ]}
      columns={[
        { key: 'name', label: 'From', render: (e) => <div><p className="font-semibold">{e.name}</p><p className="text-xs text-zinc-500 dark:text-fog">{e.phone}{e.email && ` – ${e.email}`}</p></div> },
        { key: 'subject', label: 'Message', render: (e) => <div className="max-w-md"><p className="font-medium">{e.subject}</p><p className="line-clamp-2 text-xs text-zinc-500 dark:text-fog">{e.message}</p></div> },
        { key: 'created_at', label: 'Received', render: (e) => <span className="text-xs">{formatDateTime(e.created_at)}</span> },
        { key: 'status', label: 'Status', render: (e) => <StatusBadge kind="enquiry" value={e.status} /> },
      ]}
    />
  );
}

/* -------------------------------- Customers ------------------------------ */
function CustomerDetail({ id, onClose }) {
  const { data, loading, error, reload } = useApi(() => customersApi.get(id), [id]);
  const [tab, setTab] = useState('bookings');
  const c = data?.customer;
  return (
    <Modal open onClose={onClose} title={c?.name || 'Customer'} description="Customer record and history" size="xl">
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <dl className="a-card p-4">
            <DetailRow label="Phone">{c.phone}</DetailRow>
            <DetailRow label="Email">{c.email || '—'}</DetailRow>
            <DetailRow label="City">{c.city || '—'}</DetailRow>
            <DetailRow label="Registered">{formatDate(c.registered_at)}</DetailRow>
            <DetailRow label="Source"><span className="capitalize">{c.source}</span></DetailRow>
            <DetailRow label="Bookings">{c.total_bookings}</DetailRow>
            <DetailRow label="Purchases">{c.total_purchases}</DetailRow>
            <DetailRow label="Total spent"><span className="font-cond">{formatPKR(c.total_spent)}</span></DetailRow>
            <DetailRow label="Outstanding"><span className="font-cond">{formatPKR(c.outstanding_balance)}</span></DetailRow>
            {c.notes && <p className="mt-3 rounded bg-zinc-50 p-2 text-sm dark:bg-white/5">{c.notes}</p>}
          </dl>
          <div>
            <Tabs value={tab} onChange={setTab} layoutId="cust-tabs" tabs={[
              { value: 'bookings', label: 'Bookings', count: data.bookings.length },
              { value: 'sales', label: 'Purchases', count: data.sales.length },
              { value: 'enquiries', label: 'Enquiries', count: data.enquiries.length },
            ]} />
            <ul className="divide-y divide-zinc-100 dark:divide-white/5">
              {tab === 'bookings' && data.bookings.map((b) => (
                <li key={b.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div><p className="font-semibold">{b.bike_name}</p><p className="text-xs text-zinc-500 dark:text-fog">{b.reference} – {b.type_label} – {formatDate(b.preferred_date)} {formatTime(b.preferred_time)}</p></div>
                  <StatusBadge kind="booking" value={b.status} />
                </li>
              ))}
              {tab === 'sales' && data.sales.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div><p className="font-semibold">{s.bike_name}</p><p className="text-xs text-zinc-500 dark:text-fog">{s.invoice_no} – {formatDate(s.sale_date)}</p></div>
                  <div className="text-right"><p className="font-cond font-semibold">{formatPKR(s.selling_price)}</p><StatusBadge kind={s.status === 'reversed' ? 'sale' : 'payment'} value={s.status === 'reversed' ? 'reversed' : s.payment_status} /></div>
                </li>
              ))}
              {tab === 'enquiries' && data.enquiries.map((e) => (
                <li key={e.id} className="py-3 text-sm"><p className="font-semibold">{e.subject}</p><p className="text-xs text-zinc-500 dark:text-fog">{e.message}</p></li>
              ))}
            </ul>
            {((tab === 'bookings' && !data.bookings.length) || (tab === 'sales' && !data.sales.length) || (tab === 'enquiries' && !data.enquiries.length)) && (
              <p className="py-8 text-center text-sm text-zinc-500 dark:text-fog">No records.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function AdminCustomers() {
  const [viewing, setViewing] = useState(null);
  const toast = useToast();
  return (
    <>
      <CrudPage
        title="Customers" entity="Customer" api={customersApi} defaults={{ source: 'walk-in' }}
        description="Private customer records – never shown on the public website."
        fields={[
          { name: 'name', label: 'Full name', required: true, minLength: 3 },
          { name: 'phone', label: 'Mobile number', required: true, phone: true, placeholder: '0300-1234567' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'city', label: 'City' },
          { name: 'source', label: 'Source', type: 'select', placeholder: '', options: ['walk-in', 'website', 'referral', 'booking', 'phone'].map((v) => ({ value: v, label: v })) },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        columns={[
          { key: 'name', label: 'Customer', render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-zinc-500 dark:text-fog">{c.phone}{c.email && ` – ${c.email}`}</p></div> },
          { key: 'city', label: 'City' },
          { key: 'registered_at', label: 'Registered', render: (c) => formatDate(c.registered_at) },
          { key: 'total_bookings', label: 'Bookings', align: 'right' },
          { key: 'total_purchases', label: 'Purchases', align: 'right' },
          { key: 'total_spent', label: 'Spent', align: 'right', render: (c) => <span className="font-cond">{formatPKR(c.total_spent)}</span> },
        ]}
        extraActions={(c) => (
          <button className="btn-icon h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10" onClick={() => setViewing(c.id)} aria-label="View history"><Eye className="h-4 w-4" /></button>
        )}
      />
      {viewing && <CustomerDetail id={viewing} onClose={() => setViewing(null)} toast={toast} />}
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Heart, Mail, MapPin, MessageCircle, Navigation, Phone, Trash2, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { useSite } from '../../context/SiteContext';
import { useShop } from '../../context/ShopContext';
import { bikesApi, enquiriesApi, galleryApi, offersApi } from '../../lib/services';
import { rules } from '../../lib/validation';
import { cn, formatDate, formatPKR } from '../../lib/format';
import { PageHero, SectionHeader } from '../../components/public/PublicBits';
import { PriceTag } from '../../components/public/BikeCard';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { FormError, Input, Textarea } from '../../components/ui/Form';
import { Reveal, SmartImage } from '../../components/ui/Media';
import { FaqList } from './Home';

export function Categories() {
  const { categories, loading } = useSite();
  return (
    <>
      <PageHero title="Categories" text="From 50 cc scooties to 750 cc tourers – find your kind of ride." />
      <div className="container-site grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />)}
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 0.05}>
            <Link to={`/categories/${c.slug}`} className="group relative block overflow-hidden rounded-2xl border border-white/10">
              <SmartImage src={c.image} alt="" className="aspect-[16/10]" zoom />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="font-display text-2xl">{c.name}</h2>
                <p className="mt-1 text-sm text-bone/70">{c.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}

export function Offers() {
  const { data, loading, error, reload } = useApi(() => offersApi.list({ public: true, page_size: 50 }), []);
  return (
    <>
      <PageHero title="Offers and promotions" text="Only offers valid today are shown. Sample offers are labelled as such." />
      <div className="container-site py-12">
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && !data?.length && <EmptyState title="No offers running right now" text="Check back soon or ask the showroom about current deals." />}
        <div className="grid gap-6 md:grid-cols-2">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          {data?.map((o) => (
            <Reveal key={o.id}>
              <article className="p-card flex h-full flex-col overflow-hidden">
                <div className="relative">
                  <SmartImage src={o.banner} alt="" className="aspect-[21/9]" />
                  {o.discount_type !== 'none' && (
                    <span className="font-display absolute right-4 top-4 rounded-lg bg-ignite px-3 py-1.5 text-xl text-white">
                      {o.discount_type === 'percent' ? `${o.discount_value}% off` : `${formatPKR(o.discount_value)} off`}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusBadge kind="offer" value={o.status} />
                    <span className="rounded-md border border-white/15 px-2 py-0.5 text-fog">{o.label}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">{o.title}</h2>
                  <p className="mt-2 text-fog">{o.description}</p>
                  <p className="mt-3 text-sm text-bone/70">Valid {formatDate(o.start_date)} – {formatDate(o.end_date)}</p>
                  {o.bikes.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {o.bikes.map((b) => (
                        <li key={b.id}><Link to={`/bikes/${b.id}`} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:border-ignite hover:text-ignite-400">{b.name}</Link></li>
                      ))}
                    </ul>
                  )}
                  {o.applies_to_all && <p className="mt-4 text-sm">Applies to every motorcycle.</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

export function About() {
  const { content } = useSite();
  const a = content?.about;
  return (
    <>
      <PageHero title={a?.title || 'About us'} />
      <div className="container-site grid items-start gap-12 py-14 lg:grid-cols-2">
        <Reveal>
          <p className="text-lg leading-relaxed text-bone/85">{a?.story}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border-l-2 border-ignite pl-4"><h2 className="font-bold">Our mission</h2><p className="mt-2 text-sm text-fog">{a?.mission}</p></div>
            <div className="border-l-2 border-white/30 pl-4"><h2 className="font-bold">Our vision</h2><p className="mt-2 text-sm text-fog">{a?.vision}</p></div>
          </div>
          <div className="mt-10 flex gap-3"><Link to="/book" className="btn-primary">Book a visit</Link><Link to="/contact" className="btn-ghost">Contact us</Link></div>
        </Reveal>
        <Reveal><SmartImage src={a?.image} alt="Inside the showroom" className="aspect-[4/5] rounded-2xl" /></Reveal>
      </div>
      <section className="container-site py-10">
        <SectionHeader title="Frequently asked questions" />
        <FaqList />
      </section>
    </>
  );
}

export function GalleryPage() {
  const { data, loading, error, reload } = useApi(() => galleryApi.list({ public: true }), []);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const items = (data || []).filter((g) => filter === 'all' || g.category === filter);
  return (
    <>
      <PageHero title="Gallery" text="Inside the showroom, on the road and at our events (demo photos)." />
      <div className="container-site py-12">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
          {['all', 'showroom', 'bikes', 'events'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={cn('rounded-full px-4 py-1.5 text-sm font-medium capitalize', filter === f ? 'bg-bone text-carbon' : 'border border-white/15 text-fog hover:text-bone')}>
              {f}
            </button>
          ))}
        </div>
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !items.length && !error && <EmptyState title="No photos in this group yet" />}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="mb-4 h-60 rounded-xl" />)}
          {items.map((g) => (
            <button key={g.id} onClick={() => setLightbox(g)} className="group mb-4 block w-full overflow-hidden rounded-xl text-left">
              <SmartImage src={g.image} alt={g.title} className={g.id % 3 === 0 ? 'aspect-square' : 'aspect-[4/3]'} zoom />
              <span className="mt-2 block text-sm text-fog">{g.caption || g.title}</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label={lightbox.title}>
            <button className="btn-icon absolute right-4 top-4 text-white hover:bg-white/10" aria-label="Close"><X className="h-6 w-6" /></button>
            <motion.figure initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <SmartImage src={lightbox.image} alt={lightbox.title} className="max-h-[80vh] rounded-xl" imgClassName="object-contain" />
              <figcaption className="mt-3 text-center text-sm text-bone/80">{lightbox.caption}</figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Contact() {
  const { content } = useSite();
  const c = content?.contact || {};
  const [sent, setSent] = useState(false);
  const form = useForm({ name: '', phone: '', email: '', subject: '', message: '' }, {
    name: [rules.required('Name'), rules.minLen(3, 'Name')],
    phone: [rules.required('Phone number'), rules.phone()],
    email: [rules.email()],
    subject: [rules.required('Subject'), rules.minLen(3, 'Subject')],
    message: [rules.required('Message'), rules.minLen(10, 'Message')],
  });
  const submit = form.submit(async (v) => {
    await enquiriesApi.create({ ...v, email: v.email || null });
    setSent(true);
    form.reset();
  });
  const query = c.map_query || c.address;
  const isPlaceholder = !c.map_query && /placeholder/i.test(c.address || '');
  return (
    <>
      <PageHero title="Contact and location" text="Call, message or visit – or send the form and we'll get back to you." />
      <div className="container-site grid gap-10 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-ignite" /><span>{c.address}{c.city && <><br />{c.city}</>}</span></li>
            {(c.phones || []).map((p) => <li key={p} className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-ignite" /><a href={`tel:${p.replace(/[^\d+]/g, '')}`} className="hover:text-ignite-400">{p}</a></li>)}
            {c.email && <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-ignite" /><a href={`mailto:${c.email}`} className="hover:text-ignite-400">{c.email}</a></li>}
            {(c.hours || []).map((h) => <li key={h.day} className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-ignite" /><span><b className="font-semibold">{h.day}</b><br /><span className="text-fog">{h.time}</span></span></li>)}
          </ul>
          <div className="flex flex-wrap gap-2">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`} target="_blank" rel="noreferrer"
              className={cn('btn-light', isPlaceholder && 'pointer-events-none opacity-50')} aria-disabled={isPlaceholder}>
              <Navigation className="h-4 w-4" /> Get directions
            </a>
            {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" className="btn-ghost"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          </div>
          {c.map_embed_url ? (
            <iframe title="Showroom location map" src={c.map_embed_url} className="aspect-[4/3] w-full rounded-2xl border border-white/10" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
              <MapPin className="h-8 w-8 text-fog" />
              <p className="mt-3 font-semibold">Map placeholder</p>
              <p className="mt-1 max-w-xs text-sm text-fog">No real map is connected. Add the showroom's Google Maps embed URL in Admin → Content → Contact.</p>
            </div>
          )}
        </div>
        <div className="p-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Send us a message</h2>
          {sent ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-3 font-semibold">Message sent</p>
              <p className="mt-1 text-sm text-fog">The showroom team will reply by phone or email.</p>
              <button className="btn-ghost mt-4" onClick={() => setSent(false)}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormError message={form.formError} />
              <Input variant="public" name="name" label="Name" required value={form.values.name} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.name} />
              <Input variant="public" name="phone" label="Phone" type="tel" required placeholder="0300-1234567" value={form.values.phone} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.phone} />
              <Input variant="public" name="email" label="Email (optional)" type="email" value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.email} className="sm:col-span-2" />
              <Input variant="public" name="subject" label="Subject" required value={form.values.subject} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.subject} className="sm:col-span-2" />
              <Textarea variant="public" name="message" label="Message" required rows={5} value={form.values.message} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.message} className="sm:col-span-2" />
              <button className="btn-primary sm:col-span-2" disabled={form.submitting}>{form.submitting ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export function Compare() {
  const { compare, removeCompare } = useShop();
  const ids = compare.map((c) => c.id).join(',');
  const { data, loading, error, reload } = useApi(() => bikesApi.compare(ids), [ids], { enabled: compare.length >= 2 });
  const rows = [
    ['Price', (b) => <PriceTag pricing={b.pricing} />],
    ['Availability', (b) => <StatusBadge kind="availability" value={b.availability} />],
    ['Brand', (b) => b.brand?.name], ['Category', (b) => b.category?.name], ['Model year', (b) => b.model_year],
    ['Condition', (b) => (b.condition === 'used' ? 'Pre-owned' : 'New')],
    ['Engine', (b) => (b.fuel_type === 'Electric' ? 'Electric motor' : `${b.engine_cc} cc`)],
    ['Fuel', (b) => b.fuel_type], ['Transmission', (b) => b.transmission], ['Mileage / range', (b) => b.mileage],
    ['Max power', (b) => b.max_power], ['Warranty', (b) => b.warranty], ['Colours', (b) => b.colors?.join(', ')],
  ];
  return (
    <>
      <PageHero title="Compare motorcycles" text="Put two or three bikes side by side. Add bikes with the compare button on any bike card." />
      <div className="container-site py-12">
        {compare.length < 2 ? (
          <EmptyState title="Pick at least two bikes" text={`You have ${compare.length} selected.`} action={<Link to="/bikes" className="btn-primary">Browse bikes</Link>} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="w-40 bg-black/30 p-4 text-left font-semibold text-fog" scope="col">Model</th>
                  {data.map((b) => (
                    <th key={b.id} scope="col" className="p-4 text-left align-top">
                      <SmartImage src={b.image} alt="" className="aspect-[4/3] rounded-lg" />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <Link to={`/bikes/${b.slug}`} className="text-base font-bold hover:text-ignite-400">{b.name}</Link>
                        <button onClick={() => removeCompare(b.id)} className="text-fog hover:text-bone" aria-label={`Remove ${b.name}`}><X className="h-4 w-4" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => (
                  <tr key={label} className="border-t border-white/10">
                    <th scope="row" className="bg-black/30 p-4 text-left font-medium text-fog">{label}</th>
                    {data.map((b) => <td key={b.id} className="font-cond p-4">{fn(b) || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function Favourites() {
  const { favourites, toggleFavourite } = useShop();
  return (
    <>
      <PageHero title="Your favourites" text="Saved in this browser only – sign-in sync would need a real account system." />
      <div className="container-site py-12">
        {!favourites.length ? (
          <EmptyState icon={Heart} title="No favourites yet" text="Tap the heart on any bike to save it here." action={<Link to="/bikes" className="btn-primary">Browse bikes</Link>} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((f) => (
              <li key={f.id} className="p-card flex items-center gap-4 p-3">
                <SmartImage src={f.image} alt="" className="h-20 w-28 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Link to={`/bikes/${f.slug}`} className="font-semibold hover:text-ignite-400">{f.name}</Link>
                  <Link to={`/book?bike=${f.id}`} className="mt-1 block text-sm text-fog hover:text-bone">Book a test ride</Link>
                </div>
                <button onClick={() => toggleFavourite(f)} className="btn-icon text-fog hover:bg-white/10 hover:text-bone" aria-label={`Remove ${f.name}`}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function NotFound({ admin = false }) {
  return (
    <div className="container-site py-28 text-center">
      <p className="font-display text-8xl text-ignite">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page took a wrong turn</h1>
      <p className="mt-2 text-fog">The address doesn't match any page.</p>
      <Link to={admin ? '/admin/dashboard' : '/'} className="btn-primary mt-6">{admin ? 'Back to dashboard' : 'Back to home'}</Link>
    </div>
  );
}

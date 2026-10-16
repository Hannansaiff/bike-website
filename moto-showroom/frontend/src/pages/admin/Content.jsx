import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { bikesApi, contentApi } from '../../lib/services';
import { PageHeader } from '../../components/admin/AdminUI';
import { FormFields, buildSchema } from '../../components/admin/CrudPage';
import { DemoNotice, Skeleton } from '../../components/ui/Feedback';
import { FormError, Toggle } from '../../components/ui/Form';
import { Tabs } from '../../components/ui/Navigation';
import { AdminBanners, AdminFaqs, AdminTestimonials } from './Modules';

/** Edits one content section with save / cancel. flatten/unflatten map nested values to form fields. */
function SectionEditor({ section, fields, value, flatten = (v) => v, unflatten = (v) => v, onSaved }) {
  const toast = useToast();
  const initial = useMemo(() => flatten(value || {}), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const form = useForm(initial, buildSchema(fields));
  useEffect(() => form.reset(initial), [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(form.values) !== JSON.stringify(initial);
  const save = form.submit(async (v) => {
    await contentApi.updateSection(section, unflatten(v));
    toast.success('Saved – the public website now shows this change');
    onSaved();
  });
  return (
    <form onSubmit={save} noValidate className="a-card space-y-5 p-5">
      <FormError message={form.formError} />
      <FormFields fields={fields} form={form} />
      <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
        <button type="button" className="a-btn" disabled={!dirty || form.submitting} onClick={() => form.reset(initial)}>Cancel changes</button>
        <button className="btn-primary" disabled={!dirty || form.submitting}>{form.submitting ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  );
}

const HOME_SECTION_LABELS = {
  highlights: 'Highlight counters', featured: 'Featured motorcycles', banners: 'Promotional banners', latest: 'New arrivals',
  offers: 'Offers', best_sellers: 'Best sellers', electric: 'Electric bikes', scooters: 'Scooters', used: 'Pre-owned bikes',
  brands: 'Brands', testimonials: 'Testimonials', faqs: 'FAQs',
};

export default function AdminContent() {
  const { content, refresh, loading } = useSite();
  const toast = useToast();
  const [tab, setTab] = useState('hero');
  const bikes = useApi(() => bikesApi.list({ admin: true, page_size: 100, sort: 'name' }), []);
  const [featured, setFeatured] = useState([]);
  const [sections, setSections] = useState({});
  useEffect(() => { if (content) { setFeatured(content.featured_bike_ids || []); setSections(content.home_sections || {}); } }, [content]);

  if (loading || !content) return <Skeleton className="h-96" />;

  const saveRaw = async (section, value, msg = 'Saved – changes are live on the website') => {
    try { await contentApi.updateSection(section, value); toast.success(msg); refresh(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader title="Website content" description="Everything here appears on the public site immediately after saving."
        actions={<a href="/" target="_blank" rel="noreferrer" className="a-btn"><ExternalLink className="h-4 w-4" /> Open website</a>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} layoutId="content-tabs" tabs={[
        { value: 'hero', label: 'Hero' }, { value: 'home', label: 'Homepage' }, { value: 'banners', label: 'Banners' },
        { value: 'about', label: 'About' }, { value: 'contact', label: 'Contact & hours' }, { value: 'social', label: 'Social & footer' },
        { value: 'testimonials', label: 'Testimonials' }, { value: 'faqs', label: 'FAQs' },
      ]} />

      {tab === 'hero' && (
        <SectionEditor section="hero" value={content.hero} onSaved={refresh}
          flatten={(h) => ({ ...h, p_label: h.primary_cta?.label, p_link: h.primary_cta?.link, s_label: h.secondary_cta?.label, s_link: h.secondary_cta?.link, t_label: h.tertiary_cta?.label, t_link: h.tertiary_cta?.link })}
          unflatten={(v) => ({ eyebrow: v.eyebrow || '', title: v.title, highlight: v.highlight || '', subtitle: v.subtitle || '', image: v.image || '',
            primary_cta: { label: v.p_label, link: v.p_link }, secondary_cta: { label: v.s_label, link: v.s_link }, tertiary_cta: { label: v.t_label, link: v.t_link } })}
          fields={[
            { name: 'eyebrow', label: 'Small line above title', full: true },
            { name: 'title', label: 'Headline', required: true, minLength: 3, full: true },
            { name: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2 },
            { name: 'image', label: 'Background image', type: 'image' },
            { name: 'p_label', label: 'Primary button label', required: true }, { name: 'p_link', label: 'Primary button link', required: true },
            { name: 's_label', label: 'Second button label', required: true }, { name: 's_link', label: 'Second button link', required: true },
            { name: 't_label', label: 'Third button label', required: true }, { name: 't_link', label: 'Third button link', required: true },
          ]} />
      )}

      {tab === 'home' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="a-card p-5">
            <h2 className="font-bold">Homepage sections</h2>
            <p className="text-sm text-zinc-500 dark:text-fog">Turn sections on or off.</p>
            <div className="mt-4 space-y-3">
              {Object.entries(HOME_SECTION_LABELS).map(([k, label]) => (
                <Toggle key={k} label={label} checked={sections[k] !== false} onChange={(v) => setSections((s) => ({ ...s, [k]: v }))} />
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="a-btn" onClick={() => setSections(content.home_sections)}>Cancel</button>
              <button className="btn-primary" onClick={() => saveRaw('home_sections', sections)}>Save sections</button>
            </div>
          </section>
          <section className="a-card p-5">
            <h2 className="font-bold">Featured motorcycles</h2>
            <p className="text-sm text-zinc-500 dark:text-fog">Pick up to 8, shown in the order selected.</p>
            <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
              {(bikes.data || []).map((b) => {
                const idx = featured.indexOf(b.id);
                return (
                  <li key={b.id}>
                    <label className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-white/5">
                      <input type="checkbox" className="accent-[#ff5b1f]" checked={idx >= 0} disabled={idx < 0 && featured.length >= 8}
                        onChange={() => setFeatured((f) => (idx >= 0 ? f.filter((x) => x !== b.id) : [...f, b.id]))} />
                      <span className="flex-1">{b.name}</span>
                      {idx >= 0 && <span className="font-cond text-xs font-bold text-ignite">#{idx + 1}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button className="a-btn" onClick={() => setFeatured(content.featured_bike_ids)}>Cancel</button>
              <button className="btn-primary" onClick={() => saveRaw('featured_bike_ids', featured)}>Save featured</button>
            </div>
          </section>
          <div className="xl:col-span-2">
            <h2 className="mb-2 font-bold">Highlight counters</h2>
            <SectionEditor section="highlights" value={content.highlights} onSaved={refresh}
              flatten={(list) => Object.fromEntries(list.slice(0, 4).flatMap((h, i) => [[`l${i}`, h.label], [`v${i}`, h.value], [`s${i}`, h.suffix]]))}
              unflatten={(v) => [0, 1, 2, 3].filter((i) => v[`l${i}`]).map((i) => ({ label: v[`l${i}`], value: Number(v[`v${i}`]) || 0, suffix: v[`s${i}`] || '' }))}
              fields={[0, 1, 2, 3].flatMap((i) => [
                { name: `l${i}`, label: `Counter ${i + 1} label` },
                { name: `v${i}`, label: `Counter ${i + 1} value`, type: 'number', min: 0 },
                { name: `s${i}`, label: `Counter ${i + 1} suffix`, placeholder: 'e.g. +', full: true },
              ])} />
          </div>
          <div className="xl:col-span-2">
            <h2 className="mb-2 font-bold">Showroom introduction</h2>
            <SectionEditor section="intro" value={content.intro} onSaved={refresh}
              fields={[{ name: 'title', label: 'Title', required: true, minLength: 3, full: true }, { name: 'text', label: 'Text', type: 'textarea' }]} />
          </div>
        </div>
      )}

      {tab === 'banners' && <AdminBanners />}
      {tab === 'testimonials' && <AdminTestimonials />}
      {tab === 'faqs' && <AdminFaqs />}

      {tab === 'about' && (
        <SectionEditor section="about" value={content.about} onSaved={refresh} fields={[
          { name: 'title', label: 'Page title', required: true, minLength: 3, full: true },
          { name: 'story', label: 'Our story', type: 'textarea', rows: 6 },
          { name: 'mission', label: 'Mission', type: 'textarea', rows: 2 },
          { name: 'vision', label: 'Vision', type: 'textarea', rows: 2 },
          { name: 'image', label: 'Image', type: 'image' },
        ]} />
      )}

      {tab === 'contact' && (
        <>
          <DemoNotice className="mb-4">Use the real showroom address only once confirmed. The map stays a labelled placeholder until you paste a Google Maps embed URL.</DemoNotice>
          <SectionEditor section="contact" value={content.contact} onSaved={refresh}
            flatten={(c) => ({ ...c, phones: c.phones || [], hours_text: (c.hours || []).map((h) => `${h.day} | ${h.time}`) })}
            unflatten={(v) => ({
              phones: (v.phones || []).map((s) => s.trim()).filter(Boolean), whatsapp: v.whatsapp || '', email: v.email || '', address: v.address || '',
              city: v.city || '', map_embed_url: v.map_embed_url || '', map_query: v.map_query || '',
              hours: (v.hours_text || []).map((l) => l.split('|')).filter((p) => p[0]?.trim() && p[1]?.trim()).map(([day, time]) => ({ day: day.trim(), time: time.trim() })),
            })}
            fields={[
              { name: 'address', label: 'Address', full: true }, { name: 'city', label: 'City' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'whatsapp', label: 'WhatsApp number (international, digits only)', validate: (v) => (v && !/^\d{10,15}$/.test(v) ? 'Digits only, e.g. 923001234567' : '') },
              { name: 'map_query', label: 'Directions search text', hint: 'Used for the Get directions button' },
              { name: 'phones', label: 'Phone numbers', type: 'list', rows: 2 },
              { name: 'hours_text', label: 'Opening hours', type: 'list', rows: 3, hint: 'One per line as: Day | Time' },
              { name: 'map_embed_url', label: 'Google Maps embed URL', full: true, placeholder: 'https://www.google.com/maps/embed?pb=…',
                validate: (v) => (v && !/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(v) ? 'Must start with https://www.google.com/maps/embed' : '') },
            ]} />
        </>
      )}

      {tab === 'social' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <h2 className="mb-2 font-bold">Social links</h2>
            <SectionEditor section="social" value={content.social} onSaved={refresh}
              fields={['facebook', 'instagram', 'youtube', 'tiktok', 'twitter'].map((n) => ({ name: n, label: n[0].toUpperCase() + n.slice(1), type: 'url', full: true }))} />
          </div>
          <div>
            <h2 className="mb-2 font-bold">Footer</h2>
            <SectionEditor section="footer" value={content.footer} onSaved={refresh}
              fields={[{ name: 'text', label: 'Footer text', type: 'textarea', rows: 3 }, { name: 'copyright', label: 'Copyright name', full: true }]} />
          </div>
        </div>
      )}
    </div>
  );
}

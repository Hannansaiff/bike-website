import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useSite } from '../../context/SiteContext';
import { bikesApi } from '../../lib/services';
import { BikeGrid } from '../../components/public/BikeCard';
import { PageHero } from '../../components/public/PublicBits';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Navigation';
import { SmartImage } from '../../components/ui/Media';
import { cn, formatPKR } from '../../lib/format';

const SORTS = [
  { value: 'latest', label: 'Latest arrivals' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];
const CC_RANGES = [
  { value: '', label: 'Any engine' },
  { value: '0-0', label: 'Electric (no engine)' },
  { value: '1-110', label: 'Up to 110 cc' },
  { value: '111-200', label: '111–200 cc' },
  { value: '201-400', label: '201–400 cc' },
  { value: '401-3000', label: '400 cc +' },
];
const FILTER_KEYS = ['q', 'category', 'brand', 'min_price', 'max_price', 'cc', 'fuel_type', 'condition', 'model_year', 'availability'];

function FilterPanel({ get, set, meta, lockCategory }) {
  const sel = 'p-input';
  return (
    <div className="space-y-4">
      {!lockCategory && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Category</span>
          <select className={sel} value={get('category')} onChange={(e) => set('category', e.target.value)}>
            <option value="">All categories</option>
            {meta?.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Brand</span>
        <select className={sel} value={get('brand')} onChange={(e) => set('brand', e.target.value)}>
          <option value="">All brands</option>
          {meta?.brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1.5 font-medium">Price (PKR)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input className={sel} type="number" min="0" inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={get('min_price')} onChange={(e) => set('min_price', e.target.value)} />
          <input className={sel} type="number" min="0" inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={get('max_price')} onChange={(e) => set('max_price', e.target.value)} />
        </div>
        {meta && <p className="mt-1 text-xs text-fog">Range {formatPKR(meta.price_range[0])} – {formatPKR(meta.price_range[1])}</p>}
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Engine capacity</span>
        <select className={sel} value={get('cc')} onChange={(e) => set('cc', e.target.value)}>
          {CC_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Fuel type</span>
        <select className={sel} value={get('fuel_type')} onChange={(e) => set('fuel_type', e.target.value)}>
          <option value="">Any fuel</option>
          {meta?.fuel_types.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1.5 font-medium">Condition</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 p-1">
          {[['', 'Any'], ['new', 'New'], ['used', 'Used']].map(([v, l]) => (
            <button key={l} type="button" onClick={() => set('condition', v)} aria-pressed={get('condition') === v}
              className={cn('rounded-md py-1.5 text-sm font-medium', get('condition') === v ? 'bg-bone text-carbon' : 'text-fog hover:text-bone')}>
              {l}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Model year</span>
        <select className={sel} value={get('model_year')} onChange={(e) => set('model_year', e.target.value)}>
          <option value="">Any year</option>
          {meta?.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Availability</span>
        <select className={sel} value={get('availability')} onChange={(e) => set('availability', e.target.value)}>
          <option value="">Any status</option>
          {meta?.availability.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </label>
    </div>
  );
}

/** Catalogue – also used for category pages (/categories/:slug). */
export default function Bikes() {
  const { slug } = useParams();
  const { categories } = useSite();
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const get = (k) => params.get(k) || '';
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v === '' || v === null || v === undefined) next.delete(k);
    else next.set(k, v);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const [search, setSearch] = useState(get('q'));
  const dq = useDebounce(search);
  useEffect(() => {
    if (dq !== get('q')) set('q', dq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const category = slug ? categories.find((c) => c.slug === slug) : null;
  const meta = useApi(() => bikesApi.filters(), []);
  const [minCc, maxCc] = (get('cc') || '-').split('-');
  const query = {
    q: get('q'), category: slug || get('category'), brand: get('brand'), min_price: get('min_price'), max_price: get('max_price'),
    min_cc: minCc, max_cc: maxCc, fuel_type: get('fuel_type'), condition: get('condition'), model_year: get('model_year'),
    availability: get('availability'), sort: get('sort') || 'latest', page: get('page') || 1, page_size: 12,
  };
  const { data, meta: pageMeta, loading, error, reload } = useApi(() => bikesApi.list(query), [params.toString(), slug]);

  const active = useMemo(
    () => FILTER_KEYS.filter((k) => get(k) && !(slug && k === 'category')).map((k) => {
      let label = get(k);
      if (k === 'cc') label = CC_RANGES.find((r) => r.value === label)?.label;
      if (k === 'min_price') label = `From ${formatPKR(label)}`;
      if (k === 'max_price') label = `Up to ${formatPKR(label)}`;
      if (k === 'q') label = `“${label}”`;
      if (k === 'category') label = meta.data?.categories.find((c) => c.slug === label)?.name || label;
      if (k === 'brand') label = meta.data?.brands.find((b) => b.slug === label)?.name || label;
      return { k, label };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.toString(), meta.data]
  );
  const reset = () => {
    setSearch('');
    setParams(get('sort') ? { sort: get('sort') } : {}, { replace: true });
  };

  if (slug && categories.length && !category) {
    return (
      <div className="container-site py-24">
        <EmptyState title="Category not available" text="This category doesn't exist or is currently hidden." action={<Link to="/categories" className="btn-primary">See all categories</Link>} />
      </div>
    );
  }

  return (
    <>
      {category ? (
        <section className="relative overflow-hidden border-b border-white/10 bg-black">
          <SmartImage src={category.image} alt="" className="absolute inset-0 h-full opacity-35" />
          <div className="relative container-site py-16 sm:py-24">
            <Link to="/categories" className="text-sm text-fog hover:text-bone">All categories</Link>
            <h1 className="font-display mt-3 text-4xl sm:text-6xl">{category.name}</h1>
            <p className="mt-4 max-w-xl text-lg text-bone/75">{category.description}</p>
          </div>
        </section>
      ) : (
        <PageHero title="All motorcycles" text="Search the full showroom – new, pre-owned, petrol and electric." />
      )}

      <div className="container-site py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model, brand or keyword" aria-label="Search motorcycles" className="p-input sm:max-w-md"
          />
          <div className="flex gap-2 sm:ml-auto">
            <button className="btn-ghost lg:hidden" onClick={() => setMobileFilters(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters {active.length > 0 && `(${active.length})`}
            </button>
            <select value={get('sort') || 'latest'} onChange={(e) => set('sort', e.target.value)} className="p-input w-auto" aria-label="Sort by">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {active.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {active.map((a) => (
              <button key={a.k} onClick={() => { if (a.k === 'q') setSearch(''); set(a.k, ''); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-ignite/40 bg-ignite/10 px-3 py-1 text-xs font-medium text-ignite-400 hover:bg-ignite/20">
                {a.label} <X className="h-3 w-3" aria-label="remove" />
              </button>
            ))}
            <button onClick={reset} className="text-xs font-semibold text-fog underline-offset-2 hover:text-bone hover:underline">Reset all filters</button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24">
              <FilterPanel get={get} set={set} meta={meta.data} lockCategory={!!slug} />
            </div>
          </aside>
          <div>
            {pageMeta && !loading && <p className="mb-4 text-sm text-fog tabular">{pageMeta.total} motorcycle{pageMeta.total === 1 ? '' : 's'} found</p>}
            {error ? (
              <ErrorState error={error} onRetry={reload} />
            ) : !loading && !data?.length ? (
              <EmptyState icon={SearchX} title="No bikes match these filters" text="Try widening the price range or removing a filter."
                action={<button onClick={reset} className="btn-primary">Reset filters</button>} />
            ) : (
              <BikeGrid bikes={data || []} loading={loading} count={6} className="xl:grid-cols-3" />
            )}
            <Pagination meta={pageMeta} onPage={(p) => { set('page', p); window.scrollTo({ top: 0 }); }} className="mt-8" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilters && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileFilters(false)} />
            <motion.div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-carbon p-5"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.22 }}
              role="dialog" aria-modal="true" aria-label="Filters">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button className="btn-icon hover:bg-white/10" onClick={() => setMobileFilters(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
              </div>
              <FilterPanel get={get} set={set} meta={meta.data} lockCategory={!!slug} />
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={reset}>Reset</button>
                <button className="btn-primary" onClick={() => setMobileFilters(false)}>Show results</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, CalendarCheck, Check, Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';
import { useSite } from '../../context/SiteContext';
import { bikesApi } from '../../lib/services';
import { BikeGrid, PriceTag } from '../../components/public/BikeCard';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { Gallery, Reveal } from '../../components/ui/Media';
import { cn, formatNumber } from '../../lib/format';

const AVAILABILITY_NOTE = {
  available: 'In stock and ready for a test ride or purchase.',
  reserved: 'All remaining units are reserved. Book a visit to join the waiting list.',
  sold: 'Sold out for now. Send an enquiry and we will tell you when new stock arrives.',
  out_of_stock: 'Not currently in stock. Send an enquiry for the next delivery.',
  discontinued: 'This model is discontinued and no longer bookable.',
  upcoming: 'Coming soon. Register interest with a showroom visit or purchase enquiry.',
};

export default function BikeDetail() {
  const { slug } = useParams();
  const { data: bike, loading, error, reload } = useApi(() => bikesApi.get(slug), [slug]);
  const related = useApi(() => bikesApi.related(slug, 4), [slug]);
  const { isFavourite, toggleFavourite, inCompare, toggleCompare } = useShop();
  const { content } = useSite();
  const toast = useToast();

  useEffect(() => {
    if (bike?.id) bikesApi.view(bike.id).catch(() => {});
  }, [bike?.id]);

  if (loading)
    return (
      <div className="container-site grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-40 w-full" /></div>
      </div>
    );
  if (error)
    return (
      <div className="container-site py-20">
        {error.status === 404 ? (
          <EmptyState title="Motorcycle not found" text="It may have been removed or its category is hidden." action={<Link to="/bikes" className="btn-primary">Browse all bikes</Link>} />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );

  const fav = isFavourite(bike.id);
  const cmp = inCompare(bike.id);
  const bookable = !['discontinued'].includes(bike.availability);
  const specs = [
    ['Brand', bike.brand?.name],
    ['Category', bike.category?.name],
    ['Model year', bike.model_year],
    ['Condition', bike.condition === 'used' ? 'Pre-owned' : 'New'],
    ['Engine capacity', bike.fuel_type === 'Electric' ? 'Electric motor' : `${bike.engine_cc} cc`],
    ['Fuel type', bike.fuel_type],
    ['Transmission', bike.transmission],
    [bike.fuel_type === 'Electric' ? 'Range' : 'Mileage', bike.mileage || '—'],
    ['Maximum power', bike.max_power || '—'],
    ...(bike.condition === 'used' ? [['Odometer', `${formatNumber(bike.odometer_km)} km`]] : []),
    ['Warranty', bike.warranty || '—'],
    ['Registration', bike.registration || '—'],
    ['Units in stock', bike.stock?.in_stock ?? 0],
  ];
  const wa = content?.contact?.whatsapp;

  return (
    <>
      <div className="container-site py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-fog">
          <Link to="/bikes" className="hover:text-bone">Bikes</Link>
          <span className="mx-2 text-white/25">/</span>
          {bike.category && <Link to={`/categories/${bike.category.slug}`} className="hover:text-bone">{bike.category.name}</Link>}
          <span className="mx-2 text-white/25">/</span>
          <span className="text-bone">{bike.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <Gallery images={bike.images} alt={bike.name} />
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge kind="availability" value={bike.availability} />
              {bike.condition === 'used' && <span className="rounded-md bg-bone px-2 py-0.5 text-xs font-bold text-carbon">Pre-owned</span>}
              {bike.is_demo && <span className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-fog">Demo listing – illustrative specs</span>}
            </div>
            <p className="mt-4 text-sm text-fog">{bike.brand?.name}</p>
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">{bike.name}</h1>
            <PriceTag pricing={bike.pricing} size="lg" className="mt-6" />
            {bike.pricing?.perks?.map((p) => (
              <p key={p.id} className="mt-2 text-sm text-ignite-400">Includes: {p.title}{p.is_demo && ' (sample offer)'}</p>
            ))}
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-bone/80">{AVAILABILITY_NOTE[bike.availability]}</p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {bookable ? (
                <>
                  <Link to={`/book?bike=${bike.id}&type=${bike.availability === 'upcoming' ? 'purchase_enquiry' : 'test_ride'}`} className="btn-primary py-3">
                    <CalendarCheck className="h-4 w-4" /> {bike.availability === 'upcoming' ? 'Register interest' : 'Book a test ride'}
                  </Link>
                  <Link to={`/book?bike=${bike.id}&type=purchase_enquiry`} className="btn-light py-3">Enquire to buy</Link>
                </>
              ) : (
                <Link to="/bikes" className="btn-light py-3 sm:col-span-2">See available alternatives</Link>
              )}
              <button
                onClick={() => toast.success(toggleFavourite(bike) ? 'Saved to favourites' : 'Removed from favourites')}
                className={cn('btn-ghost', fav && 'border-ignite text-ignite')} aria-pressed={fav}
              >
                <Heart className={cn('h-4 w-4', fav && 'fill-current')} /> {fav ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => { if (toggleCompare(bike) === 'full') toast.info('Compare holds up to 3 bikes.'); }}
                className={cn('btn-ghost', cmp && 'border-ignite text-ignite')} aria-pressed={cmp}
              >
                {cmp ? <Check className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />} {cmp ? 'In compare' : 'Compare'}
              </button>
            </div>
            {wa && (
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I'm interested in the ${bike.name}`)}`} target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-fog hover:text-bone">
                <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
              </a>
            )}

            {bike.colors?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold">Colours</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {bike.colors.map((c) => <li key={c} className="rounded-full border border-white/15 px-3 py-1 text-xs">{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <h2 className="text-2xl font-bold">Specifications</h2>
            <dl className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              {specs.map(([k, v], i) => (
                <div key={k} className={cn('grid grid-cols-2 gap-4 px-5 py-3 text-sm', i % 2 ? 'bg-white/[0.02]' : '')}>
                  <dt className="text-fog">{k}</dt>
                  <dd className="font-cond font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal>
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="mt-4 leading-relaxed text-bone/80">{bike.description}</p>
            {bike.features?.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {bike.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm"><ShieldCheck className="h-4 w-4 shrink-0 text-ignite" />{f}</li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </div>

      {related.data?.length > 0 && (
        <section className="container-site py-12">
          <h2 className="font-display mb-8 text-3xl">You might also like</h2>
          <BikeGrid bikes={related.data} loading={related.loading} count={4} />
        </section>
      )}
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, CalendarCheck, ChevronDown, Star, Wrench, Zap } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useApi } from '../../hooks/useApi';
import { bannersApi, bikesApi, faqsApi, offersApi, testimonialsApi } from '../../lib/services';
import { BikeGrid } from '../../components/public/BikeCard';
import { SectionHeader } from '../../components/public/PublicBits';
import { AnimatedCounter, Reveal, SmartImage } from '../../components/ui/Media';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import { cn, formatDate } from '../../lib/format';

/* Tachometer strip – the hero's one orchestrated motion moment. */
function Tachometer() {
  const reduce = useReducedMotion();
  const ticks = Array.from({ length: 49 }, (_, i) => i); // 0–12k rpm in 250 steps
  return (
    <div className="relative mt-10 max-w-xl" aria-hidden>
      <svg viewBox="0 0 480 46" className="w-full">
        {ticks.map((i) => {
          const x = 4 + i * 9.7;
          const major = i % 4 === 0;
          const red = i >= 40;
          return (
            <line key={i} x1={x} x2={x} y1={major ? 4 : 12} y2={26} stroke={red ? '#e5172f' : 'rgba(244,244,241,0.45)'} strokeWidth={major ? 2 : 1} />
          );
        })}
        {ticks.filter((i) => i % 4 === 0).map((i) => (
          <text key={`t${i}`} x={4 + i * 9.7} y={42} fontSize="10" textAnchor="middle" fill={i >= 40 ? '#e5172f' : '#9a9ea8'} fontFamily="Archivo">
            {i / 4}
          </text>
        ))}
      </svg>
      <motion.div
        className="absolute left-[0.8%] top-0 h-[26px] w-[3px] rounded bg-ignite shadow-[0_0_12px_#ff5b1f]"
        initial={{ left: '0.8%' }}
        animate={{ left: reduce ? '80%' : ['0.8%', '86%', '78%'] }}
        transition={{ duration: 1.6, delay: 0.3, ease: [0.3, 0.9, 0.3, 1], times: [0, 0.7, 1] }}
      />
      <p className="mt-1 text-xs text-fog">rpm × 1000</p>
    </div>
  );
}

function Hero({ hero }) {
  if (!hero) return <Skeleton className="h-[80vh] rounded-none" />;
  return (
    <section className="relative isolate overflow-hidden bg-black">
      <div className="absolute inset-0 -z-10 lg:left-[38%]">
        <SmartImage src={hero.image} alt="" eager className="h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10 lg:via-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
      <div className="container-site flex min-h-[78vh] flex-col justify-center py-20">
        {hero.eyebrow && <p className="mb-5 text-sm font-medium text-ignite-400">{hero.eyebrow}</p>}
        <motion.h1
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display max-w-3xl text-5xl sm:text-7xl xl:text-8xl"
        >
          {hero.title}
        </motion.h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/75">{hero.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={hero.primary_cta?.link || '/bikes'} className="btn-primary px-6 py-3 text-base">{hero.primary_cta?.label}</Link>
          <Link to={hero.secondary_cta?.link || '/book'} className="btn-light px-6 py-3 text-base">{hero.secondary_cta?.label}</Link>
          <Link to={hero.tertiary_cta?.link || '/contact'} className="btn-ghost px-6 py-3 text-base">{hero.tertiary_cta?.label}</Link>
        </div>
        <Tachometer />
      </div>
    </section>
  );
}

function BikeSection({ title, text, params, link }) {
  const { data, loading, error, reload } = useApi(() => bikesApi.list({ page_size: 4, ...params }), [JSON.stringify(params)]);
  if (!loading && !error && !data?.length) return null;
  return (
    <section className="container-site py-14">
      <Reveal><SectionHeader title={title} text={text} link={link} /></Reveal>
      {error ? <ErrorState error={error} onRetry={reload} /> : <BikeGrid bikes={data || []} loading={loading} count={4} />}
    </section>
  );
}

function FeaturedSection({ ids }) {
  const { data, loading } = useApi(() => bikesApi.list({ ids: ids.join(','), page_size: 8 }), [ids.join(',')], { enabled: ids.length > 0 });
  if (!ids.length) return null;
  const ordered = (data || []).slice().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return (
    <section className="container-site py-16">
      <Reveal><SectionHeader title="Featured machines" text="Hand-picked by our team this month." link="/bikes" linkLabel="Browse all bikes" /></Reveal>
      <BikeGrid bikes={ordered} loading={loading} count={4} />
    </section>
  );
}

function Highlights({ items }) {
  return (
    <section className="border-y border-white/10 bg-black/40">
      <div className="container-site grid grid-cols-2 gap-px lg:grid-cols-4">
        {items.map((h) => (
          <div key={h.label} className="px-4 py-10 text-center">
            <AnimatedCounter value={h.value} suffix={h.suffix} className="font-display block text-4xl text-bone sm:text-5xl" />
            <p className="mt-2 text-sm text-fog">{h.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BrandStrip() {
  const { brands } = useSite();
  if (!brands.length) return null;
  return (
    <section className="container-site py-14">
      <Reveal><SectionHeader title="Brands on our floor" text="Fictional demo brands – replace them with your real line-up in the admin panel." /></Reveal>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            to={`/bikes?brand=${b.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-white/10 px-4 py-4 transition-colors hover:border-white/30 hover:bg-white/[0.03]"
          >
            <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm text-white" style={{ background: b.color }}>
              {b.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{b.name}</span>
              <span className="block truncate text-xs text-fog">{b.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OffersSection() {
  const { data } = useApi(() => offersApi.list({ public: true, page_size: 3 }), []);
  const offers = (data || []).filter((o) => o.highlight).slice(0, 3);
  if (!offers.length) return null;
  return (
    <section className="container-site py-14">
      <Reveal><SectionHeader title="Deals running now" text="Offer status updates automatically from its start and end dates." link="/offers" linkLabel="All offers" /></Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {offers.map((o, i) => (
          <Reveal key={o.id} delay={i * 0.06}>
            <Link to="/offers" className="group relative block h-full overflow-hidden rounded-2xl border border-white/10">
              <SmartImage src={o.banner} alt="" className="aspect-[16/10]" zoom />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs text-bone/70">{o.label} · ends {formatDate(o.end_date)}</p>
                <h3 className="mt-1 text-xl font-bold">{o.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-bone/70">{o.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BannerSection() {
  const { data } = useApi(() => bannersApi.list({ public: true }), []);
  const banners = data || [];
  if (!banners.length) return null;
  return (
    <section className="container-site grid gap-5 py-6 md:grid-cols-2">
      {banners.map((b) => (
        <Reveal key={b.id}>
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <SmartImage src={b.image} alt="" className="aspect-[21/9]" />
            <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/90 to-black/10 p-6 sm:p-8">
              <h3 className="font-display max-w-xs text-2xl sm:text-3xl">{b.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-bone/75">{b.subtitle}</p>
              {b.cta_label && <Link to={b.cta_link || '/bikes'} className="btn-light btn-sm mt-4 self-start">{b.cta_label}</Link>}
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

function WhyUs({ intro }) {
  const points = [
    [CalendarCheck, 'Book online, ride the same week', 'Pick a slot for a test ride or showroom visit and track it with your booking reference.'],
    [BadgeCheck, 'Inspected pre-owned bikes', 'Every used listing carries an inspection note and transparent pricing.'],
    [Wrench, 'Registration & after-sales', 'Paperwork help, first-service reminders and genuine parts support.'],
    [Zap, 'Electric range explained', 'Ask about charging, battery care and running costs before you buy.'],
  ];
  return (
    <section className="container-site grid gap-10 py-20 lg:grid-cols-[1fr_1.2fr]">
      <Reveal>
        <h2 className="font-display text-3xl sm:text-4xl">{intro?.title}</h2>
        <p className="mt-4 max-w-md text-fog">{intro?.text}</p>
        <Link to="/about" className="btn-ghost mt-6">About the showroom</Link>
      </Reveal>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
        {points.map(([Icon, t, d]) => (
          <div key={t} className="bg-carbon p-6">
            <Icon className="h-6 w-6 text-ignite" />
            <h3 className="mt-4 font-bold">{t}</h3>
            <p className="mt-1.5 text-sm text-fog">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const { data } = useApi(() => testimonialsApi.list({ public: true }), []);
  if (!data?.length) return null;
  return (
    <section className="bg-black/40 py-20">
      <div className="container-site">
        <Reveal><SectionHeader title="Riders on riding with us" text="Sample testimonials for demonstration." /></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {data.slice(0, 3).map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <figure className="p-card h-full p-6">
                <div className="flex gap-0.5 text-ignite" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} className={cn('h-4 w-4', k < t.rating ? 'fill-current' : 'opacity-25')} />)}
                </div>
                <blockquote className="mt-4 text-bone/85">“{t.text}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-fog">, {t.city}{t.bike_label && ` – rides a ${t.bike_label}`}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqList({ limit }) {
  const { data } = useApi(() => faqsApi.list({ public: true }), []);
  const [open, setOpen] = useState(null);
  const faqs = (data || []).slice(0, limit || undefined);
  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id}>
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : f.id)}
            >
              {f.question}
              <ChevronDown className={cn('h-5 w-5 shrink-0 text-fog transition-transform', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-fog">{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { content } = useSite();
  const s = content?.home_sections || {};
  return (
    <>
      <Hero hero={content?.hero} />
      {s.highlights !== false && content?.highlights && <Highlights items={content.highlights} />}
      {s.featured !== false && <FeaturedSection ids={content?.featured_bike_ids || []} />}
      {s.banners !== false && <BannerSection />}
      {s.latest !== false && <BikeSection title="New arrivals" text="The latest models added to the showroom." params={{ sort: 'latest', condition: 'new', availability: 'available,reserved' }} link="/bikes?sort=latest" />}
      {s.offers !== false && <OffersSection />}
      {s.best_sellers !== false && <BikeSection title="Best sellers" text="Ranked by showroom sales, bookings and views." params={{ sort: 'popular' }} link="/bikes?sort=popular" />}
      {s.electric !== false && <BikeSection title="Electric" text="Quiet, quick and cheap to run." params={{ category: 'electric' }} link="/categories/electric" />}
      {s.scooters !== false && <BikeSection title="Scooters and scooties" text="Automatic and easy for the city." params={{ category: 'scooter,scooty' }} link="/categories/scooter" />}
      {s.used !== false && <BikeSection title="Pre-owned, inspected" text="Great value on bikes that have been checked over." params={{ condition: 'used' }} link="/categories/used" />}
      {s.brands !== false && <BrandStrip />}
      <WhyUs intro={content?.intro} />
      {s.testimonials !== false && <Testimonials />}
      {s.faqs !== false && (
        <section className="container-site grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">Questions riders ask</h2>
            <p className="mt-4 text-fog">Still unsure? Send us a message and the team will reply.</p>
            <Link to="/contact" className="btn-ghost mt-6">Contact the showroom</Link>
          </div>
          <FaqList limit={6} />
        </section>
      )}
    </>
  );
}

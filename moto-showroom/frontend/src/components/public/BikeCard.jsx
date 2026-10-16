import { Link } from 'react-router-dom';
import { ArrowLeftRight, Check, Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';
import { cn, formatPKR } from '../../lib/format';
import { Skeleton, StatusBadge, Tooltip } from '../ui/Feedback';
import { SmartImage } from '../ui/Media';

export function PriceTag({ pricing, size = 'md', className }) {
  if (!pricing) return null;
  const big = size === 'lg';
  return (
    <div className={className}>
      <p className={cn('font-cond font-bold text-bone', big ? 'text-4xl' : 'text-xl')}>{formatPKR(pricing.final_price)}</p>
      {pricing.discount > 0 && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fog">
          <span className="line-through tabular">{formatPKR(pricing.price)}</span>
          <span className="font-semibold text-ignite-400 tabular">Save {formatPKR(pricing.discount)}</span>
          <span>{pricing.offer?.is_demo ? 'Sample offer' : 'Configured offer'}</span>
        </p>
      )}
    </div>
  );
}

/** Spec plate: the key three numbers, set in the condensed face. */
export function SpecPlate({ bike, className }) {
  const items = [
    bike.fuel_type === 'Electric' ? ['Motor', 'Electric'] : ['Engine', `${bike.engine_cc} cc`],
    ['Gearbox', bike.transmission?.replace(' Manual', '').replace('Single-Speed ', '') || '—'],
    ['Year', bike.model_year],
  ];
  return (
    <dl className={cn('grid grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/10 bg-black/30', className)}>
      {items.map(([k, v]) => (
        <div key={k} className="px-2.5 py-2">
          <dt className="text-[11px] text-fog">{k}</dt>
          <dd className="font-cond truncate text-sm font-semibold text-bone">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function BikeCard({ bike }) {
  const { isFavourite, toggleFavourite, inCompare, toggleCompare } = useShop();
  const toast = useToast();
  const fav = isFavourite(bike.id);
  const cmp = inCompare(bike.id);

  const onFav = () => {
    const added = toggleFavourite(bike);
    toast.success(added ? `${bike.name} saved to favourites` : `${bike.name} removed from favourites`);
  };
  const onCompare = () => {
    const r = toggleCompare(bike);
    if (r === 'full') toast.info('You can compare up to 3 bikes. Remove one from the compare tray first.');
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-graphite transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="relative">
        <SmartImage src={bike.image} alt={bike.name} className="aspect-[4/3]" zoom />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusBadge kind="availability" value={bike.availability} className="bg-black/70 backdrop-blur" />
          {bike.condition === 'used' && <span className="rounded-md bg-bone px-2 py-0.5 text-xs font-bold text-carbon">Pre-owned</span>}
        </div>
        {bike.pricing?.discount > 0 && (
          <span className="absolute bottom-3 left-3 rounded-md bg-ignite px-2 py-0.5 text-xs font-bold text-white tabular">
            −{bike.pricing.discount_percent}%
          </span>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            onClick={onFav}
            aria-pressed={fav}
            aria-label={fav ? `Remove ${bike.name} from favourites` : `Save ${bike.name} to favourites`}
            className={cn(
              'btn-icon relative z-10 backdrop-blur',
              fav ? 'bg-ignite text-white' : 'bg-black/55 text-white hover:bg-black/75'
            )}
          >
            <Heart className={cn('h-4 w-4', fav && 'fill-current')} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-fog">
          {bike.brand?.name} <span className="text-white/25">/</span> {bike.category?.name}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-bone">
          <Link to={`/bikes/${bike.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {bike.name}
          </Link>
        </h3>
        <SpecPlate bike={bike} className="mt-3" />
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <PriceTag pricing={bike.pricing} />
          <Tooltip label={cmp ? 'Remove from compare' : 'Add to compare'}>
            <button
              onClick={onCompare}
              aria-pressed={cmp}
              aria-label={cmp ? `Remove ${bike.name} from comparison` : `Compare ${bike.name}`}
              className={cn(
                'btn-icon relative z-10 border',
                cmp ? 'border-ignite bg-ignite/15 text-ignite' : 'border-white/15 text-fog hover:border-white/35 hover:text-bone'
              )}
            >
              {cmp ? <Check className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
            </button>
          </Tooltip>
        </div>
      </div>
    </article>
  );
}

export function BikeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-graphite">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

export function BikeGrid({ bikes, loading, count = 8, className }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: count }).map((_, i) => <BikeCardSkeleton key={i} />)
        : bikes.map((b) => <BikeCard key={b.id} bike={b} />)}
    </div>
  );
}

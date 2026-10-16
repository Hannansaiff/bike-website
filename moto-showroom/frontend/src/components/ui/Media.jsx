import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, FALLBACK_IMAGE } from '../../lib/format';

/** Image with lazy loading, a skeleton while loading and a local fallback on error. */
export function SmartImage({ src, alt, className, imgClassName, zoom = false, eager = false }) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(!src);
    setLoaded(false);
  }, [src]);
  return (
    <div className={cn('relative overflow-hidden bg-graphite', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/[0.04]" aria-hidden />}
      <img
        src={failed ? FALLBACK_IMAGE : src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
        className={cn(
          'h-full w-full object-cover transition duration-700 ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
          zoom && 'group-hover:scale-[1.06]',
          imgClassName
        )}
      />
    </div>
  );
}

/** Scroll reveal – a gentle fade/lift, played once. Respects reduced motion. */
export function Reveal({ children, delay = 0, className, as = 'div' }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Counts up to `value` when scrolled into view. */
export function AnimatedCounter({ value, suffix = '', className, format = (n) => Math.round(n).toLocaleString() }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value, { duration: 1.4, ease: 'easeOut', onUpdate: setDisplay });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={className}>
      {format(display)}
      {suffix}
    </span>
  );
}

/** Large product gallery with thumbnails and keyboard arrows. */
export function Gallery({ images = [], alt }) {
  const list = images.length ? images : [FALLBACK_IMAGE];
  const [index, setIndex] = useState(0);
  const go = (d) => setIndex((i) => (i + d + list.length) % list.length);
  return (
    <div>
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
        tabIndex={0}
        role="region"
        aria-label={`${alt} image gallery, use arrow keys to browse`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
      >
        <motion.div key={index} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="h-full">
          <SmartImage src={list[index]} alt={`${alt} – image ${index + 1}`} className="h-full" zoom eager />
        </motion.div>
        {list.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="btn-icon absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white backdrop-blur hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="btn-icon absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white backdrop-blur hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white tabular">
              {index + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {list.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'overflow-hidden rounded-lg ring-2 transition',
                i === index ? 'ring-ignite' : 'ring-transparent opacity-60 hover:opacity-100'
              )}
            >
              <SmartImage src={img} alt="" className="aspect-[4/3]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

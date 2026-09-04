import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPromotions, recordImpression, type Promotion, type PromoPlacement } from '@/lib/promotions';

type Props = {
  placement: PromoPlacement;
  /** how many promos to render in this slot (default 1) */
  limit?: number;
  className?: string;
};

/**
 * Renders admin-created promotions in a given spot of the app.
 * Renders nothing at all when there is no live promotion for the placement.
 */
export default function PromoSpot({ placement, limit = 1, className = '' }: Props) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [closed, setClosed] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchPromotions(placement);
      if (!alive) return;
      const shown = list.slice(0, limit);
      shown.forEach(p => recordImpression(p.id));
      setPromos(shown);
    })();
    return () => { alive = false; };
  }, [placement, limit]);

  const banners = promos.filter(p => (p.style || 'banner') !== 'popup' && !closed.includes(p.id));
  const popups = promos.filter(p => p.style === 'popup' && !closed.includes(p.id));

  if (banners.length === 0 && popups.length === 0) return null;

  return (
    <>
      {banners.length > 0 && (
        <div className={`space-y-3 ${className}`}>
          {banners.map((p, i) => (
            <PromoBanner key={p.id} promo={p} delay={i * 0.05} onClose={() => setClosed(c => [...c, p.id])} />
          ))}
        </div>
      )}
      <PromoPopup promos={popups} onClose={id => setClosed(c => [...c, id])} />
    </>
  );
}

function open(p: Promotion) {
  if (p.link_url) window.open(p.link_url, '_blank', 'noopener,noreferrer');
}

function PromoBanner({ promo, delay, onClose }: { promo: Promotion; delay: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

      <button
        onClick={onClose}
        aria-label="Dismiss promotion"
        className="absolute right-3 top-3 z-10 rounded-full bg-background/70 p-1.5 text-muted-foreground transition hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        {promo.poster_url && (
          <div className="h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 sm:h-24 sm:w-40">
            <img src={promo.poster_url} alt={promo.title} loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Megaphone className="h-3 w-3" /> {promo.subtitle || 'Sponsored'}
          </span>
          <h3 className="mt-2 font-display text-lg font-bold leading-tight sm:text-xl">{promo.title}</h3>
          {promo.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{promo.description}</p>
          )}
        </div>
        {promo.link_url && (
          <Button onClick={() => open(promo)} className="shrink-0 gap-1.5 rounded-xl">
            {promo.cta_text || 'Learn more'} <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function PromoPopup({ promos, onClose }: { promos: Promotion[]; onClose: (id: string) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);
  const promo = promos[0];

  return (
    <AnimatePresence>
      {ready && promo && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-primary/30 bg-card/95 shadow-2xl backdrop-blur-xl sm:bottom-6"
        >
          <button
            onClick={() => onClose(promo.id)}
            aria-label="Dismiss promotion"
            className="absolute right-2 top-2 z-10 rounded-full bg-background/70 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {promo.poster_url && (
            <img src={promo.poster_url} alt={promo.title} loading="lazy" className="h-28 w-full object-cover" />
          )}
          <div className="space-y-2 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {promo.subtitle || 'Sponsored'}
            </span>
            <h4 className="font-display text-base font-bold leading-tight">{promo.title}</h4>
            {promo.description && <p className="line-clamp-3 text-xs text-muted-foreground">{promo.description}</p>}
            {promo.link_url && (
              <Button size="sm" className="w-full gap-1.5 rounded-xl" onClick={() => open(promo)}>
                {promo.cta_text || 'Learn more'} <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

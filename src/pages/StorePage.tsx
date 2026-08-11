import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ExternalLink, Sparkles, Star, Megaphone, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RankersLoader from '@/components/RankersLoader';

export type AffiliateProduct = {
  id: string; title: string; description: string | null; image_url: string | null;
  store: string; affiliate_url: string; price: string | null; category: string;
  badge: string | null; featured: boolean; active: boolean; sort_order: number;
};

export type Promotion = {
  id: string; title: string; subtitle: string | null; description: string | null;
  poster_url: string | null; link_url: string | null; cta_text: string;
  active: boolean; starts_at: string | null; ends_at: string | null;
};

const liveNow = (p: Promotion) => {
  const now = Date.now();
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
  if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
  return p.active;
};

export default function StorePage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from('affiliate_products').select('*').eq('active', true).order('sort_order').order('created_at', { ascending: false }),
        supabase.from('promotions').select('*').eq('active', true).order('sort_order'),
      ]);
      setProducts((p as AffiliateProduct[]) || []);
      setPromos(((pr as Promotion[]) || []).filter(liveNow));
      setLoading(false);
    })();
  }, []);

  if (loading) return <RankersLoader label="Loading Store" />;

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const term = q.trim().toLowerCase();
  const list = products.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (!term || p.title.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term)));
  const featured = list.filter(p => p.featured);
  const rest = list.filter(p => !p.featured);

  return (
    <div className="space-y-8 pb-24">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 px-5 py-9 backdrop-blur-xl sm:px-9 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Rankers Store
        </span>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Hand-picked books &amp; gear that actually<br className="hidden sm:block" /> move your <span className="text-gradient">rank</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Every item here is recommended by the Rankers Star team. Buying through these links costs you nothing extra and helps keep the platform free forever.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search books, gear, courses..."
            className="h-12 max-w-md rounded-xl" />
        </div>
      </motion.section>

      {promos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">Featured Promotions</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {promos.map(p => (
              <motion.div key={p.id} whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-xl">
                {p.poster_url && (
                  <img src={p.poster_url} alt={p.title} loading="lazy"
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="p-5">
                  {p.subtitle && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{p.subtitle}</p>}
                  <h3 className="mt-1 font-display text-xl font-bold text-foreground">{p.title}</h3>
                  {p.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
                  {p.link_url && (
                    <Button className="mt-4 h-11 gap-2 rounded-full px-6 font-semibold"
                      onClick={() => window.open(p.link_url!, '_blank', 'noopener,noreferrer')}>
                      {p.cta_text} <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 py-20 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-40" />
          <p className="text-lg">Recommendations are being curated</p>
          <p className="text-sm">Check back soon for hand-picked books and study gear.</p>
        </div>
      ) : (
        <>
          {categories.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    cat === c ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 text-muted-foreground hover:text-foreground'}`}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {featured.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <h2 className="font-display text-lg font-bold">Top Picks</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map(p => <ProductCard key={p.id} product={p} highlight />)}
              </div>
            </section>
          )}

          <section className="space-y-4">
            {featured.length > 0 && <h2 className="font-display text-lg font-bold">All Recommendations</h2>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {list.length === 0 && <p className="text-sm text-muted-foreground">Nothing matches that search.</p>}
          </section>
        </>
      )}

      <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Disclosure: some links on this page are affiliate links. Rankers Star may earn a small commission at no extra cost to you.
        Products are sold and shipped by third-party stores such as Amazon and Flipkart.
      </p>
    </div>
  );
}

function ProductCard({ product, highlight }: { product: AffiliateProduct; highlight?: boolean }) {
  return (
    <motion.article whileHover={{ y: -6 }}
      className={`group flex flex-col overflow-hidden rounded-3xl border bg-card/60 backdrop-blur-xl transition-colors ${
        highlight ? 'border-primary/40 shadow-[0_0_45px_-20px_hsl(var(--primary))]' : 'border-border/70 hover:border-primary/30'}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {product.image_url
          ? <img src={product.image_url} alt={product.title} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="grid h-full w-full place-items-center"><ShoppingBag className="h-10 w-10 text-muted-foreground/40" /></div>}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
            {product.badge}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
          {product.store}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-foreground">{product.title}</h3>
        {product.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{product.description}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          {product.price
            ? <span className="font-display text-lg font-bold text-primary">{product.price}</span>
            : <span className="text-xs text-muted-foreground">Check latest price</span>}
          <Button size="sm" className="gap-1.5 rounded-full px-4 font-semibold"
            onClick={() => window.open(product.affiliate_url, '_blank', 'noopener,noreferrer')}>
            Buy now <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

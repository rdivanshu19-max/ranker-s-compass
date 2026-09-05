import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Search, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import RankersLoader from '@/components/RankersLoader';
import { AppLogo } from '@/components/AppMedia';
import { autoPoster, type TestSeries } from '@/lib/testSeries';
import { PRACTICE_PACKS } from '@/lib/practicePacks';
import PracticePackCard from '@/components/PracticePackCard';
import PromoSpot from '@/components/PromoSpot';

export default function TestSeriesPage() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('test_series').select('*').order('sort_order', { ascending: true }),
        supabase.from('test_series_tests').select('series_id'),
      ]);
      setSeries((s as TestSeries[]) || []);
      const c: Record<string, number> = {};
      (t || []).forEach((x: any) => { c[x.series_id] = (c[x.series_id] || 0) + 1; });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => series.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  ), [series, search]);

  if (loading) return <RankersLoader label="Loading Test Series" />;

  return (
    <div className="space-y-9">
      <PromoSpot placement="test_series" />
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 px-5 py-10 backdrop-blur-xl sm:px-9 sm:py-14">
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Test Series Hub
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Practice with the<br /><span className="text-gradient">tests that matter.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Live and upcoming test series from leading institutions, tracked in one place so you never miss an attempt.
          </p>
        </div>
      </motion.section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Featured Practice</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">Infinite practice, real exam tests & guided study</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Curated modules that open right here inside Rankers Star — no signup jumps, no lost tabs.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {PRACTICE_PACKS.map((p, i) => <PracticePackCard key={p.slug} pack={p} index={i} />)}
        </div>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search test series..." className="h-12 rounded-xl pl-9" />
      </div>


      {filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 opacity-40" />
          <p className="text-lg">{search ? 'No test series match your search' : 'No test series yet'}</p>
          <p className="text-sm">New series are added regularly.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.button key={s.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }} whileHover={{ y: -5 }}
              onClick={() => navigate(`/app/test-series/${s.id}`)}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 text-left backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_18px_50px_-22px_hsl(var(--primary)/0.55)]">
              <div className="relative h-28 w-full overflow-hidden"
                style={s.poster_url?.trim() ? undefined : { backgroundImage: autoPoster(s.logo_url || s.name) }}>
                {s.poster_url?.trim() && <img src={s.poster_url} alt={`${s.name} poster`} loading="lazy" className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              </div>
              <div className="relative -mt-8 p-5 pt-0">
                <AppLogo src={s.logo_url} name={s.name} className="h-16 w-16 rounded-2xl border border-border/70 text-xl shadow-lg backdrop-blur" />
                <h2 className="mt-3 font-display text-lg font-bold transition-colors group-hover:text-primary">{s.name}</h2>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {counts[s.id] || 0} test{(counts[s.id] || 0) === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    View Test Series <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

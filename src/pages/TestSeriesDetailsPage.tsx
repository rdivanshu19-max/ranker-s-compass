import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarClock, Play, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { AppLogo } from '@/components/AppMedia';
import { autoPoster, statusInfo, type SeriesTest, type TestSeries } from '@/lib/testSeries';

export default function TestSeriesDetailsPage() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<TestSeries | null>(null);
  const [tests, setTests] = useState<SeriesTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('test_series').select('*').eq('id', seriesId).maybeSingle(),
        supabase.from('test_series_tests').select('*').eq('series_id', seriesId).order('sort_order', { ascending: true }),
      ]);
      setSeries((s as TestSeries) || null);
      setTests((t as SeriesTest[]) || []);
      setLoading(false);
    })();
  }, [seriesId]);

  const counts = useMemo(() => ({
    available: tests.filter(t => t.status === 'available').length,
    upcoming: tests.filter(t => t.status === 'upcoming').length,
  }), [tests]);

  const openTest = (test: SeriesTest) => {
    if (test.status === 'upcoming' || !test.link?.trim()) return;
    setOpening(true);
    setTimeout(() => navigate(`/app/test/${test.id}`), 500);
  };

  if (loading) return <RankersLoader label="Opening Test Series" />;
  if (!series) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-muted-foreground">This test series is no longer available.</p>
        <Button variant="outline" onClick={() => navigate('/app/test-series')}>Back to Test Series Hub</Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <AnimatePresence>
        {opening && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RankersLoader fullScreen label="Opening Test" />
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={() => navigate('/app/test-series')}>
        <ArrowLeft className="h-4 w-4" /> Test Series Hub
      </Button>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xl">
        <div className="relative h-40 w-full sm:h-52"
          style={series.poster_url?.trim() ? undefined : { backgroundImage: autoPoster(series.logo_url || series.name) }}>
          {series.poster_url?.trim() && <img src={series.poster_url} alt={`${series.name} poster`} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
        <div className="relative -mt-14 flex flex-col gap-4 px-5 pb-7 sm:flex-row sm:items-end sm:px-8">
          <AppLogo src={series.logo_url} name={series.name} className="h-20 w-20 shrink-0 rounded-2xl border border-border/70 text-2xl shadow-xl backdrop-blur" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {tests.length} test{tests.length === 1 ? '' : 's'} · {counts.available} live · {counts.upcoming} upcoming
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{series.name}</h1>
            {series.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{series.description}</p>}
          </div>
        </div>
      </motion.section>

      {tests.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No tests have been added to this series yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tests.map((t, i) => {
            const info = statusInfo(t.status);
            const isUpcoming = t.status === 'upcoming';
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`relative overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur-xl transition-all ${
                  isUpcoming ? 'border-border/60 opacity-90' : 'border-border/70 hover:border-primary/50 hover:shadow-[0_16px_44px_-24px_hsl(var(--primary)/0.6)]'
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-display text-lg font-bold leading-tight">{t.name}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${info.className}`}>{info.label}</span>
                </div>
                {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
                {t.scheduled_at && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(t.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
                <Button className="mt-4 w-full gap-2 rounded-xl" variant={isUpcoming ? 'outline' : 'default'}
                  disabled={isUpcoming || !t.link?.trim()} onClick={() => openTest(t)}>
                  {isUpcoming ? <Clock className="h-4 w-4" /> : t.status === 'completed' ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {info.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

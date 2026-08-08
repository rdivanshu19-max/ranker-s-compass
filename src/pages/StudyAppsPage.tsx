import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Search, ArrowRight, AlertTriangle, Heart, Sparkles, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { AppBanner, AppLogo } from '@/components/AppMedia';
import { useFavoriteApps } from '@/hooks/useFavoriteApps';
import type { StudyApp } from '@/lib/studyApps';

export default function StudyAppsPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StudyApp[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { favorites, toggle } = useFavoriteApps();

  useEffect(() => {
    (async () => {
      const [{ data: appData }, { data: portalData }] = await Promise.all([
        supabase.from('study_apps').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('study_portals').select('app_id'),
      ]);
      setApps((appData as StudyApp[]) || []);
      const c: Record<string, number> = {};
      (portalData || []).forEach((p: any) => { c[p.app_id] = (c[p.app_id] || 0) + 1; });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(search.toLowerCase())
  ), [apps, search]);

  const myApps = useMemo(() => apps.filter(a => favorites.includes(a.id)), [apps, favorites]);

  if (loading) return <RankersLoader label="Loading Study Apps" />;

  const Card = ({ app, i }: { app: StudyApp; i: number }) => {
    const fav = favorites.includes(app.id);
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.04, 0.25) }}
        whileHover={{ y: -5 }}
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_18px_50px_-22px_hsl(var(--primary)/0.55)]"
      >
        <button onClick={() => navigate(`/app/apps/${app.id}`)} className="block w-full text-left">
          <AppBanner src={app.banner_url} name={app.name} className="h-28 w-full" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <div className="relative -mt-8 p-5 pt-0">
            <AppLogo src={app.logo_url} name={app.name} className="h-16 w-16 rounded-2xl border border-border/70 text-xl shadow-lg backdrop-blur" />
            <h2 className="mt-3 font-display text-lg font-bold transition-colors group-hover:text-primary">{app.name}</h2>
            {app.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>}
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                {counts[app.id] || 0} portal{(counts[app.id] || 0) === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </button>
        <button
          onClick={() => toggle(app.id)}
          aria-label={fav ? 'Remove from My Apps' : 'Save to My Apps'}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition-all ${
            fav ? 'border-primary/50 bg-primary/20 text-primary' : 'border-border/70 bg-background/70 text-muted-foreground hover:text-primary'
          }`}
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 px-5 py-10 backdrop-blur-xl sm:px-9 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Every coaching app, one place
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Top coaching apps,<br /><span className="text-gradient">unlocked for free.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Rankers Star brings the study apps serious aspirants actually use — their batches, portals and material hubs — organised, rated and ready to open in one tap.
          </p>
        </div>
      </motion.section>

      {/* Search */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Search Apps</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by app name or description..." className="h-12 rounded-xl pl-9" />
        </div>
      </section>

      {/* My Apps */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">My Apps</h2>
          <span className="text-xs text-muted-foreground">({myApps.length})</span>
        </div>
        {myApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <Compass className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="font-semibold">No saved apps yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any app to keep it here for quick access.</p>
            <Button className="mt-4 rounded-xl" onClick={() => document.getElementById('explore-apps')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Study Apps
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myApps.map((a, i) => <Card key={a.id} app={a} i={i} />)}
          </div>
        )}
      </section>

      {/* Explore */}
      <section id="explore-apps" className="space-y-4 scroll-mt-20">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Explore Study Apps</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <LayoutGrid className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg">{search ? 'No apps match your search' : 'No study apps yet'}</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => <Card key={a.id} app={a} i={i} />)}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> We do not own any third-party app or portal. All content belongs to its respective owners and is linked for educational purposes only.
        </p>
      </div>
    </div>
  );
}

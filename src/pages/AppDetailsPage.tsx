import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ExternalLink, BookOpen, Filter, Heart, Quote, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { AppBanner, AppLogo } from '@/components/AppMedia';
import { useFavoriteApps } from '@/hooks/useFavoriteApps';
import { BADGE_KEYS, badgeInfo, portalMatchesCategory, sortPortals, type StudyApp, type StudyPortal } from '@/lib/studyApps';

export default function AppDetailsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<StudyApp | null>(null);
  const [portals, setPortals] = useState<StudyPortal[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [badge, setBadge] = useState('all');
  const [opening, setOpening] = useState(false);
  const { favorites, toggle } = useFavoriteApps();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: p }, { data: c }] = await Promise.all([
        supabase.from('study_apps').select('*').eq('id', appId).maybeSingle(),
        supabase.from('study_portals').select('*').eq('app_id', appId).order('sort_order', { ascending: true }),
        supabase.from('portal_categories').select('name').order('name'),
      ]);
      setApp((a as StudyApp) || null);
      setPortals((p as StudyPortal[]) || []);
      setAllCategories(((c as any[]) || []).map(x => x.name));
      setLoading(false);
    })();
  }, [appId]);

  const categories = useMemo(() => {
    const used = portals.map(p => p.category).filter(Boolean);
    return Array.from(new Set([...used, ...allCategories])).filter(c => c && c !== 'All Categories');
  }, [portals, allCategories]);

  const visible = useMemo(() => sortPortals(portals.filter(p =>
    portalMatchesCategory(p, category) &&
    (badge === 'all' || p.badge === badge) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()))
  )), [portals, category, badge, search]);

  const featured = visible.find(p => p.badge === 'best') || null;
  const rest = featured ? visible.filter(p => p.id !== featured.id) : visible;

  const openPortal = (portal: StudyPortal) => {
    setOpening(true);
    setTimeout(() => navigate(`/app/portal/${portal.id}`), 500);
  };

  if (loading) return <RankersLoader label="Opening App" />;
  if (!app) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-muted-foreground">This app is no longer available.</p>
        <Button onClick={() => navigate('/app/apps')} variant="outline">Back to Study Apps</Button>
      </div>
    );
  }

  const fav = favorites.includes(app.id);

  return (
    <div className="space-y-7">
      <AnimatePresence>
        {opening && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RankersLoader fullScreen label="Opening Portal" />
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={() => navigate('/app/apps')}>
        <ArrowLeft className="h-4 w-4" /> Study Apps
      </Button>

      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xl">
        <AppBanner src={app.banner_url} name={app.name} className="h-40 w-full sm:h-56" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-t from-card via-card/50 to-transparent sm:h-56" />
        <div className="relative -mt-14 flex flex-col gap-4 px-5 pb-7 sm:flex-row sm:items-end sm:px-8">
          <AppLogo src={app.logo_url} name={app.name} className="h-20 w-20 shrink-0 rounded-2xl border border-border/70 text-2xl shadow-xl backdrop-blur" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{portals.length} portals available</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{app.name}</h1>
            {app.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{app.description}</p>}
          </div>
          <Button variant={fav ? 'default' : 'outline'} className="shrink-0 gap-2 rounded-xl" onClick={() => toggle(app.id)}>
            <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} /> {fav ? 'Saved' : 'Save App'}
          </Button>
        </div>
      </motion.section>

      {/* Quote strip */}
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/40 px-4 py-3 backdrop-blur">
        <Quote className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm italic text-muted-foreground">
          Pick a portal, open it inside Rankers Star, and get straight to studying — no hunting for links.
        </p>
      </div>

      {app.courses_included && (
        <div className="rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Courses Included</p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{app.courses_included}</p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search portals..." className="rounded-xl pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Category</span>
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40'}`}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Rating</span>
          {['all', ...BADGE_KEYS].map(b => (
            <button key={b} onClick={() => setBadge(b)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${badge === b ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40'}`}>
              {b === 'all' ? 'All' : `${badgeInfo(b).emoji} ${badgeInfo(b).label}`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No portals match your filters.</p>
      ) : (
        <div className="space-y-6">
          {/* Featured best portal */}
          {featured && (
            <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border-2 border-primary/50 bg-gradient-to-br from-primary/12 via-card/70 to-card/60 p-5 shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.9)] backdrop-blur-xl sm:p-7">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                <AppLogo src={featured.logo_url || app.logo_url} name={featured.name} className="h-16 w-16 shrink-0 rounded-2xl border border-primary/40 text-lg" />
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Crown className="h-3 w-3" /> Best Portal
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold leading-tight sm:text-2xl">{featured.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {featured.description?.trim() || 'Our top recommendation for this app — fastest and most reliable.'}
                  </p>
                  {featured.category && (
                    <span className="mt-2 inline-block rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">{featured.category}</span>
                  )}
                </div>
                <Button size="lg" className="shrink-0 gap-2 rounded-xl" onClick={() => openPortal(featured)}>
                  Enter Portal <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {rest.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">All Portals</h2>
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/50 backdrop-blur-xl">
                {rest.map((p, i) => {
                  const info = badgeInfo(p.badge);
                  const tone =
                    p.badge === 'best' ? 'hover:bg-primary/10' :
                    p.badge === 'recommended' ? 'hover:bg-emerald-500/5' :
                    p.badge === 'good' ? 'hover:bg-sky-500/5' : 'hover:bg-muted/40';
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={`flex items-center gap-3 border-b border-border/60 p-4 transition-colors last:border-b-0 ${tone}`}>
                      <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{String(i + (featured ? 2 : 1)).padStart(2, '0')}</span>
                      <AppLogo src={p.logo_url || app.logo_url} name={p.name} className="h-11 w-11 shrink-0 rounded-xl border border-border/70 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-display font-bold leading-tight">{p.name}</h3>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${info.className}`}>{info.emoji} {info.label}</span>
                        </div>
                        {p.description?.trim() && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
                        {p.category && <p className="mt-0.5 text-[11px] text-muted-foreground">{p.category}</p>}
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 gap-1 rounded-xl" onClick={() => openPortal(p)}>
                        Enter <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

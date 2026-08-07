import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ExternalLink, BookOpen, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { BADGE_KEYS, badgeInfo, sortPortals, type StudyApp, type StudyPortal } from '@/lib/studyApps';

export default function AppDetailsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<StudyApp | null>(null);
  const [portals, setPortals] = useState<StudyPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [badge, setBadge] = useState('all');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from('study_apps').select('*').eq('id', appId).maybeSingle(),
        supabase.from('study_portals').select('*').eq('app_id', appId).order('sort_order', { ascending: true }),
      ]);
      setApp((a as StudyApp) || null);
      setPortals((p as StudyPortal[]) || []);
      setLoading(false);
    })();
  }, [appId]);

  const categories = useMemo(() => Array.from(new Set(portals.map(p => p.category).filter(Boolean))), [portals]);

  const visible = useMemo(() => sortPortals(portals.filter(p =>
    (category === 'all' || p.category === category) &&
    (badge === 'all' || p.badge === badge) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase()))
  )), [portals, category, badge, search]);

  const openPortal = (portal: StudyPortal) => {
    setOpening(true);
    setTimeout(() => navigate(`/app/portal/${portal.id}`), 550);
  };

  if (loading) return <RankersLoader label="Opening App" />;
  if (!app) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground">This app is no longer available.</p>
        <Button onClick={() => navigate('/app/apps')} variant="outline">Back to Study Apps</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>{opening && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RankersLoader fullScreen label="Opening Portal" /></motion.div>}</AnimatePresence>

      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate('/app/apps')}>
        <ArrowLeft className="w-4 h-4" /> Study Apps
      </Button>

      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-border/70 bg-card/60 backdrop-blur-xl">
        <div className="relative h-40 sm:h-52">
          {app.banner_url
            ? <img src={app.banner_url} alt={`${app.name} banner`} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-primary/25 via-primary/5 to-transparent" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
        <div className="relative px-5 sm:px-7 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-20 h-20 rounded-2xl border border-border/70 bg-background/85 backdrop-blur grid place-items-center overflow-hidden shadow-xl shrink-0">
            {app.logo_url
              ? <img src={app.logo_url} alt={`${app.name} logo`} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold font-display text-primary">{app.name.slice(0, 2).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-display">{app.name}</h1>
            {app.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{app.description}</p>}
          </div>
        </div>
      </motion.div>

      {app.courses_included && (
        <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur p-5">
          <p className="flex items-center gap-2 text-sm font-semibold mb-2"><BookOpen className="w-4 h-4 text-primary" /> Courses Included</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{app.courses_included}</p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search portals..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Category</span>
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/60 border-border hover:border-primary/40 text-muted-foreground'}`}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">Rating</span>
          {['all', ...BADGE_KEYS].map(b => (
            <button key={b} onClick={() => setBadge(b)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${badge === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/60 border-border hover:border-primary/40 text-muted-foreground'}`}>
              {b === 'all' ? 'All' : `${badgeInfo(b).emoji} ${badgeInfo(b).label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Portals */}
      {visible.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No portals match your filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((p, i) => {
            const info = badgeInfo(p.badge);
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="group relative rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_16px_44px_-22px_hsl(var(--primary)/0.6)]">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/8 to-transparent pointer-events-none" />
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold font-display leading-tight">{p.name}</h3>
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${info.className}`}>
                      {info.emoji} {info.label}
                    </span>
                  </div>
                  {p.category && (
                    <span className="inline-block text-[11px] px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                      {p.category}
                    </span>
                  )}
                  <Button className="w-full rounded-xl gap-2" onClick={() => openPortal(p)}>
                    Enter Portal <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import RankersLoader from '@/components/RankersLoader';
import type { StudyApp } from '@/lib/studyApps';

export default function StudyAppsPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StudyApp[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <RankersLoader label="Loading Study Apps" />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-primary" /> <span className="text-gradient">Study Apps</span>
        </h1>
        <p className="text-muted-foreground mt-1">Every study platform and its portals, all inside Rankers Star.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." className="pl-9 rounded-xl" />
      </motion.div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> We do not own any third-party app or portal. All content belongs to its respective owners and is linked for educational purposes only.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{search ? 'No apps match your search' : 'No study apps yet'}</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((app, i) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/app/apps/${app.id}`)}
              className="group relative text-left rounded-2xl overflow-hidden border border-border/70 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-[0_18px_50px_-20px_hsl(var(--primary)/0.55)]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
              {app.banner_url ? (
                <div className="relative h-24 overflow-hidden">
                  <img src={app.banner_url} alt={`${app.name} banner`} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
              ) : (
                <div className="relative h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
              )}

              <div className="relative p-5 pt-0 -mt-8">
                <div className="w-16 h-16 rounded-2xl border border-border/70 bg-background/80 backdrop-blur grid place-items-center overflow-hidden shadow-lg">
                  {app.logo_url
                    ? <img src={app.logo_url} alt={`${app.name} logo`} loading="lazy" className="w-full h-full object-cover" />
                    : <span className="text-xl font-bold font-display text-primary">{app.name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <h2 className="mt-3 text-lg font-bold font-display group-hover:text-primary transition-colors">{app.name}</h2>
                {app.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{app.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {counts[app.id] || 0} portal{(counts[app.id] || 0) === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 translate-x-[-6px] group-hover:translate-x-0 transition-all">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
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

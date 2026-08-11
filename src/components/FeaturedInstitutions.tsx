import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Institution = { id: string; name: string; logo_url: string | null; kind: string };

/** Continuously scrolling institution strip, populated automatically from the admin panel. */
export default function FeaturedInstitutions() {
  const [items, setItems] = useState<Institution[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: apps }, { data: series }] = await Promise.all([
        supabase.from('study_apps').select('id,name,logo_url').order('sort_order', { ascending: true }),
        supabase.from('test_series').select('id,name,logo_url').order('sort_order', { ascending: true }),
      ]);
      const list: Institution[] = [
        ...((apps as any[]) || []).map(a => ({ id: `app-${a.id}`, name: a.name, logo_url: a.logo_url, kind: 'Study App' })),
        ...((series as any[]) || []).map(s => ({ id: `ts-${s.id}`, name: s.name, logo_url: s.logo_url, kind: 'Test Series' })),
      ];
      const seen = new Set<string>();
      setItems(list.filter(i => (seen.has(i.name.toLowerCase()) ? false : (seen.add(i.name.toLowerCase()), true))));
    })();
  }, []);

  if (items.length === 0) return null;

  // Duplicate the track so the loop never visibly resets.
  const track = [...items, ...items];
  const duration = Math.max(18, items.length * 5);

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-hero py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Featured <span className="text-gradient">Institutions</span>
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground/80">Coaching platforms and test series available inside Rankers Star.</p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max gap-4 marquee-track" style={{ animationDuration: `${duration}s` }}>
          {track.map((item, i) => (
            <div key={`${item.id}-${i}`}
              className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-primary/25 bg-card p-4 shadow-[0_0_35px_-25px_hsl(var(--primary))] backdrop-blur">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-background/70">
                {item.logo_url
                  ? <img src={item.logo_url} alt={`${item.name} logo`} loading="lazy" className="h-full w-full object-cover" />
                  : <span className="font-display text-sm font-bold text-primary">{item.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">{item.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{item.kind}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

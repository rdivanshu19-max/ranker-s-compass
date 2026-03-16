import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Star, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'Other Material', 'Tests'];

export default function LibraryPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMaterials();
  }, [user]);

  const loadMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    setMaterials(data || []);
    if (user && data) {
      // Load user's ratings
      const { data: rData } = await supabase.from('ratings').select('material_id, rating').eq('user_id', user.id);
      const ur: Record<string, number> = {};
      rData?.forEach(r => { ur[r.material_id] = r.rating; });
      setUserRatings(ur);

      // Load avg ratings
      const { data: allRatings } = await supabase.from('ratings').select('material_id, rating');
      const avgMap: Record<string, { sum: number; count: number }> = {};
      allRatings?.forEach(r => {
        if (!avgMap[r.material_id]) avgMap[r.material_id] = { sum: 0, count: 0 };
        avgMap[r.material_id].sum += r.rating;
        avgMap[r.material_id].count++;
      });
      const avgRatings: Record<string, number> = {};
      Object.entries(avgMap).forEach(([id, v]) => { avgRatings[id] = Math.round((v.sum / v.count) * 10) / 10; });
      setRatings(avgRatings);
    }
  };

  const handleRate = async (materialId: string, rating: number) => {
    if (!user) { toast.error('Please sign in to rate'); return; }
    const { error } = await supabase.from('ratings').upsert({
      material_id: materialId, user_id: user.id, rating
    }, { onConflict: 'material_id,user_id' });
    if (error) toast.error('Failed to rate');
    else { toast.success('Rated!'); setUserRatings(p => ({ ...p, [materialId]: rating })); loadMaterials(); }
  };

  const handleDownload = async (material: any) => {
    if (user) {
      await supabase.from('user_downloads').insert({ user_id: user.id, material_id: material.id });
    }
    window.open(material.link, '_blank');
  };

  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !activeFilter || m.types?.includes(activeFilter);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">
          Rankers <span className="text-gradient">Library</span> 📚
        </h1>
        <p className="text-muted-foreground mt-1">Browse and access free study materials</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..."
          className="pl-10" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant={activeFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(null)}>
          <Filter className="w-3 h-3 mr-1" /> All
        </Button>
        {TYPES.map(t => (
          <Button key={t} variant={activeFilter === t ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(t)}>
            {t}
          </Button>
        ))}
      </div>

      {/* Materials */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No materials found</p>
            <p className="text-sm">Materials uploaded by admins will appear here</p>
          </div>
        ) : filtered.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold font-display">{m.title}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.types?.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                  ))}
                </div>
                {/* Rating */}
                {m.rating_enabled && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => handleRate(m.id, s)}
                          className="transition-colors hover:scale-110">
                          <Star className={`w-4 h-4 ${(userRatings[m.id] || 0) >= s ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    {ratings[m.id] && <span className="text-xs text-muted-foreground">({ratings[m.id]})</span>}
                  </div>
                )}
              </div>
              <Button variant="default" size="sm" onClick={() => handleDownload(m)} className="shrink-0">
                <ExternalLink className="w-3 h-3 mr-1" /> Open
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

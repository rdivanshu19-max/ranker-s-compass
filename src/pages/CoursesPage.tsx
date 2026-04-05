import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { GraduationCap, ExternalLink, BookOpen, Pin, Flame, TrendingUp, Star, AlertTriangle, Search, Zap, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type CourseResource = { title: string; url: string; type: string };
type Course = {
  id: string; title: string; description: string; poster_url: string;
  resources: CourseResource[]; created_at: string; pinned: boolean; tags: string[];
};

const TAG_CONFIG: Record<string, { icon: typeof Flame; gradient: string; text: string }> = {
  popular: { icon: Flame, gradient: 'from-orange-500 to-amber-400', text: 'Popular' },
  hot: { icon: Zap, gradient: 'from-red-500 to-rose-400', text: '🔥 Hot' },
  'most used': { icon: TrendingUp, gradient: 'from-blue-500 to-cyan-400', text: 'Most Used' },
  boards: { icon: Award, gradient: 'from-emerald-500 to-teal-400', text: 'Boards' },
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('courses').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
      setCourses((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">
          <span className="text-gradient">Courses</span> 🎓
        </h1>
        <p className="text-muted-foreground mt-1">Premium courses curated for your preparation</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses by name, description or tag..." className="pl-9" />
      </motion.div>

      {/* Disclaimer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-start gap-3 bg-muted/50 border border-border rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> We do not own any third-party courses. All content belongs to its respective owners and is shared for educational purposes only.
        </p>
      </motion.div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{search ? 'No courses match your search' : 'No courses available yet'}</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              {course.poster_url ? (
                <div className="relative overflow-hidden">
                  <img src={course.poster_url} alt={course.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  {course.pinned && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}
                  {course.tags?.length > 0 && (
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {course.tags.map(tag => {
                        const config = TAG_CONFIG[tag];
                        return (
                          <span key={tag} className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-lg backdrop-blur-sm bg-gradient-to-r ${config?.gradient || 'from-muted to-muted-foreground'}`}>
                            {config?.text || tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-primary/30" />
                  {course.pinned && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}
                  {course.tags?.length > 0 && (
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {course.tags.map(tag => {
                        const config = TAG_CONFIG[tag];
                        return (
                          <span key={tag} className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-lg bg-gradient-to-r ${config?.gradient || 'from-muted to-muted-foreground'}`}>
                            {config?.text || tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors">{course.title}</h3>
                {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
                {course.resources && course.resources.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground">📦 {course.resources.length} Resource{course.resources.length > 1 ? 's' : ''}</p>
                    {course.resources.map((r: CourseResource, ri: number) => (
                      <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2.5 rounded-lg bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all">
                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="flex-1 truncate">{r.title || r.url}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

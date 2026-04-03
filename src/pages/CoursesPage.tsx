import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { GraduationCap, ExternalLink, BookOpen, Pin, Flame, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CourseResource = { title: string; url: string; type: string };
type Course = {
  id: string; title: string; description: string; poster_url: string;
  resources: CourseResource[]; created_at: string; pinned: boolean; tags: string[];
};

const TAG_ICONS: Record<string, { icon: typeof Flame; color: string }> = {
  popular: { icon: Flame, color: 'text-orange-500' },
  hot: { icon: Flame, color: 'text-red-500' },
  'most used': { icon: TrendingUp, color: 'text-primary' },
  boards: { icon: Star, color: 'text-yellow-500' },
};

const TAG_COLORS: Record<string, string> = {
  popular: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  hot: 'bg-red-500/10 text-red-500 border-red-500/20',
  'most used': 'bg-primary/10 text-primary border-primary/20',
  boards: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('courses').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
      setCourses((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

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

      {/* Disclaimer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-start gap-3 bg-muted/50 border border-border rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> We do not own any third-party courses. All content belongs to its respective owners and is shared for educational purposes only.
        </p>
      </motion.div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">No courses available yet</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              {course.poster_url ? (
                <div className="relative overflow-hidden">
                  <img src={course.poster_url} alt={course.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  {course.pinned && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}
                  {course.tags?.length > 0 && (
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {course.tags.map(tag => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-1 rounded-full border ${TAG_COLORS[tag] || 'bg-muted text-muted-foreground border-border'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-primary/30" />
                  {course.pinned && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}
                </div>
              )}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors">{course.title}</h3>
                {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
                {course.tags?.length > 0 && !course.poster_url && (
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.map(tag => (
                      <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-muted text-muted-foreground border-border'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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

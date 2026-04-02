import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CourseResource = { title: string; url: string; type: string };
type Course = {
  id: string; title: string; description: string; poster_url: string;
  resources: CourseResource[]; created_at: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
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
        <p className="text-muted-foreground mt-1">Premium courses curated by our team</p>
      </motion.div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">No courses available yet</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-300">
              {course.poster_url && (
                <img src={course.poster_url} alt={course.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold font-display">{course.title}</h3>
                {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
                {course.resources && course.resources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Resources:</p>
                    {course.resources.map((r: CourseResource, ri: number) => (
                      <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors">
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

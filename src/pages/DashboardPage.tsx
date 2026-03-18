import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Download,
  TrendingUp,
  Pin,
  Star,
  ExternalLink,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flame,
  FolderOpen,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type TopicInsight = {
  topic: string;
  score: number;
};

const quotes = [
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'The only way to do great work is to love what you do.',
  "Believe you can and you're halfway there.",
  'Education is the most powerful weapon which you can use to change the world.',
  "Hard work beats talent when talent doesn't work hard.",
  'Dream big, start small, act now.',
  "Your limitation — it's only your imagination.",
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const calculateStudyStreak = (dates: string[]) => {
  if (!dates.length) return 0;

  const daySet = new Set(dates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  if (!daySet.has(formatDateKey(today))) {
    startDate.setDate(startDate.getDate() - 1);
    if (!daySet.has(formatDateKey(startDate))) return 0;
  }

  let streak = 0;
  const cursor = new Date(startDate);

  while (daySet.has(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const deriveTopicInsights = (
  results: Array<{ chapter: string | null; subject: string | null; obtained_marks: number; total_marks: number }>,
) => {
  const aggregate = new Map<string, { sum: number; count: number }>();

  results.forEach((row) => {
    const label = row.chapter || row.subject || 'Mixed Test Topics';
    const percentage = row.total_marks > 0 ? Math.max(0, (row.obtained_marks / row.total_marks) * 100) : 0;
    const current = aggregate.get(label) ?? { sum: 0, count: 0 };
    aggregate.set(label, { sum: current.sum + percentage, count: current.count + 1 });
  });

  const topics = [...aggregate.entries()]
    .map(([topic, value]) => ({ topic, score: Math.round(value.sum / value.count) }))
    .sort((a, b) => b.score - a.score);

  return {
    strong: topics.slice(0, 3),
    weak: [...topics].reverse().slice(0, 3),
  };
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [materialCount, setMaterialCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [exploredMaterialCount, setExploredMaterialCount] = useState(0);
  const [studyVaultCount, setStudyVaultCount] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [pinnedMaterials, setPinnedMaterials] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<Array<{ day: string; minutes: number }>>([]);
  const [strongTopics, setStrongTopics] = useState<TopicInsight[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicInsight[]>([]);
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const loadWeeklyStats = useCallback(async () => {
    if (!user) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const { data } = await supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', formatDateKey(startDate))
      .lte('date', formatDateKey(today));

    const totals = new Map<string, number>();
    (data || []).forEach((row) => {
      totals.set(row.date, (totals.get(row.date) || 0) + row.duration_minutes);
    });

    const weekData = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + index);
      const dateStr = formatDateKey(d);
      return {
        day: days[d.getDay()],
        minutes: totals.get(dateStr) || 0,
      };
    });

    setWeeklyStats(weekData);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [mats, downloads, explored, tests, pinned, vault, sessions, results] = await Promise.all([
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('user_downloads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_downloads').select('material_id').eq('user_id', user.id),
        supabase.from('test_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('materials').select('*').eq('pinned', true).order('updated_at', { ascending: false }).limit(10),
        supabase.from('study_vault').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('study_sessions').select('date').eq('user_id', user.id).order('date', { ascending: false }).limit(365),
        supabase
          .from('test_results')
          .select('chapter, subject, obtained_marks, total_marks')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(60),
      ]);

      setMaterialCount(mats.count || 0);
      setDownloadCount(downloads.count || 0);
      setTestCount(tests.count || 0);
      setStudyVaultCount(vault.count || 0);
      setPinnedMaterials(pinned.data || []);
      setExploredMaterialCount(new Set((explored.data || []).map((item) => item.material_id)).size);
      setStudyStreak(calculateStudyStreak((sessions.data || []).map((entry) => entry.date)));

      const insightData = deriveTopicInsights(results.data || []);
      setStrongTopics(insightData.strong);
      setWeakTopics(insightData.weak);
    };

    load();
    loadWeeklyStats();
  }, [user, loadWeeklyStats]);

  const startTimer = () => {
    if (isTimerRunning) return;
    setIsTimerRunning(true);
    startTimeRef.current = Date.now() - timerSeconds * 1000;

    timerRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const saveAndReset = async () => {
    if (timerSeconds < 60) {
      toast.error('Study at least 1 minute before saving');
      return;
    }

    pauseTimer();
    const minutes = Math.round(timerSeconds / 60);
    const today = formatDateKey(new Date());

    if (user) {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        date: today,
        duration_minutes: minutes,
      });

      if (error) {
        toast.error('Failed to save study time');
        return;
      }

      toast.success(`Saved ${minutes} minutes of study time!`);
      setTimerSeconds(0);
      loadWeeklyStats();

      const { data: sessions } = await supabase.from('study_sessions').select('date').eq('user_id', user.id).order('date', { ascending: false });
      setStudyStreak(calculateStudyStreak((sessions || []).map((entry) => entry.date)));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const libraryCoverage = materialCount > 0 ? Math.min(100, Math.round((exploredMaterialCount / materialCount) * 100)) : 0;

  const statCards = [
    { icon: BookOpen, label: 'Library Materials', value: materialCount, color: 'text-primary' },
    { icon: Download, label: 'Your Downloads', value: downloadCount, color: 'text-primary' },
    { icon: TrendingUp, label: 'Tests Taken', value: testCount, color: 'text-primary' },
    { icon: Flame, label: 'Study Streak', value: `${studyStreak}d`, color: 'text-primary' },
    { icon: FolderOpen, label: 'Vault Materials', value: studyVaultCount, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold font-display">
          Welcome, <span className="text-gradient">{profile?.display_name || 'Student'}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your study dashboard</p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.08 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <p className="text-lg italic text-muted-foreground">&quot;{quote}&quot;</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.12 + i * 0.06 }}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-display">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.22 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-display">Library Coverage Progress</h3>
        </div>
        <Progress value={libraryCoverage} className="h-3" />
        <p className="text-sm text-muted-foreground mt-3">
          You explored <span className="text-foreground font-semibold">{exploredMaterialCount}</span> out of{' '}
          <span className="text-foreground font-semibold">{materialCount}</span> library materials.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-display">Study Timer</h3>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="text-5xl font-mono font-bold text-primary tracking-wider">{formatTimer(timerSeconds)}</div>
          <div className="flex flex-wrap gap-2">
            {!isTimerRunning ? (
              <Button onClick={startTimer} className="gap-2">
                <Play className="w-4 h-4" /> Start
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="outline" className="gap-2">
                <Pause className="w-4 h-4" /> Pause
              </Button>
            )}
            <Button onClick={saveAndReset} variant="secondary" className="gap-2" disabled={timerSeconds < 60}>
              <RotateCcw className="w-4 h-4" /> Save & Reset
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Save sessions to update your weekly graph and streak automatically.</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.38 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">Weekly Study Stats</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.44 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">Performance Insights</h3>
          </div>

          {strongTopics.length === 0 && weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete more AI tests to unlock chapter-level strong and weak topic analysis.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Strong Topics</p>
                <div className="space-y-2">
                  {strongTopics.map((item) => (
                    <div key={`strong-${item.topic}`} className="rounded-lg border border-border bg-background/50 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm">{item.topic}</span>
                      <span className="text-sm font-semibold text-primary">{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Focus Areas</p>
                <div className="space-y-2">
                  {weakTopics.map((item) => (
                    <div key={`weak-${item.topic}`} className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm">{item.topic}</span>
                      <span className="text-sm font-semibold text-destructive">{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {weakTopics[0] && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary inline-block mr-2" />
                  Suggested focus today: revise <span className="text-foreground font-semibold">{weakTopics[0].topic}</span> first,
                  then attempt a chapter-wise test.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {pinnedMaterials.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">Pinned Materials (Top {pinnedMaterials.length})</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {pinnedMaterials.map((material) => (
              <a
                key={material.id}
                href={material.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-muted/40 p-4 hover:border-primary/40 hover:bg-muted transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-primary mt-0.5" />
                    <p className="font-medium leading-snug">{material.title}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {Array.isArray(material.types) && material.types.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {material.types.slice(0, 3).map((type: string) => (
                      <span key={`${material.id}-${type}`} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-md bg-primary/10 text-primary">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Button variant="default" size="lg" onClick={() => navigate('/app/library')} className="rounded-xl">
          <BookOpen className="w-4 h-4 mr-2" /> Browse Library
        </Button>
        <Button variant="default" size="lg" onClick={() => navigate('/app/tests')} className="rounded-xl">
          <Star className="w-4 h-4 mr-2" /> Take a Test
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  tests: number;
};

const quotes = [
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'The only way to do great work is to love what you do.',
  "Believe you can and you're halfway there.",
  'Education is the most powerful weapon which you can use to change the world.',
  "Hard work beats talent when talent doesn't work hard.",
  'Dream big, start small, act now.',
  "Your limitation — it's only your imagination.",
  'The secret of getting ahead is getting started. — Mark Twain',
  'It does not matter how slowly you go as long as you do not stop. — Confucius',
  'Strive for progress, not perfection.',
  'Every expert was once a beginner.',
  'A year from now you may wish you had started today.',
  'Discipline is the bridge between goals and accomplishment.',
  'Small daily improvements over time lead to stunning results.',
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    .map(([topic, value]) => ({ topic, score: Math.round(value.sum / value.count), tests: value.count }))
    .sort((a, b) => b.score - a.score);
  return {
    strong: topics.filter(t => t.score >= 50).slice(0, 4),
    weak: topics.filter(t => t.score < 50).slice(0, 4).length > 0
      ? topics.filter(t => t.score < 50).slice(0, 4)
      : [...topics].reverse().slice(0, 4),
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

    // Build 7-day array starting from today-6, then reorder Mon-Sun
    const rawDays: Array<{ dayName: string; dayIndex: number; minutes: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = formatDateKey(d);
      const jsDay = d.getDay(); // 0=Sun
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      rawDays.push({ dayName: dayNames[jsDay], dayIndex: jsDay === 0 ? 7 : jsDay, minutes: totals.get(dateStr) || 0 });
    }

    rawDays.sort((a, b) => a.dayIndex - b.dayIndex);
    setWeeklyStats(rawDays.map(d => ({ day: d.dayName, minutes: d.minutes })));
  }, [user]);

  // Check badges and celebrate new ones
  const checkBadges = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.awarded && result.awarded.length > 0) {
        // Fire confetti celebration
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6ecc'];
        (function frame() {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
        result.awarded.forEach((name: string) => {
          toast.success(`🎉 Badge Earned: ${name}`, { description: 'Congratulations! Check your profile for details.' });
        });
      }
    } catch {}
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
        supabase.from('test_results').select('chapter, subject, obtained_marks, total_marks').eq('user_id', user.id).order('created_at', { ascending: false }).limit(60),
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
    checkBadges();
  }, [user, loadWeeklyStats, checkBadges]);

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
    if (timerSeconds < 60) { toast.error('Study at least 1 minute before saving'); return; }
    pauseTimer();
    const minutes = Math.round(timerSeconds / 60);
    const today = formatDateKey(new Date());
    if (user) {
      const { error } = await supabase.from('study_sessions').insert({ user_id: user.id, date: today, duration_minutes: minutes });
      if (error) { toast.error('Failed to save study time'); return; }
      toast.success(`Saved ${minutes} minutes of study time!`);
      setTimerSeconds(0);
      loadWeeklyStats();
      const { data: sessions } = await supabase.from('study_sessions').select('date').eq('user_id', user.id).order('date', { ascending: false });
      setStudyStreak(calculateStudyStreak((sessions || []).map((entry) => entry.date)));
    }
  };

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

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

      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.08 }}
        className="bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-2xl border border-primary/20 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-lg italic text-muted-foreground">&quot;{quote}&quot;</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.12 + i * 0.06 }}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
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

      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.22 }}
        className="bg-card rounded-2xl border border-border p-6">
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

      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-display">Study Timer</h3>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="text-5xl font-mono font-bold text-primary tracking-wider">{formatTimer(timerSeconds)}</div>
          <div className="flex flex-wrap gap-2">
            {!isTimerRunning ? (
              <Button onClick={startTimer} className="gap-2"><Play className="w-4 h-4" /> Start</Button>
            ) : (
              <Button onClick={pauseTimer} variant="outline" className="gap-2"><Pause className="w-4 h-4" /> Pause</Button>
            )}
            <Button onClick={saveAndReset} variant="secondary" className="gap-2" disabled={timerSeconds < 60}>
              <RotateCcw className="w-4 h-4" /> Save & Reset
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.38 }}
          className="bg-card rounded-2xl border border-border p-6">
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

        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.44 }}
          className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">Chapter-wise Performance</h3>
          </div>

          {strongTopics.length === 0 && weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete more AI tests to unlock chapter-level strong and weak topic analysis.
            </p>
          ) : (
            <div className="space-y-4">
              {strongTopics.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Strong Chapters
                  </p>
                  <div className="space-y-2">
                    {strongTopics.map((item) => (
                      <div key={`strong-${item.topic}`} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{item.topic}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({item.tests} tests)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-primary w-10 text-right">{item.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {weakTopics.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Focus Areas
                  </p>
                  <div className="space-y-2">
                    {weakTopics.map((item) => (
                      <div key={`weak-${item.topic}`} className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{item.topic}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({item.tests} tests)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-destructive rounded-full" style={{ width: `${item.score}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-destructive w-10 text-right">{item.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {weakTopics[0] && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary inline-block mr-2" />
                  <strong>AI Suggestion:</strong> Focus on <span className="text-foreground font-semibold">{weakTopics[0].topic}</span> today — take a chapter-wise test and revise weak formulas.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {pinnedMaterials.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">📌 Pinned Materials ({pinnedMaterials.length})</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pinnedMaterials.map((material) => (
              <a key={material.id} href={material.link} target="_blank" rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-gradient-to-br from-muted/40 to-transparent p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all">
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
                      <span key={`${material.id}-${type}`} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-md bg-primary/10 text-primary">{type}</span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button variant="default" size="lg" onClick={() => navigate('/app/library')} className="rounded-xl gap-2">
          <BookOpen className="w-4 h-4" /> Library
        </Button>
        <Button variant="default" size="lg" onClick={() => navigate('/app/tests')} className="rounded-xl gap-2">
          <Star className="w-4 h-4" /> AI Tests
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/app/courses')} className="rounded-xl gap-2">
          <Brain className="w-4 h-4" /> Courses
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/app/vault')} className="rounded-xl gap-2">
          <FolderOpen className="w-4 h-4" /> Vault
        </Button>
      </div>
    </div>
  );
}
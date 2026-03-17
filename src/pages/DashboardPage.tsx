import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BookOpen, Download, TrendingUp, Pin, Star, ExternalLink, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const quotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Hard work beats talent when talent doesn't work hard.",
  "Dream big, start small, act now.",
  "Your limitation — it's only your imagination.",
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [materialCount, setMaterialCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [pinnedMaterials, setPinnedMaterials] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const loadWeeklyStats = useCallback(async () => {
    if (!user) return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const { data } = await supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).eq('date', dateStr);
      const total = data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
      weekData.push({ day: days[d.getDay()], minutes: total });
    }
    setWeeklyStats(weekData);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [mats, downloads, tests, pinned] = await Promise.all([
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('user_downloads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('test_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('materials').select('*').eq('pinned', true).limit(5),
      ]);
      setMaterialCount(mats.count || 0);
      setDownloadCount(downloads.count || 0);
      setTestCount(tests.count || 0);
      setPinnedMaterials(pinned.data || []);
    };
    load();
    loadWeeklyStats();
  }, [user, loadWeeklyStats]);

  // Timer functions
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
    const today = new Date().toISOString().split('T')[0];

    if (user) {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        date: today,
        duration_minutes: minutes,
      });
      if (error) { toast.error('Failed to save'); return; }
      toast.success(`Saved ${minutes} minutes of study time!`);
      setTimerSeconds(0);
      loadWeeklyStats();
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const statCards = [
    { icon: BookOpen, label: 'Library Materials', value: materialCount, color: 'text-primary' },
    { icon: Download, label: 'Your Downloads', value: downloadCount, color: 'text-green-500' },
    { icon: TrendingUp, label: 'Tests Taken', value: testCount, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold font-display">
          Welcome, <span className="text-gradient">{profile?.display_name || 'Student'}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study dashboard</p>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6">
        <p className="text-lg italic text-muted-foreground">"{quote}"</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Study Timer */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-display">Study Timer</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-5xl font-mono font-bold text-primary tracking-wider">
            {formatTimer(timerSeconds)}
          </div>
          <div className="flex gap-2">
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
        <p className="text-xs text-muted-foreground mt-3">Start the timer when you study. Save to track your progress in the weekly chart.</p>
      </motion.div>

      {/* Weekly Study Chart */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-display">Weekly Study Stats</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pinned Materials */}
      {pinnedMaterials.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">Pinned Materials</h3>
          </div>
          <div className="space-y-3">
            {pinnedMaterials.map(m => (
              <a key={m.id} href={m.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium">{m.title}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
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

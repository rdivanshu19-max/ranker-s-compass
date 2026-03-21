import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trophy, Flame, Award, Medal } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

type LeaderEntry = { user_id: string; display_name: string; value: number };

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'scores' | 'streaks' | 'badges'>('scores');
  const [topScorers, setTopScorers] = useState<LeaderEntry[]>([]);
  const [topStreaks, setTopStreaks] = useState<LeaderEntry[]>([]);
  const [topBadges, setTopBadges] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Top scorers - by total obtained marks
      const { data: results } = await supabase.from('test_results').select('user_id, obtained_marks');
      const scoreMap = new Map<string, number>();
      (results || []).forEach(r => scoreMap.set(r.user_id, (scoreMap.get(r.user_id) || 0) + r.obtained_marks));

      // Top badges
      const { data: badges } = await supabase.from('user_badges').select('user_id');
      const badgeMap = new Map<string, number>();
      (badges || []).forEach(b => badgeMap.set(b.user_id, (badgeMap.get(b.user_id) || 0) + 1));

      // Study streaks - by total study sessions
      const { data: sessions } = await supabase.from('study_sessions').select('user_id, date');
      const streakMap = new Map<string, Set<string>>();
      (sessions || []).forEach(s => {
        if (!streakMap.has(s.user_id)) streakMap.set(s.user_id, new Set());
        streakMap.get(s.user_id)!.add(s.date);
      });
      const streakCalc = new Map<string, number>();
      streakMap.forEach((dates, uid) => {
        const sorted = [...dates].sort().reverse();
        let streak = 0;
        const today = new Date(); today.setHours(0,0,0,0);
        const cursor = new Date(today);
        const dateKey = (d: Date) => d.toISOString().split('T')[0];
        if (!dates.has(dateKey(cursor))) { cursor.setDate(cursor.getDate()-1); if (!dates.has(dateKey(cursor))) { streakCalc.set(uid, 0); return; } }
        while (dates.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate()-1); }
        streakCalc.set(uid, streak);
      });

      // Get all profiles for names
      const allUids = new Set([...scoreMap.keys(), ...badgeMap.keys(), ...streakCalc.keys()]);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', [...allUids]);
      const nameMap = new Map<string, string>();
      (profiles || []).forEach(p => nameMap.set(p.user_id, p.display_name));

      setTopScorers([...scoreMap.entries()].map(([uid, v]) => ({ user_id: uid, display_name: nameMap.get(uid) || 'Student', value: v })).sort((a,b) => b.value - a.value).slice(0, 20));
      setTopStreaks([...streakCalc.entries()].filter(([,v]) => v > 0).map(([uid, v]) => ({ user_id: uid, display_name: nameMap.get(uid) || 'Student', value: v })).sort((a,b) => b.value - a.value).slice(0, 20));
      setTopBadges([...badgeMap.entries()].map(([uid, v]) => ({ user_id: uid, display_name: nameMap.get(uid) || 'Student', value: v })).sort((a,b) => b.value - a.value).slice(0, 20));
      setLoading(false);
    };
    load();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const tabs = [
    { key: 'scores' as const, label: 'Test Scores', icon: Trophy },
    { key: 'streaks' as const, label: 'Study Streaks', icon: Flame },
    { key: 'badges' as const, label: 'Badges Earned', icon: Award },
  ];
  const current = tab === 'scores' ? topScorers : tab === 'streaks' ? topStreaks : topBadges;
  const unit = tab === 'scores' ? 'marks' : tab === 'streaks' ? 'days' : 'badges';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Trophy className="w-8 h-8 text-primary" /> <span className="text-gradient">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">Top performing students on Rankers Star</p>
      </motion.div>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : current.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Medal className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>No data yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {current.map((entry, i) => (
            <motion.div key={entry.user_id} initial="hidden" animate="visible" variants={fadeUp}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${i < 3 ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}>
              <div className="w-8 text-center text-lg font-bold">
                {i < 3 ? medals[i] : <span className="text-muted-foreground text-sm">#{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {entry.display_name[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.display_name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-primary">{entry.value}</span>
                <span className="text-xs text-muted-foreground ml-1">{unit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

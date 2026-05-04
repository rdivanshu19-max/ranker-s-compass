import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, Target, TrendingUp, AlertTriangle,
  Zap, Calendar, Brain, Flame, Clock, CheckCircle2, Circle,
  ChevronDown, ChevronUp, BookOpen, BarChart3, Skull, Smile, Award,
  Mic, MicOff, Trash2, History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import MarkdownMath from '@/components/MarkdownMath';
import { toast } from 'sonner';
import { useAILimit } from '@/hooks/useAILimit';
import AILoadingScreen from '@/components/AILoadingScreen';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Message = { role: 'user' | 'assistant'; content: string };
type StudyMode = 'lazy' | 'normal' | 'beast';
type DailyTask = { id: string; text: string; done: boolean };

const MODE_CONFIG: Record<StudyMode, { label: string; icon: any; emoji: string; color: string; desc: string }> = {
  lazy: { label: 'Lazy Mode', icon: Smile, emoji: '😄', color: 'text-yellow-500', desc: 'Light study, basics only' },
  normal: { label: 'Normal Mode', icon: Target, emoji: '📚', color: 'text-blue-500', desc: 'Balanced study plan' },
  beast: { label: 'Beast Mode', icon: Skull, emoji: '🔥', color: 'text-red-500', desc: 'Max intensity, no mercy' },
};

const STORAGE_KEY_TASKS = 'astra_daily_tasks';
const STORAGE_KEY_MODE = 'astra_study_mode';
const STORAGE_KEY_EXAM_DATE = 'astra_exam_date';
const STORAGE_KEY_CHECKIN = 'astra_last_checkin';

function loadTasks(): DailyTask[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!saved) return [];
    const { date, tasks } = JSON.parse(saved);
    if (date === new Date().toISOString().split('T')[0]) return tasks;
    return [];
  } catch { return []; }
}

function saveTasks(tasks: DailyTask[]) {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    tasks,
  }));
}

export default function AstraDashboard() {
  const { user } = useAuth();
  const { remaining, limit, refresh: refreshLimit, resetIn, unlimited } = useAILimit('ai_mentor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<StudyMode>(() =>
    (localStorage.getItem(STORAGE_KEY_MODE) as StudyMode) || 'normal'
  );
  const [examDate, setExamDate] = useState(() => localStorage.getItem(STORAGE_KEY_EXAM_DATE) || '');
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(loadTasks);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [mistakePatterns, setMistakePatterns] = useState<Array<{ topic: string; count: number; avgScore: number }>>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)) : null;
  const completedTasks = dailyTasks.filter(t => t.done).length;
  const taskProgress = dailyTasks.length > 0 ? Math.round((completedTasks / dailyTasks.length) * 100) : 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Load consistency score and mistake patterns
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Consistency: sessions in last 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', twoWeeksAgo.toISOString().split('T')[0]);
      const uniqueDays = new Set((sessions || []).map(s => s.date));
      setConsistencyScore(Math.round((uniqueDays.size / 14) * 100));

      // Mistake patterns from test results
      const { data: results } = await supabase
        .from('test_results')
        .select('chapter, subject, obtained_marks, total_marks, incorrect')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (results && results.length > 0) {
        const byTopic: Record<string, { errors: number; total: number; obtained: number; count: number }> = {};
        results.forEach(r => {
          const topic = r.chapter || r.subject || 'General';
          if (!byTopic[topic]) byTopic[topic] = { errors: 0, total: 0, obtained: 0, count: 0 };
          byTopic[topic].errors += r.incorrect;
          byTopic[topic].total += r.total_marks;
          byTopic[topic].obtained += r.obtained_marks;
          byTopic[topic].count++;
        });
        const patterns = Object.entries(byTopic)
          .map(([topic, v]) => ({ topic, count: v.errors, avgScore: Math.round((v.obtained / v.total) * 100) }))
          .filter(p => p.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setMistakePatterns(patterns);
        setWeakTopics(patterns.filter(p => p.avgScore < 50).map(p => p.topic).slice(0, 3));
      }
    };
    load();
  }, [user]);

  // Load saved chat history on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('astra_chat_history')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(40);
      if (data && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
        setHistoryLoaded(true);
      }
    })();
  }, [user]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error('Voice input error. Please try again.'); };
    recognitionRef.current = rec;
  }, []);

  const toggleVoice = () => {
    const rec = recognitionRef.current;
    if (!rec) { toast.error('Voice input not supported in this browser'); return; }
    if (listening) { rec.stop(); setListening(false); }
    else {
      try { rec.start(); setListening(true); setChatOpen(true); }
      catch { setListening(false); }
    }
  };

  const deleteHistory = async () => {
    if (!user) return;
    await supabase.from('astra_chat_history').delete().eq('user_id', user.id);
    setMessages([]);
    setHistoryLoaded(false);
    toast.success('Chat history cleared');
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || !user) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astra-mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: newMessages,
          mode,
          examDate: examDate || undefined,
          dailyTasks,
          consistencyScore,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
        throw new Error(err.error || 'Failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            assistantMsg += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
              return updated;
            });
          } catch {}
        }
      }

      // Parse tasks from AI response
      parseTasks(assistantMsg);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Something went wrong.'}` }]);
    }
    setLoading(false);
    refreshLimit();
  };

  const parseTasks = (text: string) => {
    // Look for numbered or bullet tasks in AI response
    const taskRegex = /(?:^|\n)\s*(?:[\d]+[.)]\s*|[-•]\s*|✅\s*|☐\s*)(.*?)(?=\n|$)/g;
    const found: DailyTask[] = [];
    let match;
    while ((match = taskRegex.exec(text)) !== null) {
      const taskText = match[1].trim().replace(/\*\*/g, '');
      if (taskText.length > 5 && taskText.length < 200 && !taskText.startsWith('http')) {
        found.push({ id: crypto.randomUUID(), text: taskText, done: false });
      }
    }
    if (found.length > 0) {
      setDailyTasks(found.slice(0, 10));
      saveTasks(found.slice(0, 10));
    }
  };

  const toggleTask = (id: string) => {
    const updated = dailyTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setDailyTasks(updated);
    saveTasks(updated);
    const allDone = updated.every(t => t.done);
    if (allDone && updated.length > 0) {
      toast.success('🎉 All tasks completed! Great job!');
    }
  };

  const changeMode = (newMode: StudyMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    toast.success(`Switched to ${MODE_CONFIG[newMode].label} ${MODE_CONFIG[newMode].emoji}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const whatNow = () => sendMessage(
    `I need an instant task right now. I'm in ${mode} mode. ${daysLeft !== null ? `I have ${daysLeft} days until my exam.` : ''} My weak topics are: ${weakTopics.join(', ') || 'not identified yet'}. Give me ONE specific thing to do right now with exact time.`
  );

  const fixWeakTopic = () => {
    const topic = weakTopics[0] || mistakePatterns[0]?.topic;
    if (!topic) { toast.error('Take some tests first so I can identify weak topics'); return; }
    sendMessage(`Fix Weak Topic: ${topic}. Give me: 1 key concept to revise, then suggest I take a chapter test on this. Be specific and give me a mini plan.`);
  };

  const dailyCheckin = () => sendMessage(
    `Daily check-in: I completed ${completedTasks}/${dailyTasks.length} tasks today (${taskProgress}%). ${dailyTasks.filter(t => !t.done).map(t => `Incomplete: ${t.text}`).join('. ')}. Give me feedback on my discipline and adjust tomorrow's plan.`
  );

  return (
    <motion.div id="astra-mentor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-2xl border-2 border-violet-500/30 overflow-hidden shadow-2xl shadow-violet-500/20">
      {/* Animated glow ring */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 opacity-60 blur-md animate-pulse" />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-violet-500/5 border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Bot className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-card animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xl font-display flex items-center gap-2">
                ASTRA Mentor
                <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 mr-1" /> AI
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Your Personal AI Study Coach & Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unlimited ? (
              <span className="text-xs px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Unlimited
              </span>
            ) : (
              <div className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 ${
                remaining === 0 ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-violet-500/30 bg-violet-500/10 text-violet-500'
              }`} title={`Resets in ${resetIn}`}>
                <Zap className="w-3 h-3" />
                <span>{remaining}/{limit}</span>
                <span className="text-[9px] opacity-70 ml-1">· {resetIn}</span>
              </div>
            )}
            {messages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Clear chat history">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear ASTRA chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes your full conversation with ASTRA. Your study plan and tasks remain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteHistory} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {daysLeft !== null && (
              <div className="text-center bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-1.5">
                <div className="text-lg font-bold text-destructive font-display leading-none">{daysLeft}</div>
                <div className="text-[10px] text-destructive/70">days left</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switch + Exam Date */}
      <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(Object.keys(MODE_CONFIG) as StudyMode[]).map(m => {
            const cfg = MODE_CONFIG[m];
            return (
              <button key={m} onClick={() => changeMode(m)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  mode === m
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}>
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="date" value={examDate}
            onChange={e => { setExamDate(e.target.value); localStorage.setItem(STORAGE_KEY_EXAM_DATE, e.target.value); }}
            className="text-xs bg-transparent border border-border rounded-lg px-2 py-1 text-foreground"
            placeholder="Exam date"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-3 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-primary font-display">{consistencyScore}%</div>
          <div className="text-[10px] text-muted-foreground">Consistency (14d)</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary font-display">{taskProgress}%</div>
          <div className="text-[10px] text-muted-foreground">Today's Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary font-display">{mistakePatterns.length}</div>
          <div className="text-[10px] text-muted-foreground">Error Patterns</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary font-display">{MODE_CONFIG[mode].emoji}</div>
          <div className="text-[10px] text-muted-foreground">{MODE_CONFIG[mode].desc}</div>
        </div>
      </div>

      {/* Daily Tasks Checklist */}
      {dailyTasks.length > 0 && (
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Today's Tasks ({completedTasks}/{dailyTasks.length})
            </p>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={dailyCheckin}>
              📅 Check-in
            </Button>
          </div>
          <Progress value={taskProgress} className="h-1.5 mb-2" />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {dailyTasks.map(task => (
              <label key={task.id} className={`flex items-start gap-2 py-1 cursor-pointer group ${task.done ? 'opacity-60' : ''}`}>
                <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} className="mt-0.5" />
                <span className={`text-xs leading-relaxed ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mistake Journal Preview */}
      {mistakePatterns.length > 0 && (
        <div className="px-6 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Mistake Journal
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mistakePatterns.map(p => (
              <span key={p.topic}
                className={`text-[10px] px-2 py-1 rounded-full border ${
                  p.avgScore < 40 ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : p.avgScore < 60 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
                    : 'bg-muted border-border text-muted-foreground'
                }`}>
                {p.topic} ({p.count} errors, {p.avgScore}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 py-3 border-b border-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={whatNow}
            className="text-left rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 p-2.5 transition-colors">
            <Zap className="w-4 h-4 text-primary mb-1" />
            <p className="text-[11px] font-semibold leading-tight">What now?</p>
            <p className="text-[9px] text-muted-foreground">Instant task</p>
          </button>
          <button onClick={fixWeakTopic}
            className="text-left rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 p-2.5 transition-colors">
            <Brain className="w-4 h-4 text-destructive mb-1" />
            <p className="text-[11px] font-semibold leading-tight">Fix Weak Topic</p>
            <p className="text-[9px] text-muted-foreground">{weakTopics[0] || 'Auto detect'}</p>
          </button>
          <button onClick={() => sendMessage(`Create a smart time allocation plan for today based on my weak topics and ${mode} mode. ${daysLeft !== null ? `Exam is in ${daysLeft} days.` : ''} Specify exact hours per subject.`)}
            className="text-left rounded-lg border border-border bg-muted/30 hover:bg-muted/60 p-2.5 transition-colors">
            <Clock className="w-4 h-4 text-primary mb-1" />
            <p className="text-[11px] font-semibold leading-tight">Time Plan</p>
            <p className="text-[9px] text-muted-foreground">Smart allocation</p>
          </button>
          <button onClick={() => sendMessage(`Analyze my mistake journal. My error patterns: ${mistakePatterns.map(p => `${p.topic}: ${p.count} errors, ${p.avgScore}% avg`).join('; ')}. Identify repeated mistakes and give me a fix strategy.`)}
            className="text-left rounded-lg border border-border bg-muted/30 hover:bg-muted/60 p-2.5 transition-colors">
            <BarChart3 className="w-4 h-4 text-primary mb-1" />
            <p className="text-[11px] font-semibold leading-tight">Analyze Errors</p>
            <p className="text-[9px] text-muted-foreground">Pattern review</p>
          </button>
        </div>
      </div>

      {/* Chat Section */}
      <div className="px-6 py-3">
        <button onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full">
          <Bot className="w-4 h-4" />
          Chat with ASTRA
          {chatOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div ref={scrollRef} className="max-h-80 overflow-y-auto px-6 pb-2 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    Ask me anything — study plans, motivation, weak topics, strategies. I know your test data! 🌟
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    ⚠️ <strong>AI Disclaimer:</strong> ASTRA provides AI-generated suggestions. Always verify with teachers and textbooks.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                      : 'bg-muted/50 border border-border'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <MarkdownMath className="[&_p]:mb-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0">{msg.content || '...'}</MarkdownMath>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <AILoadingScreen message="ASTRA is thinking..." subMessage="Analyzing your performance & crafting a plan 🌟" />
              )}
            </div>
            <div className="px-6 pb-4">
              {!unlimited && remaining === 0 && (
                <div className="mb-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  Daily ASTRA limit reached. Resets in <strong>{resetIn}</strong>.
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" size="icon" variant={listening ? 'default' : 'outline'} onClick={toggleVoice}
                  className={`shrink-0 h-9 w-9 ${listening ? 'bg-destructive text-destructive-foreground animate-pulse' : ''}`}
                  title={listening ? 'Stop listening' : 'Voice input (Hindi/English)'}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={listening ? '🎤 Listening...' : 'Ask ASTRA anything (or tap mic to speak)...'} rows={1}
                  className="resize-none text-sm min-h-[36px] max-h-20" />
                <Button size="icon" onClick={() => sendMessage()} disabled={loading || !input.trim() || (!unlimited && remaining === 0)}
                  className="shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white h-9 w-9">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

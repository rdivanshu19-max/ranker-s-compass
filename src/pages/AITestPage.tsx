import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Clock, CheckCircle, XCircle, MinusCircle, Flag, ArrowRight,
  BarChart3, Trophy, AlertTriangle, Sparkles, Timer, X, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const JEE_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];
const NEET_SUBJECTS = ['Physics', 'Chemistry', 'Biology'];

const SYLLABUS: Record<string, Record<string, Record<string, string[]>>> = {
  JEE: {
    '11th': {
      Physics: ['Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
      Chemistry: ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Organic Chemistry Basics', 'Hydrocarbons', 'States of Matter', 's-Block Elements', 'Hydrogen', 'p-Block Elements'],
      Mathematics: ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', 'Limits and Derivatives', 'Statistics', 'Probability'],
    },
    '12th': {
      Physics: ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics'],
      Chemistry: ['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols Ethers', 'Aldehydes Ketones Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers'],
      Mathematics: ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Probability'],
    },
  },
  NEET: {
    '11th': {
      Physics: ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work Energy Power', 'System of Particles', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
      Chemistry: ['Some Basic Concepts', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry'],
      Biology: ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Division', 'Photosynthesis', 'Respiration', 'Plant Growth', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products', 'Locomotion and Movement', 'Neural Control', 'Chemical Coordination'],
    },
    '12th': {
      Physics: ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'EM Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductors'],
      Chemistry: ['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'd and f Block', 'Coordination Compounds', 'Haloalkanes', 'Alcohols Phenols Ethers', 'Aldehydes Ketones Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
      Biology: ['Reproduction in Organisms', 'Sexual Reproduction in Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Strategies for Enhancement', 'Microbes in Human Welfare', 'Biotechnology Principles', 'Biotechnology Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity', 'Environmental Issues'],
    },
  },
};

type TestState = 'config' | 'loading' | 'test' | 'result';
type Question = { id: number; question: string; options: string[]; correctAnswer: number; explanation: string; subject: string; chapter?: string };
type ResultState = {
  correct: number; incorrect: number; unanswered: number; obtained: number; total: number;
  negativeMarks: number; attempted: number;
  subjectScores: Record<string, { correct: number; incorrect: number; total: number }>;
  timePerQuestion: number[];
};

const chartColors = { correct: 'hsl(var(--primary))', incorrect: 'hsl(var(--destructive))', unanswered: 'hsl(var(--muted-foreground))' };

export default function AITestPage() {
  const { user } = useAuth();
  const [state, setState] = useState<TestState>('config');
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('JEE');
  const [classLevel, setClassLevel] = useState<'11th' | '12th' | 'Full'>('11th');
  const [subject, setSubject] = useState<string | 'Full'>('Full');
  const [chapter, setChapter] = useState<string | 'Full'>('Full');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
const [questionCount, setQuestionCount] = useState(15);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);

  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subjects = examType === 'JEE' ? JEE_SUBJECTS : NEET_SUBJECTS;

  const attemptedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const reviewCount = useMemo(() => markedForReview.size, [markedForReview]);
  const unattemptedCount = useMemo(() => Math.max(questions.length - attemptedCount, 0), [questions.length, attemptedCount]);

  // Show tutorial on first visit
  useEffect(() => {
    const seen = localStorage.getItem('ai-test-tutorial-seen');
    if (!seen) setShowTutorial(true);
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('ai-test-tutorial-seen', 'true');
  };

  const getTestConfig = () => {
    const isFullExam = classLevel === 'Full' && subject === 'Full';
    const isFullSubject = subject !== 'Full' && chapter === 'Full';
    let numQ = 15, totalMarks = 60, duration = 25 * 60;
    if (isFullExam) {
      if (examType === 'JEE') { numQ = 75; totalMarks = 300; duration = 3 * 60 * 60; }
      else { numQ = 180; totalMarks = 720; duration = 3 * 60 * 60; }
    } else if (isFullSubject) {
      if (examType === 'JEE') { numQ = 25; totalMarks = 100; duration = 60 * 60; }
      else if (subject === 'Biology') { numQ = 90; totalMarks = 360; duration = 90 * 60; }
      else { numQ = 45; totalMarks = 180; duration = 45 * 60; }
    } else if (classLevel !== 'Full' && subject === 'Full') {
      // Full class test
      numQ = 30; totalMarks = 120; duration = 60 * 60;
    }
    return { numQ, totalMarks, duration };
  };

  const getSubjectDistribution = () => {
    const isFullExam = classLevel === 'Full' && subject === 'Full';
    const isClassFull = classLevel !== 'Full' && subject === 'Full';

    if (isFullExam) {
      if (examType === 'JEE') {
        return [
          { subject: 'Physics', count: 25 },
          { subject: 'Chemistry', count: 25 },
          { subject: 'Mathematics', count: 25 },
        ];
      } else {
        return [
          { subject: 'Physics', count: 45 },
          { subject: 'Chemistry', count: 45 },
          { subject: 'Biology', count: 90 },
        ];
      }
    }

    if (isClassFull) {
      if (examType === 'JEE') {
        return [
          { subject: 'Physics', count: 10 },
          { subject: 'Chemistry', count: 10 },
          { subject: 'Mathematics', count: 10 },
        ];
      } else {
        return [
          { subject: 'Physics', count: 8 },
          { subject: 'Chemistry', count: 7 },
          { subject: 'Biology', count: 15 },
        ];
      }
    }

    return null; // single subject or chapter - no distribution needed
  };

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => clearTimer(), []);

  const recordQuestionTime = (fromIdx: number) => {
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    setQuestionTimes(prev => {
      const next = [...prev];
      next[fromIdx] = (next[fromIdx] || 0) + elapsed;
      return next;
    });
    questionStartRef.current = Date.now();
  };

  const navigateToQuestion = (idx: number) => {
    recordQuestionTime(currentQ);
    setCurrentQ(idx);
  };

  const startTest = async () => {
    setState('loading');
    const config = getTestConfig();

let numQ = config.numQ;

if (chapter !== 'Full') {
  numQ = questionCount;
}

const duration = numQ * 2 * 60;
    const distribution = getSubjectDistribution();
    try {
      const body: any = { examType, numQuestions: numQ };
      if (distribution) {
        body.subjectDistribution = distribution;
      } else {
        body.subject = subject === 'Full' ? null : subject;
        body.chapter = chapter === 'Full' ? null : chapter;
      }

      const { data, error } = await supabase.functions.invoke('generate-test', { body });
      if (error) throw error;
      if (!data?.questions || data.questions.length === 0) throw new Error('No questions generated');
      setQuestions(data.questions);
      setAnswers({});
      setMarkedForReview(new Set());
      setCurrentQ(0);
      setTimeLeft(duration);
      setResult(null);
      setQuestionTimes(new Array(data.questions.length).fill(0));
      questionStartRef.current = Date.now();
      setState('test');
      clearTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => { if (prev <= 1) { clearTimer(); return 0; } return prev - 1; });
      }, 1000);
    } catch (e: any) {
      const msg = e.message || 'Something went wrong. Please try again.';
      toast.error(msg.includes('fetch') ? 'Something went wrong. Please check your connection and try again.' : msg);
      setState('config');
    }
  };

  // Auto-submit when time runs out
  useEffect(() => {
    if (state === 'test' && timeLeft === 0) {
      submitTest();
    }
  }, [timeLeft, state]);

  const submitTest = async () => {
    clearTimer();
    recordQuestionTime(currentQ);

    let correct = 0, incorrect = 0, unanswered = 0;
    const subjectScores: Record<string, { correct: number; incorrect: number; total: number }> = {};
    questions.forEach((q, i) => {
      const subj = q.subject || 'General';
      if (!subjectScores[subj]) subjectScores[subj] = { correct: 0, incorrect: 0, total: 0 };
      subjectScores[subj].total += 1;
      if (answers[i] === undefined) unanswered += 1;
      else if (answers[i] === q.correctAnswer) { correct += 1; subjectScores[subj].correct += 1; }
      else { incorrect += 1; subjectScores[subj].incorrect += 1; }
    });
    // Marking: +4 correct, -1 incorrect, 0 unanswered
    const obtained = correct * 4 - incorrect * 1;
    const total = questions.length * 4;
    const res: ResultState = { correct, incorrect, unanswered, obtained, total, negativeMarks: incorrect, attempted: correct + incorrect, subjectScores, timePerQuestion: questionTimes };
    setResult(res);
    setState('result');
    if (user) {
      await supabase.from('test_results').insert({
        user_id: user.id, exam_type: examType, class: classLevel, subject: subject === 'Full' ? null : subject,
        chapter: chapter === 'Full' ? null : chapter, total_marks: total, obtained_marks: obtained, total_questions: questions.length,
        attempted: res.attempted, correct, incorrect, unanswered, negative_marks: incorrect, subject_scores: subjectScores,
        duration_seconds: getTestConfig().duration - timeLeft,
      });
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const toggleReview = (idx: number) => {
    setMarkedForReview((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  // Tutorial Overlay
  const TutorialOverlay = () => (
    <AnimatePresence>
      {showTutorial && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> How AI Tests Work
              </h2>
              <Button variant="ghost" size="icon" onClick={dismissTutorial}><X className="w-4 h-4" /></Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="font-medium">CBT Mode (Computer Based Test)</p>
                  <p className="text-muted-foreground">Just like the real JEE/NEET exam! Navigate freely between questions.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-lg">📊</span>
                <div>
                  <p className="font-medium">Marking Scheme</p>
                  <p className="text-muted-foreground">+4 for correct, -1 for incorrect, 0 for unanswered</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-lg">🎨</span>
                <div>
                  <p className="font-medium">Question Palette</p>
                  <p className="text-muted-foreground">
                    <span className="text-green-500 font-bold">Green</span> = Answered, {' '}
                    <span className="text-orange-500 font-bold">Orange</span> = Marked for Review, {' '}
                    <span className="text-destructive font-bold">Red</span> = Not Attempted
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-lg">⏱️</span>
                <div>
                  <p className="font-medium">Exam Patterns</p>
                  <p className="text-muted-foreground">JEE: 75 Q (25 per subject), 300 marks, 3 hrs</p>
                  <p className="text-muted-foreground">NEET: 180 Q (90 Bio, 45 Phy, 45 Chem), 720 marks, 3 hrs</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-lg">📈</span>
                <div>
                  <p className="font-medium">Detailed Analysis</p>
                  <p className="text-muted-foreground">Get subject-wise scores, time analysis, and answer review after each test.</p>
                </div>
              </div>
            </div>

            <Button variant="hero" className="w-full" onClick={dismissTutorial}>
              <Sparkles className="w-4 h-4 mr-2" /> Got it, let's go!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Loading
  if (state === 'loading') {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="mx-auto animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-lg font-bold font-display">Generating your test...</p>
          <p className="text-muted-foreground">AI is crafting {getTestConfig().numQ} exam-style questions for {examType}</p>
          <p className="text-xs text-muted-foreground">This may take a moment for large tests</p>
        </motion.div>
      </div>
    );
  }

  // Test UI
  if (state === 'test') {
    const q = questions[currentQ];
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              <span className="font-bold font-display">{examType} CBT Test</span>
              <span className="text-xs text-muted-foreground">({questions.length} Q)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                <Clock className="w-4 h-4 inline mr-1" />{formatTime(timeLeft)}
              </span>
              <Button variant="destructive" size="sm" onClick={submitTest}>Submit Test</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            AI-generated questions for practice only. Verify with standard references.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          {q && (
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q.subject}</span>
                <Button
                  variant={markedForReview.has(currentQ) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleReview(currentQ)}
                  className={markedForReview.has(currentQ) ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : ''}
                >
                  <Flag className="w-3.5 h-3.5 mr-1" />
                  {markedForReview.has(currentQ) ? 'Marked for Review' : 'Mark for Review'}
                </Button>
              </div>
              <h3 className="text-lg font-medium leading-relaxed">Q{currentQ + 1}. {q.question}</h3>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: oi }))}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${answers[currentQ] === oi ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40'}`}>
                    <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => navigateToQuestion(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>Previous</Button>
                <Button onClick={() => navigateToQuestion(Math.min(questions.length - 1, currentQ + 1))} disabled={currentQ === questions.length - 1}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Question Palette */}
          <div className="bg-card rounded-2xl border border-border p-4 h-fit space-y-4">
            <h4 className="font-bold font-display">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
              {questions.map((_, i) => {
                const isCurrent = i === currentQ;
                const isReview = markedForReview.has(i);
                const isAnswered = answers[i] !== undefined;

                let colorClass = 'bg-destructive/20 text-destructive border-destructive/40';
                if (isAnswered) colorClass = 'bg-green-500/20 text-green-600 border-green-500/40';
                if (isReview) colorClass = 'bg-orange-500/20 text-orange-600 border-orange-500/40';
                if (isCurrent) colorClass += ' ring-2 ring-primary ring-offset-1 ring-offset-card';

                return (
                  <button key={i} type="button" onClick={() => navigateToQuestion(i)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border ${colorClass}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2.5">
                <span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
                <span className="flex-1">Answered</span>
                <span className="font-bold text-green-600">{attemptedCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2.5">
                <span className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50" />
                <span className="flex-1">Marked for Review</span>
                <span className="font-bold text-orange-600">{reviewCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <span className="w-3 h-3 rounded bg-destructive/30 border border-destructive/50" />
                <span className="flex-1">Not Attempted</span>
                <span className="font-bold text-destructive">{unattemptedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result
  if (state === 'result' && result) {
    const pieData = [
      { name: 'Correct', value: result.correct, color: chartColors.correct },
      { name: 'Incorrect', value: result.incorrect, color: chartColors.incorrect },
      { name: 'Unanswered', value: result.unanswered, color: chartColors.unanswered },
    ];
    const subjectData = Object.entries(result.subjectScores).map(([name, value]) => ({
      name, marks: value.correct * 4 - value.incorrect, total: value.total * 4,
    }));
    const percentage = result.total > 0 ? Math.round((Math.max(0, result.obtained) / result.total) * 100) : 0;
    const avgTimePerQ = result.timePerQuestion.length > 0
      ? Math.round(result.timePerQuestion.reduce((a, b) => a + b, 0) / result.timePerQuestion.length)
      : 0;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-2">
          <Trophy className="w-14 h-14 text-primary mx-auto" />
          <h1 className="text-4xl font-bold font-display">Test Complete!</h1>
          <div className="text-5xl font-bold font-display text-gradient">{result.obtained}/{result.total}</div>
          <p className="text-muted-foreground">
            {percentage >= 60 ? 'Excellent work! 🎉' : percentage >= 40 ? 'Great effort! Keep pushing! 💪' : 'Keep practicing, progress is loading! 📚'}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Attempted', value: result.attempted, icon: CheckCircle, tone: 'text-primary' },
            { label: 'Correct', value: result.correct, icon: CheckCircle, tone: 'text-green-500' },
            { label: 'Incorrect', value: result.incorrect, icon: XCircle, tone: 'text-destructive' },
            { label: 'Negative', value: `-${result.negativeMarks}`, icon: MinusCircle, tone: 'text-destructive' },
            { label: 'Avg Time/Q', value: `${avgTimePerQ}s`, icon: Timer, tone: 'text-primary' },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.tone}`} />
              <div className="text-2xl font-bold font-display">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold font-display mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Overview</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={76} dataKey="value" paddingAngle={4}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold font-display mb-4">Subject Analysis</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip /><Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {result.timePerQuestion.some(t => t > 0) && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold font-display mb-4 flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /> Time Spent Per Question</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.timePerQuestion.map((t, i) => ({ q: `Q${i + 1}`, seconds: Math.round(t) }))}>
                  <XAxis dataKey="q" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip /><Bar dataKey="seconds" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Seconds" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold font-display mb-4">Answer Review</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, i) => {
              const isUnanswered = answers[i] === undefined;
              const isCorrect = answers[i] === q.correctAnswer;
              const timeSpent = Math.round(result.timePerQuestion[i] || 0);
              return (
                <div key={i} className={`p-4 rounded-xl border ${isUnanswered ? 'border-destructive/30 bg-destructive/5' : isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm flex-1">Q{i + 1}. {q.question}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{timeSpent}s</span>
                  </div>
                  <p className="text-xs mt-1 text-green-600">✅ Correct: {String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}</p>
                  {!isUnanswered && !isCorrect && (
                    <p className="text-xs text-destructive">❌ Your answer: {String.fromCharCode(65 + answers[i])}. {q.options[answers[i]]}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">💡 {q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Button variant="hero" size="xl" className="w-full" onClick={() => { setState('config'); setResult(null); }}>
          <Sparkles className="w-4 h-4 mr-2" /> Take Another Test
        </Button>
      </div>
    );
  }

  // Config
  const availableChapters = classLevel !== 'Full' && subject !== 'Full' ? SYLLABUS[examType]?.[classLevel]?.[subject] || [] : [];
  const currentConfig = getTestConfig();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <TutorialOverlay />
      {showSelector && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-card border border-border rounded-2xl p-6 w-[90%] max-w-md animate-in fade-in zoom-in">

      <h2 className="text-lg font-bold mb-4 text-center">Custom Question Selector</h2>

      <div className="flex gap-3 justify-center mb-6">
        {[10, 15, 20].map((num) => (
          <button
            key={num}
            onClick={() => setQuestionCount(num)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              questionCount === num
                ? 'bg-primary text-white shadow-md'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setShowSelector(false)}
          className="text-sm text-muted-foreground"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowSelector(false);
            startTest();
          }}
          className="bg-primary text-white px-4 py-2 rounded-xl"
        >
          Start Test
        </button>
      </div>

    </div>
  
)}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-display">AI <span className="text-gradient">Mock Tests</span> 🎯</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="How it works">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
        <p className="text-muted-foreground">Practice with AI-generated CBT-mode tests matching actual exam patterns.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">Exam Type</label>
          <div className="flex gap-3">
            {(['JEE', 'NEET'] as const).map((item) => (
              <Button key={item} variant={examType === item ? 'default' : 'outline'} size="lg" className="flex-1"
                onClick={() => { setExamType(item); setSubject('Full'); setChapter('Full'); }}>{item}</Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Class / Scope</label>
          <div className="flex gap-2">
            {(['11th', '12th', 'Full'] as const).map((item) => (
              <Button key={item} variant={classLevel === item ? 'default' : 'outline'} size="sm" className="flex-1"
                onClick={() => { setClassLevel(item); setSubject('Full'); setChapter('Full'); }}>
                {item === 'Full' ? `Complete ${examType}` : `Class ${item}`}
              </Button>
            ))}
          </div>
        </div>

        {classLevel !== 'Full' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              <Button variant={subject === 'Full' ? 'default' : 'outline'} size="sm" onClick={() => { setSubject('Full'); setChapter('Full'); }}>All Subjects</Button>
              {subjects.map((item) => (
                <Button key={item} variant={subject === item ? 'default' : 'outline'} size="sm" onClick={() => { setSubject(item); setChapter('Full'); }}>{item}</Button>
              ))}
            </div>
          </div>
        )}

        {availableChapters.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">Chapter</label>
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
              <Button variant={chapter === 'Full' ? 'default' : 'outline'} size="sm" onClick={() => setChapter('Full')}>All Chapters</Button>
              {availableChapters.map((item) => (
                <Button key={item} variant={chapter === item ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setChapter(item)}>{item}</Button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
          <p><strong>Pattern:</strong> +4 correct, -1 incorrect, 0 unanswered</p>
          <p><strong>Duration:</strong> {formatTime(currentConfig.duration)}</p>
          <p><strong>Questions:</strong> {currentConfig.numQ} | <strong>Total Marks:</strong> {currentConfig.totalMarks}</p>
        </div>

        <Button variant="hero" size="xl" className="w-full" onClick={() => {
  if (chapter !== 'Full') {
    setShowSelector(true);
  } else {
    startTest();
  }
}}
          <FlaskConical className="w-5 h-5 mr-2" /> Start Test
        </Button>
      </motion.div>
    </div>
  );
}

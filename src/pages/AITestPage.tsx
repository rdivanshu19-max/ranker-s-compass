import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { FlaskConical, Clock, CheckCircle, XCircle, MinusCircle, Flag, ArrowRight, BarChart3, Trophy } from 'lucide-react';
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
    }
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
    }
  }
};

type TestState = 'config' | 'loading' | 'test' | 'result';
type Question = { id: number; question: string; options: string[]; correctAnswer: number; explanation: string; subject: string; chapter?: string };

export default function AITestPage() {
  const { user } = useAuth();
  const [state, setState] = useState<TestState>('config');
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('JEE');
  const [classLevel, setClassLevel] = useState<'11th' | '12th' | 'Full'>('11th');
  const [subject, setSubject] = useState<string | 'Full'>('Full');
  const [chapter, setChapter] = useState<string | 'Full'>('Full');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);

  const subjects = examType === 'JEE' ? JEE_SUBJECTS : NEET_SUBJECTS;

  const getTestConfig = () => {
    const isFullExam = classLevel === 'Full' && subject === 'Full';
    const isFullSubject = subject !== 'Full' && chapter === 'Full';
    
    let numQ = 10;
    let totalMarks = 40;
    let duration = 20 * 60; // 20 mins

    if (isFullExam) {
      if (examType === 'JEE') { numQ = 75; totalMarks = 300; duration = 3 * 60 * 60; }
      else { numQ = 180; totalMarks = 720; duration = 3 * 60 * 60; }
    } else if (isFullSubject) {
      if (examType === 'JEE') { numQ = 25; totalMarks = 100; duration = 60 * 60; }
      else if (subject === 'Biology') { numQ = 90; totalMarks = 360; duration = 90 * 60; }
      else { numQ = 45; totalMarks = 180; duration = 45 * 60; }
    } else if (classLevel !== 'Full' && subject === 'Full') {
      numQ = 30; totalMarks = 120; duration = 60 * 60;
    }

    return { numQ, totalMarks, duration };
  };

  const startTest = async () => {
    setState('loading');
    const { numQ, duration } = getTestConfig();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          examType,
          subject: subject === 'Full' ? null : subject,
          chapter: chapter === 'Full' ? null : chapter,
          numQuestions: Math.min(numQ, 25), // Cap at 25 per request for speed
        }
      });
      
      if (error) throw error;
      if (!data?.questions) throw new Error('No questions generated');

      setQuestions(data.questions);
      setAnswers({});
      setMarkedForReview(new Set());
      setCurrentQ(0);
      setTimeLeft(duration);
      setState('test');

      // Start timer
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(interval); submitTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      toast.error('Failed to generate test: ' + (e.message || 'Try again'));
      setState('config');
    }
  };

  const submitTest = async () => {
    let correct = 0, incorrect = 0, unanswered = 0;
    const subjectScores: Record<string, { correct: number; incorrect: number; total: number }> = {};

    questions.forEach((q, i) => {
      const subj = q.subject || 'General';
      if (!subjectScores[subj]) subjectScores[subj] = { correct: 0, incorrect: 0, total: 0 };
      subjectScores[subj].total++;

      if (answers[i] === undefined) { unanswered++; }
      else if (answers[i] === q.correctAnswer) { correct++; subjectScores[subj].correct++; }
      else { incorrect++; subjectScores[subj].incorrect++; }
    });

    const marksPerCorrect = 4;
    const negativePerWrong = 1;
    const obtained = (correct * marksPerCorrect) - (incorrect * negativePerWrong);
    const total = questions.length * marksPerCorrect;
    const negativeMks = incorrect * negativePerWrong;

    const res = { correct, incorrect, unanswered, obtained, total, negativeMarks: negativeMks, subjectScores, attempted: correct + incorrect };
    setResult(res);
    setState('result');

    // Save to DB
    if (user) {
      await supabase.from('test_results').insert({
        user_id: user.id, exam_type: examType, class: classLevel,
        subject: subject === 'Full' ? null : subject, chapter: chapter === 'Full' ? null : chapter,
        total_marks: total, obtained_marks: obtained, total_questions: questions.length,
        attempted: res.attempted, correct, incorrect, unanswered,
        negative_marks: negativeMks, subject_scores: subjectScores,
        duration_seconds: getTestConfig().duration - timeLeft
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
    setMarkedForReview(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-lg font-bold font-display">Generating your test...</p>
        <p className="text-muted-foreground">AI is crafting questions matching {examType} pattern</p>
      </div>
    );
  }

  if (state === 'test') {
    const q = questions[currentQ];
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <span className="font-bold font-display">{examType} Test</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              <Clock className="w-4 h-4 inline mr-1" />{formatTime(timeLeft)}
            </span>
            <Button variant="destructive" size="sm" onClick={submitTest}>Submit Test</Button>
          </div>
        </div>

        {/* Question nav */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentQ ? 'bg-primary text-primary-foreground' :
                markedForReview.has(i) ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500' :
                answers[i] !== undefined ? 'bg-green-500/20 text-green-600 border border-green-500' :
                'bg-muted text-muted-foreground'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        {q && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q.subject}</span>
              <button onClick={() => toggleReview(currentQ)}
                className={`text-xs flex items-center gap-1 ${markedForReview.has(currentQ) ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                <Flag className="w-3 h-3" /> {markedForReview.has(currentQ) ? 'Marked' : 'Mark for Review'}
              </button>
            </div>
            <h3 className="text-lg font-medium">Q{currentQ + 1}. {q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: oi }))}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    answers[currentQ] === oi ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50'
                  }`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}>Previous</Button>
          <Button onClick={() => setCurrentQ(p => Math.min(questions.length - 1, p + 1))} disabled={currentQ === questions.length - 1}>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>✅ Answered: {Object.keys(answers).length}</span>
          <span>⬜ Unanswered: {questions.length - Object.keys(answers).length}</span>
          <span>🟡 Review: {markedForReview.size}</span>
        </div>
      </div>
    );
  }

  if (state === 'result' && result) {
    const pieData = [
      { name: 'Correct', value: result.correct, color: '#22c55e' },
      { name: 'Incorrect', value: result.incorrect, color: '#ef4444' },
      { name: 'Unanswered', value: result.unanswered, color: '#6b7280' },
    ];
    const subjectData = Object.entries(result.subjectScores as Record<string, any>).map(([name, v]) => ({
      name, correct: v.correct * 4, incorrect: -(v.incorrect * 1), total: v.total * 4
    }));
    const percentage = Math.round((result.obtained / result.total) * 100);

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${percentage >= 60 ? 'text-yellow-500' : percentage >= 40 ? 'text-primary' : 'text-muted-foreground'}`} />
          <h1 className="text-4xl font-bold font-display mb-2">Test Complete!</h1>
          <div className="text-5xl font-bold font-display text-gradient">{result.obtained}/{result.total}</div>
          <p className="text-muted-foreground mt-2">{percentage >= 60 ? 'Excellent work! 🎉' : percentage >= 40 ? 'Good effort! Keep going! 💪' : 'Keep practicing! You got this! 📚'}</p>
        </motion.div>

        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { label: 'Attempted', value: result.attempted, icon: CheckCircle, color: 'text-blue-500' },
            { label: 'Correct', value: result.correct, icon: CheckCircle, color: 'text-green-500' },
            { label: 'Incorrect', value: result.incorrect, icon: XCircle, color: 'text-red-500' },
            { label: 'Negative', value: `-${result.negativeMarks}`, icon: MinusCircle, color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
              <div className="text-2xl font-bold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold font-display mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold font-display mb-4">Subject Analysis</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="correct" fill="#22c55e" name="Marks" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Review answers */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold font-display mb-4">Answer Review</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;
              const isUnanswered = answers[i] === undefined;
              return (
                <div key={i} className={`p-4 rounded-xl border ${isUnanswered ? 'border-muted' : isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className="font-medium text-sm">Q{i + 1}. {q.question}</p>
                  <p className="text-xs mt-1 text-green-600">✅ Correct: {String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}</p>
                  {!isUnanswered && !isCorrect && (
                    <p className="text-xs text-red-500">❌ Your answer: {String.fromCharCode(65 + answers[i])}. {q.options[answers[i]]}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">💡 {q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Button variant="hero" size="lg" className="w-full" onClick={() => { setState('config'); setResult(null); }}>
          Take Another Test
        </Button>
      </div>
    );
  }

  // Config state
  const availableChapters = classLevel !== 'Full' && subject !== 'Full' ? SYLLABUS[examType]?.[classLevel]?.[subject] || [] : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">AI <span className="text-gradient">Mock Tests</span> 🎯</h1>
        <p className="text-muted-foreground mt-1">Practice with AI-generated CBT-mode tests matching actual exam patterns</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-5">
        {/* Exam Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Exam Type</label>
          <div className="flex gap-3">
            {(['JEE', 'NEET'] as const).map(e => (
              <Button key={e} variant={examType === e ? 'default' : 'outline'} size="lg" className="flex-1"
                onClick={() => { setExamType(e); setSubject('Full'); setChapter('Full'); }}>
                {e}
              </Button>
            ))}
          </div>
        </div>

        {/* Class */}
        <div>
          <label className="text-sm font-medium mb-2 block">Class / Scope</label>
          <div className="flex gap-2">
            {(['11th', '12th', 'Full'] as const).map(c => (
              <Button key={c} variant={classLevel === c ? 'default' : 'outline'} size="sm" className="flex-1"
                onClick={() => { setClassLevel(c); setSubject('Full'); setChapter('Full'); }}>
                {c === 'Full' ? `Complete ${examType}` : `Class ${c}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Subject */}
        {classLevel !== 'Full' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              <Button variant={subject === 'Full' ? 'default' : 'outline'} size="sm"
                onClick={() => { setSubject('Full'); setChapter('Full'); }}>All Subjects</Button>
              {subjects.map(s => (
                <Button key={s} variant={subject === s ? 'default' : 'outline'} size="sm"
                  onClick={() => { setSubject(s); setChapter('Full'); }}>{s}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Chapter */}
        {availableChapters.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">Chapter</label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              <Button variant={chapter === 'Full' ? 'default' : 'outline'} size="sm" onClick={() => setChapter('Full')}>All Chapters</Button>
              {availableChapters.map(c => (
                <Button key={c} variant={chapter === c ? 'default' : 'outline'} size="sm" onClick={() => setChapter(c)}
                  className="text-xs">{c}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Test info */}
        <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
          <p><strong>Pattern:</strong> +4 for correct, -1 for incorrect, 0 for unanswered</p>
          <p><strong>Duration:</strong> {formatTime(getTestConfig().duration)}</p>
          <p><strong>Questions:</strong> {getTestConfig().numQ} | <strong>Total Marks:</strong> {getTestConfig().totalMarks}</p>
        </div>

        <Button variant="hero" size="xl" className="w-full" onClick={startTest}>
          <FlaskConical className="w-5 h-5 mr-2" /> Start Test
        </Button>
      </motion.div>
    </div>
  );
}

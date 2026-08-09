import { Infinity as InfinityIcon, Atom, FlaskConical, FileText, Layers, GraduationCap, type LucideIcon } from 'lucide-react';

export type PracticePack = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  icon: LucideIcon;
  accent: string; // tailwind gradient classes for the icon tile
  meta: { label: string; value: string }[];
  points: string[];
  cta: string;
};

export const PRACTICE_PACKS: PracticePack[] = [
  {
    slug: 'adaptive-maths',
    name: 'Adaptive Maths · Infinite Practice',
    tagline: 'Never run out of questions again.',
    description:
      'An endless, self-adjusting Maths question bank. Difficulty moves with your accuracy so every question lands right at your level.',
    url: 'https://www.acrolly.com/dashboard/adaptive-questions',
    icon: InfinityIcon,
    accent: 'from-indigo-500 to-violet-500',
    meta: [
      { label: 'Subject', value: 'Mathematics' },
      { label: 'Questions', value: 'Unlimited' },
      { label: 'Mode', value: 'Adaptive · Level based' },
    ],
    points: [
      'Difficulty adapts to you in real time',
      'Step-by-step solutions on every question',
      'Practice chapter-wise or full syllabus',
    ],
    cta: 'Start Practice',
  },
  {
    slug: 'adaptive-physics',
    name: 'Physics · Infinite Skills',
    tagline: 'Build concept muscle, question by question.',
    description:
      'Endless Physics drilling that keeps pushing your level up — from base concepts to exam-grade multi-step problems.',
    url: 'https://www.acrolly.com/dashboard/adaptive-questions?subject=Physics',
    icon: Atom,
    accent: 'from-sky-500 to-cyan-400',
    meta: [
      { label: 'Subject', value: 'Physics' },
      { label: 'Questions', value: 'Unlimited' },
      { label: 'Mode', value: 'Adaptive · Level based' },
    ],
    points: [
      'Concept-first progression, no random grinding',
      'Instant worked solutions',
      'Tracks weak chapters automatically',
    ],
    cta: 'Start Practice',
  },
  {
    slug: 'adaptive-chemistry',
    name: 'Chemistry · Infinite Practice',
    tagline: 'Physical, Organic and Inorganic — all covered.',
    description:
      'A continuous Chemistry practice engine that mixes reaction logic, numericals and factual recall at exactly your level.',
    url: 'https://www.acrolly.com/dashboard/adaptive-questions?subject=Chemistry',
    icon: FlaskConical,
    accent: 'from-emerald-500 to-teal-400',
    meta: [
      { label: 'Subject', value: 'Chemistry' },
      { label: 'Questions', value: 'Unlimited' },
      { label: 'Mode', value: 'Adaptive · Level based' },
    ],
    points: [
      'All three branches in one flow',
      'Reaction-wise and numerical practice',
      'Detailed explanations for every answer',
    ],
    cta: 'Start Practice',
  },
  {
    slug: 'full-syllabus-tests',
    name: 'Full Syllabus Tests · JEE Main & Advanced',
    tagline: 'Every shift. Every year. Real exam pressure.',
    description:
      'Attempt full-length, timed papers in an official-style CBT interface — scored instantly and ready to review.',
    url: 'https://www.acrolly.com/full-test-selection',
    icon: FileText,
    accent: 'from-blue-500 to-indigo-500',
    meta: [
      { label: 'Exams', value: 'Main & Advanced' },
      { label: 'Papers', value: 'All sessions & shifts' },
      { label: 'Duration', value: '180 min · timed' },
    ],
    points: [
      'Official CBT-style exam interface',
      'Detailed step-by-step solutions',
      'Exam mode or practice mode — with or without timer',
    ],
    cta: 'Attempt Now',
  },
  {
    slug: 'chapter-wise-tests',
    name: 'Chapter-wise Tests · JEE Main & Advanced',
    tagline: 'Finish a chapter, prove you own it.',
    description:
      'Targeted chapter tests to lock in what you just studied, with instant scoring and mistake-level review.',
    url: 'https://www.acrolly.com/chapter-selection',
    icon: Layers,
    accent: 'from-amber-500 to-orange-500',
    meta: [
      { label: 'Scope', value: 'Chapter-wise' },
      { label: 'Subjects', value: 'PCM' },
      { label: 'Duration', value: 'Short · focused' },
    ],
    points: [
      'One chapter at a time, zero noise',
      'Instant score and accuracy breakdown',
      'Perfect right after a lecture or revision',
    ],
    cta: 'Take Test',
  },
  {
    slug: 'complete-study',
    name: 'Complete Study · AI + Teacher Experience',
    tagline: 'Learn a chapter end-to-end, guided.',
    description:
      'Study any chapter with an AI tutor that explains like a real teacher — concept walkthroughs, doubts and practice in one continuous flow.',
    url: 'https://www.acrolly.com/dashboard/ai-tutor',
    icon: GraduationCap,
    accent: 'from-fuchsia-500 to-violet-500',
    meta: [
      { label: 'Format', value: 'Guided chapter study' },
      { label: 'Support', value: 'AI tutor · 24×7' },
      { label: 'Subjects', value: 'Physics · Chem · Maths' },
    ],
    points: [
      'Teacher-style concept explanations',
      'Ask doubts mid-chapter and continue',
      'Practice suggested right after each concept',
    ],
    cta: 'Start Studying',
  },
];

export const findPack = (slug?: string) => PRACTICE_PACKS.find(p => p.slug === slug);

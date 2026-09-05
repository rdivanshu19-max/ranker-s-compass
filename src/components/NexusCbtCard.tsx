import { motion } from 'framer-motion';
import { ArrowUpRight, FileDown, Brain, Timer, BarChart3, FileText, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LINKS } from '@/lib/links';

const FEATURES = [
  { icon: Timer, label: 'Real exam-like timed CBT interface' },
  { icon: Layers, label: 'Chapter, topic & full-syllabus tests (easy → advanced)' },
  { icon: BarChart3, label: 'Deep performance analytics & downloadable report cards' },
  { icon: FileText, label: 'PDF → test converter and custom test builder' },
  { icon: Brain, label: 'AI-made notes, flashcards & AI doubt support' },
  { icon: FileDown, label: 'Download question papers + dedicated revision section' },
];

/** Promotion card for our own test platform, Nexus CBT. */
export default function NexusCbtCard({ className = '' }: { className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-primary/30 bg-card/60 p-5 backdrop-blur-xl sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src="/nexus-cbt-logo.png"
          alt="Nexus CBT logo"
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-2xl object-contain drop-shadow-2xl sm:h-28 sm:w-28"
        />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Our dedicated test platform
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">Nexus CBT</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Practice unlimited multi-chapter and multi-topic tests, build your own paper from a PDF, and revise smarter with AI.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {FEATURES.map(f => (
              <li key={f.label} className="flex items-start gap-2 text-xs text-muted-foreground">
                <f.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-5 gap-1.5 rounded-xl">
            <a href={LINKS.nexusCbt} target="_blank" rel="noopener noreferrer">
              Start practising on Nexus CBT <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

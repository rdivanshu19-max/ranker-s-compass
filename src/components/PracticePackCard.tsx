import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PracticePack } from '@/lib/practicePacks';

export default function PracticePackCard({ pack, index = 0 }: { pack: PracticePack; index?: number }) {
  const navigate = useNavigate();
  const Icon = pack.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/45 hover:shadow-[0_28px_70px_-40px_hsl(var(--primary)/0.8)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${pack.accent} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Free
        </span>
      </div>

      <h3 className="relative mt-6 font-display text-2xl font-bold leading-tight tracking-tight">{pack.name}</h3>
      <p className="relative mt-1.5 text-sm font-medium text-muted-foreground">{pack.tagline}</p>
      <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">{pack.description}</p>

      <div className="relative mt-6 grid gap-2.5 sm:grid-cols-3">
        {pack.meta.map(m => (
          <div key={m.label} className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-sm font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      <ul className="relative mt-6 space-y-2.5">
        {pack.points.map(p => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {p}
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate(`/app/practice/${pack.slug}`)}
        className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
      >
        {pack.cta}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </motion.article>
  );
}

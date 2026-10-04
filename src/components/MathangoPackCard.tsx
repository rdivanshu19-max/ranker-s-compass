import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MathangoPackCard() {
  const navigate = useNavigate();
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl transition-all duration-300 hover:border-primary/45 hover:shadow-[0_28px_70px_-40px_hsl(var(--primary)/0.8)] sm:p-6">
      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
          <ClipboardList className="h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Free
        </span>
      </div>
      <h3 className="relative mt-4 font-display text-xl font-bold leading-tight tracking-tight">Mathango 2027 · QFTs</h3>
      <p className="relative mt-1.5 text-sm font-medium text-muted-foreground">Six full-syllabus mocks in real CBT view.</p>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">Full-syllabus JEE Main QFTs covering Physics, Chemistry &amp; Mathematics. QPT 1 is open now — a new test unlocks every Sunday.</p>
      <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
        {[['Tests', '6 QFTs'], ['Pattern', '75 Qs · 300 marks'], ['Mode', 'Desktop CBT']].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{l}</p>
            <p className="mt-1 text-sm font-bold">{v}</p>
          </div>
        ))}
      </div>
      <ul className="relative mt-4 space-y-1.5">
        {['Real exam CBT interface', '180 minutes per full test', 'New test every Sunday'].map(p => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{p}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/app/mathango')}
        className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-transform duration-300 hover:-translate-y-0.5">
        View Tests <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </article>
  );
}

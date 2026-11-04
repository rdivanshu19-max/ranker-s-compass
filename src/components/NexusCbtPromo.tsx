import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LINKS } from '@/lib/links';
import { ArrowUpRight, Zap, BellRing, Check } from 'lucide-react';

const KEY = 'rs-nexus-promo-next';
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** High-impact Nexus CBT promo: opens a few minutes into a session, then re-surfaces every few hours. */
export default function NexusCbtPromo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, String(Date.now() + rand(1.5, 4) * 60_000));
    const check = () => {
      const next = Number(localStorage.getItem(KEY) || 0);
      if (Date.now() >= next && !document.querySelector('[role="dialog"]')) {
        localStorage.setItem(KEY, String(Date.now() + rand(2.5, 4) * 60 * 60_000));
        setOpen(true);
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  const close = () => { localStorage.setItem(KEY, String(Date.now() + rand(2.5, 4) * 60 * 60_000)); setOpen(false); };

  return (
    <Dialog open={open} onOpenChange={o => !o && close()}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-2 border-white/15 bg-[hsl(222_47%_11%)] p-0 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[hsl(45_96%_53%)]/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative px-6 pb-6 pt-8 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/nexus-cbt-logo.png" alt="Nexus CBT" className="h-14 w-14 rounded-2xl bg-white/95 object-contain p-1.5 shadow-lg" />
            <div>
              <p className="font-['Space_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(45_96%_53%)]">our flagship app · live now</p>
              <DialogTitle className="font-display text-2xl font-black tracking-tight text-white">Nexus CBT</DialogTitle>
            </div>
          </div>

          <DialogDescription asChild>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              The next-generation exam engine from Rankers Star — unlimited custom CBTs, PDF-to-test builder, deep analytics and AI revision.
              This is where Rankers Star is heading. Everything crazy lands here first.
            </p>
          </DialogDescription>

          <div className="mt-4 rounded-2xl border border-[hsl(45_96%_53%)]/40 bg-[hsl(45_96%_53%)]/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-[hsl(45_96%_53%)]">
              <Zap className="h-4 w-4" /> ONLY 10 FOUNDING SEATS
            </p>
            <p className="mt-1 text-xs text-white/70">The first 10 students who join get early access to every new drop before it goes public.</p>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs text-white/75">
            {['Unlimited chapter, topic & full-syllabus CBTs', 'Turn any PDF into a real timed test', 'Report cards, analytics & AI-made revision'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-[hsl(45_96%_53%)]" /> {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2">
            <Button asChild className="h-12 gap-2 rounded-xl bg-[hsl(45_96%_53%)] font-bold text-[hsl(222_47%_11%)] hover:bg-[hsl(45_96%_60%)]">
              <a href={LINKS.nexusCbt} target="_blank" rel="noopener noreferrer">
                Claim your founding seat <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 gap-2 rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                <BellRing className="h-4 w-4" /> Get update alerts on WhatsApp
              </a>
            </Button>
            <button onClick={close} className="mx-auto mt-1 text-[11px] font-['Space_Mono',monospace] uppercase tracking-widest text-white/40 hover:text-white/70">
              Remind me later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

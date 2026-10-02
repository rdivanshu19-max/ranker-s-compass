import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Lock, Monitor, PlayCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MATHANGO_TESTS, countdown, isUnlocked, tryUnlockCode } from '@/lib/mathango';

export default function MathangoPage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [codeError, setCodeError] = useState('');
  const submit = async () => {
    if (await tryUnlockCode(code)) {
      toast.success('Mathango tests unlocked'); setCode(''); setCodeError(''); setShowCode(false); setDialogOpen(false); setNow(Date.now());
    } else { setCodeError('Incorrect code. Please try again.'); toast.error('Incorrect code'); }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/app/test-series')}>
        <ArrowLeft className="h-4 w-4" /> Test Series
      </Button>

      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
        <Monitor className="h-5 w-5 shrink-0 text-primary" />
        <p><span className="font-semibold">Mathango 2027</span> — Use Desktop Site View for Better Experience.</p>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Mathango 2027 · QFTs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Six full-syllabus mocks in desktop CBT view. One new test unlocks every Sunday.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {MATHANGO_TESTS.map((t, i) => {
          const open = isUnlocked(t, now);
          return (
            <motion.div key={t.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl sm:p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
                    {String(t.n).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Full Test</p>
                    <h2 className="font-display text-lg font-bold sm:text-xl">{t.name}</h2>
                  </div>
                </div>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary">FREE</span>
              </div>

              <div className="relative mt-5 grid grid-cols-3 gap-2.5">
                {[['Time', '180 min'], ['Qs', '75'], ['Marks', '300']].map(([l, v]) => (
                  <div key={l} className="rounded-2xl border border-border/70 bg-background/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{l}</p>
                    <p className="text-sm font-semibold">{v}</p>
                  </div>
                ))}
              </div>

              <p className="relative mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Syllabus
              </p>
              <div className="relative mt-2 rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-3 text-sm">
                Mathango 2027 full-syllabus QFT — Physics, Chemistry &amp; Mathematics.
              </div>

              <div className="relative mt-5">
                {open ? (
                  <Button className="h-12 w-full gap-2 rounded-xl text-base" onClick={() => navigate(`/app/mathango/${t.n}`)}>
                    <PlayCircle className="h-5 w-5" /> Start Test <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-center">
                    <p className="flex items-center justify-center gap-2 font-semibold text-destructive"><Lock className="h-4 w-4" /> Locked</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Live on {new Date(t.unlockAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                      <span className="font-semibold text-foreground">{countdown(t.unlockAt - now)}</span>
                    </p>
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setCode(''); setCodeError(''); setDialogOpen(true); }}>
                      <KeyRound className="h-3.5 w-3.5" /> Unlock with Code
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock with Code</DialogTitle>
            <DialogDescription>Enter your unlock code to access the locked Mathango 2027 tests.</DialogDescription>
          </DialogHeader>
          <Input autoFocus value={code} onChange={e => { setCode(e.target.value); setCodeError(''); }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Unlock code" />
          {codeError && <p className="text-sm text-destructive">{codeError}</p>}
          <Button onClick={submit} disabled={!code.trim()}>Unlock</Button>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        {showCode ? (
          <div className="flex w-full max-w-xs gap-2">
            <Input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Access code" type="password" />
            <Button variant="outline" onClick={submit}>Unlock</Button>
          </div>
        ) : (
          <button aria-label="Access code" onClick={() => setShowCode(true)} className="p-2 text-muted-foreground/30 hover:text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

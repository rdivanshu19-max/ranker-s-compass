import { useEffect, useState } from 'react';
import { Send, MessageCircle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LINKS } from '@/lib/links';

const KEY = 'rs-join-popup-next';
const MIN = 60_000;
const rand = (a: number, b: number) => (a + Math.random() * (b - a)) * MIN;
const schedule = (ms: number) => localStorage.setItem(KEY, String(Date.now() + ms));

/** Occasional Telegram + WhatsApp join prompt: ~every 1–2h (randomized), longer after "I Have Joined". */
export default function JoinChannelsPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) schedule(rand(3, 8)); // first prompt a few minutes into the first visit
    const check = () => {
      const next = Number(localStorage.getItem(KEY) || 0);
      if (Date.now() >= next && !document.querySelector('[role="dialog"]')) {
        schedule(rand(60, 120)); // reserve next slot immediately so other tabs don't also show it
        setOpen(true);
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  const close = () => { schedule(rand(60, 120)); setOpen(false); };
  const joined = () => { schedule(rand(3 * 24 * 60, 5 * 24 * 60)); setOpen(false); };

  return (
    <Dialog open={open} onOpenChange={o => !o && close()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogTitle className="text-2xl font-black">Don't miss free drops 📚</DialogTitle>
        <DialogDescription>Join our channels for daily lectures, PYQs, test alerts and launch news.</DialogDescription>
        <div className="grid gap-3">
          <Button asChild className="h-12 gap-2 rounded-xl">
            <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer"><Send className="h-4 w-4" /> Join Telegram</a>
          </Button>
          <Button asChild variant="outline" className="h-12 gap-2 rounded-xl">
            <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Join WhatsApp Channel</a>
          </Button>
          <Button variant="ghost" onClick={joined} className="gap-2"><Check className="h-4 w-4" /> I Have Joined</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

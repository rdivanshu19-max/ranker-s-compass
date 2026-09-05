import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Send, MessageCircle, MonitorCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LINKS } from '@/lib/links';

/** Logos live in /public so they resolve on every host (Lovable preview and Vercel). */
const EDGE_LOGO = '/rankers-edge-logo.png';
const NEXUS_LOGO = '/nexus-cbt-logo.png';

type Slide = {
  id: string;
  tag: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  icon: typeof Sparkles;
  /** tailwind gradient classes for the banner artwork */
  art: string;
  logo?: string;
  logoAlt?: string;
};

const slides: Slide[] = [
  {
    id: 'edge',
    tag: 'RECOMMENDED BY RANKERS STAR',
    title: 'Rankers Edge — the obsessive prep cockpit',
    desc: 'Endless adaptive Maths, year-vaulted PYQs, pattern-true mocks and a live AI tutor that renders real math — not chatty fluff.',
    cta: 'Open Rankers Edge',
    href: LINKS.rankersEdge,
    icon: Sparkles,
    art: 'from-indigo-600/40 via-violet-600/25 to-transparent',
    logo: EDGE_LOGO,
    logoAlt: 'Rankers Edge logo',
  },
  {
    id: 'nexus',
    tag: 'OUR DEDICATED TEST PLATFORM',
    title: 'Nexus CBT — real exam-like testing, built by us',
    desc: 'Chapter, topic and full-syllabus tests at easy to advanced levels, a real CBT interface with timers, deep performance analytics, downloadable question papers and report cards, custom tests from your own PDFs, AI-made notes, flashcards, AI doubt support and a dedicated revision section.',
    cta: 'Practice on Nexus CBT',
    href: LINKS.nexusCbt,
    icon: MonitorCheck,
    art: 'from-violet-700/45 via-purple-600/25 to-transparent',
    logo: NEXUS_LOGO,
    logoAlt: 'Nexus CBT logo',
  },
  {
    id: 'whatsapp',
    tag: 'INSTANT UPDATES',
    title: 'Join our WhatsApp Channel',
    desc: 'Batch drops, test alerts and launch news — straight to your phone, zero spam.',
    cta: 'Join Free',
    href: LINKS.whatsapp,
    icon: MessageCircle,
    art: 'from-emerald-500/40 via-emerald-500/15 to-transparent',
  },
  {
    id: 'telegram',
    tag: 'DAILY MATERIAL DROPS',
    title: 'Rankers Star on Telegram',
    desc: 'Lectures, books, PYQs and notes posted daily for JEE, NEET and Boards — completely free.',
    cta: 'Join Telegram',
    href: LINKS.telegram,
    icon: Send,
    art: 'from-sky-500/40 via-sky-500/15 to-transparent',
  },
];

export default function PromoBanners() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <section className="relative overflow-hidden bg-hero py-12 sm:py-16">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="relative mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 p-6 backdrop-blur-xl sm:p-10"
            >
              <div className={`pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l ${slide.art}`} />
              {slide.logo && (
                <img
                  src={slide.logo}
                  alt="Rankers Edge"
                  loading="lazy"
                  className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-40 mix-blend-screen sm:block"
                />
              )}
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  <Icon className="h-3.5 w-3.5" /> {slide.tag}
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                  {slide.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{slide.desc}</p>
                <Button variant="hero" size="lg" asChild className="mt-6 w-full sm:w-auto">
                  <a href={slide.href} target="_blank" rel="noopener noreferrer">
                    {slide.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full border border-white/10 text-white"
              onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)} aria-label="Previous promotion">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => setIndex(i)} aria-label={`Show ${s.title}`}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : 'w-2.5 bg-primary/30'}`} />
              ))}
            </div>
            <Button variant="ghost" size="icon" className="rounded-full border border-white/10 text-white"
              onClick={() => setIndex(i => (i + 1) % slides.length)} aria-label="Next promotion">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

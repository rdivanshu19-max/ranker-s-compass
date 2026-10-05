import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUp, MessageCircle, Search, Info, ChevronDown, Star } from 'lucide-react';
import study from '@/assets/rv-study.jpg';
import night from '@/assets/rv-night.jpg';
import books from '@/assets/rv-books.jpg';
import win from '@/assets/rv-win.jpg';

const mono = "font-['Space_Mono',monospace]";
const hand = "font-['Kalam',cursive]";
const hl = 'bg-[hsl(var(--highlight))]';
const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

const Photo = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => (
  <div className={`rounded-2xl border-[6px] border-card bg-card shadow-[var(--shadow-card)] ${className}`}>
    <img src={src} alt={alt} loading="lazy" width={816} height={816} className="h-full w-full rounded-xl object-cover" />
  </div>
);

export function RVHero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pt-28">
      <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className={`inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold tracking-[0.12em] shadow-sm ${mono}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${hl}`} /> THE JOYFUL SIDE OF PREP
          </span>
          <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-3.5 text-sm font-semibold sm:text-base">
            Free JEE &amp; NEET materials, AI tests aur mentor — neeche button se shuru karo.
          </div>
          <h1 className="mt-7 text-5xl font-black italic leading-[0.95] tracking-[-0.05em] sm:text-7xl">
            Survive the<br />
            <span className="relative inline-block pl-3 text-primary">syllabus.
              <span className={`absolute -bottom-2 left-0 h-1.5 w-full rounded-full ${hl}`} />
            </span><br />
            <span className="mt-3 inline-block">Keep your sanity.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
            <b className="not-italic text-foreground">Rankers Star</b> is a focused, joyful study hub for JEE &amp; NEET aspirants. Practice smarter, revise with clarity, and keep moving toward your next rank{' '}
            <span className={`not-italic text-foreground ${hand} text-2xl font-bold`}>without losing your mind.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-base font-bold text-background shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
              Open Rankers Star <ArrowRight className="h-5 w-5" />
            </button>
            <span className={`text-sm italic text-muted-foreground ${mono}`}>Because 10 hours a day<br />deserves a better hub.</span>
          </div>
        </motion.div>

        {/* Phone mock */}
        <motion.div initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto w-full max-w-[340px]">
          <div className="absolute -inset-10 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative rounded-[3rem] border-[10px] border-foreground bg-foreground p-1 shadow-2xl">
            <div className="mx-auto mb-2 h-6 w-32 rounded-b-2xl bg-foreground" />
            <div className="min-h-[460px] rounded-[2.2rem] bg-[hsl(var(--hero-bg))] p-3 text-background">
              <div className={`rounded-full bg-background/10 px-3 py-1.5 text-[10px] ${mono}`}>● rankers-stars.vercel.app</div>
              <div className="mt-2 h-1 rounded-full bg-primary" />
              <div className="mt-3 flex items-center gap-2 text-[10px]">
                <b className="text-sm">JEE</b>
                {['Dropper', '12th', 'ADV', 'JEE27'].map(t => <span key={t} className="rounded-md bg-background/10 px-1.5 py-0.5">{t}</span>)}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-background/15 px-3 py-2 text-[11px] opacity-70"><Search className="h-3 w-3" /> Search tests…</div>
              <div className="mt-3 flex gap-3 border-b border-background/15 pb-2 text-[11px]">
                <span>Mock 6</span><span>PYQs 403</span><span className="text-primary">Physics 205</span>
              </div>
              <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-3 text-[11px] leading-relaxed">
                <Info className="mb-1 h-3 w-3 text-primary" />
                <b>Mathango 2027</b> — QPT 1–6 full-syllabus CBTs. New test unlocks every Sunday.
              </div>
              {['Physics', 'Chemistry', 'Maths'].map((s, i) => (
                <div key={s} className="mt-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px]">
                  <div><b className="text-primary">{s}</b><p className="opacity-60">{[205, 188, 214][i]} tests</p></div>
                  <ChevronDown className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function RVStages() {
  return (
    <section className="py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div {...reveal}>
          <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">The 6 Stages of Prep.</h2>
          <p className={`mt-2 text-lg text-muted-foreground sm:text-2xl ${mono}`}>(and how we survive them)</p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
          <motion.div {...reveal} className="grid items-center gap-6 rounded-[2rem] border border-border bg-card p-8 shadow-[var(--shadow-card)] sm:grid-cols-[1.4fr_1fr] sm:p-10">
            <div>
              <p className={`text-sm font-bold text-primary ${mono}`}>01 / THE DISTRACTION BATTLE</p>
              <h3 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">When you finally hit that flow state…</h3>
              <p className="mt-4 text-muted-foreground">And suddenly have to fend off your phone, snacks, and the overwhelming urge to take a 'quick' nap. Rankers Star's focus timer keeps you locked in.</p>
            </div>
            <Photo src={study} alt="Student focused while studying" className="rotate-2" />
          </motion.div>

          <motion.div {...reveal} className={`relative rounded-[2rem] ${hl} p-8 text-[hsl(var(--hero-bg))] shadow-[var(--shadow-card)]`}>
            <p className={`text-sm font-bold ${mono}`}>02 / THE DELUSION</p>
            <h3 className="mt-3 text-3xl font-black leading-tight">The 3 AM motivation spike.</h3>
            <Photo src={night} alt="Student studying late at night" className="mx-auto mt-6 w-3/4 -rotate-2" />
            <div className={`-mt-6 relative rotate-1 rounded-2xl bg-card p-4 text-lg text-foreground shadow-lg ${hand}`}>"Organic Chem at 3 AM makes perfect sense."</div>
          </motion.div>
        </div>

        <motion.div {...reveal} className="mt-6 grid items-center overflow-hidden rounded-[2rem] border border-border bg-primary/5 sm:grid-cols-[1.6fr_1fr]">
          <div className="p-8 sm:p-10">
            <p className={`text-sm font-bold text-primary ${mono}`}>03 / THE OVERWHELM</p>
            <h3 className="mt-3 text-4xl font-black sm:text-5xl">Facing the reality.</h3>
            <div className={`mt-6 -rotate-1 rounded-2xl border border-border bg-card p-6 text-lg italic shadow-md ${hand}`}>
              My pending revision pile staring at me while I calculate the absolute minimum marks needed to pass.
            </div>
          </div>
          <img src={books} alt="Student carrying a huge stack of books" loading="lazy" width={816} height={816} className="h-full max-h-[420px] w-full object-cover" />
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <motion.div {...reveal} className="rounded-[2rem] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="relative grid place-items-center rounded-3xl bg-muted p-6">
              <img src={night} alt="Student taking a rest" loading="lazy" width={816} height={816} className="h-56 w-56 rounded-xl object-cover" />
              <span className={`absolute right-6 top-6 rotate-2 rounded-lg ${hl} px-4 py-2 text-lg font-bold text-[hsl(var(--hero-bg))] shadow ${hand}`}>"Just 5 minutes..."</span>
            </div>
            <div className="p-5">
              <p className={`text-sm font-bold text-muted-foreground ${mono}`}>04 / THE DENIAL</p>
              <h3 className="mt-2 text-3xl font-black">The 'productive' rest.</h3>
              <p className="mt-3 text-muted-foreground">Taking a well-deserved, heavily-funded two-hour break after exactly fifteen minutes of intense reading.</p>
            </div>
          </motion.div>

          <motion.div {...reveal} className="grid items-center gap-6 rounded-[2rem] bg-[hsl(var(--hero-bg))] p-8 text-background sm:grid-cols-[1.3fr_1fr]">
            <div>
              <p className={`text-sm font-bold text-[hsl(var(--highlight))] ${mono}`}>05 / THE CONFUSION</p>
              <h3 className="mt-3 text-4xl font-black leading-tight">The math isn't mathing.</h3>
              <p className="mt-5 border-l-4 border-[hsl(var(--highlight))] pl-5 text-background/80">Trying to figure out if my calculator is broken, or if my answer is genuinely just that wrong. Ask RankerPulse AI.</p>
            </div>
            <Photo src={study} alt="Student solving maths" className="rotate-2" />
          </motion.div>
        </div>

        <motion.div {...reveal} className="relative mt-6 grid items-center gap-6 overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground sm:grid-cols-[1.4fr_1fr] sm:p-12">
          <div>
            <span className={`inline-block rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-bold ${mono}`}>06 / THE TRIUMPH</span>
            <h3 className="mt-4 text-5xl font-black leading-none sm:text-7xl">We are<br />victory.</h3>
            <p className="mt-4 max-w-md text-primary-foreground/85">When the result finally lands and every late night was worth it.</p>
          </div>
          <Photo src={win} alt="Student celebrating with a trophy" className="mx-auto w-4/5 -rotate-3" />
          <Star className="absolute right-8 top-8 h-12 w-12 fill-[hsl(var(--highlight))] text-[hsl(var(--highlight))]" />
        </motion.div>
      </div>
    </section>
  );
}

const posts = [
  { user: 'revision_ka_victim', meta: '2 min ago · PROCRASTINATION', up: '2.7K', c: 184, img: study, title: 'Kal se pakka — Day 47.', body: 'Revision planner chaar baar redesign kar liya. Revision abhi bhi beta version mein hai.', tone: 'bg-primary' },
  { user: 'air1_after_midnight', meta: '3:07 AM · NIGHT SHIFT', up: '4.1K', c: 263, img: night, title: '3 AM pe AIR 1 energy.', body: 'Subah 8 baje alarm baja aur motivation ne officially resignation de diya.', tone: 'bg-[hsl(var(--highlight))]' },
  { user: 'syllabus_dlc', meta: 'today · BACKLOG', up: '3.3K', c: 209, img: books, title: 'One-shot dekhne gaya tha...', body: 'YouTube ne teen aur playlists recommend karke pura syllabus DLC unlock kar diya.', tone: 'bg-accent' },
  { user: 'room_temp_ranker', meta: 'result day · RARE', up: '6.8K', c: 521, img: win, title: 'Score room temperature cross kar gaya!', body: 'Family group mein result bhejne layak historical moment finally aa gaya.', tone: 'bg-primary' },
];
const quotes = [
  { user: 'topper_translator', meta: 'just now · TOPPER LOGIC', up: '7.4K', c: 603, q: '"Kuch nahi padha" ka matlab: sirf NCERT, PYQs, modules aur 14 mocks.', title: 'Topper: "Bhai kuch nahi padha."', body: 'Also topper: 99.8 percentile, teen revision aur mistake notebook color-coded.', bg: 'bg-[hsl(var(--highlight)/0.12)]' },
  { user: 'paper_review_expert', meta: 'after mock · DAMAGE CONTROL', up: '5.9K', c: 447, q: 'Marks discuss nahi karenge. User experience solid tha.', title: 'Mummy: Test kaisa gaya?', body: 'Me: Paper ka font bohot readable tha aur invigilator ka nature bhi acha tha.', bg: 'bg-destructive/5' },
];

const Head = ({ user, meta, up, tone = 'bg-primary' }: { user: string; meta: string; up: string; tone?: string }) => (
  <div className="flex items-center justify-between gap-2 p-4">
    <div className="flex items-center gap-3">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone} text-sm font-black text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground))]`}>RS</div>
      <div><p className="font-bold">@{user}</p><p className={`text-[11px] text-muted-foreground ${mono}`}>{meta}</p></div>
    </div>
    <span className={`rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-bold text-primary ${mono}`}>▲ {up}</span>
  </div>
);
const Foot = ({ up, c }: { up: string; c: number }) => (
  <div className={`mt-auto flex items-center justify-between border-t border-border px-5 py-4 text-xs text-muted-foreground ${mono}`}>
    <span className="flex gap-4"><span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" />{up}</span><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c}</span></span>
    <span className="font-bold">Share with batch ↗</span>
  </div>
);

export function RVFeed() {
  const navigate = useNavigate();
  return (
    <section className="py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div {...reveal}>
          <span className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-primary ${mono}`}>● THE PREP FEED</span>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Reddit energy. <span className="text-primary">Rankers Star originals.</span></h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Batch ke woh thoughts jo sabke dimaag mein aate hain, par class group mein koi type nahi karta.</p>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <motion.article key={p.user} {...reveal} className="flex flex-col rounded-[1.75rem] border border-border bg-card shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1">
              <Head {...p} />
              <div className="relative mx-4 overflow-hidden rounded-2xl border border-border">
                <img src={p.img} alt={p.title} loading="lazy" width={816} height={816} className="aspect-[4/3] w-full object-cover" />
                <span className={`absolute bottom-3 right-3 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-xs font-bold ${mono}`}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="p-5"><h3 className="text-2xl font-black tracking-tight">{p.title}</h3><p className="mt-2 text-muted-foreground">{p.body}</p></div>
              <Foot {...p} />
            </motion.article>
          ))}
          {quotes.map(p => (
            <motion.article key={p.user} {...reveal} className="flex flex-col rounded-[1.75rem] border border-border bg-card shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1">
              <Head {...p} />
              <div className={`mx-4 grid min-h-[200px] place-items-center rounded-2xl border border-border ${p.bg} p-6 text-center text-2xl font-bold ${hand}`}>{p.q}</div>
              <div className="p-5"><h3 className="text-2xl font-black tracking-tight">{p.title}</h3><p className="mt-2 text-muted-foreground">{p.body}</p></div>
              <Foot {...p} />
            </motion.article>
          ))}
        </div>

        <motion.div {...reveal} className="mt-8 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-border bg-gradient-to-r from-card to-[hsl(var(--highlight)/0.12)] p-8 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className={`text-sm font-bold tracking-[0.2em] text-primary ${mono}`}>PLOT TWIST</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Itna scroll kar liya? Ab ek test bhi de hi do.</h3>
            <p className="mt-3 text-muted-foreground">Memes marks nahi badhaate. Honest mocks kabhi-kabhi badha dete hain.</p>
          </div>
          <button onClick={() => navigate('/auth')} className="inline-flex shrink-0 items-center gap-3 rounded-full bg-foreground px-8 py-4 font-bold text-background transition-transform hover:-translate-y-0.5">
            Open Rankers Star <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

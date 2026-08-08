import { motion } from 'framer-motion';
import logoAsset from '@/assets/rankers-logo.png.asset.json';

interface Props {
  label?: string;
  fullScreen?: boolean;
}

/** The single standard Rankers Star loading animation used across the app. */
export default function RankersLoader({ label = 'Loading', fullScreen = false }: Props) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-5 overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-[80] bg-background/97 backdrop-blur-md' : 'py-24 w-full'
      }`}
    >
      {/* subtle animated background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[90px]"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '38px 38px' }}
        />
      </div>

      <div className="relative grid place-items-center">
        <motion.span
          className="absolute h-28 w-28 rounded-[30%] border border-primary/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="absolute h-24 w-24 rounded-full border-2 border-primary/60 border-t-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.img
          src={logoAsset.url}
          alt="Rankers Star"
          className="relative h-16 w-16 rounded-2xl object-cover shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)]"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative text-center">
        <motion.p
          className="text-sm font-semibold tracking-wide text-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Rankers Star</p>
      </div>
    </div>
  );
}

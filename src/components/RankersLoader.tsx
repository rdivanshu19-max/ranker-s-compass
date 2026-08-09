import { motion } from 'framer-motion';

interface Props {
  label?: string;
  fullScreen?: boolean;
}

/** The single standard Rankers Star loading animation used across the app. */
export default function RankersLoader({ label = 'Loading', fullScreen = false }: Props) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-6 overflow-hidden ${
        fullScreen
          ? 'fixed inset-0 z-[80] bg-background/95 backdrop-blur-xl'
          : 'min-h-[70vh] w-full py-16'
      }`}
    >
      {/* soft ambient glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px]"
        animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.95, 1.06, 0.95] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />

      <div className="relative grid h-32 w-32 place-items-center">
        {/* outer soft ring */}
        <span className="absolute h-32 w-32 rounded-full border border-primary/15" />
        {/* rotating arc */}
        <motion.span
          className="absolute h-32 w-32 rounded-full border-2 border-transparent border-t-primary border-r-primary/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        {/* counter-rotating thin arc */}
        <motion.span
          className="absolute h-24 w-24 rounded-full border border-transparent border-b-primary/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
        />
        {/* breathing halo */}
        <motion.span
          className="absolute h-20 w-20 rounded-full bg-primary/20 blur-xl"
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.12, 0.9] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        />
        {/* logo — perfectly circular */}
        <motion.img
          src="/logo.png"
          alt="Rankers Star"
          width={72}
          height={72}
          className="relative h-[72px] w-[72px] rounded-full object-cover ring-1 ring-primary/30"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        />
      </div>

      <div className="relative text-center">
        <motion.p
          className="text-sm font-semibold tracking-wide text-foreground"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        >
          {label}
        </motion.p>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Rankers Star</p>
      </div>
    </div>
  );
}

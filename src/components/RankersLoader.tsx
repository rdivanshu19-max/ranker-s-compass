import { motion } from 'framer-motion';

interface Props {
  label?: string;
  fullScreen?: boolean;
}

export default function RankersLoader({ label = 'Loading', fullScreen = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm' : 'py-20'}`}>
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-2xl border border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-xl border-2 border-primary/60 border-t-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <motion.span
            className="text-2xl font-bold font-display text-gradient"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            RS
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium tracking-wide text-foreground/90">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-1">Rankers Star</p>
      </div>
    </div>
  );
}

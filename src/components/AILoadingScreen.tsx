import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap } from 'lucide-react';

interface Props {
  message?: string;
  subMessage?: string;
}

export default function AILoadingScreen({ message = 'AI is thinking...', subMessage }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="relative w-32 h-32 mb-6">
        {/* Pulsing rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          />
        ))}
        {/* Rotating gradient */}
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Brain className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
        {/* Orbiting sparkles */}
        {[Sparkles, Zap, Sparkles].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: 360 }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
          >
            <div style={{ transform: `translateX(${60 + i * 4}px)` }}>
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-lg font-bold font-display bg-gradient-to-r from-primary via-fuchsia-500 to-violet-500 bg-clip-text text-transparent"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
      {subMessage && <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">{subMessage}</p>}

      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

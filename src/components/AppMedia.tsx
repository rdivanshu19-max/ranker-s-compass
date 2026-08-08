import { useState } from 'react';

const hashHue = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
};

/** Deterministic premium gradient used whenever no banner/poster image exists. */
export const fallbackGradient = (seed: string) => {
  const hue = hashHue(seed || 'rankers');
  return `linear-gradient(135deg, hsl(${hue} 55% 16%) 0%, hsl(${(hue + 28) % 360} 45% 10%) 55%, hsl(var(--primary) / 0.28) 100%)`;
};

export function AppBanner({ src, name, className = '' }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const show = !!src?.trim() && !failed;
  return (
    <div className={`relative overflow-hidden ${className}`} style={show ? undefined : { backgroundImage: fallbackGradient(name) }}>
      {show ? (
        <img
          src={src!.trim()}
          alt={`${name} banner`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
          />
          <span className="absolute bottom-2 left-3 text-xs font-bold uppercase tracking-[0.25em] text-foreground/70">
            {name.slice(0, 18)}
          </span>
        </>
      )}
    </div>
  );
}

export function AppLogo({ src, name, className = '' }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const show = !!src?.trim() && !failed;
  return (
    <div className={`grid place-items-center overflow-hidden bg-background/85 ${className}`}>
      {show ? (
        <img src={src!.trim()} alt={`${name} logo`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold text-primary">{name.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

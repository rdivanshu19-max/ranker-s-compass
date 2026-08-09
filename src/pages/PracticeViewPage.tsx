import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { findPack } from '@/lib/practicePacks';

export default function PracticeViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const pack = findPack(slug);
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);
  const redirectedRef = useRef(false);

  const target = pack?.url || '';

  useEffect(() => {
    if (!target) return;
    const timer = setTimeout(() => {
      if (!loadedRef.current && !redirectedRef.current) {
        redirectedRef.current = true;
        window.location.replace(target);
      }
    }, 7000);
    return () => clearTimeout(timer);
  }, [target]);

  if (!pack) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-muted-foreground">This practice module is not available.</p>
        <Button variant="outline" onClick={() => navigate('/app/test-series')}>Back to Test Hub</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-lg">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/app/test-series')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="truncate text-sm font-semibold">{pack.name}</p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => window.open(target, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative flex-1">
        {!ready && (
          <div className="absolute inset-0 z-10 bg-background">
            <RankersLoader fullScreen={false} label={`Opening ${pack.cta}`} />
          </div>
        )}
        <iframe
          src={target}
          title={pack.name}
          className="h-full w-full border-0"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; microphone; picture-in-picture"
          referrerPolicy="no-referrer"
          onLoad={() => { loadedRef.current = true; setReady(true); }}
          onError={() => {
            if (!redirectedRef.current) { redirectedRef.current = true; window.location.replace(target); }
          }}
        />
      </div>
    </div>
  );
}

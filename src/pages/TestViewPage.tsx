import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { normalizeUrl, type SeriesTest } from '@/lib/testSeries';

export default function TestViewPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<SeriesTest | null>(null);
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    (async () => {
      const { data } = await supabase.from('test_series_tests').select('*').eq('id', testId).maybeSingle();
      const t = data as SeriesTest | null;
      setTest(t);
      if (!t?.link) return;
      const target = normalizeUrl(t.link);
      timer = setTimeout(() => {
        if (!loadedRef.current && !redirectedRef.current) {
          redirectedRef.current = true;
          window.location.replace(target);
        }
      }, 6000);
    })();
    return () => clearTimeout(timer);
  }, [testId]);

  const target = test?.link ? normalizeUrl(test.link) : '';

  const handleFailure = () => {
    if (redirectedRef.current || !target) return;
    redirectedRef.current = true;
    window.location.replace(target);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-lg">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="truncate text-sm font-semibold">{test?.name || 'Test'}</p>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => target && window.open(target, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative flex-1">
        {!ready && <div className="absolute inset-0 z-10 bg-background"><RankersLoader label="Opening Test" /></div>}
        {test && target && (
          <iframe
            src={target}
            title={test.name}
            className="h-full w-full border-0"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => { loadedRef.current = true; setReady(true); }}
            onError={handleFailure}
          />
        )}
      </div>
    </div>
  );
}

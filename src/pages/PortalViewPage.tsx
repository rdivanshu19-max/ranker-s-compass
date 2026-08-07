import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import RankersLoader from '@/components/RankersLoader';
import { normalizeUrl, type StudyPortal } from '@/lib/studyApps';

export default function PortalViewPage() {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<StudyPortal | null>(null);
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    (async () => {
      const { data } = await supabase.from('study_portals').select('*').eq('id', portalId).maybeSingle();
      const p = data as StudyPortal | null;
      setPortal(p);
      if (!p) return;
      const target = normalizeUrl(p.url);
      // Automatic fallback: if the iframe never loads (X-Frame-Options / CSP / network),
      // send the user straight to the original URL instead of a blank page.
      timer = setTimeout(() => {
        if (!loadedRef.current && !redirectedRef.current) {
          redirectedRef.current = true;
          window.location.replace(target);
        }
      }, 6000);
    })();
    return () => clearTimeout(timer);
  }, [portalId]);

  const target = portal ? normalizeUrl(portal.url) : '';

  const handleFailure = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    window.location.replace(target);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="h-12 shrink-0 flex items-center justify-between gap-2 px-3 border-b border-border bg-card/80 backdrop-blur-lg">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <p className="text-sm font-semibold truncate">{portal?.name || 'Portal'}</p>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => target && window.open(target, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative flex-1">
        {!ready && <div className="absolute inset-0 z-10 bg-background"><RankersLoader label="Opening Portal" /></div>}
        {portal && (
          <iframe
            src={target}
            title={portal.name}
            className="w-full h-full border-0"
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

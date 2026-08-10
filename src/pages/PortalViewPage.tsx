import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import RankersLoader from '@/components/RankersLoader';
import EmbedFrame from '@/components/EmbedFrame';
import { normalizeUrl, type StudyPortal } from '@/lib/studyApps';

export default function PortalViewPage() {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<StudyPortal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('study_portals').select('*').eq('id', portalId).maybeSingle();
      setPortal(data as StudyPortal | null);
      setLoading(false);
    })();
  }, [portalId]);

  if (loading || !portal) return <RankersLoader label="Opening Portal" fullScreen />;

  return <EmbedFrame url={normalizeUrl(portal.url)} title={portal.name} onBack={() => navigate(-1)} />;
}

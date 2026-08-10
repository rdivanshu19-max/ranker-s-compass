import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import RankersLoader from '@/components/RankersLoader';
import EmbedFrame from '@/components/EmbedFrame';
import { normalizeUrl, type SeriesTest } from '@/lib/testSeries';
import { Button } from '@/components/ui/button';

export default function TestViewPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<SeriesTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('test_series_tests').select('*').eq('id', testId).maybeSingle();
      setTest(data as SeriesTest | null);
      setLoading(false);
    })();
  }, [testId]);

  if (loading) return <RankersLoader label="Opening Test" fullScreen />;

  if (!test?.link) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-muted-foreground">This test link is not available yet.</p>
        <Button variant="outline" onClick={() => navigate('/app/test-series')}>Back to Test Series</Button>
      </div>
    );
  }

  return <EmbedFrame url={normalizeUrl(test.link)} title={test.name} onBack={() => navigate(-1)} />;
}

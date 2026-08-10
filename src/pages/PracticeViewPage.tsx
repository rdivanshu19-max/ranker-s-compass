import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EmbedFrame from '@/components/EmbedFrame';
import { findPack } from '@/lib/practicePacks';

export default function PracticeViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const pack = findPack(slug);

  if (!pack) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-muted-foreground">This practice module is not available.</p>
        <Button variant="outline" onClick={() => navigate('/app/test-series')}>Back to Test Hub</Button>
      </div>
    );
  }

  return <EmbedFrame url={pack.url} title={pack.name} onBack={() => navigate('/app/test-series')} />;
}

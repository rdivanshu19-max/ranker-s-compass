import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MATHANGO_TESTS, isUnlocked } from '@/lib/mathango';

const DESKTOP_W = 1280;

/** Renders the original CBT at a fixed desktop width, scaled to fit smaller screens. */
export default function MathangoTestPage() {
  const { n } = useParams();
  const navigate = useNavigate();
  const test = MATHANGO_TESTS.find(t => String(t.n) === n);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: DESKTOP_W, h: 800 });

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!test || !isUnlocked(test)) return <Navigate to="/app/mathango" replace />;

  const scale = Math.min(1, size.w / DESKTOP_W);
  const frameW = scale < 1 ? DESKTOP_W : size.w;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur-lg">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/app/mathango')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="truncate text-sm font-semibold">Mathango 2027 · {test.name}</p>
      </div>
      <div ref={boxRef} className="relative flex-1 overflow-hidden">
        <iframe
          src={test.url}
          title={test.name}
          style={{ width: frameW, height: size.h / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          className="border-0 bg-white"
        />
      </div>
    </div>
  );
}

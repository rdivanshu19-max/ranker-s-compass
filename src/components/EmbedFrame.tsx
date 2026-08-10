import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Hosts that always refuse to be framed — skip the iframe entirely. */
const NO_FRAME_HOSTS = [
  'drive.google.com', 'docs.google.com', 'accounts.google.com', 'forms.gle',
  'youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com',
  't.me', 'telegram.me', 'mega.nz', 'dropbox.com', 'onedrive.live.com', 'mediafire.com',
];

export const isNonEmbeddable = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return NO_FRAME_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

function Skeleton() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="skeleton-shimmer h-10 w-1/3 rounded-xl" />
        <div className="skeleton-shimmer h-40 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="skeleton-shimmer h-14 rounded-xl" />
          <div className="skeleton-shimmer h-14 rounded-xl" />
          <div className="skeleton-shimmer h-14 rounded-xl" />
          <div className="skeleton-shimmer h-14 rounded-xl" />
        </div>
        <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
        <div className="flex justify-end"><div className="skeleton-shimmer h-11 w-40 rounded-full" /></div>
      </div>
    </div>
  );
}

function Blocked({ title, url, onRetry }: { title: string; url: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-background px-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border/70 bg-card/70 p-7 text-center backdrop-blur-xl"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <ShieldAlert className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold">This page can&apos;t open inside Rankers Star</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{title}</span> is hosted on a site that blocks embedding
          (Google Drive, YouTube and similar). Open it in a new tab — you&apos;ll stay signed in here.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            className="w-full gap-2"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" /> Open in a new tab
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> Try loading here again
          </Button>
        </div>
        <p className="mt-4 break-all text-[11px] text-muted-foreground">{url}</p>
      </motion.div>
    </div>
  );
}

type Props = {
  url: string;
  title: string;
  onBack: () => void;
  /** ms before we assume the frame was blocked */
  timeout?: number;
};

/**
 * Shared embed shell: skeleton loader while the page loads and a friendly
 * "open in a new tab" fallback whenever the site refuses to be framed.
 */
export default function EmbedFrame({ url, title, onBack, timeout = 6500 }: Props) {
  const known = isNonEmbeddable(url);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(known);
  const [attempt, setAttempt] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (known || blocked) return;
    loadedRef.current = false;
    setReady(false);
    const t = setTimeout(() => { if (!loadedRef.current) setBlocked(true); }, timeout);
    return () => clearTimeout(t);
  }, [url, attempt, known, blocked, timeout]);

  // Non-embeddable links get sent straight out so the click still "just works".
  useEffect(() => {
    if (known) window.open(url, '_blank', 'noopener,noreferrer');
  }, [known, url]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-lg">
        <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="truncate text-sm font-semibold">{title}</p>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative flex-1">
        {blocked ? (
          <Blocked
            title={title}
            url={url}
            onRetry={() => { setBlocked(false); setReady(false); setAttempt(a => a + 1); }}
          />
        ) : (
          <>
            {!ready && <Skeleton />}
            <iframe
              key={attempt}
              src={url}
              title={title}
              className="h-full w-full border-0"
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; microphone; picture-in-picture"
              referrerPolicy="no-referrer"
              onLoad={() => { loadedRef.current = true; setReady(true); }}
              onError={() => setBlocked(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}

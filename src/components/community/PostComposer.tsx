import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, Sigma, Smile, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadCommunityImage, type Post, type Space } from '@/lib/community';

const MATH_SYMBOLS = ['√', 'π', '∫', 'Σ', '∞', '≈', '≤', '≥', '≠', 'Δ', 'θ', '°', '±', '→'];
const EMOJIS = ['🔥', '💡', '🙏', '😅', '🎯', '📘', '✅', '❓'];

type Props = {
  open: boolean;
  spaces: Space[];
  onClose: () => void;
  onCreated: (post: Post) => void;
};

export default function PostComposer({ open, spaces, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const insert = (token: string) => {
    const el = areaRef.current;
    if (!el) return setContent(c => c + token);
    const start = el.selectionStart ?? content.length;
    setContent(content.slice(0, start) + token + content.slice(el.selectionEnd ?? start));
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + token.length; });
  };

  const pick = (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!user) return toast.error('Sign in to post');
    if (!content.trim()) return toast.error('Write your doubt or thought first');
    setBusy(true);
    try {
      const image_url = file ? await uploadCommunityImage(file, user.id) : null;
      const { data, error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        space_id: spaceId || null,
        title: title.trim() || null,
        content: content.trim(),
        image_url,
      }).select().single();
      if (error) throw error;
      onCreated(data as Post);
      toast.success('Posted to the community');
      setTitle(''); setContent(''); setFile(null); setPreview(''); setSpaceId('');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Could not publish post');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-end bg-background/80 p-0 backdrop-blur-md sm:place-items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={e => e.stopPropagation()}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border/70 bg-card/95 p-5 shadow-2xl backdrop-blur-xl sm:max-w-xl sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">New Post</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={140}
              placeholder="Title (optional) — e.g. Doubt in rotational motion"
              className="mt-4 h-12 rounded-xl" />

            <Textarea ref={areaRef} value={content} onChange={e => setContent(e.target.value)} maxLength={4000}
              placeholder="Ask your doubt, share a trick, or start a discussion..."
              className="mt-3 min-h-[150px] rounded-2xl text-base" />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {MATH_SYMBOLS.map(s => (
                <button key={s} onClick={() => insert(s)}
                  className="h-9 w-9 rounded-lg border border-border/70 bg-background/50 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary">
                  {s}
                </button>
              ))}
              {EMOJIS.map(s => (
                <button key={s} onClick={() => insert(s)}
                  className="h-9 w-9 rounded-lg border border-border/70 bg-background/50 text-sm transition-colors hover:border-primary/50">
                  {s}
                </button>
              ))}
            </div>

            {spaces.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setSpaceId('')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${!spaceId ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 text-muted-foreground'}`}>
                  General Feed
                </button>
                {spaces.map(s => (
                  <button key={s.id} onClick={() => setSpaceId(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${spaceId === s.id ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 text-muted-foreground'}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {preview && (
              <div className="relative mt-4">
                <img src={preview} alt="Attachment preview" className="max-h-64 w-full rounded-2xl border border-border/60 object-cover" />
                <button onClick={() => { setFile(null); setPreview(''); }}
                  className="absolute right-3 top-3 rounded-full bg-background/85 p-2 backdrop-blur"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                <ImagePlus className="h-4 w-4" /> Image
                <input type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0])} />
              </label>
              <Button onClick={submit} disabled={busy} className="h-11 gap-2 rounded-xl px-6 font-semibold">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sigma className="h-4 w-4" />}
                {busy ? 'Posting...' : 'Post'}
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Smile className="h-3.5 w-3.5" /> Be kind. Admins and moderators can remove posts that break the rules.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

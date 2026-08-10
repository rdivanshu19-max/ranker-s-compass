import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadCommunityImage, timeAgo, type Story } from '@/lib/community';

type Props = {
  stories: Story[];
  names: Record<string, string>;
  onAdded: (s: Story) => void;
  onDeleted: (id: string) => void;
};

export default function StoriesRail({ stories, names, onAdded, onDeleted }: Props) {
  const { user, isAdmin, isModerator } = useAuth();
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<Story | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = async (f?: File) => {
    if (!f || !user) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setBusy(true);
    try {
      const image_url = await uploadCommunityImage(f, user.id);
      const { data, error } = await supabase.from('community_stories')
        .insert({ user_id: user.id, image_url }).select().single();
      if (error) throw error;
      onAdded(data as Story);
      toast.success('Story added — live for 24 hours');
    } catch (e: any) {
      toast.error(e.message || 'Could not add story');
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('community_stories').delete().eq('id', id);
    if (error) return toast.error(error.message);
    onDeleted(id);
    setActive(null);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          className="group flex w-16 shrink-0 flex-col items-center gap-1.5">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-primary/50 bg-primary/10 text-primary transition-colors group-hover:border-primary">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">Your story</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => add(e.target.files?.[0])} />

        {stories.map(s => (
          <button key={s.id} onClick={() => setActive(s)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[2px]">
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-card">
                {s.image_url
                  ? <img src={s.image_url} alt="Story" className="h-full w-full object-cover" />
                  : <span className="font-display text-xs font-bold">{(names[s.user_id] || 'S').slice(0, 2).toUpperCase()}</span>}
              </span>
            </span>
            <span className="w-16 truncate text-center text-[10px] text-muted-foreground">{names[s.user_id] || 'Student'}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-background/95 p-4 backdrop-blur-xl" onClick={() => setActive(null)}>
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/70 bg-card">
            {active.image_url && <img src={active.image_url} alt="Story" className="max-h-[70vh] w-full object-contain" />}
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{names[active.user_id] || 'Student'}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(active.created_at)}</p>
              </div>
              {(user?.id === active.user_id || isAdmin || isModerator) && (
                <button onClick={() => remove(active.id)} className="text-xs font-semibold text-destructive">Delete</button>
              )}
            </div>
            <button onClick={() => setActive(null)} className="absolute right-3 top-3 rounded-full bg-background/80 p-2">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

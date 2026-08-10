import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Trash2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MarkdownMath from '@/components/MarkdownMath';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { timeAgo, tagsFor, type Comment, type Post, type Space, type UserStats } from '@/lib/community';

type Props = {
  post: Post;
  space?: Space;
  author: { name: string; stats: UserStats };
  score: number;
  myVote: number;
  commentCount: number;
  onVote: (postId: string, value: number) => void;
  onDeleted: (postId: string) => void;
};

export default function CommunityPost({ post, space, author, score, myVote, commentCount, onVote, onDeleted }: Props) {
  const { user, isAdmin, isModerator } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const canDelete = user?.id === post.user_id || isAdmin || isModerator;

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at');
      const list = (data as Comment[]) || [];
      setComments(list);
      const ids = [...new Set(list.map(c => c.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids);
        setNames(Object.fromEntries(((profs as any[]) || []).map(p => [p.user_id, p.display_name])));
      }
    })();
  }, [open, post.id]);

  const addComment = async () => {
    if (!draft.trim() || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, content: draft.trim() })
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setComments(c => [...c, data as Comment]);
    setDraft('');
  };

  const removePost = async () => {
    const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
    if (error) return toast.error(error.message);
    toast.success('Post removed');
    onDeleted(post.id);
  };

  const share = async () => {
    const url = `${window.location.origin}/app/community?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title || 'Rankers Community', url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* dismissed */ }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl transition-colors hover:border-primary/30 sm:p-6"
    >
      <header className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-sm font-bold text-primary-foreground">
          {author.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-foreground">{author.name}</p>
            {tagsFor(author.stats).map(t => (
              <span key={t.label} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.tone}`}>
                {t.label}
              </span>
            ))}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {timeAgo(post.created_at)}
            {space && (
              <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: space.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: space.color }} />
                {space.name}
              </span>
            )}
          </p>
        </div>
        {canDelete && (
          <button onClick={removePost} title="Delete post"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {post.title && <h3 className="mt-4 font-display text-lg font-bold leading-snug">{post.title}</h3>}
      <MarkdownMath className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.content}</MarkdownMath>

      {post.image_url && (
        <img src={post.image_url} alt="Doubt attachment" loading="lazy"
          className="mt-4 max-h-[420px] w-full rounded-2xl border border-border/60 object-cover" />
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/50 px-1.5 py-1">
          <button onClick={() => onVote(post.id, myVote === 1 ? 0 : 1)}
            className={`rounded-full p-1.5 transition-colors ${myVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <ArrowBigUp className="h-5 w-5" />
          </button>
          <span className="min-w-6 text-center text-sm font-bold">{score}</span>
          <button onClick={() => onVote(post.id, myVote === -1 ? 0 : -1)}
            className={`rounded-full p-1.5 transition-colors ${myVote === -1 ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
            <ArrowBigDown className="h-5 w-5" />
          </button>
        </div>

        <button onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <MessageCircle className="h-4 w-4" /> {commentCount + (open ? comments.length - commentCount : 0) || commentCount}
        </button>

        <button onClick={share}
          className="ml-auto inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </footer>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          {comments.map(c => (
            <div key={c.id} className="rounded-2xl bg-background/40 p-3">
              <p className="text-xs font-semibold text-primary">{names[c.user_id] || 'Student'} <span className="ml-1 font-normal text-muted-foreground">{timeAgo(c.created_at)}</span></p>
              <MarkdownMath className="mt-1 text-sm text-foreground">{c.content}</MarkdownMath>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No replies yet — be the first to solve this.</p>}
          {user && (
            <div className="flex gap-2">
              <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a reply..."
                onKeyDown={e => { if (e.key === 'Enter') addComment(); }} className="h-11 rounded-xl" />
              <Button onClick={addComment} disabled={busy || !draft.trim()} className="h-11 gap-1.5 rounded-xl px-4">
                <Send className="h-4 w-4" /> Reply
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.article>
  );
}

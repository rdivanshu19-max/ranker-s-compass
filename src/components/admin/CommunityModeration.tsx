import { useEffect, useState } from 'react';
import { Trash2, MessageSquare, Image as ImageIcon, Compass, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import MarkdownMath from '@/components/MarkdownMath';
import { timeAgo, type Post, type Space, type Story } from '@/lib/community';

type View = 'posts' | 'stories' | 'spaces';

export default function CommunityModeration({ actorId, actorRole }: { actorId: string; actorRole: 'admin' | 'moderator' }) {
  const [view, setView] = useState<View>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: st }, { data: sp }] = await Promise.all([
      supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('community_stories').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('community_spaces').select('*').order('created_at'),
    ]);
    setPosts((p as Post[]) || []);
    setStories((st as Story[]) || []);
    setSpaces((sp as Space[]) || []);
    const ids = [...new Set([...((p as Post[]) || []).map(x => x.user_id), ...((st as Story[]) || []).map(x => x.user_id)])];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids);
      setNames(Object.fromEntries(((profs as any[]) || []).map(x => [x.user_id, x.display_name])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const log = async (action: string, targetType: string, targetId: string, details: any) => {
    await supabase.from('activity_log').insert({
      actor_id: actorId, actor_role: actorRole, action, target_type: targetType, target_id: targetId, details,
    });
  };

  const removeRow = async (table: 'community_posts' | 'community_stories' | 'community_spaces', id: string, label: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return toast.error(error.message);
    await log(`delete_${table.replace('community_', '')}`, table, id, { label });
    toast.success('Removed');
    if (table === 'community_posts') setPosts(l => l.filter(x => x.id !== id));
    if (table === 'community_stories') setStories(l => l.filter(x => x.id !== id));
    if (table === 'community_spaces') setSpaces(l => l.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {([['posts', MessageSquare, `Posts (${posts.length})`], ['stories', ImageIcon, `Stories (${stories.length})`], ['spaces', Compass, `Spaces (${spaces.length})`]] as const).map(([v, Icon, label]) => (
          <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} className="gap-1.5" onClick={() => setView(v)}>
            <Icon className="h-4 w-4" /> {label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading community data...</div>
      ) : view === 'posts' ? (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{names[p.user_id] || 'Student'} <span className="ml-1 text-xs font-normal text-muted-foreground">{timeAgo(p.created_at)}</span></p>
                  {p.title && <p className="mt-1 font-display text-sm font-bold">{p.title}</p>}
                  <MarkdownMath className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.content}</MarkdownMath>
                  {p.image_url && <img src={p.image_url} alt="Post attachment" className="mt-2 h-24 rounded-lg object-cover" />}
                </div>
                <Button size="sm" variant="destructive" className="gap-1.5 shrink-0" onClick={() => removeRow('community_posts', p.id, p.title || p.content.slice(0, 60))}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
        </div>
      ) : view === 'stories' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map(s => {
            const expired = new Date(s.expires_at) < new Date();
            return (
              <div key={s.id} className="rounded-2xl border border-border/70 bg-card/50 p-3">
                {s.image_url && <img src={s.image_url} alt="Story" className="h-40 w-full rounded-xl object-cover" />}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{names[s.user_id] || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">{expired ? 'Expired' : `${timeAgo(s.created_at)} · live`}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => removeRow('community_stories', s.id, 'story')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {stories.length === 0 && <p className="text-sm text-muted-foreground">No stories.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {spaces.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/50 p-4">
              <div>
                <p className="font-display text-sm font-bold">{s.name}</p>
                {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
              </div>
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => removeRow('community_spaces', s.id, s.name)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          ))}
          {spaces.length === 0 && <p className="text-sm text-muted-foreground">No spaces yet.</p>}
        </div>
      )}
    </div>
  );
}

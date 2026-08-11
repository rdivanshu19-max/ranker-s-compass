import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Sparkles, PenLine, Compass, Plus, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import RankersLoader from '@/components/RankersLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CommunityPost from '@/components/community/CommunityPost';
import PostComposer from '@/components/community/PostComposer';
import StoriesRail from '@/components/community/StoriesRail';
import { computeXp, levelOf, tagsFor, type Post, type Space, type Story, type UserStats } from '@/lib/community';

type Tab = 'feed' | 'spaces' | 'ranks';

export default function CommunityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('feed');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});     // postId -> score
  const [myVotes, setMyVotes] = useState<Record<string, number>>({}); // postId -> my value
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [statsByUser, setStatsByUser] = useState<Record<string, UserStats>>({});
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [spaceFilter, setSpaceFilter] = useState<string>('');
  const [composer, setComposer] = useState(false);
  const [newSpace, setNewSpace] = useState('');

  const load = async () => {
    const [{ data: p }, { data: sp }, { data: st }, { data: v }, { data: c }, { data: mem }] = await Promise.all([
      supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(120),
      supabase.from('community_spaces').select('*').order('created_at'),
      supabase.from('community_stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
      supabase.from('post_votes').select('post_id, user_id, value'),
      supabase.from('post_comments').select('post_id, user_id'),
      supabase.from('space_members').select('space_id, user_id'),
    ]);

    const postList = (p as Post[]) || [];
    setPosts(postList);
    setSpaces((sp as Space[]) || []);
    setStories((st as Story[]) || []);

    const score: Record<string, number> = {};
    const mine: Record<string, number> = {};
    const upvotesFor: Record<string, number> = {};
    const authorOf = Object.fromEntries(postList.map(x => [x.id, x.user_id]));
    ((v as any[]) || []).forEach(row => {
      score[row.post_id] = (score[row.post_id] || 0) + row.value;
      if (row.user_id === user?.id) mine[row.post_id] = row.value;
      if (row.value > 0 && authorOf[row.post_id]) {
        upvotesFor[authorOf[row.post_id]] = (upvotesFor[authorOf[row.post_id]] || 0) + 1;
      }
    });
    setVotes(score); setMyVotes(mine);

    const cc: Record<string, number> = {};
    const solvedBy: Record<string, number> = {};
    ((c as any[]) || []).forEach(row => {
      cc[row.post_id] = (cc[row.post_id] || 0) + 1;
      solvedBy[row.user_id] = (solvedBy[row.user_id] || 0) + 1;
    });
    setCommentCounts(cc);

    const postsBy: Record<string, number> = {};
    postList.forEach(x => { postsBy[x.user_id] = (postsBy[x.user_id] || 0) + 1; });

    const allIds = [...new Set([
      ...postList.map(x => x.user_id),
      ...Object.keys(solvedBy),
      ...((st as Story[]) || []).map(x => x.user_id),
    ])];
    const stats: Record<string, UserStats> = {};
    allIds.forEach(id => {
      const base = { posts: postsBy[id] || 0, solved: solvedBy[id] || 0, upvotes: upvotesFor[id] || 0 };
      stats[id] = { ...base, xp: computeXp(base) };
    });
    if (user && !stats[user.id]) stats[user.id] = { posts: 0, solved: 0, upvotes: 0, xp: 0 };
    setStatsByUser(stats);

    const mine2: Record<string, boolean> = {};
    const counts: Record<string, number> = {};
    ((mem as any[]) || []).forEach(row => {
      counts[row.space_id] = (counts[row.space_id] || 0) + 1;
      if (row.user_id === user?.id) mine2[row.space_id] = true;
    });
    setMemberships(mine2); setMemberCounts(counts);

    const ids = [...new Set([...allIds, ...(user ? [user.id] : [])])];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', ids);
      const rows = (profs as any[]) || [];
      setNames(Object.fromEntries(rows.map(x => [x.user_id, x.display_name])));
      setHandles(Object.fromEntries(rows.filter(x => x.username).map(x => [x.user_id, x.username])));
      setAvatars(Object.fromEntries(rows.filter(x => x.avatar_url).map(x => [x.user_id, x.avatar_url])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const vote = async (postId: string, value: number) => {
    if (!user) return toast.error('Sign in to vote');
    const prev = myVotes[postId] || 0;
    setMyVotes(m => ({ ...m, [postId]: value }));
    setVotes(s => ({ ...s, [postId]: (s[postId] || 0) - prev + value }));
    if (value === 0) await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id);
    else await supabase.from('post_votes').upsert({ post_id: postId, user_id: user.id, value }, { onConflict: 'post_id,user_id' });
  };

  const toggleSpace = async (spaceId: string) => {
    if (!user) return toast.error('Sign in to join spaces');
    const joined = memberships[spaceId];
    setMemberships(m => ({ ...m, [spaceId]: !joined }));
    setMemberCounts(c => ({ ...c, [spaceId]: Math.max(0, (c[spaceId] || 0) + (joined ? -1 : 1)) }));
    if (joined) await supabase.from('space_members').delete().eq('space_id', spaceId).eq('user_id', user.id);
    else await supabase.from('space_members').insert({ space_id: spaceId, user_id: user.id });
  };

  const createSpace = async () => {
    if (!user || !newSpace.trim()) return;
    const { data, error } = await supabase.from('community_spaces')
      .insert({ name: newSpace.trim(), created_by: user.id }).select().single();
    if (error) return toast.error(error.message);
    setSpaces(s => [...s, data as Space]);
    setNewSpace('');
    toast.success('Space created');
    toggleSpace((data as Space).id);
  };

  const leaderboard = useMemo(() =>
    Object.entries(statsByUser)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 25), [statsByUser]);

  const myStats = (user && statsByUser[user.id]) || { posts: 0, solved: 0, upvotes: 0, xp: 0 };
  const myLevel = levelOf(myStats.xp);

  const feed = useMemo(() => {
    const list = spaceFilter ? posts.filter(p => p.space_id === spaceFilter) : posts;
    return [...list].sort((a, b) =>
      Number(Boolean((b as any).pinned)) - Number(Boolean((a as any).pinned)) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, spaceFilter]);

  if (loading) return <RankersLoader label="Loading Community" />;

  return (
    <div className="space-y-7 pb-24">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 px-5 py-8 backdrop-blur-xl sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Rankers Community
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              Ask doubts. Solve doubts.<br /><span className="text-gradient">Rank together.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              A feed built for aspirants — post doubts with images and math, upvote the best answers, join spaces and climb the XP leaderboard.
            </p>
          </div>
          <Button size="lg" className="h-12 gap-2 rounded-full px-6 font-semibold" onClick={() => setComposer(true)}>
            <PenLine className="h-4 w-4" /> New Post
          </Button>
        </div>
      </motion.section>

      {user && (
        <div className="rounded-3xl border border-border/70 bg-card/50 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
              {avatars[user.id]
                ? <img src={avatars[user.id]} alt="Your avatar" className="h-full w-full object-cover" />
                : (names[user.id] || 'ST').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="font-display text-base font-bold">
                {names[user.id] || 'Student'}
                {handles[user.id] && <span className="ml-2 text-xs font-medium text-primary">@{handles[user.id]}</span>}
              </p>
              <p className="text-xs text-muted-foreground">Level {myLevel.level} · {myLevel.name} · {myStats.xp} XP</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/50">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }} animate={{ width: `${myLevel.progress}%` }} transition={{ duration: 0.7 }} />
              </div>
              {myLevel.next && <p className="mt-1.5 text-[11px] text-muted-foreground">{myLevel.toNext} XP to {myLevel.next}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsFor(myStats).map(t => (
                <span key={t.label} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${t.tone}`}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <StoriesRail
        stories={stories}
        names={names}
        onAdded={s => setStories(prev => [s, ...prev])}
        onDeleted={id => setStories(prev => prev.filter(s => s.id !== id))}
      />

      <div className="flex gap-2 overflow-x-auto">
        {([['feed', Flame, 'Feed'], ['spaces', Compass, 'Spaces'], ['ranks', Trophy, 'Leaderboard']] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-5">
          {spaces.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setSpaceFilter('')}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${!spaceFilter ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground'}`}>
                All posts
              </button>
              {spaces.map(s => (
                <button key={s.id} onClick={() => setSpaceFilter(s.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${spaceFilter === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {feed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 py-20 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p className="text-lg">No posts yet</p>
              <p className="text-sm">Be the first to ask a doubt in the community.</p>
            </div>
          ) : feed.map(p => (
            <CommunityPost
              key={p.id}
              post={p}
              space={spaces.find(s => s.id === p.space_id)}
              author={{
                name: names[p.user_id] || 'Student',
                username: handles[p.user_id],
                avatarUrl: avatars[p.user_id],
                stats: statsByUser[p.user_id] || { posts: 0, solved: 0, upvotes: 0, xp: 0 },
              }}
              score={votes[p.id] || 0}
              myVote={myVotes[p.id] || 0}
              commentCount={commentCounts[p.id] || 0}
              onVote={vote}
              onDeleted={id => setPosts(list => list.filter(x => x.id !== id))}
              onPinned={(id, pinned) => setPosts(list => list.map(x => (x.id === id ? ({ ...x, pinned } as Post) : x)))}
            />
          ))}
        </div>
      )}

      {tab === 'spaces' && (
        <div className="space-y-5">
          <div className="flex gap-2">
            <Input value={newSpace} onChange={e => setNewSpace(e.target.value)} placeholder="Create a space — e.g. JEE 2027, Physics Doubts"
              className="h-12 rounded-xl" onKeyDown={e => { if (e.key === 'Enter') createSpace(); }} />
            <Button onClick={createSpace} disabled={!newSpace.trim()} className="h-12 gap-1.5 rounded-xl px-5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map(s => (
              <motion.div key={s.id} whileHover={{ y: -4 }}
                className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <h3 className="font-display text-base font-bold">{s.name}</h3>
                </div>
                {s.description && <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{memberCounts[s.id] || 0} member{(memberCounts[s.id] || 0) === 1 ? '' : 's'}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setSpaceFilter(s.id); setTab('feed'); }}>View</Button>
                    <Button size="sm" variant={memberships[s.id] ? 'outline' : 'default'} onClick={() => toggleSpace(s.id)}>
                      {memberships[s.id] ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            {spaces.length === 0 && <p className="text-sm text-muted-foreground">No spaces yet — create the first one.</p>}
          </div>
        </div>
      )}

      {tab === 'ranks' && (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/50 backdrop-blur-xl">
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/15 to-transparent px-5 py-4">
            <h2 className="font-display text-lg font-bold">Top Rankers</h2>
            <p className="text-xs text-muted-foreground">XP = 10 per post · 6 per reply · 3 per upvote received</p>
          </div>
          <div className="divide-y divide-border/50">
            {leaderboard.map((row, i) => (
              <div key={row.id} className={`flex items-center gap-4 px-5 py-3.5 ${row.id === user?.id ? 'bg-primary/5' : ''}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                  i === 0 ? 'bg-amber-400/20 text-amber-300' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-300' : 'bg-muted/40 text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {names[row.id] || 'Student'}
                    {handles[row.id] && <span className="ml-1.5 text-xs font-normal text-muted-foreground">@{handles[row.id]}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.posts} posts · {row.solved} replies · {row.upvotes} upvotes</p>
                </div>
                <span className="font-display text-sm font-bold text-primary">{row.xp} XP</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      )}

      <PostComposer
        open={composer}
        spaces={spaces}
        onClose={() => setComposer(false)}
        onCreated={p => setPosts(list => [p, ...list])}
      />
    </div>
  );
}

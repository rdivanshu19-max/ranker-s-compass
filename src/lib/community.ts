import { supabase } from '@/lib/supabase';

export type Space = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  space_id: string | null;
  title: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export type UserStats = {
  posts: number;
  solved: number;   // comments written = doubts helped with
  upvotes: number;  // upvotes received
  xp: number;
};

export const XP = { post: 10, comment: 6, upvoteReceived: 3 };

export const computeXp = (s: Omit<UserStats, 'xp'>) =>
  s.posts * XP.post + s.solved * XP.comment + s.upvotes * XP.upvoteReceived;

export const LEVELS = [
  { min: 0, name: 'Aspirant' },
  { min: 200, name: 'Scholar' },
  { min: 600, name: 'Prodigy' },
  { min: 1500, name: 'JEE Master' },
  { min: 3500, name: 'Legend' },
];

export function levelOf(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.min) idx = i; });
  const next = LEVELS[idx + 1];
  return {
    level: idx + 1,
    name: LEVELS[idx].name,
    next: next?.name ?? null,
    toNext: next ? next.min - xp : 0,
    progress: next ? Math.min(100, ((xp - LEVELS[idx].min) / (next.min - LEVELS[idx].min)) * 100) : 100,
  };
}

/** Reputation tags derived from real activity — no manual assignment needed. */
export function tagsFor(stats: UserStats): { label: string; tone: string }[] {
  const tags: { label: string; tone: string }[] = [];
  if (stats.solved >= 25) tags.push({ label: 'Top Solver', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300' });
  else if (stats.solved >= 10) tags.push({ label: 'Helper', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' });
  if (stats.upvotes >= 50) tags.push({ label: 'Community Favourite', tone: 'border-pink-500/40 bg-pink-500/10 text-pink-300' });
  if (stats.posts >= 20) tags.push({ label: 'Active Poster', tone: 'border-sky-500/40 bg-sky-500/10 text-sky-300' });
  if (tags.length === 0) tags.push({ label: 'New Here', tone: 'border-border bg-muted/40 text-muted-foreground' });
  return tags;
}

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/** Uploads a community image and returns its public URL. */
export async function uploadCommunityImage(file: File, userId: string) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `community/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('course-posters').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('course-posters').getPublicUrl(path).data.publicUrl;
}

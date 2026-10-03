import { supabase } from '@/lib/supabase';

// QPT 1 open now; QPT 2–6 unlock every Sunday (00:00 IST) starting 4 Oct 2026.
const FIRST_SUNDAY = new Date('2026-10-04T00:00:00+05:30').getTime();
const WEEK = 7 * 24 * 3600 * 1000;

export type MathangoTest = { n: number; name: string; unlockAt: number };

export const MATHANGO_TESTS: MathangoTest[] = [1, 2, 3, 4, 5, 6].map(n => ({
  n,
  name: `QPT ${n} · Full Syllabus`,
  unlockAt: n === 1 ? 0 : FIRST_SUNDAY + (n - 2) * WEEK,
}));

// Test files live in src/private and are only loaded on demand (no public URL).
const loaders = import.meta.glob('/src/private/mathango/*.html', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
export const loadMathangoHtml = (n: number) => {
  const fn = loaders[`/src/private/mathango/qpt${n}.html`];
  return fn ? fn() : Promise.reject(new Error('Test not found'));
};

// Account-based unlock: stored per user on the server, verified server-side.
export const fetchAccountUnlock = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('mathango_unlocks').select('user_id').eq('user_id', user.id).maybeSingle();
  return !!data;
};

export const tryUnlockCode = async (code: string) => {
  const { data, error } = await supabase.rpc('redeem_mathango_code', { _code: code });
  return !error && data === true;
};
export const isUnlocked = (t: MathangoTest, now = Date.now(), accountUnlocked = false) => accountUnlocked || now >= t.unlockAt;

export const countdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
};

export const MATHANGO_CODE = 'GCDITSUPRE';
const KEY = 'mathango-unlock-v1';

// QPT 1 open now; QPT 2–6 unlock every Sunday (00:00 IST) starting 4 Oct 2026.
const FIRST_SUNDAY = new Date('2026-10-04T00:00:00+05:30').getTime();
const WEEK = 7 * 24 * 3600 * 1000;

export type MathangoTest = { n: number; name: string; url: string; unlockAt: number };

export const MATHANGO_TESTS: MathangoTest[] = [1, 2, 3, 4, 5, 6].map(n => ({
  n,
  name: `QPT ${n} · Full Syllabus`,
  url: `/mathango/qpt${n}.html`,
  unlockAt: n === 1 ? 0 : FIRST_SUNDAY + (n - 2) * WEEK,
}));

export const isMasterUnlocked = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};
export const tryUnlockCode = (code: string) => {
  if (code.trim().toUpperCase() !== MATHANGO_CODE) return false;
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  return true;
};
export const isUnlocked = (t: MathangoTest, now = Date.now()) => isMasterUnlocked() || now >= t.unlockAt;

export const countdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
};

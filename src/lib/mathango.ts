const CODE_HASH = 'f418aa3623d0a91042cf66b76b090981a639ae056aff597f2ebd3f46f7d2c084';
const KEY = 'mathango-unlock-v1';

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

export const isMasterUnlocked = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const tryUnlockCode = async (code: string) => {
  if ((await sha256(code.trim().toUpperCase())) !== CODE_HASH) return false;
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  return true;
};
export const isUnlocked = (t: MathangoTest, now = Date.now()) => isMasterUnlocked() || now >= t.unlockAt;

export const countdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
};

export type TestStatus = 'available' | 'upcoming' | 'completed';

export type TestSeries = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  poster_url: string;
  sort_order: number;
  created_at: string;
};

export type SeriesTest = {
  id: string;
  series_id: string;
  name: string;
  link: string;
  status: TestStatus | string;
  description: string | null;
  scheduled_at: string | null;
  sort_order: number;
};

export const TEST_STATUSES: { value: TestStatus; label: string; cta: string; className: string }[] = [
  { value: 'available', label: 'Available', cta: 'Start Test', className: 'bg-primary/15 text-primary border-primary/40' },
  { value: 'upcoming', label: 'Upcoming', cta: 'Upcoming', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'completed', label: 'Completed', cta: 'View Test', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
];

export const statusInfo = (status: string) =>
  TEST_STATUSES.find(s => s.value === status) ?? TEST_STATUSES[0];

export const normalizeUrl = (url: string) =>
  /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

/**
 * Builds a subtle premium background from a logo URL when the admin has not
 * uploaded a custom poster. Falls back to the Rankers Star theme.
 */
export const autoPoster = (seed: string) => {
  if (!seed) return 'linear-gradient(135deg, hsl(var(--primary)/0.25), hsl(222 47% 8%))';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 48% 15%) 0%, hsl(${(h + 22) % 360} 40% 9%) 60%, hsl(var(--primary) / 0.22) 100%)`;
};

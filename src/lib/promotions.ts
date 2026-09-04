import { supabase } from '@/lib/supabase';

export type PromoPlacement =
  | 'dashboard' | 'community' | 'library' | 'tests' | 'apps'
  | 'test_series' | 'store' | 'vault' | 'landing';

export const PLACEMENTS: { id: PromoPlacement; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'community', label: 'Community' },
  { id: 'library', label: 'Library' },
  { id: 'tests', label: 'AI Tests' },
  { id: 'apps', label: 'Study Apps' },
  { id: 'test_series', label: 'Test Series' },
  { id: 'vault', label: 'Study Vault' },
  { id: 'store', label: 'Store' },
  { id: 'landing', label: 'Landing page' },
];

export type Promotion = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  poster_url: string | null;
  link_url: string | null;
  cta_text: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  placements: string[] | null;
  max_impressions: number | null;
  style: string | null;
};

export const isLive = (p: Promotion) => {
  const now = Date.now();
  if (!p.active) return false;
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
  if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
  return true;
};

const KEY = 'rs_promo_impressions';

type Counts = Record<string, number>;

function readCounts(): Counts {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

/** How many times a promo has already been shown in this browsing session. */
export function impressionsOf(id: string): number {
  return readCounts()[id] ?? 0;
}

export function recordImpression(id: string) {
  const c = readCounts();
  c[id] = (c[id] ?? 0) + 1;
  try { sessionStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

/** Live promos targeted at a placement that still have impressions left this session. */
export async function fetchPromotions(placement: PromoPlacement): Promise<Promotion[]> {
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  return ((data as unknown as Promotion[]) || [])
    .filter(isLive)
    .filter(p => (p.placements || ['store']).includes(placement))
    .filter(p => {
      const max = p.max_impressions ?? 0;
      return max <= 0 || impressionsOf(p.id) < max;
    });
}

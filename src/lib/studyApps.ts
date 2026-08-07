export type PortalBadge = 'best' | 'recommended' | 'good' | 'standard';

export type StudyApp = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  courses_included: string;
  sort_order: number;
  created_at: string;
};

export type StudyPortal = {
  id: string;
  app_id: string;
  name: string;
  url: string;
  category: string;
  badge: PortalBadge | string;
  sort_order: number;
};

export const BADGES: Record<PortalBadge, { label: string; emoji: string; className: string; rank: number }> = {
  best: { label: 'Best Portal', emoji: '⭐', className: 'bg-primary/20 text-primary border-primary/40', rank: 0 },
  recommended: { label: 'Recommended', emoji: '✅', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', rank: 1 },
  good: { label: 'Good', emoji: '👍', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30', rank: 2 },
  standard: { label: 'Standard', emoji: '📌', className: 'bg-muted text-muted-foreground border-border', rank: 3 },
};

export const BADGE_KEYS: PortalBadge[] = ['best', 'recommended', 'good', 'standard'];

export const badgeInfo = (badge: string) => BADGES[(badge as PortalBadge)] ?? BADGES.standard;

export const sortPortals = (portals: StudyPortal[]) =>
  [...portals].sort((a, b) => {
    const diff = badgeInfo(a.badge).rank - badgeInfo(b.badge).rank;
    return diff !== 0 ? diff : a.sort_order - b.sort_order;
  });

export const normalizeUrl = (url: string) =>
  /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

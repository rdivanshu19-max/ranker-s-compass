import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export type AIFeature = 'ai_test' | 'ai_chat' | 'ai_mentor';

export const AI_LIMITS: Record<AIFeature, number> = {
  ai_test: 3,
  ai_chat: 10,
  ai_mentor: 10,
};

function istDate(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().split('T')[0];
}

export function msUntilISTMidnight(): number {
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const tomorrow = new Date(Date.UTC(
    istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0
  ));
  return tomorrow.getTime() - 5.5 * 3600 * 1000 - now.getTime();
}

export function formatResetTime(): string {
  const ms = msUntilISTMidnight();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function useAILimit(feature: AIFeature) {
  const { user, isAdmin } = useAuth();
  const [used, setUsed] = useState(0);
  const limit = AI_LIMITS[feature];

  const refresh = useCallback(async () => {
    if (!user || isAdmin) return;
    const { data } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .eq('usage_date', istDate())
      .maybeSingle();
    setUsed(data?.count ?? 0);
  }, [user, feature, isAdmin]);

  useEffect(() => { refresh(); }, [refresh]);

  if (isAdmin) {
    return { used: 0, limit: Infinity, remaining: Infinity, refresh, resetIn: formatResetTime(), unlimited: true };
  }

  return { used, limit, remaining: Math.max(0, limit - used), refresh, resetIn: formatResetTime(), unlimited: false };
}

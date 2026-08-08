import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFavoriteApps() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    const { data } = await supabase.from('app_favorites').select('app_id').eq('user_id', user.id);
    setFavorites(((data as any[]) || []).map(r => r.app_id));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (appId: string) => {
    if (!user) { toast.error('Sign in to save apps'); return; }
    const isFav = favorites.includes(appId);
    setFavorites(prev => (isFav ? prev.filter(id => id !== appId) : [...prev, appId]));
    if (isFav) {
      const { error } = await supabase.from('app_favorites').delete().eq('user_id', user.id).eq('app_id', appId);
      if (error) { toast.error(error.message); load(); return; }
      toast.success('Removed from My Apps');
    } else {
      const { error } = await supabase.from('app_favorites').insert({ user_id: user.id, app_id: appId } as any);
      if (error) { toast.error(error.message); load(); return; }
      toast.success('Saved to My Apps');
    }
  };

  return { favorites, toggle, reloadFavorites: load };
}

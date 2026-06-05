import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const withCheckTimeout = async <T,>(request: PromiseLike<T>, timeoutMs = 4000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Ban check timed out')), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

export default function ProtectedRoute({ children, requireAuth = false }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, loading, isGuest } = useAuth();
  const [banned, setBanned] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBan = async () => {
      if (!user) { setChecking(false); return; }
      try {
        const { data } = await withCheckTimeout(supabase.from('banned_users').select('id').eq('user_id', user.id).maybeSingle());
        if (data) {
          setBanned(true);
          toast.error('Your account has been banned. Contact support if you think this is a mistake.');
          await supabase.auth.signOut();
        }
      } catch {
        // Do not block the whole app if the backend is slow after login.
      }
      setChecking(false);
    };
    if (!loading) checkBan();
  }, [user, loading]);

  if (user && (loading || checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (banned) return <Navigate to="/" replace />;
  if (requireAuth && !user && !isGuest) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

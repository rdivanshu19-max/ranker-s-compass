import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [banned, setBanned] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBan = async () => {
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from('banned_users').select('id').eq('user_id', user.id).maybeSingle();
      if (data) {
        setBanned(true);
        toast.error('Your account has been banned. Contact support if you think this is a mistake.');
        await supabase.auth.signOut();
      }
      setChecking(false);
    };
    if (!loading) checkBan();
  }, [user, loading]);

  if (loading || checking) {
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
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

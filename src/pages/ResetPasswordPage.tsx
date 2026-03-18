import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryContext, setIsRecoveryContext] = useState(false);

  const hasValidPassword = useMemo(() => password.length >= 8 && password === confirmPassword, [password, confirmPassword]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const queryParams = new URLSearchParams(window.location.search);

    const flowType = hashParams.get('type') ?? queryParams.get('type');
    const hasToken = Boolean(hashParams.get('access_token') ?? queryParams.get('access_token') ?? queryParams.get('token_hash'));

    setIsRecoveryContext(flowType === 'recovery' || hasToken);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidPassword) {
      toast.error('Password must be at least 8 characters and both fields must match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully. You can now sign in.');
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md hero-card rounded-2xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            {isRecoveryContext
              ? 'Set a new password for your account.'
              : 'Open this page from your reset email link to continue.'}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">New Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="bg-background/50 border-border/50"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="bg-background/50 border-border/50"
              required
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={loading || !isRecoveryContext}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Button>
      </motion.div>
    </div>
  );
}

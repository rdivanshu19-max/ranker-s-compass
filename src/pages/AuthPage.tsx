import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!displayName.trim()) { toast.error('Please enter your name'); setLoading(false); return; }
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6" style={{ color: 'hsl(220 15% 70%)' }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        
        <div className="hero-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display mb-2">
              <span style={{ color: 'hsl(0 0% 100%)' }}>Rankers </span><span className="text-gradient">Star</span>
            </h1>
            <p style={{ color: 'hsl(220 15% 60%)' }}>{isSignUp ? 'Create your account' : 'Welcome back'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'hsl(220 15% 70%)' }}>Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name in the app"
                  className="bg-background/50 border-border/50" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'hsl(220 15% 70%)' }}>Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="bg-background/50 border-border/50" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'hsl(220 15% 70%)' }}>Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="bg-background/50 border-border/50" required />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              <Zap className="w-4 h-4" />
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

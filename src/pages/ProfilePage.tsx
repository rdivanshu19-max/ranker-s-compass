import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Save, Trash2, AlertTriangle, Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import BadgeChart from '@/components/BadgeChart';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const { user, profile, refreshProfile, isAdmin, signOut } = useAuth();
  const [name, setName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('referral_code').eq('user_id', user.id).single().then(async ({ data }) => {
      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      } else {
        const code = user.id.slice(0, 8).toUpperCase();
        await supabase.from('profiles').update({ referral_code: code }).eq('user_id', user.id);
        setReferralCode(code);
      }
    });
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id).then(({ count }) => {
      setReferralCount(count || 0);
    });
    supabase.from('user_badges').select('*').eq('user_id', user.id).then(({ data }) => {
      setBadges(data || []);
    });
    // Load progress data for badges
    const loadProgress = async () => {
      const [downloads, tests, sessions, referrals] = await Promise.all([
        supabase.from('user_downloads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('test_results').select('id, obtained_marks, total_marks').eq('user_id', user.id),
        supabase.from('study_sessions').select('date').eq('user_id', user.id).order('date', { ascending: false }).limit(365),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
      ]);
      // Calculate streak
      const dates = (sessions.data || []).map(s => s.date);
      const daySet = new Set(dates);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const cursor = new Date(today);
      if (!daySet.has(cursor.toISOString().split('T')[0])) { cursor.setDate(cursor.getDate() - 1); }
      let streak = 0;
      while (daySet.has(cursor.toISOString().split('T')[0])) { streak++; cursor.setDate(cursor.getDate() - 1); }
      // Best score
      const bestPct = Math.max(0, ...(tests.data || []).map(t => t.total_marks > 0 ? (t.obtained_marks / t.total_marks) * 100 : 0));
      setBadgeProgress({
        consistent: streak,
        explorer: downloads.count || 0,
        helpful: referrals.count || 0,
        topper: Math.round(bestPct),
        veteran: tests.count || 0,
      });
    };
    loadProgress();
    checkBadges();
  }, [user]);

  const checkBadges = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({}),
      });
      const result = await resp.json();
      if (result.awarded?.length > 0) {
        result.awarded.forEach((b: string) => toast.success(`🎉 Badge earned: ${b}!`));
        const { data } = await supabase.from('user_badges').select('*').eq('user_id', user.id);
        setBadges(data || []);
      }
    } catch {}
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: name, bio }).eq('user_id', user.id);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated!'); await refreshProfile(); }
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: 'delete_self' }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      toast.success('Account deleted successfully. Goodbye!');
      setDeleteDialogOpen(false);
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/';
    } catch (e: any) {
      toast.error('Failed to delete: ' + e.message);
    }
    setDeleting(false);
    setConfirmStep(0);
  };

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">Your <span className="text-gradient">Profile</span></h1>
      </motion.div>

      {/* Profile info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">{profile?.display_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {isAdmin && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Display Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Bio</label>
          <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </motion.div>

      {/* Badge System Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border p-6">
        <BadgeChart earnedBadges={badges} progress={badgeProgress} />
      </motion.div>

      {/* Referral */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold font-display">Refer Friends</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Share Rankers Star and earn the <span className="text-primary font-medium">🤝 Helpful</span> badge!</p>
        <div className="flex gap-2 mb-3">
          <Input value={referralLink} readOnly className="text-xs flex-1" />
          <Button variant="outline" size="icon" onClick={copyReferralLink}>
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">{referralCount}</span> friends joined via your link
        </p>
      </motion.div>

      {/* Delete Account */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="font-bold font-display text-destructive">Danger Zone</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting your account will permanently remove all your data, progress, test results, and study vault.
          You can create a new account with the same email later.
        </p>
        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setConfirmStep(0); }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" onClick={() => { setConfirmStep(1); setDeleteDialogOpen(true); }}>
              <Trash2 className="w-4 h-4" /> Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            {confirmStep <= 1 ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => { e.preventDefault(); setConfirmStep(2); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, I want to delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Final Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is your <strong>last chance</strong>. Once deleted, ALL your progress is gone forever.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep my account</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? 'Deleting...' : 'DELETE PERMANENTLY'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}

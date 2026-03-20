import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Star, Send, Trash2, MessageSquare, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function FeedbackPage() {
  const { user, profile, isAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userFeedback, setUserFeedback] = useState<any>(null);

  const loadFeedbacks = async () => {
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    setFeedbacks(data || []);
    if (user) {
      const mine = (data || []).find(f => f.user_id === user.id);
      setUserFeedback(mine || null);
    }
  };

  useEffect(() => { loadFeedbacks(); }, [user]);

  const submitFeedback = async () => {
    if (!user || !profile) return;
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id, display_name: profile.display_name, rating, review: review.trim() || null,
    });
    if (error) toast.error('Failed to submit');
    else { toast.success('Thank you for your feedback! ⭐'); setRating(0); setReview(''); }
    setSubmitting(false);
    loadFeedbacks();
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    toast.success('Feedback deleted');
    loadFeedbacks();
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase.from('feedback').update({ admin_reply: replyText.trim() }).eq('id', id);
    toast.success('Reply posted');
    setReplyingTo(null);
    setReplyText('');
    loadFeedbacks();
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-3xl font-bold font-display">
          <span className="text-gradient">Feedback</span> & Reviews
        </h1>
        <p className="text-muted-foreground mt-1">Tell us what you think about Rankers Star</p>
      </motion.div>

      {/* Overall rating */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border p-6 text-center">
        <div className="text-5xl font-bold font-display text-primary">{avgRating}</div>
        <div className="flex justify-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-5 h-5 ${s <= Math.round(Number(avgRating)) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{feedbacks.length} reviews</p>
      </motion.div>

      {/* Submit form */}
      {!userFeedback && user && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold font-display">Rate Rankers Star</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)} className="transition-transform hover:scale-125">
                <Star className={`w-8 h-8 ${s <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <Textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="Write your review (optional)..." rows={3} />
          <Button onClick={submitFeedback} disabled={submitting} className="gap-2">
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </motion.div>
      )}

      {userFeedback && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
          You've already submitted a review. Thank you! ⭐
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {feedbacks.map(f => (
          <motion.div key={f.id} initial="hidden" animate="visible" variants={fadeUp}
            className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {f.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-sm">{f.display_name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= f.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReplyingTo(f.id); setReplyText(f.admin_reply || ''); }}>
                      <Reply className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFeedback(f.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </>
                )}
                {user?.id === f.user_id && !isAdmin && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFeedback(f.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {f.review && <p className="text-sm text-muted-foreground mt-3">{f.review}</p>}
            {f.admin_reply && (
              <div className="mt-3 ml-6 border-l-2 border-primary/30 pl-3">
                <p className="text-xs font-medium text-primary mb-1">Admin Reply</p>
                <p className="text-sm text-muted-foreground">{f.admin_reply}</p>
              </div>
            )}
            {replyingTo === f.id && (
              <div className="mt-3 flex gap-2">
                <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write admin reply..." className="flex-1 text-sm" />
                <Button size="sm" onClick={() => submitReply(f.id)}>Reply</Button>
                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

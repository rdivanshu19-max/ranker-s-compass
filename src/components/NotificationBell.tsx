import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  image_url?: string;
  priority?: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-mark as read when popover opens
  useEffect(() => {
    if (!open || !user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const markRead = async () => {
      for (const id of unreadIds) {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      }
      load();
    };
    const timer = setTimeout(markRead, 800);
    return () => clearTimeout(timer);
  }, [open, notifications]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'badge_earned': return '🏆';
      case 'feedback_reply': return '💬';
      case 'admin_broadcast': return '📢';
      default: return '🔔';
    }
  };

  const getPriorityStyle = (priority?: string) => {
    if (priority === 'important') return 'border-l-4 border-l-orange-500 bg-orange-500/5';
    if (priority === 'urgent') return 'border-l-4 border-l-destructive bg-destructive/5';
    return '';
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] max-w-[calc(100vw-2rem)] p-0 max-h-[85vh] rounded-2xl border-border/60 shadow-2xl shadow-primary/10 overflow-hidden" align="end">
          <div className="relative px-5 py-4 border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/20 backdrop-blur flex items-center justify-center shadow-inner">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base font-display">Notifications</h4>
                  <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'You\'re all caught up ✨'}</p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground border-0 text-xs px-2.5 py-1">
                  <Sparkles className="w-3 h-3 mr-1" /> {unreadCount} new
                </Badge>
              )}
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="text-center py-14 px-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-base font-semibold text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">We'll ping you when something happens!</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-5 py-4 transition-all hover:bg-muted/40 ${!n.read ? 'bg-primary/5' : ''} ${getPriorityStyle(n.priority)}`}>
                <div className="flex gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                    n.priority === 'urgent' ? 'bg-destructive/15' :
                    n.priority === 'important' ? 'bg-orange-500/15' :
                    'bg-primary/10'
                  }`}>
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-snug break-words">{n.title}</p>
                      {!n.read && <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />}
                    </div>
                    {n.message && <p className="text-sm text-muted-foreground leading-relaxed break-words">{n.message}</p>}
                    {n.image_url && n.image_url.length > 0 && (
                      <img
                        src={n.image_url}
                        alt=""
                        className="w-full max-h-44 object-cover rounded-xl mt-2 border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxUrl(n.image_url!)}
                      />
                    )}
                    <div className="flex items-center gap-2 pt-0.5">
                      {n.priority === 'urgent' && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Urgent
                        </span>
                      )}
                      {n.priority === 'important' && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Important
                        </span>
                      )}
                      <p className="text-[11px] text-muted-foreground/70">
                        {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Image lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur-sm">
          <DialogTitle className="sr-only">Notification Image</DialogTitle>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="" className="w-full max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

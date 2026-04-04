import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
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
      <PopoverContent className="w-96 p-0 max-h-[80vh]" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Notifications</h4>
              <p className="text-[10px] text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" /> {unreadCount} new
            </Badge>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">We'll notify you when something happens!</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`p-4 border-b border-border last:border-0 transition-all hover:bg-muted/30 ${!n.read ? 'bg-primary/5' : ''} ${getPriorityStyle(n.priority)}`}>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">{getTypeIcon(n.type)}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{n.title}</p>
                    {n.priority === 'urgent' && (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    {n.priority === 'important' && (
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    )}
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>}
                  {n.image_url && (
                    <img src={n.image_url} alt="" className="w-full max-h-32 object-cover rounded-lg mt-2 border border-border" />
                  )}
                  <p className="text-[10px] text-muted-foreground/60">
                    {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

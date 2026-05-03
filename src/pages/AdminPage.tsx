import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Shield, Plus, Trash2, Pin, ToggleLeft, ToggleRight, Edit3, AlertTriangle,
  Users, Ban, Search, MessageSquare, CheckCircle, GraduationCap, Bell, Upload, Tag, Image,
  ShieldCheck, Flag, UserPlus, UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DEFAULT_TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'JEE Advanced', 'JEE Test', 'NEET Test', 'Other Material', 'Tests', 'Physics', 'Chemistry', 'Maths', 'Biology', 'Boards'];
const COURSE_TAGS = ['popular', 'hot', 'most used', 'boards'];
const MAX_PINNED = 10;

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTypes, setEditTypes] = useState<string[]>([]);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMode, setEditMode] = useState<'categories' | 'title'>('categories');
  const [pinnedCount, setPinnedCount] = useState(0);
  const [tab, setTab] = useState<'materials' | 'users' | 'feedback' | 'courses' | 'notifications' | 'moderators' | 'reports'>('materials');
  const [moderators, setModerators] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [searchUser, setSearchUser] = useState('');
  const [banReason, setBanReason] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Courses state
  const [courses, setCourses] = useState<any[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePosterFile, setCoursePosterFile] = useState<File | null>(null);
  const [courseResources, setCourseResources] = useState<{ title: string; url: string; type: string }[]>([]);
  const [addingCourse, setAddingCourse] = useState(false);
  const [courseTags, setCourseTags] = useState<string[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseTags, setEditCourseTags] = useState<string[]>([]);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const editPosterInputRef = useRef<HTMLInputElement>(null);
  const [editCoursePosterFile, setEditCoursePosterFile] = useState<File | null>(null);

  // Notification state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState('normal');
  const [notifImageFile, setNotifImageFile] = useState<File | null>(null);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [editNotifTitle, setEditNotifTitle] = useState('');
  const [editNotifMessage, setEditNotifMessage] = useState('');
  const notifImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMaterials(); loadUsers(); loadFeedbacks(); loadCourses(); loadNotifications(); loadModerators(); loadReports(); }, []);

  const loadModerators = async () => {
    const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'moderator');
    setModerators(new Set((data || []).map((r: any) => r.user_id)));
  };

  const loadReports = async () => {
    const { data } = await supabase.from('user_reports').select('*').order('created_at', { ascending: false });
    setReports(data || []);
  };

  const promoteModerator = async (userId: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'moderator' as any });
    if (error) { toast.error(error.message); return; }
    await supabase.from('activity_log').insert({ actor_id: user!.id, actor_role: 'admin', action: 'promote_moderator', target_type: 'user', target_id: userId });
    await supabase.from('notifications').insert({ user_id: userId, title: '🛡️ You are now a Moderator', message: 'You can add materials/courses and report users.', type: 'admin_broadcast', priority: 'important' } as any);
    toast.success('Promoted to moderator');
    loadModerators();
  };

  const demoteModerator = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'moderator' as any);
    if (error) { toast.error(error.message); return; }
    await supabase.from('activity_log').insert({ actor_id: user!.id, actor_role: 'admin', action: 'demote_moderator', target_type: 'user', target_id: userId });
    toast.success('Moderator removed');
    loadModerators();
  };

  const updateReportStatus = async (id: string, status: string, notes?: string) => {
    await supabase.from('user_reports').update({ status, admin_notes: notes ?? null, updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('activity_log').insert({ actor_id: user!.id, actor_role: 'admin', action: `report_${status}`, target_type: 'report', target_id: id });
    toast.success(`Report marked ${status}`);
    loadReports();
  };

  if (!isAdmin) return <Navigate to="/app" replace />;

  const loadMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    const mats = data || [];
    setMaterials(mats);
    setPinnedCount(mats.filter(m => m.pinned).length);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllProfiles(profiles || []);
    const { data: bans } = await supabase.from('banned_users').select('user_id');
    setBannedUsers(new Set((bans || []).map(b => b.user_id)));
  };

  const loadFeedbacks = async () => {
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    setFeedbacks(data || []);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
  };

  const addMaterial = async () => {
    if (!title.trim() || !link.trim()) { toast.error('Fill all fields'); return; }
    if (selectedTypes.length === 0) { toast.error('Select at least one type'); return; }
    const { error } = await supabase.from('materials').insert({ title, link, description: description.trim() || '', types: selectedTypes, uploaded_by: user!.id });
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Material uploaded!');
    setTitle(''); setLink(''); setDescription(''); setSelectedTypes([]); setAdding(false);
    loadMaterials();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    if (!pinned && pinnedCount >= MAX_PINNED) { toast.error(`Maximum ${MAX_PINNED} pinned materials allowed.`); return; }
    await supabase.from('materials').update({ pinned: !pinned }).eq('id', id);
    loadMaterials();
  };

  const toggleRating = async (id: string, enabled: boolean) => {
    await supabase.from('materials').update({ rating_enabled: !enabled }).eq('id', id);
    loadMaterials();
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from('materials').delete().eq('id', id);
    toast.success('Deleted');
    loadMaterials();
  };

  const toggleType = (t: string) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const startEditCategories = (m: any) => { setEditingId(m.id); setEditTypes(m.types || []); setEditMode('categories'); };
  const startEditTitle = (m: any) => { setEditingId(m.id); setEditTitle(m.title); setEditDescription(m.description || ''); setEditMode('title'); };

  const saveEditCategories = async (id: string) => {
    if (editTypes.length === 0) { toast.error('Select at least one category'); return; }
    await supabase.from('materials').update({ types: editTypes }).eq('id', id);
    toast.success('Categories updated!');
    setEditingId(null);
    loadMaterials();
  };

  const saveEditTitle = async (id: string) => {
    if (!editTitle.trim()) { toast.error('Title cannot be empty'); return; }
    await supabase.from('materials').update({ title: editTitle.trim(), description: editDescription.trim() }).eq('id', id);
    toast.success('Material updated!');
    setEditingId(null);
    loadMaterials();
  };

  const toggleEditType = (t: string) => setEditTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const callAdminAction = async (action: string, targetUserId: string, extraBody: Record<string, string> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ action, target_user_id: targetUserId, ...extraBody }),
    });
    return resp.json();
  };

  const banUser = async (userId: string) => {
    try {
      const result = await callAdminAction('admin_ban', userId, { reason: banReason || 'Banned by admin' });
      if (result.error) throw new Error(result.error);
      toast.success('User banned');
      setBanReason('');
      loadUsers();
    } catch (e: any) { toast.error('Failed: ' + e.message); }
  };

  const unbanUser = async (userId: string) => {
    try {
      const result = await callAdminAction('admin_unban', userId);
      if (result.error) throw new Error(result.error);
      toast.success('User unbanned');
      loadUsers();
    } catch (e: any) { toast.error('Failed: ' + e.message); }
  };

  const deleteUser = async (userId: string) => {
    try {
      const result = await callAdminAction('admin_delete', userId);
      if (result.error) throw new Error(result.error);
      toast.success('User deleted');
      loadUsers();
    } catch (e: any) { toast.error('Failed: ' + e.message); }
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase.from('feedback').update({ admin_reply: replyText.trim() }).eq('id', id);
    // Send notification to user
    const fb = feedbacks.find(f => f.id === id);
    if (fb) {
      await supabase.from('notifications').insert({
        user_id: fb.user_id,
        title: '💬 Admin replied to your feedback',
        message: replyText.trim().slice(0, 200),
        type: 'feedback_reply',
      } as any);
    }
    toast.success('Reply posted & user notified');
    setReplyingTo(null);
    setReplyText('');
    loadFeedbacks();
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    toast.success('Feedback deleted');
    loadFeedbacks();
  };

  // Upload poster to storage
  const uploadPoster = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('course-posters').upload(path, file);
    if (error) { toast.error('Failed to upload poster'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('course-posters').getPublicUrl(path);
    return publicUrl;
  };

  const addCourse = async () => {
    if (!courseTitle.trim()) { toast.error('Course title required'); return; }
    let posterUrl = '';
    if (coursePosterFile) {
      const url = await uploadPoster(coursePosterFile);
      if (!url) return;
      posterUrl = url;
    }
    const { error } = await supabase.from('courses').insert({
      title: courseTitle.trim(),
      description: courseDesc.trim(),
      poster_url: posterUrl,
      resources: courseResources.filter(r => r.url.trim()),
      tags: courseTags,
      created_by: user!.id,
    } as any);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Course added!');
    setCourseTitle(''); setCourseDesc(''); setCoursePosterFile(null); setCourseResources([]); setCourseTags([]); setAddingCourse(false);
    loadCourses();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from('courses').delete().eq('id', id);
    toast.success('Course deleted');
    loadCourses();
  };

  const toggleCoursePin = async (id: string, pinned: boolean) => {
    await supabase.from('courses').update({ pinned: !pinned } as any).eq('id', id);
    loadCourses();
  };

  const startEditCourse = (c: any) => {
    setEditingCourseId(c.id);
    setEditCourseTitle(c.title);
    setEditCourseDesc(c.description || '');
    setEditCourseTags(c.tags || []);
    setEditCoursePosterFile(null);
  };

  const saveEditCourse = async (id: string) => {
    const updates: any = { title: editCourseTitle.trim(), description: editCourseDesc.trim(), tags: editCourseTags };
    if (editCoursePosterFile) {
      const url = await uploadPoster(editCoursePosterFile);
      if (url) updates.poster_url = url;
    }
    await supabase.from('courses').update(updates).eq('id', id);
    toast.success('Course updated!');
    setEditingCourseId(null);
    loadCourses();
  };

  const addResourceField = () => setCourseResources(prev => [...prev, { title: '', url: '', type: 'link' }]);
  const updateResource = (index: number, field: string, value: string) => setCourseResources(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  const removeResource = (index: number) => setCourseResources(prev => prev.filter((_, i) => i !== index));

  const uploadNotifImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('course-posters').upload(path, file);
    if (error) { toast.error('Failed to upload image'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('course-posters').getPublicUrl(path);
    return publicUrl;
  };

  const sendBroadcastNotification = async () => {
    if (!notifTitle.trim()) { toast.error('Title required'); return; }
    setSendingNotif(true);
    let imageUrl = '';
    if (notifImageFile) {
      const url = await uploadNotifImage(notifImageFile);
      if (url) imageUrl = url;
    }
    const { data: profiles } = await supabase.from('profiles').select('user_id');
    if (profiles && profiles.length > 0) {
      const rows = profiles.map(p => ({
        user_id: p.user_id,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: 'admin_broadcast',
        image_url: imageUrl,
        priority: notifPriority,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        await supabase.from('notifications').insert(rows.slice(i, i + 50) as any);
      }
      toast.success(`Notification sent to ${profiles.length} users!`);
      setNotifTitle(''); setNotifMessage(''); setNotifPriority('normal'); setNotifImageFile(null);
      loadNotifications();
    }
    setSendingNotif(false);
  };

  const loadNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    // Deduplicate by title+created_at (broadcasts create one per user)
    const seen = new Set<string>();
    const unique: any[] = [];
    (data || []).forEach(n => {
      const key = `${n.title}||${n.created_at}`;
      if (!seen.has(key)) { seen.add(key); unique.push(n); }
    });
    setSentNotifications(unique);
  };

  const deleteNotification = async (title: string, _createdAt: string) => {
    // Delete all copies of this broadcast across all users by matching title
    // created_at can have microsecond differences across batch inserts
    const { data: matches } = await supabase.from('notifications').select('id').eq('title', title);
    if (matches && matches.length > 0) {
      for (let i = 0; i < matches.length; i += 50) {
        const ids = matches.slice(i, i + 50).map(m => m.id);
        for (const id of ids) {
          await supabase.from('notifications').delete().eq('id', id);
        }
      }
    }
    toast.success('Notification deleted for all users');
    loadNotifications();
  };

  const startEditNotif = (n: any) => {
    setEditingNotifId(n.id);
    setEditNotifTitle(n.title);
    setEditNotifMessage(n.message);
  };

  const saveEditNotif = async (title: string, createdAt: string) => {
    await supabase.from('notifications').update({ title: editNotifTitle.trim(), message: editNotifMessage.trim() } as any).eq('title', title).eq('created_at', createdAt);
    toast.success('Notification updated');
    setEditingNotifId(null);
    loadNotifications();
  };

  const filteredProfiles = allProfiles.filter(p =>
    p.display_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    p.user_id?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> Admin <span className="text-gradient">Panel</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage materials, users, feedback, courses & notifications</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['materials', 'users', 'feedback', 'courses', 'notifications', 'moderators', 'reports'] as const).map(t => {
            const icons: any = { materials: null, users: Users, feedback: MessageSquare, courses: GraduationCap, notifications: Bell, moderators: ShieldCheck, reports: Flag };
            const Icon = icons[t];
            return (
              <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)} className="gap-1 capitalize">
                {Icon && <Icon className="w-4 h-4" />} {t}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* ========== MATERIALS TAB ========== */}
      {tab === 'materials' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
              <span>Pinned: <strong className="text-primary">{pinnedCount}/{MAX_PINNED}</strong></span>
            </div>
            <Button onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 mr-1" /> Upload Material</Button>
          </div>

          {adding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Material name" />
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Material link (URL)" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} />
              <div>
                <label className="text-sm font-medium mb-2 block">Type(s)</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TYPES.map(t => (
                    <Button key={t} variant={selectedTypes.includes(t) ? 'default' : 'outline'} size="sm" onClick={() => toggleType(t)}>{t}</Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addMaterial}>Upload</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {materials.map(m => (
              <div key={m.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === m.id && editMode === 'title' ? (
                      <div className="space-y-2">
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                        <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditTitle(m.id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold">{m.title}</h3>
                        {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                      </>
                    )}
                    {editingId === m.id && editMode === 'categories' ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {DEFAULT_TYPES.map(t => (
                            <Button key={t} variant={editTypes.includes(t) ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => toggleEditType(t)}>{t}</Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditCategories(m.id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : editingId !== m.id && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.types?.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    <Button variant="ghost" size="icon" onClick={() => startEditTitle(m)} title="Edit title"><Edit3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => startEditCategories(m)} title="Edit categories"><span className="text-xs">🏷️</span></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePin(m.id, m.pinned)} title={m.pinned ? 'Unpin' : 'Pin'}>
                      <Pin className={`w-4 h-4 ${m.pinned ? 'text-primary fill-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleRating(m.id, m.rating_enabled)} title="Toggle rating">
                      {m.rating_enabled ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMaterial(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== USERS TAB ========== */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search by name..." className="pl-9" />
          </div>
          <p className="text-sm text-muted-foreground">{filteredProfiles.length} users total</p>
          <div className="space-y-2">
            {filteredProfiles.map(p => (
              <div key={p.id} className={`bg-card rounded-xl border p-4 flex items-center justify-between gap-3 ${bannedUsers.has(p.user_id) ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {p.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.user_id}</p>
                    {bannedUsers.has(p.user_id) && (
                      <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">BANNED</span>
                    )}
                  </div>
                </div>
                {p.user_id !== user?.id && (
                  <div className="flex gap-1 shrink-0">
                    {bannedUsers.has(p.user_id) ? (
                      <Button variant="outline" size="sm" onClick={() => unbanUser(p.user_id)} className="gap-1 text-xs">
                        <CheckCircle className="w-3 h-3" /> Unban
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Ban user"><Ban className="w-4 h-4 text-orange-500" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ban {p.display_name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <Input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason (optional)" className="mt-2" />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => banUser(p.user_id)} className="bg-orange-500 hover:bg-orange-600">Ban</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Delete user"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {p.display_name}'s account?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the user and all their data.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(p.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== FEEDBACK TAB ========== */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No feedback yet</p>
          ) : feedbacks.map(f => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{f.display_name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xs ${s <= f.rating ? 'text-primary' : 'text-muted-foreground/30'}`}>★</span>
                    ))}
                  </div>
                  {f.review && <p className="text-sm text-muted-foreground mt-2">{f.review}</p>}
                  {f.admin_reply && (
                    <div className="mt-2 ml-4 border-l-2 border-primary/30 pl-3">
                      <p className="text-xs text-primary font-medium">Admin Reply</p>
                      <p className="text-sm text-muted-foreground">{f.admin_reply}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReplyingTo(f.id); setReplyText(f.admin_reply || ''); }}>
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFeedback(f.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
              {replyingTo === f.id && (
                <div className="mt-3 flex gap-2">
                  <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write reply..." className="flex-1 text-sm" />
                  <Button size="sm" onClick={() => submitReply(f.id)}>Reply</Button>
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========== COURSES TAB ========== */}
      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddingCourse(!addingCourse)}><Plus className="w-4 h-4 mr-1" /> Add Course</Button>
          </div>

          {addingCourse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Course title" />
              <Textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Description" rows={2} />
              
              {/* Poster upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Poster Image</label>
                <input ref={posterInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setCoursePosterFile(e.target.files?.[0] || null)} />
                <Button variant="outline" size="sm" onClick={() => posterInputRef.current?.click()} className="gap-1">
                  <Upload className="w-3 h-3" /> {coursePosterFile ? coursePosterFile.name : 'Upload Poster'}
                </Button>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_TAGS.map(t => (
                    <Button key={t} variant={courseTags.includes(t) ? 'default' : 'outline'} size="sm"
                      onClick={() => setCourseTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                      <Tag className="w-3 h-3 mr-1" /> {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Resources</label>
                  <Button variant="outline" size="sm" onClick={addResourceField}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {courseResources.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input value={r.title} onChange={e => updateResource(i, 'title', e.target.value)} placeholder="Title" className="flex-1" />
                    <Input value={r.url} onChange={e => updateResource(i, 'url', e.target.value)} placeholder="URL" className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeResource(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={addCourse}>Add Course</Button>
                <Button variant="outline" onClick={() => setAddingCourse(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {courses.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No courses yet</p>
            ) : courses.map(c => (
              <div key={c.id} className="bg-card rounded-xl border border-border p-4">
                {editingCourseId === c.id ? (
                  <div className="space-y-3">
                    <Input value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)} placeholder="Title" />
                    <Textarea value={editCourseDesc} onChange={e => setEditCourseDesc(e.target.value)} placeholder="Description" rows={2} />
                    <div>
                      <label className="text-xs font-medium mb-1 block">Change Poster</label>
                      <input ref={editPosterInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => setEditCoursePosterFile(e.target.files?.[0] || null)} />
                      <Button variant="outline" size="sm" onClick={() => editPosterInputRef.current?.click()} className="gap-1">
                        <Image className="w-3 h-3" /> {editCoursePosterFile ? editCoursePosterFile.name : 'Upload New Poster'}
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Tags</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COURSE_TAGS.map(t => (
                          <Button key={t} variant={editCourseTags.includes(t) ? 'default' : 'outline'} size="sm" className="text-xs"
                            onClick={() => setEditCourseTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                            {t}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditCourse(c.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCourseId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{c.title}</h3>
                        {c.pinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">📌</span>}
                      </div>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {c.tags.map((t: string) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                          ))}
                        </div>
                      )}
                      {c.resources?.length > 0 && <p className="text-xs text-primary mt-1">{c.resources.length} resource(s)</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEditCourse(c)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleCoursePin(c.id, c.pinned)} title={c.pinned ? 'Unpin' : 'Pin'}>
                        <Pin className={`w-4 h-4 ${c.pinned ? 'text-primary fill-primary' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCourse(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== NOTIFICATIONS TAB ========== */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Send Broadcast Notification</h3>
            </div>
            <p className="text-xs text-muted-foreground">Send a notification to all users on the platform.</p>
            <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Notification title" />
            <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Message (optional)" rows={3} />
            
            {/* Priority selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <div className="flex gap-2">
                {['normal', 'important', 'urgent'].map(p => (
                  <Button key={p} variant={notifPriority === p ? 'default' : 'outline'} size="sm"
                    onClick={() => setNotifPriority(p)} className="capitalize">{p}</Button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Attach Image (optional)</label>
              <input ref={notifImageRef} type="file" accept="image/*" className="hidden"
                onChange={e => setNotifImageFile(e.target.files?.[0] || null)} />
              <Button variant="outline" size="sm" onClick={() => notifImageRef.current?.click()} className="gap-1">
                <Upload className="w-3 h-3" /> {notifImageFile ? notifImageFile.name : 'Upload Image'}
              </Button>
            </div>

            <Button onClick={sendBroadcastNotification} disabled={sendingNotif} className="gap-1">
              <Bell className="w-4 h-4" /> {sendingNotif ? 'Sending...' : 'Send to All Users'}
            </Button>
          </motion.div>

          {/* Sent notifications list */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm">Sent Notifications</h4>
            {sentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No notifications sent yet</p>
            ) : sentNotifications.map(n => (
              <div key={n.id} className="bg-card rounded-xl border border-border p-4">
                {editingNotifId === n.id ? (
                  <div className="space-y-2">
                    <Input value={editNotifTitle} onChange={e => setEditNotifTitle(e.target.value)} placeholder="Title" />
                    <Textarea value={editNotifMessage} onChange={e => setEditNotifMessage(e.target.value)} placeholder="Message" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditNotif(n.title, n.created_at)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingNotifId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      {n.image_url && <img src={n.image_url} alt="" className="w-20 h-14 object-cover rounded mt-1" />}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditNotif(n)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(n.title, n.created_at)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

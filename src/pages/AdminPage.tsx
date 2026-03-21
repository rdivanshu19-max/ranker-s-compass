import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Pin, ToggleLeft, ToggleRight, Edit3, AlertTriangle, Users, Ban, Search, MessageSquare, CheckCircle } from 'lucide-react';
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
  const [tab, setTab] = useState<'materials' | 'users' | 'feedback'>('materials');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [searchUser, setSearchUser] = useState('');
  const [banReason, setBanReason] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { loadMaterials(); loadUsers(); loadFeedbacks(); }, []);

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
    toast.success('Reply posted');
    setReplyingTo(null);
    setReplyText('');
    loadFeedbacks();
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    toast.success('Feedback deleted');
    loadFeedbacks();
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
          <p className="text-muted-foreground mt-1">Manage materials, users & feedback</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={tab === 'materials' ? 'default' : 'outline'} size="sm" onClick={() => setTab('materials')}>Materials</Button>
          <Button variant={tab === 'users' ? 'default' : 'outline'} size="sm" onClick={() => setTab('users')} className="gap-1">
            <Users className="w-4 h-4" /> Users
          </Button>
          <Button variant={tab === 'feedback' ? 'default' : 'outline'} size="sm" onClick={() => setTab('feedback')} className="gap-1">
            <MessageSquare className="w-4 h-4" /> Feedback
          </Button>
        </div>
      </motion.div>

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
                    <Button variant="ghost" size="icon" onClick={() => startEditCategories(m)} title="Edit categories">
                      <span className="text-xs">🏷️</span>
                    </Button>
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
    </div>
  );
}

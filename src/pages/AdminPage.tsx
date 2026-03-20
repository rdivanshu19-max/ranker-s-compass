import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Pin, ToggleLeft, ToggleRight, Edit3, AlertTriangle, Users, Ban, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DEFAULT_TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'Other Material', 'Tests', 'Physics', 'Chemistry', 'Maths', 'Biology', 'Boards'];
const MAX_PINNED = 10;

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTypes, setEditTypes] = useState<string[]>([]);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [tab, setTab] = useState<'materials' | 'users'>('materials');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [searchUser, setSearchUser] = useState('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => { loadMaterials(); loadUsers(); }, []);

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

  const addMaterial = async () => {
    if (!title.trim() || !link.trim()) { toast.error('Fill all fields'); return; }
    if (selectedTypes.length === 0) { toast.error('Select at least one type'); return; }
    const { error } = await supabase.from('materials').insert({ title, link, types: selectedTypes, uploaded_by: user!.id });
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Material uploaded!');
    setTitle(''); setLink(''); setSelectedTypes([]); setAdding(false);
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

  const startEditCategories = (m: any) => { setEditingId(m.id); setEditTypes(m.types || []); };

  const saveEditCategories = async (id: string) => {
    if (editTypes.length === 0) { toast.error('Select at least one category'); return; }
    await supabase.from('materials').update({ types: editTypes }).eq('id', id);
    toast.success('Categories updated!');
    setEditingId(null);
    loadMaterials();
  };

  const toggleEditType = (t: string) => setEditTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const banUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: 'admin_ban', target_user_id: userId, reason: banReason || 'Banned by admin' }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      toast.success('User banned');
      setBanReason('');
      loadUsers();
    } catch (e: any) { toast.error('Failed: ' + e.message); }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: 'admin_delete', target_user_id: userId }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      toast.success('User deleted');
      loadUsers();
    } catch (e: any) { toast.error('Failed: ' + e.message); }
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
          <p className="text-muted-foreground mt-1">Manage materials and users</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'materials' ? 'default' : 'outline'} onClick={() => setTab('materials')}>Materials</Button>
          <Button variant={tab === 'users' ? 'default' : 'outline'} onClick={() => setTab('users')} className="gap-2">
            <Users className="w-4 h-4" /> Users
          </Button>
        </div>
      </motion.div>

      {tab === 'materials' && (
        <>
          <div className="flex items-center justify-between">
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
                  <div className="flex-1">
                    <h3 className="font-bold">{m.title}</h3>
                    {editingId === m.id ? (
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
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.types?.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEditCategories(m)} title="Edit categories"><Edit3 className="w-4 h-4" /></Button>
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search by name..." className="pl-9" />
            </div>
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
                    {!bannedUsers.has(p.user_id) && (
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
                          <AlertDialogDescription>This will permanently delete the user and all their data. This cannot be undone.</AlertDialogDescription>
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
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Trash2, Edit3, Upload, GripVertical, ChevronUp, ChevronDown, Tag, Layers, Link as LinkIcon, Save, X,
} from 'lucide-react';
import { ALL_CATEGORIES, BADGE_KEYS, badgeInfo, sortPortals, type StudyApp, type StudyPortal } from '@/lib/studyApps';

const uploadImage = async (file: File): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `apps/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('course-posters').upload(path, file);
  if (error) { toast.error('Upload failed: ' + error.message); return null; }
  return supabase.storage.from('course-posters').getPublicUrl(path).data.publicUrl;
};

type Draft = { name: string; description: string; courses_included: string; logo_url: string; banner_url: string };
const emptyDraft: Draft = { name: '', description: '', courses_included: '', logo_url: '', banner_url: '' };

export default function StudyAppsAdmin({ actorId }: { actorId: string }) {
  const [apps, setApps] = useState<StudyApp[]>([]);
  const [portals, setPortals] = useState<StudyPortal[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [portalDraft, setPortalDraft] = useState<Record<string, { name: string; url: string; category: string; badge: string; description?: string }>>({});
  const [editPortal, setEditPortal] = useState<StudyPortal | null>(null);
  const dragId = useRef<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [a, p, c] = await Promise.all([
      supabase.from('study_apps').select('*').order('sort_order', { ascending: true }),
      supabase.from('study_portals').select('*').order('sort_order', { ascending: true }),
      supabase.from('portal_categories').select('id,name').order('name'),
    ]);
    setApps((a.data as StudyApp[]) || []);
    setPortals((p.data as StudyPortal[]) || []);
    setCategories((c.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const log = (action: string, target_id: string, details: any) =>
    supabase.from('activity_log').insert({ actor_id: actorId, actor_role: 'admin', action, target_type: 'study_app', target_id, details });

  /* ---------- apps ---------- */
  const saveApp = async () => {
    if (!draft.name.trim()) { toast.error('App name required'); return; }
    setBusy(true);
    if (editingId) {
      const { error } = await supabase.from('study_apps').update({ ...draft, name: draft.name.trim() } as any).eq('id', editingId);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log('edit_app', editingId, { name: draft.name });
      toast.success('App updated');
    } else {
      const { error } = await supabase.from('study_apps').insert({ ...draft, name: draft.name.trim(), sort_order: apps.length, created_by: actorId } as any);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log('add_app', draft.name.trim(), { name: draft.name });
      toast.success('App added');
    }
    setDraft(emptyDraft); setAdding(false); setEditingId(null); load();
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Delete this app and all its portals?')) return;
    const { error } = await supabase.from('study_apps').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await log('delete_app', id, {});
    toast.success('App deleted'); load();
  };

  const moveApp = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= apps.length) return;
    const reordered = [...apps];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setApps(reordered);
    await Promise.all(reordered.map((a, i) => supabase.from('study_apps').update({ sort_order: i } as any).eq('id', a.id)));
  };

  const startEditApp = (a: StudyApp) => {
    setEditingId(a.id); setAdding(true);
    setDraft({ name: a.name, description: a.description || '', courses_included: a.courses_included || '', logo_url: a.logo_url || '', banner_url: a.banner_url || '' });
  };

  /* ---------- categories ---------- */
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from('portal_categories').insert({ name: newCategory.trim() } as any);
    if (error) { toast.error(error.message); return; }
    setNewCategory(''); toast.success('Category added'); load();
  };
  const saveCategory = async (id: string) => {
    const { error } = await supabase.from('portal_categories').update({ name: editCatName.trim() } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setEditCatId(null); load();
  };
  const deleteCategory = async (id: string) => {
    await supabase.from('portal_categories').delete().eq('id', id);
    load();
  };

  /* ---------- portals ---------- */
  const appPortals = (appId: string) => sortPortals(portals.filter(p => p.app_id === appId));

  const addPortal = async (appId: string) => {
    const d = portalDraft[appId];
    if (!d?.name?.trim() || !d?.url?.trim()) { toast.error('Portal name and URL required'); return; }
    const count = portals.filter(p => p.app_id === appId).length;
    const { error } = await supabase.from('study_portals').insert({
      app_id: appId, name: d.name.trim(), url: d.url.trim(), category: d.category || 'Other', badge: d.badge || 'standard', description: (d as any).description?.trim() || null, sort_order: count,
    } as any);
    if (error) { toast.error(error.message); return; }
    await log('add_portal', appId, { portal: d.name });
    setPortalDraft(prev => ({ ...prev, [appId]: { name: '', url: '', category: d.category || 'Other', badge: 'standard' } }));
    toast.success('Portal added'); load();
  };

  const savePortal = async () => {
    if (!editPortal) return;
    const { error } = await supabase.from('study_portals').update({
      name: editPortal.name, url: editPortal.url, category: editPortal.category, badge: editPortal.badge, description: editPortal.description || null,
    } as any).eq('id', editPortal.id);
    if (error) { toast.error(error.message); return; }
    await log('edit_portal', editPortal.id, { portal: editPortal.name });
    setEditPortal(null); toast.success('Portal updated'); load();
  };

  const deletePortal = async (id: string) => {
    await supabase.from('study_portals').delete().eq('id', id);
    await log('delete_portal', id, {});
    toast.success('Portal deleted'); load();
  };

  const reorderPortals = async (appId: string, fromId: string, toId: string) => {
    const list = appPortals(appId);
    const from = list.findIndex(p => p.id === fromId);
    const to = list.findIndex(p => p.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPortals(prev => prev.map(p => {
      const i = next.findIndex(n => n.id === p.id);
      return i >= 0 ? { ...p, sort_order: i } : p;
    }));
    await Promise.all(next.map((p, i) => supabase.from('study_portals').update({ sort_order: i } as any).eq('id', p.id)));
  };

  if (loading) return <p className="text-center py-10 text-muted-foreground">Loading study apps...</p>;

  return (
    <div className="space-y-5">
      {/* Categories manager */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Portal Categories</h3>
        <div className="flex gap-2">
          <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category (e.g. JEE)" />
          <Button onClick={addCategory}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => editCatId === c.id ? (
            <span key={c.id} className="flex items-center gap-1">
              <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="h-8 w-32" />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveCategory(c.id)}><Save className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditCatId(null)}><X className="w-3.5 h-3.5" /></Button>
            </span>
          ) : (
            <span key={c.id} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-secondary border border-border">
              {c.name}
              <button onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }} className="opacity-60 hover:opacity-100"><Edit3 className="w-3 h-3" /></button>
              <button onClick={() => deleteCategory(c.id)} className="opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3 text-destructive" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setAdding(!adding); setEditingId(null); setDraft(emptyDraft); }}>
          <Plus className="w-4 h-4 mr-1" /> Add App
        </Button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="App name (e.g. PW)" />
          <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="App description" rows={2} />
          <Textarea value={draft.courses_included} onChange={e => setDraft({ ...draft, courses_included: e.target.value })} placeholder="Courses included (optional)" rows={2} />
          <div className="flex flex-wrap gap-3">
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setDraft(d => ({ ...d, logo_url: u })); } }} />
              <Button variant="outline" size="sm" className="gap-1" onClick={() => logoRef.current?.click()}><Upload className="w-3 h-3" /> Logo</Button>
              {draft.logo_url && <img src={draft.logo_url} alt="logo preview" className="w-10 h-10 rounded-lg object-cover mt-2" />}
            </div>
            <div>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setDraft(d => ({ ...d, banner_url: u })); } }} />
              <Button variant="outline" size="sm" className="gap-1" onClick={() => bannerRef.current?.click()}><Upload className="w-3 h-3" /> Banner</Button>
              {draft.banner_url && <img src={draft.banner_url} alt="banner preview" className="h-10 rounded-lg object-cover mt-2" />}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveApp} disabled={busy}>{editingId ? 'Save Changes' : 'Create App'}</Button>
            <Button variant="outline" onClick={() => { setAdding(false); setEditingId(null); setDraft(emptyDraft); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {apps.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No study apps yet</p>
      ) : apps.map((a, i) => {
        const list = appPortals(a.id);
        const d = portalDraft[a.id] || { name: '', url: '', category: categories[0]?.name || 'Other', badge: 'standard' };
        return (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl border border-border overflow-hidden grid place-items-center bg-muted shrink-0">
                {a.logo_url ? <img src={a.logo_url} alt={a.name} className="w-full h-full object-cover" /> : <Layers className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{a.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                <p className="text-[11px] text-primary mt-1">{list.length} portal(s)</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => moveApp(i, -1)}><ChevronUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => moveApp(i, 1)}><ChevronDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => startEditApp(a)}><Edit3 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteApp(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              {expanded === a.id ? 'Hide Portals' : 'Manage Portals'}
            </Button>

            {expanded === a.id && (
              <div className="space-y-3 pt-2 border-t border-border">
                {list.map(p => (
                  <div key={p.id}
                    draggable
                    onDragStart={() => { dragId.current = p.id; }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragId.current) reorderPortals(a.id, dragId.current, p.id); dragId.current = null; }}
                    className="rounded-xl border border-border bg-background/60 p-3">
                    {editPortal?.id === p.id ? (
                      <div className="space-y-2">
                        <Input value={editPortal.name} onChange={e => setEditPortal({ ...editPortal, name: e.target.value })} placeholder="Portal name" />
                        <Input value={editPortal.url} onChange={e => setEditPortal({ ...editPortal, url: e.target.value })} placeholder="Portal URL" />
                        <Input value={editPortal.description || ''} onChange={e => setEditPortal({ ...editPortal, description: e.target.value })} placeholder="Short info (optional)" />
                        <div className="flex gap-2 flex-wrap">
                          <select value={editPortal.category} onChange={e => setEditPortal({ ...editPortal, category: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                            <option value={ALL_CATEGORIES}>{ALL_CATEGORIES}</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <select value={editPortal.badge} onChange={e => setEditPortal({ ...editPortal, badge: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                            {BADGE_KEYS.map(b => <option key={b} value={b}>{badgeInfo(b).emoji} {badgeInfo(b).label}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={savePortal}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditPortal(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><LinkIcon className="w-3 h-3" />{p.url}</p>
                          <div className="flex gap-1.5 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border">{p.category}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeInfo(p.badge).className}`}>{badgeInfo(p.badge).emoji} {badgeInfo(p.badge).label}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditPortal(p)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePortal(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Add Portal</p>
                  <Input value={d.name} onChange={e => setPortalDraft(prev => ({ ...prev, [a.id]: { ...d, name: e.target.value } }))} placeholder="Portal name (e.g. Portal 1)" />
                  <Input value={d.url} onChange={e => setPortalDraft(prev => ({ ...prev, [a.id]: { ...d, url: e.target.value } }))} placeholder="https://portal-url.com" />
                  <Input value={(d as any).description || ''} onChange={e => setPortalDraft(prev => ({ ...prev, [a.id]: { ...d, description: e.target.value } }))} placeholder="Short info (optional)" />
                  <div className="flex gap-2 flex-wrap">
                    <select value={d.category} onChange={e => setPortalDraft(prev => ({ ...prev, [a.id]: { ...d, category: e.target.value } }))}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                      <option value={ALL_CATEGORIES}>{ALL_CATEGORIES}</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={d.badge} onChange={e => setPortalDraft(prev => ({ ...prev, [a.id]: { ...d, badge: e.target.value } }))}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                      {BADGE_KEYS.map(b => <option key={b} value={b}>{badgeInfo(b).emoji} {badgeInfo(b).label}</option>)}
                    </select>
                    <Button size="sm" onClick={() => addPortal(a.id)}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

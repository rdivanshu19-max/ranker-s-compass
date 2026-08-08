import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit3, Upload, ChevronUp, ChevronDown, GripVertical, Link as LinkIcon, ClipboardList } from 'lucide-react';
import { TEST_STATUSES, statusInfo, autoPoster, type SeriesTest, type TestSeries } from '@/lib/testSeries';

const uploadImage = async (file: File): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `test-series/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('course-posters').upload(path, file);
  if (error) { toast.error('Upload failed: ' + error.message); return null; }
  return supabase.storage.from('course-posters').getPublicUrl(path).data.publicUrl;
};

type Draft = { name: string; description: string; logo_url: string; poster_url: string };
const emptyDraft: Draft = { name: '', description: '', logo_url: '', poster_url: '' };
type TestDraft = { name: string; link: string; status: string; description: string; scheduled_at: string };
const emptyTest: TestDraft = { name: '', link: '', status: 'available', description: '', scheduled_at: '' };

export default function TestSeriesAdmin({ actorId }: { actorId: string }) {
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [tests, setTests] = useState<SeriesTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testDraft, setTestDraft] = useState<Record<string, TestDraft>>({});
  const [editTest, setEditTest] = useState<SeriesTest | null>(null);
  const dragId = useRef<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [s, t] = await Promise.all([
      supabase.from('test_series').select('*').order('sort_order', { ascending: true }),
      supabase.from('test_series_tests').select('*').order('sort_order', { ascending: true }),
    ]);
    setSeries((s.data as TestSeries[]) || []);
    setTests((t.data as SeriesTest[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const log = (action: string, target_id: string, details: any) =>
    supabase.from('activity_log').insert({ actor_id: actorId, actor_role: 'admin', action, target_type: 'test_series', target_id, details } as any);

  const saveSeries = async () => {
    if (!draft.name.trim()) { toast.error('Test series name required'); return; }
    setBusy(true);
    if (editingId) {
      const { error } = await supabase.from('test_series').update({ ...draft, name: draft.name.trim() } as any).eq('id', editingId);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log('edit_test_series', editingId, { name: draft.name });
      toast.success('Test series updated');
    } else {
      const { error } = await supabase.from('test_series').insert({ ...draft, name: draft.name.trim(), sort_order: series.length, created_by: actorId } as any);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log('add_test_series', draft.name.trim(), { name: draft.name });
      toast.success('Test series created');
    }
    setDraft(emptyDraft); setAdding(false); setEditingId(null); load();
  };

  const deleteSeries = async (id: string) => {
    if (!confirm('Delete this test series and all its tests?')) return;
    const { error } = await supabase.from('test_series').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await log('delete_test_series', id, {});
    toast.success('Test series deleted'); load();
  };

  const moveSeries = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= series.length) return;
    const reordered = [...series];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setSeries(reordered);
    await Promise.all(reordered.map((s, i) => supabase.from('test_series').update({ sort_order: i } as any).eq('id', s.id)));
  };

  const seriesTests = (id: string) => tests.filter(t => t.series_id === id).sort((a, b) => a.sort_order - b.sort_order);

  const addTest = async (seriesId: string) => {
    const d = testDraft[seriesId] || emptyTest;
    if (!d.name.trim()) { toast.error('Test name required'); return; }
    const { error } = await supabase.from('test_series_tests').insert({
      series_id: seriesId,
      name: d.name.trim(),
      link: d.link.trim(),
      status: d.status,
      description: d.description.trim() || null,
      scheduled_at: d.scheduled_at ? new Date(d.scheduled_at).toISOString() : null,
      sort_order: seriesTests(seriesId).length,
    } as any);
    if (error) { toast.error(error.message); return; }
    await log('add_test', seriesId, { test: d.name });
    setTestDraft(prev => ({ ...prev, [seriesId]: emptyTest }));
    toast.success('Test added'); load();
  };

  const saveTest = async () => {
    if (!editTest) return;
    const { error } = await supabase.from('test_series_tests').update({
      name: editTest.name, link: editTest.link, status: editTest.status,
      description: editTest.description, scheduled_at: editTest.scheduled_at,
    } as any).eq('id', editTest.id);
    if (error) { toast.error(error.message); return; }
    await log('edit_test', editTest.id, { test: editTest.name });
    setEditTest(null); toast.success('Test updated'); load();
  };

  const deleteTest = async (id: string) => {
    await supabase.from('test_series_tests').delete().eq('id', id);
    await log('delete_test', id, {});
    toast.success('Test deleted'); load();
  };

  const reorderTests = async (seriesId: string, fromId: string, toId: string) => {
    const list = seriesTests(seriesId);
    const from = list.findIndex(t => t.id === fromId);
    const to = list.findIndex(t => t.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setTests(prev => prev.map(t => {
      const i = next.findIndex(n => n.id === t.id);
      return i >= 0 ? { ...t, sort_order: i } : t;
    }));
    await Promise.all(next.map((t, i) => supabase.from('test_series_tests').update({ sort_order: i } as any).eq('id', t.id)));
  };

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading test series...</p>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => { setAdding(!adding); setEditingId(null); setDraft(emptyDraft); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Test Series
        </Button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Test series name (e.g. PW Test Series)" />
          <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Description" rows={2} />
          <div className="flex flex-wrap gap-3">
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setDraft(d => ({ ...d, logo_url: u })); } }} />
              <Button variant="outline" size="sm" className="gap-1" onClick={() => logoRef.current?.click()}><Upload className="h-3 w-3" /> Logo</Button>
              {draft.logo_url && <img src={draft.logo_url} alt="logo preview" className="mt-2 h-10 w-10 rounded-lg object-cover" />}
            </div>
            <div>
              <input ref={posterRef} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setDraft(d => ({ ...d, poster_url: u })); } }} />
              <Button variant="outline" size="sm" className="gap-1" onClick={() => posterRef.current?.click()}><Upload className="h-3 w-3" /> Poster (optional)</Button>
              {draft.poster_url
                ? <img src={draft.poster_url} alt="poster preview" className="mt-2 h-10 rounded-lg object-cover" />
                : <div className="mt-2 h-10 w-24 rounded-lg" style={{ backgroundImage: autoPoster(draft.logo_url || draft.name) }} />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">No poster? A subtle background is generated automatically from the logo.</p>
          <div className="flex gap-2">
            <Button onClick={saveSeries} disabled={busy}>{editingId ? 'Save Changes' : 'Create Test Series'}</Button>
            <Button variant="outline" onClick={() => { setAdding(false); setEditingId(null); setDraft(emptyDraft); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {series.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No test series yet</p>
      ) : series.map((s, i) => {
        const list = seriesTests(s.id);
        const d = testDraft[s.id] || emptyTest;
        return (
          <div key={s.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <ClipboardList className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{s.name}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-[11px] text-primary">{list.length} test(s)</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => moveSeries(i, -1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => moveSeries(i, 1)}><ChevronDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditingId(s.id); setAdding(true); setDraft({ name: s.name, description: s.description || '', logo_url: s.logo_url || '', poster_url: s.poster_url || '' }); }}><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteSeries(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
              {expanded === s.id ? 'Hide Tests' : 'Manage Tests'}
            </Button>

            {expanded === s.id && (
              <div className="space-y-3 border-t border-border pt-2">
                {list.map(t => (
                  <div key={t.id} draggable
                    onDragStart={() => { dragId.current = t.id; }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragId.current) reorderTests(s.id, dragId.current, t.id); dragId.current = null; }}
                    className="rounded-xl border border-border bg-background/60 p-3">
                    {editTest?.id === t.id ? (
                      <div className="space-y-2">
                        <Input value={editTest.name} onChange={e => setEditTest({ ...editTest, name: e.target.value })} placeholder="Test name" />
                        <Input value={editTest.link} onChange={e => setEditTest({ ...editTest, link: e.target.value })} placeholder="Test link" />
                        <Textarea value={editTest.description || ''} onChange={e => setEditTest({ ...editTest, description: e.target.value })} placeholder="Description (optional)" rows={2} />
                        <div className="flex flex-wrap gap-2">
                          <select value={editTest.status} onChange={e => setEditTest({ ...editTest, status: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                            {TEST_STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                          </select>
                          <input type="datetime-local"
                            value={editTest.scheduled_at ? new Date(editTest.scheduled_at).toISOString().slice(0, 16) : ''}
                            onChange={e => setEditTest({ ...editTest, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveTest}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditTest(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{t.name}</p>
                          {t.link && <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><LinkIcon className="h-3 w-3" />{t.link}</p>}
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusInfo(t.status).className}`}>{statusInfo(t.status).label}</span>
                            {t.scheduled_at && <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px]">{new Date(t.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditTest(t)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTest(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Add Test</p>
                  <Input value={d.name} onChange={e => setTestDraft(prev => ({ ...prev, [s.id]: { ...d, name: e.target.value } }))} placeholder="Test name (e.g. Test 01)" />
                  <Input value={d.link} onChange={e => setTestDraft(prev => ({ ...prev, [s.id]: { ...d, link: e.target.value } }))} placeholder="https://test-link.com" />
                  <Textarea value={d.description} onChange={e => setTestDraft(prev => ({ ...prev, [s.id]: { ...d, description: e.target.value } }))} placeholder="Short description (optional)" rows={2} />
                  <div className="flex flex-wrap gap-2">
                    <select value={d.status} onChange={e => setTestDraft(prev => ({ ...prev, [s.id]: { ...d, status: e.target.value } }))}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                      {TEST_STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                    <input type="datetime-local" value={d.scheduled_at}
                      onChange={e => setTestDraft(prev => ({ ...prev, [s.id]: { ...d, scheduled_at: e.target.value } }))}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
                    <Button size="sm" onClick={() => addTest(s.id)}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>
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

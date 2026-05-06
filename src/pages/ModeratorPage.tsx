import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, GraduationCap, BookOpen, Flag, Upload, Tag, Trash2, Link as LinkIcon, CheckCircle, Clock3, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'Physics', 'Chemistry', 'Maths', 'Biology', 'Boards'];
const COURSE_TAGS = ['popular', 'hot', 'most used', 'boards'];

type CourseResource = { title: string; url: string; type: string };

const statusSteps = ['pending', 'reviewed', 'action_taken'];
const formatStatus = (status: string) => status.replace(/_/g, ' ');
const statusTone = (status: string) =>
  status === 'action_taken' ? 'bg-primary/15 text-primary border-primary/30' :
  status === 'reviewed' ? 'bg-secondary text-secondary-foreground border-border' :
  status === 'rejected' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-muted text-muted-foreground border-border';

function ReportTimeline({ report }: { report: any }) {
  const timeline = Array.isArray(report.status_timeline) ? report.status_timeline : [];
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Status timeline</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {statusSteps.map((step) => {
          const item = timeline.find((entry: any) => entry.status === step);
          const done = Boolean(item) || report.status === step;
          const Icon = done ? CheckCircle : step === 'pending' ? Clock3 : CircleDot;
          return (
            <div key={step} className={`rounded-lg border px-3 py-2 text-xs ${done ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              <div className="flex items-center gap-1.5 font-semibold capitalize">
                <Icon className="h-3.5 w-3.5" /> {formatStatus(step)}
              </div>
              {item?.at && <p className="mt-1 text-[10px] text-muted-foreground">{new Date(item.at).toLocaleString()}</p>}
              {item?.note && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{item.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModeratorPage() {
  const { isModerator, isAdmin, user } = useAuth();
  const [tab, setTab] = useState<'materials' | 'courses' | 'reports'>('materials');
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [coursePosterFile, setCoursePosterFile] = useState<File | null>(null);
  const [courseTags, setCourseTags] = useState<string[]>([]);
  const [courseResources, setCourseResources] = useState<CourseResource[]>([{ title: '', url: '', type: 'link' }]);
  const [addingCourse, setAddingCourse] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const [userSearch, setUserSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [myReports, setMyReports] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  if (!isModerator && !isAdmin) return <Navigate to="/app" replace />;

  const load = async () => {
    const [m, c, r, u] = await Promise.all([
      supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('user_reports').select('*').eq('reporter_id', user?.id).order('created_at', { ascending: false }),
      supabase.rpc('get_user_lookup' as any),
    ]);
    setMaterials(m.data || []);
    setCourses(c.data || []);
    setMyReports(r.data || []);
    setAllUsers(u.data || []);
  };

  const filteredUsers = userSearch.trim().length >= 2
    ? allUsers.filter(u => {
        const q = userSearch.toLowerCase();
        return u.user_id !== user?.id && (u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
      }).slice(0, 8)
    : [];

  const toggleType = (t: string) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleCourseTag = (t: string) => setCourseTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const addResourceField = () => setCourseResources(prev => [...prev, { title: '', url: '', type: 'link' }]);
  const updateResource = (index: number, field: keyof CourseResource, value: string) =>
    setCourseResources(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  const removeResource = (index: number) => setCourseResources(prev => prev.filter((_, i) => i !== index));

  const uploadPoster = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `moderator-${user?.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('course-posters').upload(path, file);
    if (error) { toast.error('Poster upload failed: ' + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from('course-posters').getPublicUrl(path);
    return publicUrl;
  };

  const addMaterial = async () => {
    if (!title.trim() || !link.trim() || types.length === 0) {
      toast.error('Title, link and at least one category required'); return;
    }
    setAdding(true);
    const { error } = await supabase.from('materials').insert({
      title, link, description, types, uploaded_by: user?.id, pinned: false, rating_enabled: true,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from('activity_log').insert({
      actor_id: user!.id, actor_role: isAdmin ? 'admin' : 'moderator', action: 'upload_material',
      target_type: 'material', target_id: title.trim(), details: { title, link, types } as any,
    });
    toast.success('Material added');
    setTitle(''); setLink(''); setDescription(''); setTypes([]);
    load();
  };

  const addCourse = async () => {
    if (!cTitle.trim()) { toast.error('Course title required'); return; }
    const resources = courseResources.filter(r => r.url.trim()).map(r => ({ title: r.title.trim() || 'Resource', url: r.url.trim(), type: r.type || 'link' }));
    if (resources.length === 0) { toast.error('Add at least one course resource link'); return; }
    setAddingCourse(true);
    let posterUrl = '';
    if (coursePosterFile) {
      const url = await uploadPoster(coursePosterFile);
      if (!url) { setAddingCourse(false); return; }
      posterUrl = url;
    }
    const { error } = await supabase.from('courses').insert({
      title: cTitle.trim(),
      description: cDesc.trim(),
      poster_url: posterUrl,
      created_by: user?.id,
      resources,
      tags: courseTags,
    } as any);
    setAddingCourse(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from('activity_log').insert({
      actor_id: user!.id, actor_role: isAdmin ? 'admin' : 'moderator', action: 'upload_course',
      target_type: 'course', target_id: cTitle.trim(), details: { title: cTitle.trim(), resources: resources.length, tags: courseTags } as any,
    });
    toast.success('Course added');
    setCTitle(''); setCDesc(''); setCoursePosterFile(null); setCourseTags([]); setCourseResources([{ title: '', url: '', type: 'link' }]);
    load();
  };

  const submitReport = async () => {
    if (!selectedUser || !reportReason.trim()) {
      toast.error('Select a user and write a reason'); return;
    }
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: user?.id, reported_user_id: selectedUser.user_id, reason: reportReason,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('activity_log').insert({
      actor_id: user!.id, actor_role: isAdmin ? 'admin' : 'moderator', action: 'report_user',
      target_type: 'user', target_id: selectedUser.user_id, details: { reason: reportReason } as any,
    });
    toast.success('Report submitted to admins');
    setSelectedUser(null); setUserSearch(''); setReportReason('');
    load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Moderator Panel</h1>
          <p className="text-sm text-muted-foreground">Add materials, publish courses, and track reports without delete access.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { k: 'materials' as const, l: 'Materials', i: BookOpen },
          { k: 'courses' as const, l: 'Courses', i: GraduationCap },
          { k: 'reports' as const, l: 'Report User', i: Flag },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.k ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.i className="w-4 h-4" /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Material</h2>
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="Link (URL)" value={link} onChange={e => setLink(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button key={t} onClick={() => toggleType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    types.includes(t) ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}>{t}</button>
              ))}
            </div>
            <Button onClick={addMaterial} disabled={adding} className="w-full">
              {adding ? 'Adding...' : 'Add Material'}
            </Button>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Recent Materials</h2>
            <div className="space-y-2">
              {materials.slice(0, 10).map(m => (
                <div key={m.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.link}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Course</h2>
            <Input placeholder="Course title" value={cTitle} onChange={e => setCTitle(e.target.value)} />
            <Textarea placeholder="Description" value={cDesc} onChange={e => setCDesc(e.target.value)} rows={3} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Poster Image</label>
              <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={e => setCoursePosterFile(e.target.files?.[0] || null)} />
              <Button variant="outline" type="button" onClick={() => posterInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> {coursePosterFile ? coursePosterFile.name : 'Upload Poster'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {COURSE_TAGS.map(t => (
                  <Button key={t} variant={courseTags.includes(t) ? 'default' : 'outline'} size="sm" onClick={() => toggleCourseTag(t)} className="gap-1">
                    <Tag className="w-3 h-3" /> {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Resources</label>
                <Button variant="outline" size="sm" type="button" onClick={addResourceField} className="gap-1"><Plus className="w-3 h-3" /> Add</Button>
              </div>
              {courseResources.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                  <Input value={r.title} onChange={e => updateResource(i, 'title', e.target.value)} placeholder="Resource title" />
                  <Input value={r.url} onChange={e => updateResource(i, 'url', e.target.value)} placeholder="Resource link / URL" />
                  <Button variant="ghost" size="icon" type="button" onClick={() => removeResource(i)} disabled={courseResources.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={addCourse} disabled={addingCourse} className="w-full">
              {addingCourse ? 'Publishing...' : 'Add Course'}
            </Button>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Recent Courses</h2>
            <div className="space-y-2">
              {courses.slice(0, 10).map(c => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-3 text-sm flex gap-3">
                  {c.poster_url && <img src={c.poster_url} alt={`${c.title} poster`} className="h-16 w-24 rounded-md object-cover border border-border" loading="lazy" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    {c.resources?.length > 0 && <p className="text-xs text-primary mt-1"><LinkIcon className="inline h-3 w-3" /> {c.resources.length} resource(s)</p>}
                    {c.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{c.tags.map((t: string) => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{t}</span>)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Flag className="w-4 h-4" /> Report a User</h2>
            <p className="text-xs text-muted-foreground">Report misbehavior. Admins will review and act.</p>
            {selectedUser ? (
              <div className="flex items-center justify-between gap-2 bg-primary/10 border border-primary/30 rounded-lg p-2">
                <span className="text-sm font-medium">📌 {selectedUser.display_name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Search user by name, email, username..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                {filteredUsers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <button key={u.user_id} onClick={() => { setSelectedUser(u); setUserSearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                          {u.display_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="min-w-0">
                          <span className="block font-medium truncate">{u.display_name}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">{u.email || u.username}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Textarea placeholder="Reason (be specific — what did they do?)" value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} />
            <Button onClick={submitReport} className="w-full">Submit Report</Button>
          </div>

          <div>
            <h2 className="font-semibold mb-2">My Reports</h2>
            <div className="space-y-3">
              {myReports.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">User: {r.reported_user_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${statusTone(r.status)}`}>{formatStatus(r.status)}</span>
                  </div>
                  <p className="text-sm mt-1">{r.reason}</p>
                  {r.admin_notes && <p className="text-xs text-muted-foreground mt-1">Admin: {r.admin_notes}</p>}
                  <ReportTimeline report={r} />
                </div>
              ))}
              {myReports.length === 0 && <p className="text-xs text-muted-foreground">No reports yet.</p>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

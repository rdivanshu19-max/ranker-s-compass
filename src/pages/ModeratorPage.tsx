import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit3, GraduationCap, BookOpen, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'Physics', 'Chemistry', 'Maths', 'Biology', 'Boards'];

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
  const [addingCourse, setAddingCourse] = useState(false);

  // Reports + user search
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
      supabase.from('profiles').select('user_id, display_name').order('display_name'),
    ]);
    setMaterials(m.data || []);
    setCourses(c.data || []);
    setMyReports(r.data || []);
    setAllUsers(u.data || []);
  };

  const filteredUsers = userSearch.trim().length >= 2
    ? allUsers.filter(u => u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) && u.user_id !== user?.id).slice(0, 8)
    : [];

  const toggleType = (t: string) =>
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

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
    toast.success('Material added');
    setTitle(''); setLink(''); setDescription(''); setTypes([]);
    load();
  };

  const addCourse = async () => {
    if (!cTitle.trim()) { toast.error('Title required'); return; }
    setAddingCourse(true);
    const { error } = await supabase.from('courses').insert({
      title: cTitle, description: cDesc, created_by: user?.id, resources: [], tags: [],
    });
    setAddingCourse(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Course added');
    setCTitle(''); setCDesc('');
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
      actor_id: user!.id, actor_role: 'moderator', action: 'report_user',
      target_type: 'user', target_id: selectedUser.user_id, details: { reason: reportReason } as any,
    });
    toast.success('Report submitted to admins');
    setSelectedUser(null); setUserSearch(''); setReportReason('');
    load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Moderator Panel</h1>
          <p className="text-sm text-muted-foreground">Add materials & courses, report problem users. (No delete access)</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {[
          { k: 'materials' as const, l: 'Materials', i: BookOpen },
          { k: 'courses' as const, l: 'Courses', i: GraduationCap },
          { k: 'reports' as const, l: 'Report User', i: Flag },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
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
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Course</h2>
            <Input placeholder="Course title" value={cTitle} onChange={e => setCTitle(e.target.value)} />
            <Textarea placeholder="Description" value={cDesc} onChange={e => setCDesc(e.target.value)} rows={3} />
            <Button onClick={addCourse} disabled={addingCourse} className="w-full">
              {addingCourse ? 'Adding...' : 'Add Course'}
            </Button>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Recent Courses</h2>
            <div className="space-y-2">
              {courses.slice(0, 10).map(c => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
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
            <Input placeholder="Reported User ID (uuid)" value={reportedUserId} onChange={e => setReportedUserId(e.target.value)} />
            <Textarea placeholder="Reason (be specific — what did they do?)" value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} />
            <Button onClick={submitReport} className="w-full">Submit Report</Button>
          </div>

          <div>
            <h2 className="font-semibold mb-2">My Reports</h2>
            <div className="space-y-2">
              {myReports.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">{r.reported_user_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      r.status === 'resolved' ? 'bg-green-500/10 text-green-600' :
                      r.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-sm mt-1">{r.reason}</p>
                  {r.admin_notes && <p className="text-xs text-muted-foreground mt-1">Admin: {r.admin_notes}</p>}
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

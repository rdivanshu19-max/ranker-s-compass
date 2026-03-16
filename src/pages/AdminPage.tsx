import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Pin, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const TYPES = ['Lectures', 'Lecture PDF', 'Books', 'PYQs', 'JEE', 'NEET', 'Other Material', 'Tests'];

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadMaterials(); }, []);

  if (!isAdmin) return <Navigate to="/app" replace />;

  const loadMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    setMaterials(data || []);
  };

  const addMaterial = async () => {
    if (!title.trim() || !link.trim()) { toast.error('Fill all fields'); return; }
    if (selectedTypes.length === 0) { toast.error('Select at least one type'); return; }
    const { error } = await supabase.from('materials').insert({
      title, link, types: selectedTypes, uploaded_by: user!.id
    });
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Material uploaded!');
    setTitle(''); setLink(''); setSelectedTypes([]); setAdding(false);
    loadMaterials();
  };

  const togglePin = async (id: string, pinned: boolean) => {
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

  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> Admin <span className="text-gradient">Panel</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage library materials</p>
        </div>
        <Button onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 mr-1" /> Upload Material</Button>
      </motion.div>

      {adding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Material name" />
          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Material link (URL)" />
          <div>
            <label className="text-sm font-medium mb-2 block">Type(s)</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <Button key={t} variant={selectedTypes.includes(t) ? 'default' : 'outline'} size="sm" onClick={() => toggleType(t)}>
                  {t}
                </Button>
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
              <div>
                <h3 className="font-bold">{m.title}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.types?.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => togglePin(m.id, m.pinned)} title={m.pinned ? 'Unpin' : 'Pin'}>
                  <Pin className={`w-4 h-4 ${m.pinned ? 'text-primary fill-primary' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleRating(m.id, m.rating_enabled)} title="Toggle rating">
                  {m.rating_enabled ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMaterial(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

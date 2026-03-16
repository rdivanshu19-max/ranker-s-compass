import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FolderLock, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function StudyVaultPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (user) loadItems(); }, [user]);

  const loadItems = async () => {
    const { data } = await supabase.from('study_vault').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setItems(data || []);
  };

  const addItem = async () => {
    if (!title.trim() || !link.trim()) { toast.error('Fill all fields'); return; }
    const { error } = await supabase.from('study_vault').insert({ user_id: user!.id, title, link });
    if (error) toast.error('Failed to add');
    else { toast.success('Added to vault!'); setTitle(''); setLink(''); setAdding(false); loadItems(); }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('study_vault').delete().eq('id', id);
    toast.success('Removed');
    loadItems();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Study <span className="text-gradient">Vault</span> 🔒</h1>
          <p className="text-muted-foreground mt-1">Your private collection of study materials</p>
        </div>
        <Button onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </motion.div>

      {adding && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Material title" />
          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Link (URL)" />
          <div className="flex gap-2">
            <Button onClick={addItem}>Save</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderLock className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Your vault is empty. Add your personal study links here!</p>
          </div>
        ) : items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center justify-between group">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-xs">{item.link}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href={item.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

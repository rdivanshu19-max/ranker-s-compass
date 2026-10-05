import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type U = { username: string; display_name: string; avatar_url: string | null };

/** Shows @username suggestions for the last "@word" being typed in `value`. */
export default function MentionSuggest({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const match = value.match(/(^|\s)@([A-Za-z0-9_.]{0,32})$/);
  const q = match ? match[2] : null;
  const [list, setList] = useState<U[]>([]);

  useEffect(() => {
    if (q === null) { setList([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('username, display_name, avatar_url')
        .not('username', 'is', null).ilike('username', `${q}%`).limit(5);
      setList((data as U[]) || []);
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  if (q === null) return null;
  const pick = (h: string) => onChange(value.replace(/@([A-Za-z0-9_.]{0,32})$/, `@${h} `));
  const showAdmin = 'admin'.startsWith(q.toLowerCase());

  if (!showAdmin && list.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 z-30 mb-1 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
      {showAdmin && (
        <button type="button" onMouseDown={e => { e.preventDefault(); pick('admin'); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">A</span>
          <span><b>@admin</b> <span className="text-xs text-muted-foreground">Notify admin team</span></span>
        </button>
      )}
      {list.map(u => (
        <button key={u.username} type="button" onMouseDown={e => { e.preventDefault(); pick(u.username); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
          {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            : <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{u.display_name?.[0] || '?'}</span>}
          <span><b>@{u.username}</b> <span className="text-xs text-muted-foreground">{u.display_name}</span></span>
        </button>
      ))}
    </div>
  );
}

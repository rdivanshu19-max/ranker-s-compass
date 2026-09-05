import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Upload, ExternalLink, Star, Megaphone, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadAdminFile } from '@/lib/uploads';
import type { AffiliateProduct, Promotion } from '@/pages/StorePage';
import { PLACEMENTS, PROMO_STYLES, impressionsOf, remainingImpressions, sanitizePlacements, sanitizeStyle, type PromoPlacement, type PromoStyle } from '@/lib/promotions';

const STORES = ['Amazon', 'Flipkart', 'Meesho', 'Official Site', 'Other'];
const CATEGORIES = ['Books', 'Test Series', 'Stationery', 'Gadgets', 'Courses', 'Other'];

const emptyProduct = {
  title: '', description: '', image_url: '', store: 'Amazon', affiliate_url: '',
  price: '', category: 'Books', badge: '', featured: false, active: true, sort_order: 0,
};
const emptyPromo = {
  title: '', subtitle: '', description: '', poster_url: '', link_url: '',
  cta_text: 'Learn more', active: true, sort_order: 0,
  placements: ['store'] as PromoPlacement[], max_impressions: 3, style: 'banner' as PromoStyle,
};


export default function StoreAdmin({ actorId }: { actorId: string }) {
  const [view, setView] = useState<'products' | 'promotions'>('products');
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [pForm, setPForm] = useState<any>({ ...emptyProduct });
  const [prForm, setPrForm] = useState<any>({ ...emptyPromo });
  const [editingP, setEditingP] = useState<string | null>(null);
  const [editingPr, setEditingPr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: pr }] = await Promise.all([
      supabase.from('affiliate_products').select('*').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('promotions').select('*').order('sort_order').order('created_at', { ascending: false }),
    ]);
    setProducts((p as AffiliateProduct[]) || []);
    setPromos((pr as Promotion[]) || []);
  };
  useEffect(() => { load(); }, []);

  const log = (action: string, targetType: string, targetId?: string, details?: any) =>
    supabase.from('activity_log').insert({ actor_id: actorId, actor_role: 'admin', action, target_type: targetType, target_id: targetId, details });

  const pickImage = async (file: File, set: (url: string) => void) => {
    setBusy(true);
    try { set(await uploadAdminFile(file, 'store')); toast.success('Image uploaded'); }
    catch (e: any) { toast.error(e.message || 'Upload failed'); }
    setBusy(false);
  };

  /* ---------------- products ---------------- */
  const saveProduct = async () => {
    if (!pForm.title.trim() || !pForm.affiliate_url.trim()) return toast.error('Title and buying link are required');
    setBusy(true);
    const payload = { ...pForm, sort_order: Number(pForm.sort_order) || 0, created_by: actorId };
    const { error } = editingP
      ? await supabase.from('affiliate_products').update(payload).eq('id', editingP)
      : await supabase.from('affiliate_products').insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    await log(editingP ? 'update_affiliate_product' : 'create_affiliate_product', 'affiliate_product', editingP || undefined, { title: pForm.title });
    toast.success(editingP ? 'Product updated' : 'Product added');
    setPForm({ ...emptyProduct }); setEditingP(null); load();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('affiliate_products').delete().eq('id', id);
    if (error) return toast.error(error.message);
    await log('delete_affiliate_product', 'affiliate_product', id);
    toast.success('Removed'); load();
  };

  const toggleProduct = async (p: AffiliateProduct, field: 'active' | 'featured') => {
    await supabase.from('affiliate_products').update({ [field]: !p[field] }).eq('id', p.id);
    load();
  };

  /* ---------------- promotions ---------------- */
  const savePromo = async () => {
    if (!prForm.title.trim()) return toast.error('Promotion title is required');
    setBusy(true);
    const payload = {
      ...prForm,
      sort_order: Number(prForm.sort_order) || 0,
      max_impressions: Math.max(0, Number(prForm.max_impressions) || 0),
      placements: sanitizePlacements(prForm.placements),
      style: sanitizeStyle(prForm.style),
      created_by: actorId,
    };

    const { error } = editingPr
      ? await supabase.from('promotions').update(payload).eq('id', editingPr)
      : await supabase.from('promotions').insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    await log(editingPr ? 'update_promotion' : 'create_promotion', 'promotion', editingPr || undefined, { title: prForm.title });
    toast.success(editingPr ? 'Promotion updated' : 'Promotion created');
    setPrForm({ ...emptyPromo }); setEditingPr(null); load();
  };

  const deletePromo = async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    await log('delete_promotion', 'promotion', id);
    toast.success('Promotion removed'); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {([['products', ShoppingBag, 'Affiliate Products'], ['promotions', Megaphone, 'Promotions']] as const).map(([v, Icon, label]) => (
          <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} className="gap-1.5" onClick={() => setView(v)}>
            <Icon className="h-4 w-4" /> {label}
          </Button>
        ))}
      </div>

      {view === 'products' && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-display font-bold">{editingP ? 'Edit product' : 'Add affiliate product'}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Product name" value={pForm.title} onChange={e => setPForm({ ...pForm, title: e.target.value })} />
              <Input placeholder="Price (e.g. ₹499)" value={pForm.price} onChange={e => setPForm({ ...pForm, price: e.target.value })} />
            </div>
            <Textarea placeholder="Short description — why should a student buy this?" rows={3}
              value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} />
            <Input placeholder="Affiliate / buying link (https://...)" value={pForm.affiliate_url}
              onChange={e => setPForm({ ...pForm, affiliate_url: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={pForm.store} onChange={e => setPForm({ ...pForm, store: e.target.value })}>
                {STORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={pForm.category} onChange={e => setPForm({ ...pForm, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input placeholder="Badge (Bestseller...)" value={pForm.badge} onChange={e => setPForm({ ...pForm, badge: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" /> {pForm.image_url ? 'Change cover' : 'Upload cover'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && pickImage(e.target.files[0], url => setPForm((f: any) => ({ ...f, image_url: url })))} />
              </label>
              {pForm.image_url && <img src={pForm.image_url} alt="cover preview" className="h-12 w-12 rounded-lg object-cover" />}
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={pForm.featured} onChange={e => setPForm({ ...pForm, featured: e.target.checked })} /> Top pick
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={pForm.active} onChange={e => setPForm({ ...pForm, active: e.target.checked })} /> Visible
              </label>
              <Input type="number" className="w-24" placeholder="Order" value={pForm.sort_order}
                onChange={e => setPForm({ ...pForm, sort_order: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveProduct} disabled={busy} className="gap-1.5"><Plus className="h-4 w-4" /> {editingP ? 'Save changes' : 'Add product'}</Button>
              {editingP && <Button variant="outline" onClick={() => { setEditingP(null); setPForm({ ...emptyProduct }); }}>Cancel</Button>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(p => (
              <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/40">
                  {p.image_url ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.store} · {p.category} · {p.price || 'no price'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => { setEditingP(p.id); setPForm({ ...p }); }}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => toggleProduct(p, 'featured')}>
                      <Star className={`h-3.5 w-3.5 ${p.featured ? 'text-amber-400' : ''}`} /> {p.featured ? 'Top pick' : 'Make top'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => toggleProduct(p, 'active')}>
                      {p.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {p.active ? 'Visible' : 'Hidden'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" asChild>
                      <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm text-muted-foreground">No affiliate products yet.</p>}
          </div>
        </>
      )}

      {view === 'promotions' && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-display font-bold">{editingPr ? 'Edit promotion' : 'Create promotion / sponsorship'}</h3>
            <p className="text-xs text-muted-foreground">Choose where the promotion appears and how many times each student sees it per session. Slots stay hidden when nothing is live.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Title" value={prForm.title} onChange={e => setPrForm({ ...prForm, title: e.target.value })} />
              <Input placeholder="Subtitle / sponsor name" value={prForm.subtitle} onChange={e => setPrForm({ ...prForm, subtitle: e.target.value })} />
            </div>
            <Textarea placeholder="Description" rows={3} value={prForm.description} onChange={e => setPrForm({ ...prForm, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Link (https://...)" value={prForm.link_url} onChange={e => setPrForm({ ...prForm, link_url: e.target.value })} />
              <Input placeholder="Button text" value={prForm.cta_text} onChange={e => setPrForm({ ...prForm, cta_text: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" /> {prForm.poster_url ? 'Change poster' : 'Upload poster'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && pickImage(e.target.files[0], url => setPrForm((f: any) => ({ ...f, poster_url: url })))} />
              </label>
              {prForm.poster_url && <img src={prForm.poster_url} alt="poster preview" className="h-12 w-20 rounded-lg object-cover" />}
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={prForm.active} onChange={e => setPrForm({ ...prForm, active: e.target.checked })} /> Visible
              </label>
              <Input type="number" className="w-24" placeholder="Order" value={prForm.sort_order}
                onChange={e => setPrForm({ ...prForm, sort_order: e.target.value })} />
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Show on pages</p>
              <div className="flex flex-wrap gap-2">
                {PLACEMENTS.map(pl => {
                  const on = (prForm.placements || []).includes(pl.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setPrForm((f: any) => ({
                        ...f,
                        placements: sanitizePlacements(
                          on
                            ? (f.placements || []).filter((x: PromoPlacement) => x !== pl.id)
                            : [...(f.placements || []), pl.id],
                        ),
                      }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      {pl.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  Times shown per session
                  <Input type="number" min={0} className="w-20" value={prForm.max_impressions}
                    onChange={e => setPrForm({ ...prForm, max_impressions: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  Style
                  <select
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
                    value={prForm.style}
                    onChange={e => setPrForm({ ...prForm, style: sanitizeStyle(e.target.value) as PromoStyle })}
                  >
                    {PROMO_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
                <span className="text-xs text-muted-foreground">0 = unlimited</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={savePromo} disabled={busy} className="gap-1.5"><Plus className="h-4 w-4" /> {editingPr ? 'Save changes' : 'Create promotion'}</Button>
              {editingPr && <Button variant="outline" onClick={() => { setEditingPr(null); setPrForm({ ...emptyPromo }); }}>Cancel</Button>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map(p => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{p.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {p.active ? 'Live' : 'Hidden'}
                  </span>
                </div>
                {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                {(() => {
                  const raw = p as any;
                  const places = sanitizePlacements(raw.placements);
                  const cap = Number(raw.max_impressions) || 0;
                  const left = remainingImpressions(p.id, cap);
                  return (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {places.map(id => (
                          <span key={id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {PLACEMENTS.find(pl => pl.id === id)?.label ?? id}
                          </span>
                        ))}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {sanitizeStyle(raw.style) === 'popup' ? 'Corner popup' : 'Inline banner'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {cap <= 0
                          ? `Unlimited views · ${impressionsOf(p.id)} shown this session`
                          : `${left} of ${cap} views left this session`}
                      </p>
                    </div>
                  );
                })()}
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => { setEditingPr(p.id); setPrForm({ ...p }); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive" onClick={() => deletePromo(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
            {promos.length === 0 && <p className="text-sm text-muted-foreground">No promotions yet — the Store page simply hides this section.</p>}
          </div>
        </>
      )}
    </div>
  );
}

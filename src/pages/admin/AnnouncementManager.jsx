import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Archive, Trash2, Eye, Sparkles, AlertTriangle, ShieldAlert, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { announcementEngine } from '../../services/announcementEngine';
import { authEngine } from '../../services/authEngine';

const TYPES = [
  ['feature', 'New Feature', Sparkles],
  ['update', 'Major Update', CheckCircle2],
  ['info', 'Information', Info],
  ['warning', 'Important Notice', AlertTriangle],
  ['maintenance', 'Maintenance', ShieldAlert],
];

const EMPTY = { title: '', message: '', type: 'feature', display: ['popup'], audience: 'all', plan: 'all', workspaceIds: [], expiresAt: '' };

export default function AnnouncementManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(false);
  const uid = authEngine.getAuthSession()?.uid || authEngine.getAuthSession()?.userId || null;

  const load = async () => setItems(await announcementEngine.getAll());
  useEffect(() => { load(); }, []);

  const toggleDisplay = (value) => setForm(f => ({ ...f, display: f.display.includes(value) ? f.display.filter(x => x !== value) : [...f.display, value] }));

  const publish = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    if (!form.display.length) return toast.error('Select at least one display mode');
    await announcementEngine.publish({ ...form, createdBy: uid, expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null });
    toast.success('Announcement published to selected audience');
    setForm(EMPTY); setCreating(false); setPreview(false); await load();
    window.dispatchEvent(new Event('billqyro_announcement_updated'));
  };

  const archive = async id => { await announcementEngine.archive(id); toast.success('Announcement archived'); await load(); window.dispatchEvent(new Event('billqyro_announcement_updated')); };
  const remove = async id => { if (!window.confirm('Delete this announcement permanently?')) return; await announcementEngine.delete(id); toast.success('Announcement deleted'); await load(); window.dispatchEvent(new Event('billqyro_announcement_updated')); };

  const typeConfig = TYPES.find(x => x[0] === form.type) || TYPES[0];
  const Icon = typeConfig[2];

  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-32">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div><p className="text-[10px] uppercase tracking-[.2em] font-black text-theme-accent">Owner Communication</p><h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3"><Megaphone className="w-8 h-8 text-theme-accent"/>Announcement Center</h2><p className="text-sm text-theme-muted mt-1">Publish premium in-app announcements without changing application code.</p></div>
      <button onClick={() => setCreating(v => !v)} className="btn-premium bg-[image:var(--accent-gradient)] text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2"><Plus className="w-4 h-4"/>{creating ? 'Close Editor' : 'Create Announcement'}</button>
    </div>

    {creating && <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-5">
      <div className="card-premium p-6 space-y-5">
        <div><label className="text-xs font-black text-theme-primary">Title</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="input-premium w-full mt-2" placeholder="What's new in BillQyro?"/></div>
        <div><label className="text-xs font-black text-theme-primary">Message</label><textarea rows="6" value={form.message} onChange={e => setForm({...form,message:e.target.value})} className="input-premium w-full mt-2" placeholder="Write the message users will see..."/></div>
        <div><label className="text-xs font-black text-theme-primary">Announcement Type</label><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">{TYPES.map(([value,label,I]) => <button key={value} onClick={()=>setForm({...form,type:value})} className={`p-3 rounded-xl border text-[10px] font-black ${form.type===value?'border-theme-accent bg-theme-accent/10 text-theme-accent':'border-theme-border-soft text-theme-muted'}`}><I className="w-4 h-4 mx-auto mb-1"/>{label}</button>)}</div></div>
        <div><label className="text-xs font-black text-theme-primary">Display</label><div className="flex flex-wrap gap-2 mt-2">{['popup','banner','notification'].map(v=><button key={v} onClick={()=>toggleDisplay(v)} className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase ${form.display.includes(v)?'border-theme-accent bg-theme-accent/10 text-theme-accent':'border-theme-border-soft text-theme-muted'}`}>{v}</button>)}</div></div>
        <div className="grid sm:grid-cols-2 gap-3"><div><label className="text-xs font-black text-theme-primary">Audience</label><select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="input-premium w-full mt-2"><option value="all">All Users</option><option value="plan">Specific Plan</option><option value="workspace">Specific Workspace</option></select></div><div><label className="text-xs font-black text-theme-primary">Expiry</label><input type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} className="input-premium w-full mt-2"/></div></div>
        {form.audience==='plan'&&<select value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} className="input-premium w-full"><option value="all">All Plans</option><option value="free">Free</option><option value="premium">Premium</option></select>}
        <div className="flex gap-3 justify-end pt-2"><button onClick={()=>setPreview(true)} className="btn-premium-ghost px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2"><Eye className="w-4 h-4"/>Preview</button><button onClick={publish} className="btn-premium bg-[image:var(--accent-gradient)] text-white px-5 py-3 rounded-xl text-xs font-black">Publish Now</button></div>
      </div>
      <div className="card-premium p-5"><p className="text-[10px] uppercase tracking-widest font-black text-theme-muted mb-3">Live Preview</p><div className="rounded-2xl border border-theme-border-soft overflow-hidden"><div className="h-1 bg-[image:var(--accent-gradient)]"/><div className="p-5"><div className="w-11 h-11 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center mb-4"><Icon className="w-5 h-5"/></div><p className="text-[9px] font-black uppercase tracking-widest text-theme-muted">BillQyro Update</p><h3 className="text-xl font-black text-theme-primary mt-1">{form.title || 'Your announcement title'}</h3><p className="text-sm text-theme-secondary leading-6 mt-3 whitespace-pre-line">{form.message || 'Your message will appear here.'}</p></div></div></div>
    </div>}

    <div className="space-y-3">{items.length===0?<div className="card-premium p-12 text-center text-theme-muted">No announcements published yet.</div>:items.map(a=><div key={a.id} className="card-premium p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-black text-theme-primary truncate">{a.title}</h3><span className={`text-[9px] uppercase font-black px-2 py-1 rounded-full ${a.status==='published'?'bg-emerald-500/10 text-emerald-500':'bg-theme-surface text-theme-muted'}`}>{a.status}</span></div><p className="text-sm text-theme-muted mt-1 line-clamp-2">{a.message}</p><p className="text-[9px] uppercase tracking-widest text-theme-muted mt-2">{a.type} · {a.display?.join(' + ')} · {a.audience}</p></div><div className="flex gap-2 shrink-0">{a.status==='published'&&<button onClick={()=>archive(a.id)} className="btn-premium-ghost px-3 py-2 rounded-lg text-[10px] font-black"><Archive className="w-3.5 h-3.5"/></button>}<button onClick={()=>remove(a.id)} className="btn-premium-ghost px-3 py-2 rounded-lg text-[10px] font-black text-theme-danger"><Trash2 className="w-3.5 h-3.5"/></button></div></div>)}</div>

    {preview&&<div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={()=>setPreview(false)}><div className="w-full max-w-lg card-premium p-7" onClick={e=>e.stopPropagation()}><div className="flex items-center gap-3 mb-5"><div className="w-11 h-11 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center"><Icon/></div><div><p className="text-[9px] uppercase tracking-widest text-theme-muted font-black">Preview</p><h3 className="text-xl font-black text-theme-primary">{form.title||'Announcement'}</h3></div></div><p className="text-sm text-theme-secondary leading-7 whitespace-pre-line">{form.message||'Message preview'}</p><button onClick={()=>setPreview(false)} className="mt-6 w-full py-3 rounded-xl bg-theme-accent text-white font-black text-xs">Close Preview</button></div></div>}
  </motion.div>;
}

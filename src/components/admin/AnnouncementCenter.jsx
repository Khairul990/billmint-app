import React, { useEffect, useState } from 'react';
import { BellRing, Eye, Megaphone, Archive, Trash2, Send, Save, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { announcementEngine } from '../../services/announcementEngine';

const TYPES = [
  ['feature', 'New Feature'], ['update', 'Major Update'], ['maintenance', 'Maintenance'],
  ['important', 'Important Notice'], ['tip', 'Product Tip']
];

const AnnouncementCenter = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'feature', display: ['popup'], audience: 'all', plan: 'all', status: 'draft', expiresAt: '' });
  const load = async () => setItems(await announcementEngine.getAll());
  useEffect(() => { load(); }, []);
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const save = async (publish = false) => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    await (publish ? announcementEngine.publish(form) : announcementEngine.save(form));
    setForm({ title: '', message: '', type: 'feature', display: ['popup'], audience: 'all', plan: 'all', status: 'draft', expiresAt: '' });
    await load();
    toast.success(publish ? 'Announcement published' : 'Draft saved');
  };
  const archive = async id => { await announcementEngine.archive(id); await load(); toast.success('Announcement archived'); };
  const remove = async id => { await announcementEngine.delete(id); await load(); toast.success('Announcement deleted'); };
  return <section className="card-premium overflow-hidden border-theme-accent/20">
    <div className="p-5 sm:p-6 border-b border-theme-border-soft/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-theme-accent/10 via-transparent to-transparent">
      <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 grid place-items-center"><Megaphone className="w-5 h-5 text-theme-accent"/></div><div><h3 className="text-base font-black text-theme-primary">Announcement Center</h3><p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Publish premium updates to your users</p></div></div><div className="flex items-center gap-2 text-[10px] font-bold text-theme-muted"><Sparkles className="w-3.5 h-3.5 text-theme-accent"/>Owner only</div>
    </div>
    <div className="p-5 sm:p-6 grid lg:grid-cols-[1.15fr_.85fr] gap-6">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3"><input className="input-premium w-full" value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Announcement title"/><select className="input-premium w-full" value={form.type} onChange={e=>update('type',e.target.value)}>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <textarea className="input-premium w-full min-h-36 resize-y" value={form.message} onChange={e=>update('message',e.target.value)} placeholder="Write the message users will see..."/>
        <div className="grid sm:grid-cols-3 gap-3"><select className="input-premium w-full" value={form.display[0]} onChange={e=>update('display',[e.target.value])}><option value="popup">Popup</option><option value="banner">Top Banner</option><option value="notification">Notification Center</option></select><select className="input-premium w-full" value={form.audience} onChange={e=>update('audience',e.target.value)}><option value="all">All Users</option><option value="plan">Specific Plan</option><option value="workspace">Specific Workspace</option></select><select className="input-premium w-full" value={form.plan} onChange={e=>update('plan',e.target.value)} disabled={form.audience!=='plan'}><option value="all">All Plans</option><option value="free">Free</option><option value="premium">Premium</option></select></div>
        <div className="flex flex-wrap gap-2 pt-2"><button onClick={()=>save(false)} className="btn-premium-ghost px-4 py-2.5"><Save className="w-4 h-4"/>Save Draft</button><button onClick={()=>save(true)} className="btn-premium bg-theme-accent text-white px-5 py-2.5"><Send className="w-4 h-4"/>Publish Now</button></div>
      </div>
      <div className="rounded-3xl border border-theme-border-soft/60 bg-theme-surface/50 p-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-theme-muted mb-3"><Eye className="w-3.5 h-3.5"/>Live Preview</div><div className="rounded-2xl border border-theme-accent/20 bg-theme-card/80 p-5 shadow-xl"><div className="flex gap-3"><div className="w-9 h-9 rounded-xl bg-theme-accent/10 grid place-items-center"><BellRing className="w-4 h-4 text-theme-accent"/></div><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wider text-theme-accent">{TYPES.find(x=>x[0]===form.type)?.[1]}</div><h4 className="font-black text-theme-primary mt-1">{form.title || 'Your announcement title'}</h4><p className="text-xs leading-5 text-theme-muted mt-2 whitespace-pre-wrap">{form.message || 'Your message will appear here with the selected premium notification style.'}</p></div></div></div></div>
    </div>
    {items.length>0&&<div className="border-t border-theme-border-soft/60"><div className="px-5 py-3 text-[10px] uppercase tracking-widest font-black text-theme-muted">Recent announcements</div>{items.slice(0,8).map(a=><div key={a.id} className="px-5 py-4 border-t border-theme-border-soft/40 flex items-center gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><b className="text-sm text-theme-primary truncate">{a.title}</b><span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent">{a.status}</span></div><p className="text-[10px] text-theme-muted truncate mt-0.5">{a.message}</p></div>{a.status!=='archived'&&<button onClick={()=>archive(a.id)} title="Archive" className="p-2 rounded-xl hover:bg-theme-surface"><Archive className="w-4 h-4"/></button>}<button onClick={()=>remove(a.id)} title="Delete" className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500"><Trash2 className="w-4 h-4"/></button></div>)}</div>}
  </section>;
};
export default AnnouncementCenter;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, Trash2, Edit2, Calendar, DollarSign, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';
import { CardSkeleton } from '../../components/PremiumSkeleton';
import BottomSheet from '../../components/BottomSheet';

const LS_KEY = 'billqyro_projects';
const STATUS_OPTIONS = ['Active', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

const statusIcon = (s) => {
  if (s === 'Completed') return CheckCircle;
  if (s === 'Active' || s === 'In Progress') return Clock;
  return AlertTriangle;
};
const statusColor = (s) => {
  if (s === 'Completed') return 'text-emerald-500';
  if (s === 'Active') return 'text-blue-500';
  if (s === 'In Progress') return 'text-amber-500';
  if (s === 'On Hold') return 'text-orange-500';
  return 'text-red-500';
};

const Projects = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', description: '', status: 'Active', deadline: '', budget: '' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch {}
    setLoading(false);
  }, []);

  const persist = (data) => { localStorage.setItem(LS_KEY, JSON.stringify(data)); setItems(data); };

  const openAdd = () => { setEditItem(null); setForm({ name: '', client: '', description: '', status: 'Active', deadline: '', budget: '' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, client: item.client || '', description: item.description || '', status: item.status || 'Active', deadline: item.deadline || '', budget: item.budget || '' }); setModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter project name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) { updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i); toast.success('Project updated'); }
    else { updated = [...items, { id: 'proj-' + now, ...form, createdAt: now, updatedAt: now }]; toast.success('Project created'); }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this project?')) return;
    persist(items.filter(i => i.id !== id));
    toast.success('Project removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || (i.client || '').toLowerCase().includes(q) || (i.status || '').toLowerCase().includes(q);
  });

  const activeCount = items.filter(i => i.status === 'Active' || i.status === 'In Progress').length;
  const completedCount = items.filter(i => i.status === 'Completed').length;

  const stats = [
    { label: 'Total Projects', value: items.length, icon: Briefcase, color: 'text-violet-500' },
    { label: 'Active', value: activeCount, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Projects</h1>
          <p className="text-xs text-theme-muted font-bold">Manage ongoing projects and milestones</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} variants={staggerItem} className="card-premium p-4 md:p-5 flex flex-col items-center text-center">
            <s.icon className={`w-6 h-6 ${s.color} mb-1`} />
            <span className="text-xl md:text-2xl font-black text-theme-primary">{s.value}</span>
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="card-premium p-3 flex items-center gap-2">
        <Search className="w-5 h-5 text-theme-muted shrink-0 ml-1" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, client, status..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No projects yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Create your first project to start tracking milestones.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> New Project</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const StIcon = statusIcon(item.status);
            const stColor = statusColor(item.status);
            return (
              <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold text-sm">{item.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className="font-extrabold text-theme-primary text-sm">{item.name}</h3>
                      {item.client && <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{item.client}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Edit project" aria-label="Edit project" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button title="Delete project" aria-label="Delete project" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <StIcon className={`w-3.5 h-3.5 ${stColor}`} />
                  <span className={`badge-premium text-[10px] font-bold px-2 py-0.5 rounded-full ${stColor.replace('text-', 'bg-').replace('500', '500/10')} ${stColor}`}>{item.status}</span>
                </div>
                {item.description && <p className="text-xs text-theme-muted/80 line-clamp-2 mb-3">{item.description}</p>}
                <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                  {item.deadline && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span></div>}
                  {item.budget && <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /><span>Budget: ₹{Number(item.budget).toLocaleString()}</span></div>}
                </div>
                <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">Created {new Date(item.createdAt).toLocaleDateString()}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div><label className="block mb-1">Project Name *</label><input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Client</label><input type="text" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" rows={2} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold">{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Budget (₹)</label><input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Briefcase className="w-4 h-4" />{editItem ? 'Update' : 'Create'} Project</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default Projects;

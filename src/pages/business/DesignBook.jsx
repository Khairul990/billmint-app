import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Plus, Search, Trash2, Edit2, User, Layers, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';
import { CardSkeleton } from '../../components/PremiumSkeleton';
import BottomSheet from '../../components/BottomSheet';

const LS_KEY = 'billqyro_designbook';

const DesignBook = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ designName: '', customerName: '', category: '', stitchCount: '', colors: '', notes: '' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch {}
    setLoading(false);
  }, []);

  const persist = (data) => { localStorage.setItem(LS_KEY, JSON.stringify(data)); setItems(data); };

  const openAdd = () => { setEditItem(null); setForm({ designName: '', customerName: '', category: '', stitchCount: '', colors: '', notes: '' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ designName: item.designName, customerName: item.customerName || '', category: item.category || '', stitchCount: item.stitchCount || '', colors: item.colors || '', notes: item.notes || '' }); setModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.designName.trim()) { toast.error('Enter design name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) { updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i); toast.success('Design updated'); }
    else { updated = [...items, { id: 'des-' + now, ...form, createdAt: now, updatedAt: now }]; toast.success('Design added'); }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this design?')) return;
    persist(items.filter(i => i.id !== id));
    toast.success('Design removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return i.designName.toLowerCase().includes(q) || (i.customerName || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q) || (i.colors || '').toLowerCase().includes(q);
  });

  const stats = [
    { label: 'Total Designs', value: items.length, icon: Palette, color: 'text-pink-500' },
    { label: 'Categories', value: [...new Set(items.map(i => i.category).filter(Boolean))].length, icon: Tag, color: 'text-violet-500' },
    { label: 'Customers', value: [...new Set(items.map(i => i.customerName).filter(Boolean))].length, icon: User, color: 'text-amber-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Design Book</h1>
          <p className="text-xs text-theme-muted font-bold">Manage embroidery and fashion designs</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Design
        </button>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-3 gap-3 md:gap-4">
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by design name, customer, category..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Palette className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No designs yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Add your first design to the book.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> Add Design</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-sm">{item.designName.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-extrabold text-theme-primary text-sm">{item.designName}</h3>
                    {item.customerName && <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{item.customerName}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                {item.category && <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /><span className="badge-premium bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{item.category}</span></div>}
                {item.stitchCount && <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /><span>{Number(item.stitchCount).toLocaleString()} stitches</span></div>}
                {item.colors && <div className="flex items-center gap-2"><span className="text-theme-muted/70">Colors: {item.colors}</span></div>}
              </div>
              {item.notes && <p className="mt-3 text-xs text-theme-muted/70 italic line-clamp-2 border-t border-theme-border-soft pt-3">{item.notes}</p>}
              <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">Added {new Date(item.createdAt).toLocaleDateString()}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Design' : 'Add Design'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Design Name *</label><input type="text" required value={form.designName} onChange={e => setForm(f => ({ ...f, designName: e.target.value }))} placeholder="e.g. Floral Motif" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Customer</label><input type="text" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Customer name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Embroidery" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Stitch Count</label><input type="number" value={form.stitchCount} onChange={e => setForm(f => ({ ...f, stitchCount: e.target.value }))} placeholder="e.g. 15000" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">Colors / Threads</label><input type="text" value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="e.g. Gold, Black, White" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Fabric type, special instructions..." rows={3} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Palette className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Design</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default DesignBook;

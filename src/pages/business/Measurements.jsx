import { useState, useEffect } from 'react';
import { Scissors, User, Ruler } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';

const LS_KEY = 'billqyro_measurements';

const Measurements = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', garmentType: '', chest: '', waist: '', hips: '', length: '', shoulders: '', sleeve: '', notes: '' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch (error) { console.error('Error:', error);  }
    setLoading(false);
  }, []);

  const persist = (data) => { localStorage.setItem(LS_KEY, JSON.stringify(data)); setItems(data); };

  const openAdd = () => { setEditItem(null); setForm({ customerName: '', phone: '', garmentType: '', chest: '', waist: '', hips: '', length: '', shoulders: '', sleeve: '', notes: '' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ customerName: item.customerName, phone: item.phone || '', garmentType: item.garmentType || '', chest: item.chest || '', waist: item.waist || '', hips: item.hips || '', length: item.length || '', shoulders: item.shoulders || '', sleeve: item.sleeve || '', notes: item.notes || '' }); setModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error('Enter customer name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) { updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i); toast.success('Measurement updated'); }
    else { updated = [...items, { id: 'meas-' + now, ...form, createdAt: now, updatedAt: now }]; toast.success('Measurement saved'); }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this measurement record?')) return;
    persist(items.filter(i => i.id !== id));
    toast.success('Measurement removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return i.customerName.toLowerCase().includes(q) || (i.garmentType || '').toLowerCase().includes(q) || (i.phone || '').includes(q);
  });

  const stats = [
    { label: 'Total Records', value: items.length, icon: Scissors, color: 'text-rose-500' },
    { label: 'Customers', value: [...new Set(items.map(i => i.customerName))].length, icon: User, color: 'text-blue-500' },
    { label: 'Garment Types', value: [...new Set(items.map(i => i.garmentType).filter(Boolean))].length, icon: Ruler, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Measurements</h1>
          <p className="text-xs text-theme-muted font-bold">Manage customer measurements and profiles</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Measurement
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, garment type, phone..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Scissors className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No measurements yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Add the first customer measurement record.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> Add Measurement</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">{item.customerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-extrabold text-theme-primary text-sm">{item.customerName}</h3>
                    {item.garmentType && <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><Ruler className="w-3 h-3" />{item.garmentType}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Edit measurement" aria-label="Edit measurement" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button title="Delete measurement" aria-label="Delete measurement" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {item.chest && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Chest</span><span className="text-sm font-black text-theme-primary">{item.chest}</span></div>}
                {item.waist && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Waist</span><span className="text-sm font-black text-theme-primary">{item.waist}</span></div>}
                {item.hips && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Hips</span><span className="text-sm font-black text-theme-primary">{item.hips}</span></div>}
                {item.length && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Length</span><span className="text-sm font-black text-theme-primary">{item.length}</span></div>}
                {item.shoulders && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Shoulder</span><span className="text-sm font-black text-theme-primary">{item.shoulders}</span></div>}
                {item.sleeve && <div className="bg-theme-app rounded-xl p-2 text-center"><span className="text-[9px] font-bold text-theme-muted block uppercase">Sleeve</span><span className="text-sm font-black text-theme-primary">{item.sleeve}</span></div>}
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                {item.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{item.phone}</span></div>}
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

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Measurement' : 'Add Measurement'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Customer Name *</label><input type="text" required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">Garment Type</label><input type="text" value={form.garmentType} onChange={e => setForm(f => ({ ...f, garmentType: e.target.value }))} placeholder="e.g. Sherwani, Suit, Blouse" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block mb-1">Chest</label><input type="text" value={form.chest} onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
            <div><label className="block mb-1">Waist</label><input type="text" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
            <div><label className="block mb-1">Hips</label><input type="text" value={form.hips} onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block mb-1">Length</label><input type="text" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
            <div><label className="block mb-1">Shoulders</label><input type="text" value={form.shoulders} onChange={e => setForm(f => ({ ...f, shoulders: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
            <div><label className="block mb-1">Sleeve</label><input type="text" value={form.sleeve} onChange={e => setForm(f => ({ ...f, sleeve: e.target.value }))} placeholder="in" className="input-premium w-full px-3 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold text-center" /></div>
          </div>
          <div><label className="block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Fabric preference, style notes..." rows={2} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Scissors className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Measurement</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default Measurements;

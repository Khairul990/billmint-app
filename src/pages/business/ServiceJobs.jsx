import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';

const LS_KEY = 'billqyro_servicejobs';
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];

const statusColor = (s) => {
  if (s === 'Completed' || s === 'Delivered') return 'text-emerald-500';
  if (s === 'In Progress') return 'text-amber-500';
  if (s === 'Pending') return 'text-blue-500';
  return 'text-red-500';
};

const ServiceJobs = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', device: '', serviceType: '', status: 'Pending', notes: '' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch (error) { console.error('Error:', error);  }
    setLoading(false);
  }, []);

  const persist = (data) => { localStorage.setItem(LS_KEY, JSON.stringify(data)); setItems(data); };

  const openAdd = () => { setEditItem(null); setForm({ customerName: '', phone: '', device: '', serviceType: '', status: 'Pending', notes: '' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ customerName: item.customerName, phone: item.phone || '', device: item.device || '', serviceType: item.serviceType || '', status: item.status || 'Pending', notes: item.notes || '' }); setModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error('Enter customer name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) { updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i); toast.success('Job updated'); }
    else { updated = [...items, { id: 'job-' + now, ...form, createdAt: now, updatedAt: now }]; toast.success('Service job added'); }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this service job?')) return;
    persist(items.filter(i => i.id !== id));
    toast.success('Job removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return i.customerName.toLowerCase().includes(q) || (i.device || '').toLowerCase().includes(q) || (i.serviceType || '').toLowerCase().includes(q) || (i.phone || '').includes(q);
  });

  const pendingCount = items.filter(i => i.status === 'Pending' || i.status === 'In Progress').length;
  const doneCount = items.filter(i => i.status === 'Completed' || i.status === 'Delivered').length;

  const stats = [
    { label: 'Total Jobs', value: items.length, icon: Wrench, color: 'text-orange-500' },
    { label: 'Active', value: pendingCount, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed', value: doneCount, icon: CheckCircle, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Service Jobs</h1>
          <p className="text-xs text-theme-muted font-bold">Track repair and maintenance tasks</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Job
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, device, service..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No service jobs yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Create your first service job to start tracking repairs.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> Add Job</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const stColor = statusColor(item.status);
            return (
              <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-sm">{item.customerName.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className="font-extrabold text-theme-primary text-sm">{item.customerName}</h3>
                      {item.device && <p className="text-[10px] font-semibold text-theme-muted mt-0.5">{item.device}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Edit job" aria-label="Edit job" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button title="Delete job" aria-label="Delete job" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge-premium text-[10px] font-bold px-2 py-0.5 rounded-full ${stColor.replace('text-', 'bg-').replace('500', '500/10')} ${stColor}`}>{item.status}</span>
                </div>
                <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                  {item.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{item.phone}</span></div>}
                  {item.serviceType && <div className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /><span>{item.serviceType}</span></div>}
                </div>
                {item.notes && <p className="mt-3 text-xs text-theme-muted/70 italic line-clamp-2 border-t border-theme-border-soft pt-3">{item.notes}</p>}
                <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">Added {new Date(item.createdAt).toLocaleDateString()}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Service Job' : 'Add Service Job'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Customer Name *</label><input type="text" required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Device</label><input type="text" value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))} placeholder="e.g. Washing Machine" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Service Type</label><input type="text" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} placeholder="e.g. Repair" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold">{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Diagnosis, parts needed..." rows={3} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Wrench className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Job</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default ServiceJobs;

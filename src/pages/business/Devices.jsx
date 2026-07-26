import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';

const LS_KEY = 'billqyro_devices';
const STATUS_OPTIONS = ['Pending', 'Diagnosing', 'In Repair', 'Completed', 'Delivered', 'Cancelled'];

const statusColor = (s) => {
  if (s === 'Completed' || s === 'Delivered') return 'text-emerald-500';
  if (s === 'In Repair' || s === 'Diagnosing') return 'text-amber-500';
  if (s === 'Pending') return 'text-blue-500';
  return 'text-red-500';
};

const Devices = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', deviceName: '', brand: '', model: '', imei: '', issue: '', status: 'Pending' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch (error) { console.error('Error:', error);  }
    setLoading(false);
  }, []);

  const persist = (data) => { localStorage.setItem(LS_KEY, JSON.stringify(data)); setItems(data); };

  const openAdd = () => { setEditItem(null); setForm({ customerName: '', phone: '', deviceName: '', brand: '', model: '', imei: '', issue: '', status: 'Pending' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ customerName: item.customerName, phone: item.phone || '', deviceName: item.deviceName || '', brand: item.brand || '', model: item.model || '', imei: item.imei || '', issue: item.issue || '', status: item.status || 'Pending' }); setModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error('Enter customer name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) { updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i); toast.success('Device record updated'); }
    else { updated = [...items, { id: 'dev-' + now, ...form, createdAt: now, updatedAt: now }]; toast.success('Device added'); }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this device record?')) return;
    persist(items.filter(i => i.id !== id));
    toast.success('Device removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return i.customerName.toLowerCase().includes(q) || (i.deviceName || '').toLowerCase().includes(q) || (i.brand || '').toLowerCase().includes(q) || (i.model || '').toLowerCase().includes(q) || (i.imei || '').includes(q) || (i.issue || '').toLowerCase().includes(q);
  });

  const inRepair = items.filter(i => i.status === 'Pending' || i.status === 'Diagnosing' || i.status === 'In Repair').length;
  const completed = items.filter(i => i.status === 'Completed' || i.status === 'Delivered').length;

  const stats = [
    { label: 'Total Devices', value: items.length, icon: Smartphone, color: 'text-blue-500' },
    { label: 'In Progress', value: inRepair, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Device Management</h1>
          <p className="text-xs text-theme-muted font-bold">Track devices and repairs</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Device
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, device, brand, IMEI..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No devices yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Log the first device for repair tracking.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> Add Device</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const stColor = statusColor(item.status);
            return (
              <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">D</div>
                    <div>
                      <h3 className="font-extrabold text-theme-primary text-sm">{item.deviceName || 'Unknown Device'}</h3>
                      <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{item.customerName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Edit device" aria-label="Edit device" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button title="Delete device" aria-label="Delete device" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge-premium text-[10px] font-bold px-2 py-0.5 rounded-full ${stColor.replace('text-', 'bg-').replace('500', '500/10')} ${stColor}`}>{item.status}</span>
                </div>
                <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                  {item.brand && item.model && <div className="flex items-center gap-2"><span>{item.brand} - {item.model}</span></div>}
                  {item.imei && <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /><span className="text-[10px]">IMEI: {item.imei}</span></div>}
                  {item.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{item.phone}</span></div>}
                </div>
                {item.issue && <p className="mt-3 text-xs text-theme-muted/80 line-clamp-2 border-t border-theme-border-soft pt-3"><span className="font-bold">Issue:</span> {item.issue}</p>}
                <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">Added {new Date(item.createdAt).toLocaleDateString()}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Device' : 'Add Device'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Customer Name *</label><input type="text" required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">Device Name *</label><input type="text" required value={form.deviceName} onChange={e => setForm(f => ({ ...f, deviceName: e.target.value }))} placeholder="e.g. iPhone 14" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Brand</label><input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Apple" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Model</label><input type="text" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g. A2882" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">IMEI / Serial</label><input type="text" value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} placeholder="IMEI or serial number" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Reported Issue</label><textarea value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} placeholder="Describe the issue..." rows={2} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold">{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Smartphone className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Device</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default Devices;

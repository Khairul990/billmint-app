import { useState, useEffect } from 'react';
import { Users, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';

const LS_KEY = 'billqyro_clients';

const Clients = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', notes: '' });

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      setItems(data);
    } catch (error) { console.error('Error:', error);  }
    setLoading(false);
  }, []);

  const persist = (data) => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    setItems(data);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', company: '', phone: '', email: '', address: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, company: item.company || '', phone: item.phone || '', email: item.email || '', address: item.address || '', notes: item.notes || '' });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter a client name'); return; }
    setSaving(true);
    const now = Date.now();
    let updated;
    if (editItem) {
      updated = items.map(i => i.id === editItem.id ? { ...i, ...form, updatedAt: now } : i);
      toast.success('Client updated');
    } else {
      updated = [...items, { id: 'cli-' + now, ...form, createdAt: now, updatedAt: now }];
      toast.success('Client added');
    }
    persist(updated);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this client?')) return;
    const updated = items.filter(i => i.id !== id);
    persist(updated);
    toast.success('Client removed');
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return (i.name || '').toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q) || (i.phone || '').includes(q) || (i.email || '').toLowerCase().includes(q);
  });

  const stats = [
    { label: 'Total Clients', value: items.length, icon: Users, color: 'text-blue-500' },
    { label: 'With Email', value: items.filter(i => i.email).length, icon: Mail, color: 'text-emerald-500' },
    { label: 'With Phone', value: items.filter(i => i.phone).length, icon: Phone, color: 'text-amber-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Client Roster</h1>
          <p className="text-xs text-theme-muted font-bold">Manage your professional clients</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Client
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, phone, email..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center">
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">{search ? 'No results found' : 'No clients yet'}</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm mb-6">{search ? 'Try a different search term' : 'Add your first client to start building your roster.'}</p>
          {!search && <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"><Plus className="w-4 h-4" /> Add Client</button>}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold text-sm">{item.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-extrabold text-theme-primary text-sm">{item.name}</h3>
                    {item.company && <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{item.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Edit client" aria-label="Edit client" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button title="Delete client" aria-label="Delete client" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                {item.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{item.phone}</span></div>}
                {item.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{item.email}</span></div>}
                {item.address && <div className="flex items-start gap-2"><Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{item.address}</span></div>}
              </div>
              {item.notes && <p className="mt-3 text-xs text-theme-muted/70 italic line-clamp-2 border-t border-theme-border-soft pt-3">{item.notes}</p>}
              <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">
                Added {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div><label className="block mb-1">Client Name *</label><input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Company</label><input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Business or organization" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 99999 88888" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@example.com" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Office address" rows={2} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div><label className="block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FileText className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Client</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default Clients;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Search, Trash2, Edit2, Phone, Mail, BookOpen, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations';
import { CardSkeleton } from '../../components/PremiumSkeleton';
import BottomSheet from '../../components/BottomSheet';
import PremiumEmptyState from '../../components/PremiumEmptyState';
import PullToRefresh from '../../components/PullToRefresh';

const Students = ({ students = [], onSaveStudent, onDeleteStudent }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', course: '', batch: '', enrollmentDate: '' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setItems(students);
    setLoading(false);
  }, [students]);

  const openAdd = () => { setEditItem(null); setForm({ name: '', phone: '', email: '', course: '', batch: '', enrollmentDate: '' }); setModalOpen(true); };

  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, phone: item.phone || '', email: item.email || '', course: item.course || '', batch: item.batch || '', enrollmentDate: item.enrollmentDate || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) { toast.error('Enter student name'); return; }
    setSaving(true);
    const now = new Date().toISOString();
    let payload;
    if (editItem) {
      payload = { ...editItem, ...form, updatedAt: now };
    } else {
      payload = { id: 'stu-' + Date.now(), ...form, createdAt: now, updatedAt: now };
    }
    await onSaveStudent(payload);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = useCallback((id) => {
    const confirmToast = toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-theme-surface border border-theme-border-soft shadow-xl rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-theme-danger/10 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-theme-danger" /></div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-theme-primary">Delete Student</p>
            <p className="text-xs font-semibold text-theme-muted mt-1">This action cannot be undone.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { toast.dismiss(t.id); }} className="flex-1 py-2 rounded-xl bg-theme-border-soft text-xs font-bold text-theme-primary">Cancel</button>
              <button onClick={async () => { toast.dismiss(t.id); await onDeleteStudent(id); }} className="flex-1 py-2 rounded-xl bg-theme-danger text-white text-xs font-bold">Delete</button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  }, [onDeleteStudent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    window.dispatchEvent(new CustomEvent('billqyro:sync-requested'));
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  };

  const filtered = useMemo(() => items.filter(i => {
    const q = search.toLowerCase();
    return (i.name || '').toLowerCase().includes(q) || (i.phone || '').includes(q) || (i.email || '').toLowerCase().includes(q) || (i.course || '').toLowerCase().includes(q) || (i.batch || '').toLowerCase().includes(q);
  }), [items, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const stats = [
    { label: 'Total Students', value: items.length, icon: GraduationCap, color: 'text-indigo-500' },
    { label: 'Active Courses', value: [...new Set(items.map(i => i.course).filter(Boolean))].length, icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Batches', value: [...new Set(items.map(i => i.batch).filter(Boolean))].length, icon: Users, color: 'text-amber-500' },
  ];

  if (loading) return <div className="space-y-6 pb-24"><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {refreshing && (
        <div className="flex items-center justify-center py-3">
          <RefreshCw className="w-5 h-5 text-theme-accent animate-spin" />
        </div>
      )}
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Student Directory</h1>
          <p className="text-xs text-theme-muted font-bold">Manage students and batches</p>
        </div>
        <button onClick={openAdd} className="btn-premium flex items-center gap-2 py-2.5 px-5 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md w-fit">
          <Plus className="w-4 h-4" /> Add Student
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, course, batch, phone..." className="input-premium w-full bg-transparent border-0 outline-none text-sm font-semibold text-theme-primary placeholder:text-theme-muted/50" />
      </div>

      {filtered.length === 0 ? (
        <div className="w-full">
          <PremiumEmptyState
            icon={GraduationCap}
            title={search ? 'No results found' : 'No students yet'}
            description={search ? 'Try a different search term' : 'Enroll your first student to build the directory.'}
            actionLabel={search ? null : 'Add Student'}
            onAction={search ? null : openAdd}
          />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(item => (
            <motion.div key={item.id} variants={staggerItem} className="card-premium p-5 relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">{item.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-extrabold text-theme-primary text-sm">{item.name}</h3>
                    {item.course && <p className="text-[10px] font-semibold text-theme-muted flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3" />{item.course}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Edit student" aria-label="Edit student" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button title="Delete student" aria-label="Delete student" onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs font-semibold text-theme-muted">
                {item.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{item.phone}</span></div>}
                {item.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{item.email}</span></div>}
                {item.batch && <div className="flex items-center gap-2"><span className="badge-premium bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Batch: {item.batch}</span></div>}
                {item.enrollmentDate && <div className="flex items-center gap-2"><span className="text-theme-muted/60">Enrolled: {new Date(item.enrollmentDate).toLocaleDateString()}</span></div>}
              </div>
              <span className="text-[9px] text-theme-muted/40 font-semibold mt-3 block">Added {new Date(item.createdAt).toLocaleDateString()}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-theme-surface border border-theme-border-soft disabled:opacity-50 text-xs font-bold text-theme-primary transition-colors hover:bg-theme-border-soft"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-theme-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-theme-surface border border-theme-border-soft disabled:opacity-50 text-xs font-bold text-theme-primary transition-colors hover:bg-theme-border-soft"
          >
            Next
          </button>
        </div>
      )}

      <button onClick={openAdd} className="fixed bottom-20 right-4 md:hidden flex items-center justify-center w-12 h-12 bg-[image:var(--accent-gradient)] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
          <div><label className="block mb-1">Student Name *</label><input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1">Course</label><input type="text" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} placeholder="e.g. Web Dev" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
            <div><label className="block mb-1">Batch</label><input type="text" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="e.g. 2026-A" className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          </div>
          <div><label className="block mb-1">Enrollment Date</label><input type="date" value={form.enrollmentDate} onChange={e => setForm(f => ({ ...f, enrollmentDate: e.target.value }))} className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-bold" /></div>
          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><GraduationCap className="w-4 h-4" />{editItem ? 'Update' : 'Save'} Student</>}
            </button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
    </PullToRefresh>
  );
};

export default Students;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  Tag, 
  PieChart, 
  Wrench, 
  Receipt,
  Lightbulb,
  Repeat,
  Paperclip,
  Store,
  BarChart3,
  AlertCircle,
  Camera,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import CenteredModal from '../components/CenteredModal';
import { toast } from 'react-hot-toast';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { getDueRecurring, buildRecurringPostPayload, monthKeyLabel, currentMonthKey } from '../utils/recurringExpenses';

const CATEGORIES = [
  { name: 'Supplies', color: 'bg-theme-accent-light text-theme-accent', border: 'border-theme-border-soft' },
  { name: 'Utilities', color: 'bg-theme-warning/10 text-theme-warning', border: 'border-theme-warning/30' },
  { name: 'Salaries & Wages', color: 'bg-theme-accent-light text-theme-accent', border: 'border-theme-border-soft' },
  { name: 'Rent & Maintenance', color: 'bg-theme-danger/10 text-theme-danger', border: 'border-theme-danger/30' },
  { name: 'Marketing', color: 'bg-theme-accent-light text-theme-accent', border: 'border-theme-border-soft' },
  { name: 'Other', color: 'bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted', border: 'border-theme-border-soft' }
];

const Expenses = ({ expenses = [], onSaveExpense, onDeleteExpense, businessSettings, setCurrentTab }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendor, setVendor] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const receiptInputRef = React.useRef(null);

  const currencySymbol = businessSettings?.currency || '₹';

  // --- STATS ---
  const { totalExpenses, categoryTotals } = useMemo(() => {
    let total = 0;
    const catTotals = {};
    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount || 0);
      total += amt;
      const cat = exp.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + amt;
    });
    return { totalExpenses: total, categoryTotals: catTotals };
  }, [expenses]);

  const getCategoryTotal = (catName) => categoryTotals[catName] || 0;

  // --- MONTHLY TREND (last 6 months) ---
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString('en-IN', { month: 'short' }), total: 0 });
    }
    expenses.forEach(exp => {
      const mk = String(exp.date || '').slice(0, 7);
      const m = months.find(x => x.key === mk);
      if (m) m.total += parseFloat(exp.amount || 0) || 0;
    });
    const max = Math.max(...months.map(m => m.total), 1);
    return { months, max, thisMonth: months[months.length - 1] };
  }, [expenses]);

  // --- RECURRING ---
  const dueRecurring = useMemo(() => getDueRecurring(expenses), [expenses]);
  const knownVendors = useMemo(() => [...new Set(expenses.map(e => e.vendor).filter(Boolean))].sort(), [expenses]);

  const handlePostRecurring = (series) => {
    onSaveExpense(buildRecurringPostPayload(series));
    toast.success(`"${series.title}" posted for ${monthKeyLabel(currentMonthKey())}`);
  };

  const handlePostAllRecurring = async () => {
    // Sequential saves: parallel writes would race and drop entries
    for (const series of dueRecurring) {
      try { await onSaveExpense(buildRecurringPostPayload(series)); } catch (e) { console.error(e); }
    }
    toast.success(`${dueRecurring.length} monthly expense${dueRecurring.length !== 1 ? 's' : ''} posted`);
  };

  // --- RECEIPT PHOTO (compressed to a small JPEG data URL) ---
  const handleReceiptFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 900;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          setReceiptDataUrl(canvas.toDataURL('image/jpeg', 0.6));
          toast.success('Receipt attached');
        } catch (err) {
          toast.error('Could not process the image');
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!title || !amount) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const payload = {
      title,
      category,
      amount: parseFloat(amount),
      date,
      vendor: vendor.trim(),
      recurring: isRecurring,
      seriesId: isRecurring ? `${title.trim().toLowerCase()}|${category}` : undefined,
      receiptDataUrl: receiptDataUrl || undefined
    };

    onSaveExpense(payload);
    
    // Clear form
    setTitle('');
    setCategory('Supplies');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setVendor('');
    setIsRecurring(false);
    setReceiptDataUrl('');
    setShowAddForm(false);
  };

  const handleRefresh = async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 pb-24"
      >
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {setCurrentTab && (
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="p-2 rounded-xl bg-theme-surface hover:bg-theme-border-soft transition-colors text-theme-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Expense Tracker</h2>
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">MANAGE OPERATING COSTS</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="btn-premium flex items-center justify-center gap-2 text-xs px-5 py-2.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* 1.5 DUE RECURRING BANNER */}
      {dueRecurring.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-theme-primary">
                {dueRecurring.length} monthly expense{dueRecurring.length !== 1 ? 's' : ''} not posted for {monthKeyLabel(currentMonthKey())}
              </p>
              <p className="text-[11px] text-theme-muted mt-0.5 truncate">
                {dueRecurring.map(r => `${r.title} (${formatCurrency(r.amount, currencySymbol)})`).join(' • ')}
              </p>
            </div>
          </div>
          <button onClick={handlePostAllRecurring} className="btn-premium !min-h-[36px] !px-4 text-xs shrink-0">
            Post All This Month
          </button>
        </div>
      )}

      {/* 1.8 MONTHLY SPEND CHART */}
      <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-theme-accent" /> Monthly Spend (Last 6 Months)
          </h3>
          <span className="text-[10px] font-black text-theme-accent bg-theme-accent/10 border border-theme-accent/20 px-2 py-0.5 rounded-full">
            This month: {formatCurrency(monthlyTrend.thisMonth?.total || 0, currencySymbol)}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {monthlyTrend.months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group" title={`${monthKeyLabel(m.key)}: ${formatCurrency(m.total, currencySymbol)}`}>
              <span className="text-[9px] font-black text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {m.total > 0 ? formatCurrency(m.total, currencySymbol) : ''}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all ${m.key === currentMonthKey() ? 'bg-theme-accent' : 'bg-theme-accent/40 group-hover:bg-theme-accent/60'}`}
                style={{ height: `${Math.max(4, Math.round((m.total / monthlyTrend.max) * 100))}%` }}
              />
              <span className="text-[10px] font-bold text-theme-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. OVERALL AGGREGATES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* TOTAL BOX */}
        <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Monthly Cost</p>
          <h3 className="text-3xl font-black mt-1 text-theme-primary tracking-tight font-numbers">
            {formatCurrency(totalExpenses, currencySymbol)}
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-theme-muted">
            <PieChart className="w-3.5 h-3.5 text-theme-accent" />
            <span>Aggregate business overhead logged</span>
          </div>
        </div>

        {/* TOP CATEGORIES PANEL */}
        <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs md:col-span-2 space-y-3">
          <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider pb-1 border-b border-theme-border-soft">
            Cost By Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.slice(0, 6).map((cat) => {
              const catTotal = getCategoryTotal(cat.name);
              return (
                <div key={cat.name} className="p-2.5 bg-theme-surface border border-theme-border-soft rounded-xl">
                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${cat.color}`}>
                    {cat.name.split(' ')[0]}
                  </span>
                  <p className="text-xs font-black text-theme-primary mt-1.5 font-numbers">
                    {formatCurrency(catTotal, currencySymbol)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        
        {/* 3. LOG NEW EXPENSE DRAWER */}
        <CenteredModal 
          isOpen={showAddForm} 
          onClose={() => setShowAddForm(false)} 
          title="Log Operating Cost"
        >
          <form onSubmit={handleAddExpense} className="space-y-4 text-xs font-semibold text-theme-muted pb-2">
            <div>
              <label className="block mb-1 text-theme-primary text-xs font-bold">Expense Title / Description</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office Supplies / Raw Material"
                className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 text-theme-primary text-xs font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-xs"
              >
                {CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-theme-primary text-xs font-bold">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 text-theme-primary text-xs font-bold">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-theme-primary text-xs font-bold">Vendor / Paid To (optional)</label>
              <input
                type="text"
                list="vendor-options-list"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Mega Wholesale / CESC"
                className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-xs"
              />
              <datalist id="vendor-options-list">
                {knownVendors.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>

            <label className="flex items-center justify-between bg-theme-surface border border-theme-border-soft rounded-xl px-3.5 py-2.5 cursor-pointer">
              <span className="flex items-center gap-2 text-theme-primary font-bold text-xs">
                <Repeat className="w-3.5 h-3.5 text-theme-accent" />
                Repeats every month (rent, electricity, salary…)
              </span>
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 accent-[var(--accent-primary,#C81E5C)]" />
            </label>

            <div>
              <label className="block mb-1 text-theme-primary text-xs font-bold">Receipt Photo (optional)</label>
              {receiptDataUrl ? (
                <div className="relative">
                  <img src={receiptDataUrl} alt="Receipt preview" className="w-full max-h-32 object-contain rounded-xl border border-theme-border-soft bg-theme-surface" />
                  <button
                    type="button"
                    onClick={() => setReceiptDataUrl('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-danger"
                    title="Remove receipt"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => receiptInputRef.current?.click()}
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-dashed border-theme-border-soft rounded-xl text-theme-muted hover:text-theme-accent hover:border-theme-accent/50 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Camera className="w-3.5 h-3.5" /> Attach receipt photo
                </button>
              )}
              <input ref={receiptInputRef} type="file" accept="image/*" capture="environment" onChange={handleReceiptFile} className="hidden" />
            </div>

            <button
              type="submit"
              className="w-full btn-premium py-2.5 mt-3 text-xs flex items-center justify-center gap-2"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Confirm Log Cost</span>
            </button>
          </form>
        </CenteredModal>

        {/* 4. EXPENSE ENTRIES REGISTRY */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider">Registry Log</h3>
            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider bg-theme-surface px-2 py-0.5 rounded-full border border-theme-border-soft">
              {expenses.length} Records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {expenses.map((exp) => {
                const catInfo = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                return (
                  <motion.div
                    key={exp.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="bg-theme-card rounded-2xl p-4.5 border border-theme-border-soft hover:border-theme-border-strong hover:shadow-md transition-all relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center font-extrabold text-theme-accent text-xs shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-xs text-theme-primary truncate leading-tight">{exp.title}</h3>
                            <span className="text-[10px] text-theme-muted font-semibold mt-0.5 inline-block">Expense Entry</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-all"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${catInfo.color} ${catInfo.border}`}>
                          {exp.category}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-theme-surface text-theme-muted border border-theme-border-soft">
                          <Calendar className="w-3 h-3" />
                          {exp.date}
                        </span>
                        {exp.recurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-theme-accent/10 text-theme-accent border border-theme-accent/20" title="Repeats every month">
                            <Repeat className="w-3 h-3" /> Monthly
                          </span>
                        )}
                        {exp.vendor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-theme-surface text-theme-muted border border-theme-border-soft" title="Vendor">
                            <Store className="w-3 h-3" /> {exp.vendor}
                          </span>
                        )}
                        {exp.receiptDataUrl && (
                          <button
                            onClick={() => setViewingReceipt(exp)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-theme-surface text-theme-accent border border-theme-accent/30 hover:bg-theme-accent/10"
                            title="View receipt"
                          >
                            <Paperclip className="w-3 h-3" /> Receipt
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-theme-border-soft pt-3 mt-4 flex justify-between items-center">
                      <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Amount</span>
                      <span className="text-sm font-black text-theme-primary font-numbers">
                        {formatCurrency(exp.amount, currencySymbol)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {expenses.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 bg-theme-card rounded-2xl p-10 border border-theme-border-soft text-center shadow-xs">
                <Receipt className="w-10 h-10 text-theme-muted mx-auto mb-2 opacity-60" />
                <h4 className="font-bold text-sm text-theme-primary">No Operating Costs Logged</h4>
                <p className="text-xs text-theme-muted font-medium mt-1 max-w-xs mx-auto">
                  Keep overhead clean. Click Log Expense to add business expenses!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
      <CenteredModal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title={viewingReceipt ? `Receipt — ${viewingReceipt.title}` : 'Receipt'}>
        {viewingReceipt?.receiptDataUrl && (
          <img src={viewingReceipt.receiptDataUrl} alt="Receipt" className="w-full rounded-xl border border-theme-border-soft" />
        )}
      </CenteredModal>

      </motion.div>
      </PullToRefresh>
    </AnimatedPage>
  );
};

export default Expenses;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  Tag, 
  PieChart, 
  Wrench, 
  Receipt,
  Lightbulb
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../utils/storage';

const CATEGORIES = [
  { name: 'Supplies', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  { name: 'Utilities', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { name: 'Salaries & Wages', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  { name: 'Rent & Maintenance', color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
  { name: 'Marketing', color: 'bg-sky-100 text-sky-700', border: 'border-sky-200' },
  { name: 'Other', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' }
];

const Expenses = ({ expenses = [], onSaveExpense, onDeleteExpense, businessSettings }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currencySymbol = businessSettings?.currency || '₹';

  // --- STATS ---
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  const getCategoryTotal = (catName) => {
    return expenses
      .filter(exp => exp.category === catName)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!title || !amount) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      title,
      category,
      amount: parseFloat(amount),
      date
    };

    onSaveExpense(payload);
    
    // Clear form
    setTitle('');
    setCategory('Supplies');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
  };

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
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
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Expense Tracker</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">MANAGE OPERATING COSTS</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* 2. OVERALL AGGREGATES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* TOTAL BOX */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-premium relative overflow-hidden border border-indigo-950/20">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Total Monthly Cost</p>
          <h3 className="text-3xl font-black mt-2 tracking-tight">
            {formatCurrency(totalExpenses, currencySymbol)}
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-slate-300">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Aggregate business overhead logged</span>
          </div>
        </div>

        {/* TOP CATEGORIES PANEL */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">
            Cost By Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.slice(0, 6).map((cat) => {
              const catTotal = getCategoryTotal(cat.name);
              return (
                <div key={cat.name} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${cat.color}`}>
                    {cat.name.split(' ')[0]}
                  </span>
                  <p className="text-sm font-black text-slate-700 mt-2">
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
        <BottomSheet 
          isOpen={showAddForm} 
          onClose={() => setShowAddForm(false)} 
          title="Log New Bill"
        >
          <form onSubmit={handleAddExpense} className="space-y-4 text-xs font-semibold text-slate-500 pb-4">
            <div>
              <label className="block mb-1 text-slate-400">Expense Title / Description</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Embroidery Thread Reels"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold"
              >
                {CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-400">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-md shadow-indigo-100/50 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Confirm Log Cost</span>
            </button>
          </form>
        </BottomSheet>

        {/* 4. EXPENSE ENTRIES REGISTRY */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Registry Log</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
              {expenses.length} Records
            </span>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence>
              {expenses.map((exp) => {
                const catInfo = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                return (
                  <motion.div
                    key={exp.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-premium flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">{exp.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${catInfo.color}`}>
                            {exp.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {exp.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-800">
                        {formatCurrency(exp.amount, currencySymbol)}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 hover:text-rose-600 hover:bg-rose-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {expenses.length === 0 && (
              <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-premium">
                <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">No Operating Costs Logged</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Keep overhead clean. Click Log Expense to add business expenses!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
      </motion.div>
    </PullToRefresh>
  );
};

export default Expenses;

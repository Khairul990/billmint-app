import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download, 
  RotateCcw, 
  Pencil, 
  Wallet, 
  Scale, 
  TrendingUp, 
  Ban, 
  Search, 
  X,
  Smartphone,
  Banknote,
  ShoppingBag,
  Users,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  CreditCard
} from 'lucide-react';
import { bankEngine, paiseToRupees, rupeesToPaise, BANK_CATEGORIES } from '../services/bankEngine';
import { formatCurrency } from '../utils/invoiceUtils';
import { calculateCanonicalInvoiceFinancials } from '../utils/invoiceMath';

const TABS = [
  { id: 'overview', label: 'Bank & Map Overview', icon: Wallet },
  { id: 'transactions', label: 'Transactions Ledger', icon: Scale },
  { id: 'credit', label: 'Customer Credit', icon: TrendingUp },
  { id: 'settings', label: 'Bank Settings', icon: Ban }
];

const emptyForm = {
  type: 'moneyIn',
  amountRupees: '',
  category: '',
  title: '',
  account: '',
  customerId: '',
  invoiceId: '',
  onCredit: false,
  date: new Date().toISOString().slice(0, 10),
  note: ''
};

const WITHDRAW_TARGETS = [
  { id: 'phonepe', label: 'PhonePe / UPI Wallet', icon: Smartphone, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30', category: 'Withdrawal', defaultNote: 'Transferred to PhonePe / UPI' },
  { id: 'cash', label: 'Cash in Hand (Cash Drawer)', icon: Banknote, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', category: 'Withdrawal', defaultNote: 'Withdrawn as Physical Cash' },
  { id: 'personal', label: 'Personal Expense (Owner)', icon: ShoppingBag, color: 'text-pink-500 bg-pink-500/10 border-pink-500/30', category: 'Withdrawal', defaultNote: 'Personal expense / Owner drawing' },
  { id: 'salary', label: 'Staff Salary / Advance', icon: Users, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30', category: 'Salary / Wages', defaultNote: 'Staff salary or advance payout' },
  { id: 'bank', label: 'External Bank Account', icon: Landmark, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', category: 'Withdrawal', defaultNote: 'Bank account transfer' },
  { id: 'expense', label: 'Shop / Business Bills', icon: Building, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', category: 'Expense', defaultNote: 'Business operational expense' }
];

const DEPOSIT_SOURCES = [
  { id: 'sale', label: 'Cash Sale / Invoice Payment', icon: FileText, category: 'Sale / Invoice Payment', defaultNote: 'Customer sales collection' },
  { id: 'credit_col', label: 'Old Due / Credit Collection', icon: CheckCircle2, category: 'Credit Collection', defaultNote: 'Collected from old customer due' },
  { id: 'owner_deposit', label: 'Owner Capital / Deposit', icon: Wallet, category: 'Owner Investment', defaultNote: 'Owner added money into vault' },
  { id: 'other_in', label: 'Other Money In / Profit', icon: ArrowDownRight, category: 'Other Income', defaultNote: 'Miscellaneous revenue' }
];

const InternalBank = ({ 
  customers = [], 
  invoices = [], 
  staffs = [], 
  businessSettings = {} 
}) => {
  const { t } = useI18n();
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(WITHDRAW_TARGETS[0]);
  const [depositSource, setDepositSource] = useState(DEPOSIT_SOURCES[0]);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickNote, setQuickNote] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ type: 'all', category: 'all', search: '', customerId: 'all' });
  const [confirmReverse, setConfirmReverse] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);

  // Financial totals derived from canonical billing engine
  const billingStats = useMemo(() => {
    let totalBilled = 0;
    let totalDues = 0;
    let totalInvoices = 0;

    (invoices || []).forEach(inv => {
      if (!inv || inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      totalInvoices += 1;
      const fin = calculateCanonicalInvoiceFinancials(inv);
      totalBilled += (fin.currentInvoiceTotal || 0);
      const due = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;
      if (due > 0) totalDues += due;
    });

    return { totalBilled, totalDues, totalInvoices };
  }, [invoices]);

  useEffect(() => {
    if (state?.settings && !settingsDraft) {
      const s = state.settings;
      setSettingsDraft({
        ...s,
        startingBalanceRupees: paiseToRupees(s.startingBalancePaise || 0)
      });
    }
  }, [state, settingsDraft]);

  const setDraft = (key, value) => setSettingsDraft((d) => (d ? { ...d, [key]: value } : d));

  const saveSettings = async () => {
    if (!settingsDraft) return;
    try {
      await bankEngine.saveBankSettings({
        label: settingsDraft.label,
        account: settingsDraft.account,
        currencySymbol: settingsDraft.currencySymbol,
        startingBalanceRupees: Number(settingsDraft.startingBalanceRupees) || 0,
        allowNegativeBalance: !!settingsDraft.allowNegativeBalance,
        autoPostPayments: settingsDraft.autoPostPayments !== false
      });
      setSettingsDraft(null);
      setTab('overview');
      toast.success('Bank settings saved.');
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    }
  };

  const refresh = useCallback(async () => {
    try {
      const s = await bankEngine.getState();
      setState(s);
    } catch (e) {
      console.warn('[BANK] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    const handleRealtime = (e) => {
      const col = e.detail?.collectionName;
      if (col === 'bankLedger' || col === 'bankCredit') refresh();
    };
    const handleBankSettings = () => refresh();
    window.addEventListener('billqyro_bank_updated', handler);
    window.addEventListener('billqyro:data-updated', handleRealtime);
    window.addEventListener('billqyro:bank-settings-updated', handleBankSettings);
    window.addEventListener('billqyro_sync', handler);
    return () => {
      window.removeEventListener('billqyro_bank_updated', handler);
      window.removeEventListener('billqyro:data-updated', handleRealtime);
      window.removeEventListener('billqyro:bank-settings-updated', handleBankSettings);
      window.removeEventListener('billqyro_sync', handler);
    };
  }, [refresh]);

  const customerOptions = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      const id = c.id || c._id;
      const name = c.name || c.customerName || c.businessName || 'Customer';
      if (id && !map.has(id)) map.set(id, name);
    });
    return [...map.entries()];
  }, [customers]);

  const invoiceOptions = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      const id = inv.id || inv._id;
      if (id && !map.has(id)) map.set(id, `${inv.invoiceNumber || 'Invoice'} · ${inv.customer?.name || inv.customerName || ''}`);
    });
    return [...map.entries()];
  }, [invoices]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, type: 'moneyIn' });
    setShowModal(true);
  };

  const openQuickWithdraw = (targetId = 'phonepe') => {
    const tgt = WITHDRAW_TARGETS.find(t => t.id === targetId) || WITHDRAW_TARGETS[0];
    setWithdrawTarget(tgt);
    setQuickAmount('');
    setQuickNote(tgt.defaultNote);
    setShowWithdrawModal(true);
  };

  const openQuickDeposit = (sourceId = 'sale') => {
    const src = DEPOSIT_SOURCES.find(s => s.id === sourceId) || DEPOSIT_SOURCES[0];
    setDepositSource(src);
    setQuickAmount('');
    setQuickNote(src.defaultNote);
    setShowDepositModal(true);
  };

  const handleQuickWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(quickAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to withdraw.');
      return;
    }
    const currentVaultRupees = paiseToRupees(state?.balancePaise || 0);
    if (!state?.settings?.allowNegativeBalance && amount > currentVaultRupees) {
      toast.error(`Vault balance is ${formatCurrency(currentVaultRupees, currencySymbol)}. Cannot withdraw more than available balance.`);
      return;
    }

    try {
      await bankEngine.addTransaction({
        type: 'moneyOut',
        amountRupees: amount,
        category: withdrawTarget.category,
        title: `Withdraw to ${withdrawTarget.label}`,
        account: withdrawTarget.id,
        note: quickNote || withdrawTarget.defaultNote,
        date: new Date()
      });
      toast.success(`Successfully withdrew ${formatCurrency(amount, currencySymbol)} to ${withdrawTarget.label}!`, { icon: '💸' });
      setShowWithdrawModal(false);
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to process withdrawal.');
    }
  };

  const handleQuickDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(quickAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to deposit.');
      return;
    }

    try {
      await bankEngine.addTransaction({
        type: 'moneyIn',
        amountRupees: amount,
        category: depositSource.category,
        title: `Deposit from ${depositSource.label}`,
        account: 'vault',
        note: quickNote || depositSource.defaultNote,
        date: new Date()
      });
      toast.success(`Successfully deposited ${formatCurrency(amount, currencySymbol)} into Website Bank Vault!`, { icon: '🏦' });
      setShowDepositModal(false);
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to deposit money.');
    }
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setForm({
      type: tx.type,
      amountRupees: paiseToRupees(tx.amountPaise).toString(),
      category: tx.category,
      title: tx.title,
      account: tx.account,
      customerId: tx.customerId || '',
      invoiceId: tx.invoiceId || '',
      onCredit: tx.entryType === 'credit_sale',
      date: tx.date.slice(0, 10),
      note: tx.note
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amountRupees);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }
    try {
      if (editing) {
        await bankEngine.editTransaction(editing.id, {
          amountRupees: amount,
          category: form.type === 'moneyIn' && form.category === 'Credit Collection' ? 'Credit Collection' : form.category,
          title: form.title,
          account: form.account,
          customerId: form.customerId || null,
          note: form.note,
          date: form.date ? new Date(form.date) : undefined
        });
        toast.success('Transaction updated.');
      } else {
        await bankEngine.addTransaction({
          type: form.type,
          amountRupees: amount,
          category: form.category,
          title: form.title,
          account: form.account,
          customerId: form.customerId || null,
          invoiceId: form.invoiceId || null,
          entryType: form.onCredit ? (form.type === 'moneyIn' ? 'credit_collection' : 'credit_sale') : undefined,
          note: form.note,
          date: form.date ? new Date(form.date) : undefined
        });
        toast.success('Transaction recorded.');
      }
      setShowModal(false);
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save transaction.');
    }
  };

  const doReverse = async () => {
    if (!confirmReverse) return;
    try {
      await bankEngine.reverseTransaction(confirmReverse.id, confirmReverse.reason || '');
      toast.success('Transaction reversed.');
      setConfirmReverse(null);
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to reverse.');
    }
  };

  const doExport = async () => {
    try {
      const csv = await bankEngine.exportCsv({ includeReversed: false });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BillQyro-Bank-Ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Ledger exported to CSV.');
    } catch {
      toast.error('Export failed.');
    }
  };

  const saveCreditLimit = async (customerId, name, limitRupees) => {
    try {
      await bankEngine.setCreditProfile(customerId, name, limitRupees);
      toast.success('Credit limit saved.');
      await refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save credit limit.');
    }
  };

  const setCreditLimit = (customerId, name) => {
    const current = state?.credit?.find((c) => c.id === customerId);
    const raw = window.prompt(`Set credit limit (Rs.) for ${name}:`, current ? paiseToRupees(current.creditLimitPaise).toString() : '0');
    if (raw === null) return;
    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      toast.error('Enter a valid limit (0 or more).');
      return;
    }
    saveCreditLimit(customerId, name, val);
  };

  const categories = (type) => (type === 'moneyIn' ? BANK_CATEGORIES.moneyIn : BANK_CATEGORIES.moneyOut);

  // Derived Account Balances & Pools
  const poolStats = useMemo(() => {
    if (!state?.ledger) return { phonepe: 0, cash: 0, personal: 0, salary: 0 };
    let phonepe = 0;
    let cash = 0;
    let personal = 0;
    let salary = 0;

    state.ledger.forEach(tx => {
      if (tx.reversed || tx.type !== 'moneyOut') return;
      const amt = paiseToRupees(tx.amountPaise);
      const acc = (tx.account || '').toLowerCase();
      const title = (tx.title || '').toLowerCase();
      const cat = (tx.category || '').toLowerCase();

      if (acc === 'phonepe' || title.includes('phonepe') || cat.includes('phonepe')) {
        phonepe += amt;
      } else if (acc === 'cash' || title.includes('cash') || cat.includes('cash')) {
        cash += amt;
      } else if (cat.includes('personal') || cat === 'withdrawal' || title.includes('personal')) {
        personal += amt;
      } else if (cat.includes('salary') || cat.includes('wages') || cat.includes('staff')) {
        salary += amt;
      }
    });

    return { phonepe, cash, personal, salary };
  }, [state]);

  if (loading || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-theme-muted">
        <Landmark className="w-10 h-10 mb-3 animate-pulse text-theme-accent" />
        <p className="text-sm font-bold">Loading BillQyro Central Bank &amp; Vault...</p>
      </div>
    );
  }

  const settings = state.settings || {};
  const balance = state.balancePaise || 0;
  const vaultBalanceRupees = paiseToRupees(balance);
  const currencySymbol = settings.currencySymbol || 'Rs.';

  const filtered = (state.ledger || []).filter((tx) => {
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.category !== 'all' && tx.category !== filters.category) return false;
    if (filters.customerId !== 'all' && tx.customerId !== filters.customerId) return false;
    if (!filters.includeReversed && tx.reversed) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${tx.title} ${tx.note} ${tx.invoiceNumber} ${tx.customerName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="p-4 md:p-6 bg-theme-main min-h-full space-y-6">
      
      {/* 1. BANK HEADER & COMMAND BAR */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] border border-white/60 shadow-[0_24px_64px_-12px_rgba(11,143,120,0.15),0_0_40px_rgba(255,255,255,0.9)] bg-gradient-to-b from-white/95 via-theme-surface/80 to-[var(--bq26-emerald)]/10 backdrop-blur-3xl ring-1 ring-white dark:bg-gradient-to-b dark:from-[#0B1220]/95 dark:to-[#0B1220]/80 group">
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-theme-accent/10 rounded-full blur-3xl group-hover:bg-theme-accent/20 transition-all duration-700 pointer-events-none z-0" />
        
        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-theme-accent via-teal-500 to-emerald-600 shadow-xl shadow-theme-accent/30 text-white flex items-center justify-center transform hover:scale-105 transition-transform">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
                  {settings.label || 'BillQyro Internal Bank'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-accent/15 text-theme-accent border border-theme-accent/25">
                  Website Digital Vault
                </span>
              </div>
              <p className="text-xs sm:text-sm text-theme-muted font-medium mt-1">
                {settings.account ? `Vault ID: ${settings.account}` : 'আমাদের ওয়েবসাইটের নিজস্ব ক্যাশ ও ব্যাংকিং ভল্ট — সমস্ত বিলিং, জমা ও ফোনপে উইথড্রয়াল এখান থেকেই নিয়ন্ত্রিত হয়'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={() => openQuickDeposit('sale')}
              className="px-4 py-2.5 rounded-xl bg-theme-success/10 hover:bg-theme-success/20 text-theme-success border border-theme-success/30 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Deposit (টাকা জমা)</span>
            </button>

            <button 
              onClick={() => openQuickWithdraw('phonepe')}
              className="px-4 py-2.5 rounded-xl bg-theme-danger text-white hover:bg-theme-danger/90 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-theme-danger/25 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- Withdraw (টাকা তোলা ও খরচ)</span>
            </button>

            <button 
              onClick={doExport} 
              className="px-3.5 py-2.5 rounded-xl border border-theme-border-soft bg-white/50 dark:bg-theme-surface/50 text-theme-primary text-xs font-bold hover:bg-theme-surface transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export bank transactions to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tItem) => {
          const Icon = tItem.icon;
          const isActive = tab === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-xs ${
                isActive 
                  ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/25 scale-[1.02]' 
                  : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border-soft'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. OVERVIEW TAB: INTERACTIVE FINANCIAL FLOW MAP & STAT CARDS */}
      {/* ========================================================================= */}
      {tab === 'overview' && (
        <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* 3A. THE INTERACTIVE VISUAL BANKING MAP (ম্যাপ সাইট মতো আর্কিটেকচার) */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] border border-theme-accent/20 bg-gradient-to-br from-theme-card via-theme-surface to-theme-card backdrop-blur-2xl shadow-xl shadow-theme-accent/5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-theme-border-soft">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-lg sm:text-xl font-black text-theme-primary tracking-tight">
                    Interactive Bank &amp; Money Flow Map (লাইভ মানি ফ্লো ম্যাপ)
                  </h2>
                </div>
                <p className="text-xs text-theme-muted mt-0.5">
                  টাকা আসার উৎস ➔ ওয়েবসাইটের কেন্দ্রীয় ব্যাংক ভল্ট ➔ ফোনপে, ক্যাশ ও খরচে উইথড্রয়ালের সম্পূর্ণ লাইভ চিত্র
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-theme-muted bg-theme-surface px-3 py-1 rounded-xl border border-theme-border-soft">
                  Real-time Ledger Sync
                </span>
              </div>
            </div>

            {/* THE VISUAL 3-STAGE BLUEPRINT MAP */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative">
              
              {/* ZONE 1: INFLOW & BILLING SOURCES (৪ কলাম) */}
              <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-3xl bg-theme-surface/70 border border-theme-border-soft/80 shadow-sm relative group hover:border-theme-success/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-success/10 text-theme-success border border-theme-success/20 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      1. Inflow Sources (টাকা আসার উৎস)
                    </span>
                    <span className="text-[11px] font-bold text-theme-muted">{billingStats.totalInvoices} Bills</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-theme-primary">Customer Billing &amp; Sales</h3>
                    <p className="text-[11px] text-theme-muted">দোকান ও ওয়েবসাইটের মোট তৈরি করা বিল ও বিক্রয়</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-theme-card border border-theme-border-soft/60">
                      <span className="text-theme-muted font-medium">Total Lifetime Billed:</span>
                      <span className="font-black text-theme-primary">{formatCurrency(billingStats.totalBilled, currencySymbol)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-theme-card border border-theme-border-soft/60">
                      <span className="text-theme-muted font-medium">Collected in Bank:</span>
                      <span className="font-black text-theme-success">+{formatCurrency(paiseToRupees(state.totals.totalIn), currencySymbol)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">Customer Dues (বাকি):</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">{formatCurrency(billingStats.totalDues, currencySymbol)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-theme-border-soft/60">
                  <button
                    onClick={() => openQuickDeposit('sale')}
                    className="w-full py-2.5 rounded-xl bg-theme-success/15 hover:bg-theme-success/25 text-theme-success text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deposit Sales Money (+ যোগ করুন)</span>
                  </button>
                </div>
              </div>

              {/* ZONE 2: CENTRAL VAULT (৪ কলাম) */}
              <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-b from-theme-card via-theme-accent/5 to-theme-card border-2 border-theme-accent/30 shadow-xl shadow-theme-accent/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-36 h-36 bg-theme-accent/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-accent text-white shadow-sm flex items-center gap-1.5">
                      <Landmark className="w-3 h-3" />
                      2. Central Vault (ওয়েবসাইট ব্যাংক)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="text-center py-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-theme-accent">
                      Available Business Balance
                    </p>
                    <p className={`text-4xl font-black bq-financial-number mt-1.5 tracking-tight ${vaultBalanceRupees < 0 ? 'text-theme-danger' : 'text-theme-primary'}`}>
                      {formatCurrency(vaultBalanceRupees, currencySymbol)}
                    </p>
                    <p className="text-[11px] text-theme-muted mt-1 font-semibold">
                      ওয়েবসাইটের মূল কার্যকর ব্যালেন্স
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-theme-surface/80 border border-theme-border-soft">
                      <span className="text-[10px] text-theme-muted block font-semibold">Total In</span>
                      <span className="font-black text-theme-success">+{formatCurrency(paiseToRupees(state.totals.totalIn), currencySymbol)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-surface/80 border border-theme-border-soft">
                      <span className="text-[10px] text-theme-muted block font-semibold">Total Out</span>
                      <span className="font-black text-theme-danger">-{formatCurrency(paiseToRupees(state.totals.totalOut), currencySymbol)}</span>
                    </div>
                  </div>
                </div>

                {/* FAST DISBURSEMENT BUTTONS */}
                <div className="space-y-2 pt-4 mt-4 border-t border-theme-border-soft relative z-10">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openQuickDeposit('sale')}
                      className="py-2.5 px-3 rounded-xl bg-theme-success text-white hover:opacity-95 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit (+)</span>
                    </button>
                    <button
                      onClick={() => openQuickWithdraw('phonepe')}
                      className="py-2.5 px-3 rounded-xl bg-theme-danger text-white hover:opacity-95 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Withdraw (-)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => openQuickWithdraw('phonepe')}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/25 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Send to PhonePe (ফোনপেতে পাঠান)</span>
                  </button>
                </div>
              </div>

              {/* ZONE 3: WALLETS & OUTFLOW DESTINATIONS (৪ কলাম) */}
              <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-3xl bg-theme-surface/70 border border-theme-border-soft/80 shadow-sm relative group hover:border-theme-danger/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-danger/10 text-theme-danger border border-theme-danger/20 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3 h-3" />
                      3. Wallets &amp; Outflow (তোলা ও খরচ)
                    </span>
                    <span className="text-[11px] font-bold text-theme-muted">Accounts</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-theme-primary">Disbursement Pools</h3>
                    <p className="text-[11px] text-theme-muted">ভল্ট থেকে কোথায় কোথায় কত টাকা সরানো হয়েছে</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {/* PhonePe Pool */}
                    <div 
                      onClick={() => openQuickWithdraw('phonepe')}
                      className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-theme-card border border-theme-border-soft/60 hover:border-indigo-500/40 cursor-pointer transition-all group/item"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-theme-primary block">PhonePe / UPI</span>
                          <span className="text-[10px] text-theme-muted">Transferred pool</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-indigo-500 block">{formatCurrency(poolStats.phonepe, currencySymbol)}</span>
                        <span className="text-[9px] text-theme-accent font-bold group-hover/item:underline">+ Send</span>
                      </div>
                    </div>

                    {/* Cash Pool */}
                    <div 
                      onClick={() => openQuickWithdraw('cash')}
                      className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-theme-card border border-theme-border-soft/60 hover:border-emerald-500/40 cursor-pointer transition-all group/item"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Banknote className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-theme-primary block">Cash Drawer</span>
                          <span className="text-[10px] text-theme-muted">দোকানের ক্যাশ ড্রয়ার</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-500 block">{formatCurrency(poolStats.cash, currencySymbol)}</span>
                        <span className="text-[9px] text-theme-accent font-bold group-hover/item:underline">+ Take</span>
                      </div>
                    </div>

                    {/* Personal & Staff Summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-pink-500/5 border border-pink-500/20">
                        <span className="text-[10px] text-pink-500 block font-bold">Personal Expense</span>
                        <span className="font-black text-theme-primary">{formatCurrency(poolStats.personal, currencySymbol)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-sky-500/5 border border-sky-500/20">
                        <span className="text-[10px] text-sky-500 block font-bold">Staff / Salary</span>
                        <span className="font-black text-theme-primary">{formatCurrency(poolStats.salary, currencySymbol)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-theme-border-soft/60">
                  <button
                    onClick={() => openQuickWithdraw('personal')}
                    className="w-full py-2.5 rounded-xl bg-theme-danger/15 hover:bg-theme-danger/25 text-theme-danger text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Withdraw for Personal Expense (হাতখরচ)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 3B. FINANCIAL PILLARS SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Current Vault Balance */}
            <div className="relative overflow-hidden p-5 rounded-3xl border border-theme-accent/20 bg-gradient-to-br from-white/90 to-theme-accent/5 dark:from-theme-surface dark:to-theme-accent/10 backdrop-blur-xl shadow-lg shadow-theme-accent/5 group">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-theme-accent uppercase tracking-widest flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Vault Balance
                </p>
                <span className="text-[10px] font-bold text-theme-muted">Available</span>
              </div>
              <p className={`text-3xl font-black bq-financial-number mt-2 ${vaultBalanceRupees < 0 ? 'text-theme-danger' : 'text-theme-primary'}`}>
                {formatCurrency(vaultBalanceRupees, currencySymbol)}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-border-soft/60">
                <span className="text-[11px] text-theme-muted font-medium">Safe Business Money</span>
                <button onClick={() => openQuickWithdraw('phonepe')} className="text-[11px] font-black text-theme-danger hover:underline">
                  Withdraw &rarr;
                </button>
              </div>
            </div>
            
            {/* Card 2: Total Inflow */}
            <div className="relative overflow-hidden p-5 rounded-3xl border border-theme-success/20 bg-gradient-to-br from-white/90 to-theme-success/5 dark:from-theme-surface dark:to-theme-success/10 backdrop-blur-xl shadow-lg shadow-theme-success/5 group">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-theme-success uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Total Income (Website)
                </p>
                <span className="text-[10px] font-bold text-theme-success">Inflow</span>
              </div>
              <p className="text-3xl font-black bq-financial-number mt-2 text-theme-primary">
                {formatCurrency(paiseToRupees(state.totals.totalIn), currencySymbol)}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-border-soft/60">
                <span className="text-[11px] text-theme-muted font-medium">All collections in bank</span>
                <button onClick={() => openQuickDeposit('sale')} className="text-[11px] font-black text-theme-success hover:underline">
                  + Deposit
                </button>
              </div>
            </div>

            {/* Card 3: Total Withdrawals */}
            <div className="relative overflow-hidden p-5 rounded-3xl border border-theme-danger/20 bg-gradient-to-br from-white/90 to-theme-danger/5 dark:from-theme-surface dark:to-theme-danger/10 backdrop-blur-xl shadow-lg shadow-theme-danger/5 group">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-theme-danger uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Total Withdrawals
                </p>
                <span className="text-[10px] font-bold text-theme-danger">Outflow</span>
              </div>
              <p className="text-3xl font-black bq-financial-number mt-2 text-theme-primary">
                {formatCurrency(paiseToRupees(state.totals.totalOut), currencySymbol)}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-border-soft/60">
                <span className="text-[11px] text-theme-muted font-medium">PhonePe, Cash &amp; Expenses</span>
                <span className="text-[11px] font-bold text-theme-muted">{state.ledger.filter(tx => !tx.reversed && tx.type === 'moneyOut').length} Tx</span>
              </div>
            </div>

            {/* Card 4: Customer Receivables / Dues */}
            <div className="relative overflow-hidden p-5 rounded-3xl border border-theme-warning/30 bg-gradient-to-br from-white/90 to-theme-warning/10 dark:from-theme-surface dark:to-theme-warning/10 backdrop-blur-xl shadow-lg shadow-theme-warning/5 group">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-theme-warning uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Customer Dues (বাকি)
                </p>
                <span className="text-[10px] font-bold text-theme-warning">Receivable</span>
              </div>
              <p className="text-3xl font-black bq-financial-number mt-2 text-theme-warning">
                {formatCurrency(billingStats.totalDues, currencySymbol)}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-border-soft/60">
                <span className="text-[11px] text-theme-muted font-medium">Pending from customers</span>
                <span className="text-[11px] font-extrabold text-theme-warning">Collect &rarr;</span>
              </div>
            </div>

          </div>

          {/* 3C. CATEGORY BREAKDOWN GRIDS */}
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Money In Categories */}
            <div className="rounded-3xl border border-theme-border-soft bg-theme-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-soft">
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-theme-success" />
                  {t('ib.money_in', 'Money In by Category')}
                </h3>
                <span className="text-xs font-bold text-theme-success">
                  +{formatCurrency(paiseToRupees(state.totals.totalIn), currencySymbol)}
                </span>
              </div>

              {state.totals.totalIn === 0 ? (
                <p className="text-xs text-theme-muted py-4 text-center">No money-in recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {[...(state.ledger || []).filter((t) => t.type === 'moneyIn' && !t.reversed).reduce((map, t) => {
                    map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                    return map;
                  }, new Map()).entries()].map(([cat, paise]) => (
                    <div key={cat} className="flex items-center justify-between text-xs p-2 rounded-xl bg-theme-surface/50 border border-theme-border-soft/40">
                      <span className="text-theme-primary font-bold">{cat}</span>
                      <span className="font-black text-theme-success">{formatCurrency(paiseToRupees(paise), currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Money Out / Withdrawals Categories */}
            <div className="rounded-3xl border border-theme-border-soft bg-theme-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-soft">
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-theme-danger" />
                  {t('ib.money_out', 'Withdrawals & Outflows by Category')}
                </h3>
                <span className="text-xs font-bold text-theme-danger">
                  -{formatCurrency(paiseToRupees(state.totals.totalOut), currencySymbol)}
                </span>
              </div>

              {(state.ledger || []).filter((t) => t.type === 'moneyOut' && !t.reversed).length === 0 ? (
                <div className="text-center py-6 text-theme-muted">
                  <p className="text-xs mb-2">No withdrawals recorded yet.</p>
                  <button 
                    onClick={() => openQuickWithdraw('phonepe')}
                    className="px-3 py-1.5 rounded-lg bg-theme-danger/10 text-theme-danger text-xs font-bold hover:bg-theme-danger/20 transition-colors"
                  >
                    Withdraw to PhonePe / Cash
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[...(state.ledger || []).filter((t) => t.type === 'moneyOut' && !t.reversed).reduce((map, t) => {
                    map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                    return map;
                  }, new Map()).entries()].map(([cat, paise]) => (
                    <div key={cat} className="flex items-center justify-between text-xs p-2 rounded-xl bg-theme-surface/50 border border-theme-border-soft/40">
                      <span className="text-theme-primary font-bold">{cat}</span>
                      <span className="font-black text-theme-danger">-{formatCurrency(paiseToRupees(paise), currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 4. TRANSACTIONS LEDGER TAB */}
      {/* ========================================================================= */}
      {tab === 'transactions' && (
        <motion.div key="tx" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-3xl bg-theme-card border border-theme-border-soft flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={t('ib.search_ph', 'Search by title, note, bill or customer…')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent"
                />
              </div>

              <select 
                value={filters.type} 
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} 
                className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-bold"
              >
                <option value="all">All Types</option>
                <option value="moneyIn">Deposit (Income +)</option>
                <option value="moneyOut">Withdraw (Expense -)</option>
              </select>

              <select 
                value={filters.category} 
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} 
                className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-bold"
              >
                <option value="all">All Categories</option>
                {[...BANK_CATEGORIES.moneyIn, ...BANK_CATEGORIES.moneyOut].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-theme-muted font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!!filters.includeReversed} 
                  onChange={(e) => setFilters((f) => ({ ...f, includeReversed: e.target.checked }))} 
                  className="accent-theme-accent w-4 h-4 cursor-pointer"
                />
                Include Reversed
              </label>

              <button
                onClick={openAdd}
                className="px-4 py-2 rounded-xl bg-theme-accent text-white text-xs font-black hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-theme-card rounded-3xl border border-dashed border-theme-border-soft">
              <p className="text-xs text-theme-muted font-semibold">{t('ib.no_tx', 'No transactions found matching your criteria.')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.slice(0, 200).map((tx) => (
                <div 
                  key={tx.id} 
                  className={`rounded-2xl border p-4 flex flex-wrap items-center gap-3.5 transition-all ${
                    tx.reversed 
                      ? 'border-theme-muted/20 opacity-50 bg-theme-surface/50' 
                      : 'border-theme-border-soft bg-theme-card hover:border-theme-accent/30'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    tx.type === 'moneyIn' 
                      ? 'bg-theme-success/15 text-theme-success' 
                      : 'bg-theme-danger/15 text-theme-danger'
                  }`}>
                    {tx.type === 'moneyIn' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-theme-primary text-sm leading-tight">
                        {tx.title || tx.category}
                      </p>
                      {tx.reversed && (
                        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                          REVERSED
                        </span>
                      )}
                      {tx.account && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md uppercase">
                          {tx.account}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-theme-muted font-medium mt-1">
                      {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {tx.category ? ` · ${tx.category}` : ''}
                      {tx.customerName ? ` · Customer: ${tx.customerName}` : ''}
                      {tx.invoiceNumber ? ` · Bill: ${tx.invoiceNumber}` : ''}
                    </p>

                    {tx.note && (
                      <p className="text-xs text-theme-muted mt-1 italic font-normal">
                        "{tx.note}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-black text-base tabular-nums font-numbers ${
                      tx.reversed 
                        ? 'text-theme-muted line-through' 
                        : tx.type === 'moneyIn' 
                          ? 'text-theme-success' 
                          : 'text-theme-danger'
                    }`}>
                      {tx.type === 'moneyIn' ? '+' : '- '}{formatCurrency(paiseToRupees(tx.amountPaise), currencySymbol)}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${tx.type === 'moneyIn' ? 'text-theme-success' : 'text-theme-danger'}`}>
                      {tx.type === 'moneyIn' ? 'Deposit' : 'Withdrawal'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!tx.reversed && (
                      <>
                        <button 
                          onClick={() => openEdit(tx)} 
                          title="Edit transaction" 
                          className="p-2 rounded-xl hover:bg-theme-surface text-theme-muted hover:text-theme-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmReverse(tx)} 
                          title="Reverse transaction" 
                          className="p-2 rounded-xl hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 5. CUSTOMER CREDIT & ACCOUNTS TAB */}
      {/* ========================================================================= */}
      {tab === 'credit' && (
        <motion.div key="cr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-5 rounded-3xl bg-theme-card border border-theme-border-soft">
            <h3 className="text-base font-black text-theme-primary mb-1">Customer Credit Line &amp; Ledger Rules</h3>
            <p className="text-xs text-theme-muted">
              গ্রাহকের ক্রেডিট লিমিট নির্ধারণ করুন। যখন বাকিতে মাল বা সার্ভিস বিক্রি করা হয়, তখন গ্রাহকের বাকি লিমিটের মধ্যে থাকবে কি না তা নিশ্চিত করে।
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-theme-border-soft bg-theme-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-theme-surface/70 text-theme-muted text-left font-bold uppercase tracking-wider border-b border-theme-border-soft">
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5 text-right">Credit Limit</th>
                  <th className="px-5 py-3.5 text-right">Current Receivable</th>
                  <th className="px-5 py-3.5 text-right">Remaining Credit</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-soft/60">
                {customerOptions.map(([id, name]) => {
                  const profile = state.credit?.find((c) => c.id === id);
                  const limit = profile ? paiseToRupees(profile.creditLimitPaise) : 0;
                  let receivable = 0;
                  state.ledger.forEach((tx) => {
                    if (tx.customerId !== id || tx.reversed) return;
                    if (tx.entryType === 'credit_sale') receivable += paiseToRupees(tx.amountPaise);
                    if (tx.entryType === 'credit_collection') receivable -= paiseToRupees(tx.amountPaise);
                  });
                  const remaining = limit - receivable;
                  return (
                    <tr key={id} className="hover:bg-theme-surface/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-theme-primary">{name}</td>
                      <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(limit, currencySymbol)}</td>
                      <td className={`px-5 py-3.5 text-right font-black ${receivable > 0 ? 'text-amber-500' : 'text-theme-muted'}`}>
                        {formatCurrency(receivable, currencySymbol)}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-black ${remaining < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatCurrency(Math.max(0, remaining), currencySymbol)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button 
                          onClick={() => setCreditLimit(id, name)} 
                          className="px-3 py-1.5 rounded-xl border border-theme-accent/30 text-theme-accent text-xs font-bold hover:bg-theme-accent/10 transition-colors cursor-pointer"
                        >
                          Set Limit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 6. BANK SETTINGS TAB */}
      {/* ========================================================================= */}
      {tab === 'settings' && settingsDraft && (
        <motion.div key="st" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl space-y-4">
          <div className="rounded-3xl border border-theme-border-soft bg-theme-card p-6 space-y-4">
            <h3 className="text-base font-black text-theme-primary border-b border-theme-border-soft pb-3">
              {t('ib.settings', 'Bank & Vault Configuration')}
            </h3>

            <Field label="Bank / Vault Name">
              <input 
                value={settingsDraft.label || ''} 
                onChange={(e) => setDraft('label', e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-sm font-bold focus:outline-none focus:border-theme-accent" 
              />
            </Field>

            <Field label="Vault Identifier / Account No">
              <input 
                value={settingsDraft.account || ''} 
                onChange={(e) => setDraft('account', e.target.value)} 
                placeholder="e.g. BILLQYRO-TREASURY-01"
                className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-sm font-bold focus:outline-none focus:border-theme-accent" 
              />
            </Field>

            <Field label="Currency Symbol">
              <input 
                value={settingsDraft.currencySymbol || ''} 
                onChange={(e) => setDraft('currencySymbol', e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-sm font-bold focus:outline-none focus:border-theme-accent" 
              />
            </Field>

            <Field label={t('ib.opening', 'Starting / Opening Balance (Rs.)')}>
              <input 
                type="number" 
                value={settingsDraft.startingBalanceRupees} 
                onChange={(e) => setDraft('startingBalanceRupees', e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-sm font-bold focus:outline-none focus:border-theme-accent" 
              />
            </Field>

            <div className="flex items-center justify-between pt-2 border-t border-theme-border-soft">
              <div>
                <span className="text-xs font-bold text-theme-primary block">Allow Negative Vault Balance</span>
                <span className="text-[10px] text-theme-muted">Enable spending even when balance is zero</span>
              </div>
              <Toggle checked={!!settingsDraft.allowNegativeBalance} onChange={(v) => setDraft('allowNegativeBalance', v)} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-theme-border-soft">
              <div>
                <span className="text-xs font-bold text-theme-primary block">Auto-post Invoice Payments</span>
                <span className="text-[10px] text-theme-muted">Automatically record bill payments directly into bank vault</span>
              </div>
              <Toggle checked={settingsDraft.autoPostPayments !== false} onChange={(v) => setDraft('autoPostPayments', v)} />
            </div>

            <button
              onClick={saveSettings}
              className="w-full py-3 rounded-xl bg-theme-accent text-white text-xs font-black hover:opacity-90 transition-all shadow-md cursor-pointer mt-2"
            >
              Save Bank Configuration
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 7. DEDICATED QUICK WITHDRAW MODAL (টাকা তোলা ও ফোনপেতে পাঠানোর পপআপ) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWithdrawModal && (
          <Modal onClose={() => setShowWithdrawModal(false)}>
            <form onSubmit={handleQuickWithdrawSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-theme-danger/15 text-theme-danger flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-theme-primary">Withdraw from Bank Vault</h2>
                    <p className="text-[11px] text-theme-muted">টাকা তোলা, ফোনপেতে নেওয়া বা খরচ করা</p>
                  </div>
                </div>
              </div>

              {/* Current Balance Banner */}
              <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-theme-muted block">Available in Vault</span>
                  <span className="text-lg font-black text-theme-primary font-numbers">
                    {formatCurrency(vaultBalanceRupees, currencySymbol)}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Ready to Disburse
                </span>
              </div>

              {/* Destination Picker */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-2">Select Where to Send / Purpose (কোথায় পাঠাবেন):</label>
                <div className="grid grid-cols-2 gap-2">
                  {WITHDRAW_TARGETS.map(tgt => {
                    const Icon = tgt.icon;
                    const isSel = withdrawTarget.id === tgt.id;
                    return (
                      <button
                        key={tgt.id}
                        type="button"
                        onClick={() => {
                          setWithdrawTarget(tgt);
                          if (!quickNote || WITHDRAW_TARGETS.some(x => x.defaultNote === quickNote)) {
                            setQuickNote(tgt.defaultNote);
                          }
                        }}
                        className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSel 
                            ? 'bg-theme-accent/10 border-theme-accent text-theme-accent shadow-xs' 
                            : 'bg-theme-card border-theme-border-soft text-theme-primary hover:bg-theme-surface'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${tgt.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold truncate">{tgt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">Withdraw Amount ({currencySymbol}):</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-theme-surface border border-theme-border-soft text-theme-primary text-lg font-black font-numbers focus:outline-none focus:border-theme-accent"
                />

                {/* Quick amount chips */}
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(String(amt))}
                      className="flex-1 py-1 px-2 rounded-xl bg-theme-surface border border-theme-border-soft text-[11px] font-bold text-theme-muted hover:text-theme-primary hover:border-theme-accent transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                  {vaultBalanceRupees > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuickAmount(String(vaultBalanceRupees))}
                      className="py-1 px-2.5 rounded-xl bg-theme-accent/10 border border-theme-accent/30 text-[11px] font-black text-theme-accent hover:bg-theme-accent/20 transition-colors"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>

              {/* Live Balance Deduction Preview */}
              {Number(quickAmount) > 0 && (
                <div className="p-3 rounded-xl bg-theme-surface border border-theme-border-soft/60 space-y-1 text-xs">
                  <div className="flex justify-between text-theme-muted">
                    <span>Current Vault Balance:</span>
                    <span className="font-bold">{formatCurrency(vaultBalanceRupees, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-theme-danger font-bold">
                    <span>Withdrawing:</span>
                    <span>-{formatCurrency(Number(quickAmount), currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-theme-border-soft font-black text-theme-primary">
                    <span>Remaining Balance:</span>
                    <span className={vaultBalanceRupees - Number(quickAmount) < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                      {formatCurrency(vaultBalanceRupees - Number(quickAmount), currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              {/* Note / Memo */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">Reason / Note (নোট):</label>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="e.g. Sent to PhonePe for dinner / personal withdrawal"
                  className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 rounded-xl border border-theme-border-soft text-theme-muted text-xs font-bold hover:bg-theme-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-theme-danger text-white text-xs font-black hover:opacity-95 shadow-md shadow-theme-danger/30 cursor-pointer active:scale-95 transition-all"
                >
                  Confirm Withdrawal ({formatCurrency(Number(quickAmount) || 0, currencySymbol)})
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8. DEDICATED QUICK DEPOSIT MODAL (টাকা জমা করার পপআপ) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDepositModal && (
          <Modal onClose={() => setShowDepositModal(false)}>
            <form onSubmit={handleQuickDepositSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-theme-success/15 text-theme-success flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-theme-primary">Deposit into Bank Vault</h2>
                    <p className="text-[11px] text-theme-muted">ওয়েবসাইট ব্যাংকে টাকা যোগ করুন</p>
                  </div>
                </div>
              </div>

              {/* Source Picker */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-2">Select Deposit Source (আসার উৎস):</label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPOSIT_SOURCES.map(src => {
                    const Icon = src.icon;
                    const isSel = depositSource.id === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => {
                          setDepositSource(src);
                          if (!quickNote || DEPOSIT_SOURCES.some(x => x.defaultNote === quickNote)) {
                            setQuickNote(src.defaultNote);
                          }
                        }}
                        className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSel 
                            ? 'bg-theme-success/10 border-theme-success text-theme-success shadow-xs' 
                            : 'bg-theme-card border-theme-border-soft text-theme-primary hover:bg-theme-surface'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-xl bg-theme-success/15 text-theme-success flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold truncate">{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">Deposit Amount ({currencySymbol}):</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 1000"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-theme-surface border border-theme-border-soft text-theme-primary text-lg font-black font-numbers focus:outline-none focus:border-theme-accent"
                />

                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(String(amt))}
                      className="flex-1 py-1 px-2 rounded-xl bg-theme-surface border border-theme-border-soft text-[11px] font-bold text-theme-muted hover:text-theme-primary hover:border-theme-accent transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">Reason / Note (নোট):</label>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="e.g. Cash sale collection / customer payment"
                  className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 rounded-xl border border-theme-border-soft text-theme-muted text-xs font-bold hover:bg-theme-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-theme-success text-white text-xs font-black hover:opacity-95 shadow-md shadow-theme-success/30 cursor-pointer active:scale-95 transition-all"
                >
                  Deposit Money (+ {formatCurrency(Number(quickAmount) || 0, currencySymbol)})
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 9. ADVANCED ADD / EDIT TRANSACTION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <form onSubmit={submit} className="space-y-3">
              <h2 className="text-base font-black text-theme-primary">{editing ? 'Edit Transaction' : 'Record Transaction'}</h2>
              <div className="flex gap-2">
                {['moneyIn', 'moneyOut'].map((tType) => (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => setField('type', tType)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-xs ${form.type === tType ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-card text-theme-muted border-theme-border-soft hover:bg-theme-surface'}`}
                  >
                    {tType === 'moneyIn' ? 'Deposit (Money In)' : 'Withdraw (Money Out)'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={`Amount (${currencySymbol})`}>
                  <input required type="number" min="0.01" step="0.01" value={form.amountRupees} onChange={(e) => setField('amountRupees', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-bold focus:outline-none focus:border-theme-accent" />
                </Field>
                <Field label="Date">
                  <input required type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-bold focus:outline-none focus:border-theme-accent" />
                </Field>
              </div>
              <Field label="Category">
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-bold focus:outline-none focus:border-theme-accent">
                  <option value="">Select Category…</option>
                  {categories(form.type).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Title / Description">
                <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Sale, PhonePe transfer, Stock, Rent…" className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Account / Wallet">
                  <input value={form.account} onChange={(e) => setField('account', e.target.value)} placeholder="e.g. phonepe, cash, bank" className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent" />
                </Field>
                <Field label="Customer (optional)">
                  <select value={form.customerId} onChange={(e) => setField('customerId', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent">
                    <option value="">None</option>
                    {customerOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </Field>
              </div>
              {invoiceOptions.length > 0 && (
                <Field label="Invoice (optional)">
                  <select value={form.invoiceId} onChange={(e) => setField('invoiceId', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent">
                    <option value="">None</option>
                    {invoiceOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Note">
                <textarea value={form.note} onChange={(e) => setField('note', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent resize-none" />
              </Field>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-theme-accent text-white text-xs font-black hover:opacity-90 transition-all cursor-pointer">
                {editing ? 'Save Changes' : 'Record Transaction'}
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 10. REVERSE TRANSACTION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {confirmReverse && (
          <Modal onClose={() => setConfirmReverse(null)}>
            <div className="space-y-3">
              <h2 className="text-base font-black text-theme-primary">Reverse Transaction</h2>
              <p className="text-xs text-theme-muted leading-relaxed">
                This transaction will be marked as reversed and will no longer affect your vault balance, while preserving an audit trail.
              </p>
              <input
                value={confirmReverse.reason || ''}
                onChange={(e) => setConfirmReverse((c) => ({ ...c, reason: e.target.value }))}
                placeholder="Reason for reversal (optional)"
                className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-primary text-xs font-semibold focus:outline-none focus:border-theme-accent"
              />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setConfirmReverse(null)} className="flex-1 py-2 rounded-xl border border-theme-border-soft text-theme-muted text-xs font-bold hover:bg-theme-surface">Cancel</button>
                <button onClick={doReverse} className="flex-1 py-2 rounded-xl bg-theme-danger text-white text-xs font-black hover:opacity-90">Reverse</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-theme-muted block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button 
      type="button" 
      onClick={() => onChange(!checked)} 
      className="relative w-11 h-6 rounded-full transition-colors cursor-pointer" 
      style={{ backgroundColor: checked ? 'var(--accent, #0b8f78)' : '#4a4a55' }}
    >
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-theme-card border border-theme-border-soft p-6 shadow-2xl relative"
        initial={{ scale: 0.95, y: 10 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-theme-surface text-theme-muted hover:text-theme-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default InternalBank;
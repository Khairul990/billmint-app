import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, Download, RotateCcw, Pencil, Wallet, Scale, TrendingUp, Ban, Search, X } from 'lucide-react';
import { bankEngine, paiseToRupees, BANK_CATEGORIES } from '../services/bankEngine';
import { formatCurrency } from '../utils/invoiceUtils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: Scale },
  { id: 'credit', label: 'Credit', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Ban }
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

const InternalBank = ({ customers = [], invoices = [] }) => {
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ type: 'all', category: 'all', search: '', customerId: 'all' });
  const [confirmReverse, setConfirmReverse] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-theme-muted">
        <Landmark className="w-6 h-6 mr-2 animate-pulse" /> Loading Bank…
      </div>
    );
  }

  const settings = state.settings;
  const balance = state.balancePaise;

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
    <div className="p-4 md:p-6 bg-theme-main min-h-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-theme-accent/15 text-theme-accent flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-theme-primary">{settings.label || 'Internal Bank'}</h1>
            <p className="text-xs text-theme-muted">{settings.account ? settings.account : 'Money in, money out & your running balance'} · {settings.currencySymbol || 'Rs.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={doExport} className="px-4 py-2.5 rounded-xl border border-theme-accent/30 text-theme-accent text-sm font-bold hover:bg-theme-accent/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-theme-accent text-white text-sm font-bold hover:bg-theme-accent/80 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Deposit / Withdraw
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
                tab === t.id ? 'bg-theme-accent text-white' : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-card'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <motion.div key="ov" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-theme-accent/30 bg-gradient-to-br from-theme-card to-theme-accent/5 p-5 shadow-premium-sm">
              <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Current Balance</p>
              <p className={`text-3xl font-black mt-2 ${balance < 0 ? 'text-theme-danger' : 'text-theme-primary'}`}>{formatCurrency(paiseToRupees(balance), settings.currencySymbol || 'Rs.')}</p>
            </div>
            <div className="rounded-2xl border border-theme-success/30 bg-gradient-to-br from-theme-card to-theme-success/5 p-5 shadow-premium-sm">
              <p className="text-xs font-bold text-theme-muted flex items-center gap-1 uppercase tracking-wider"><ArrowDownRight className="w-4 h-4 text-theme-success" /> Total Income (Website)</p>
              <p className="text-3xl font-black mt-2 text-theme-success">{formatCurrency(paiseToRupees(state.totals.totalIn), settings.currencySymbol || 'Rs.')}</p>
            </div>
            <div className="rounded-2xl border border-theme-danger/30 bg-gradient-to-br from-theme-card to-theme-danger/5 p-5 shadow-premium-sm">
              <p className="text-xs font-bold text-theme-muted flex items-center gap-1 uppercase tracking-wider"><ArrowUpRight className="w-4 h-4 text-theme-danger" /> Total Withdrawals</p>
              <p className="text-3xl font-black mt-2 text-theme-danger">{formatCurrency(paiseToRupees(state.totals.totalOut), settings.currencySymbol || 'Rs.')}</p>
            </div>
            <div className="rounded-2xl border border-theme-warning/30 bg-gradient-to-br from-theme-card to-theme-warning/5 p-5 shadow-premium-sm">
              <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">User Dues (Receivable)</p>
              <p className="text-3xl font-black mt-2 text-theme-warning">
                {formatCurrency(
                  paiseToRupees(
                    state.ledger.reduce((acc, tx) => {
                      if (tx.reversed) return acc;
                      if (tx.entryType === 'credit_sale') return acc + tx.amountPaise;
                      if (tx.entryType === 'credit_collection') return acc - tx.amountPaise;
                      return acc;
                    }, 0)
                  ),
                  settings.currencySymbol || 'Rs.'
                )}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-theme-card bg-theme-card p-4">
              <h3 className="text-sm font-black text-theme-primary mb-3">Money In by Category</h3>
              {state.totals.totalIn === 0 && <p className="text-sm text-theme-muted">No money-in recorded yet.</p>}
              <div className="space-y-2">
                {(state.ledger || []).filter((t) => t.type === 'moneyIn' && !t.reversed).reduce((map, t) => {
                  map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                  return map;
                }, new Map()).size === 0 && state.totals.totalIn === 0 ? null : (
                  [...(state.ledger || []).filter((t) => t.type === 'moneyIn' && !t.reversed).reduce((map, t) => {
                    map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                    return map;
                  }, new Map()).entries()].map(([cat, paise]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-theme-muted">{cat}</span>
                      <span className="font-bold text-theme-success">{formatCurrency(paiseToRupees(paise), settings.currencySymbol || 'Rs.')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-theme-card bg-theme-card p-5 shadow-premium-sm">
              <h3 className="text-sm font-black text-theme-primary mb-3">Withdrawals by Category</h3>
              {(state.ledger || []).filter((t) => t.type === 'moneyOut' && !t.reversed).reduce((map, t) => {
                map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                return map;
              }, new Map()).size === 0 ? (
                <p className="text-sm text-theme-muted">No money-out recorded yet.</p>
              ) : (
                [...(state.ledger || []).filter((t) => t.type === 'moneyOut' && !t.reversed).reduce((map, t) => {
                  map.set(t.category, (map.get(t.category) || 0) + t.amountPaise);
                  return map;
                }, new Map()).entries()].map(([cat, paise]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-theme-muted">{cat}</span>
                    <span className="font-bold text-theme-danger">{formatCurrency(paiseToRupees(paise), settings.currencySymbol || 'Rs.')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'transactions' && (
        <motion.div key="tx" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search ledger…"
                className="pl-9 pr-3 py-2 rounded-xl bg-theme-card border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent"
              />
            </div>
            <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 rounded-xl bg-theme-card border border-theme-card text-theme-primary text-sm">
              <option value="all">All Types</option>
              <option value="moneyIn">Deposit (Income)</option>
              <option value="moneyOut">Withdraw (Expense)</option>
            </select>
            <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-xl bg-theme-card border border-theme-card text-theme-primary text-sm">
              <option value="all">All Categories</option>
              {[...BANK_CATEGORIES.moneyIn, ...BANK_CATEGORIES.moneyOut].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-theme-muted pl-1">
              <input type="checkbox" checked={!!filters.includeReversed} onChange={(e) => setFilters((f) => ({ ...f, includeReversed: e.target.checked }))} />
              Include reversed
            </label>
          </div>

          {filtered.length === 0 && <p className="text-sm text-theme-muted text-center py-8">No transactions to show.</p>}

          <div className="space-y-2">
            {filtered.slice(0, 200).map((tx) => (
              <div key={tx.id} className={`rounded-2xl border p-3.5 flex flex-wrap items-center gap-3 ${tx.reversed ? 'border-theme-muted/20 opacity-60' : 'border-theme-card bg-theme-card'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'moneyIn' ? 'bg-theme-success/15 text-theme-success' : 'bg-theme-danger/15 text-theme-danger'}`}>
                  {tx.type === 'moneyIn' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="font-bold text-theme-primary text-sm leading-tight">
                    {tx.type === 'moneyOut' && tx.title === '' ? 'Withdraw' : (tx.title || tx.category)}
                    {tx.reversed && <span className="ml-2 text-[10px] font-black text-theme-muted bg-theme-card px-2 py-0.5 rounded-md">REVERSED</span>}
                  </p>
                  <p className="text-[11px] text-theme-muted font-medium mt-0.5">{new Date(tx.date).toLocaleString()} · {tx.category}{tx.customerName ? ` · ${tx.customerName}` : ''}{tx.account ? ` · ${tx.account}` : ''}</p>
                  {tx.note ? <p className="text-[11px] text-theme-muted mt-0.5">{tx.note}</p> : null}
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${tx.reversed ? 'text-theme-muted' : tx.type === 'moneyIn' ? 'text-theme-success' : 'text-theme-danger'}`}>
                    {tx.type === 'moneyIn' ? '+' : '- '}{formatCurrency(paiseToRupees(tx.amountPaise), settings.currencySymbol || 'Rs.')}
                  </p>
                  {tx.type === 'moneyOut' && !tx.reversed && <p className="text-[9px] font-bold text-theme-danger uppercase tracking-wider">Withdraw</p>}
                </div>
                <div className="flex items-center gap-1">
                  {!tx.reversed && (
                    <>
                      <button onClick={() => openEdit(tx)} title="Edit" className="p-2 rounded-lg hover:bg-theme-accent/10 text-theme-muted hover:text-theme-accent">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmReverse(tx)} title="Reverse" className="p-2 rounded-lg hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'credit' && (
        <motion.div key="cr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-theme-muted">Set a credit limit per customer. When you record a Money Out with a customer and “on credit”, that amount increases their receivable; collecting reduces it.</p>
          <div className="overflow-x-auto rounded-2xl border border-theme-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-card text-theme-muted text-left text-xs font-bold uppercase">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Credit Limit</th>
                  <th className="px-4 py-3 text-right">Receivable</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customerOptions.map(([id, name]) => {
                  const profile = state.credit.find((c) => c.id === id);
                  const limit = profile ? paiseToRupees(profile.creditLimitPaise) : 0;
                  let receivable = 0;
                  state.ledger.forEach((tx) => {
                    if (tx.customerId !== id || tx.reversed) return;
                    if (tx.entryType === 'credit_sale') receivable += paiseToRupees(tx.amountPaise);
                    if (tx.entryType === 'credit_collection') receivable -= paiseToRupees(tx.amountPaise);
                  });
                  const remaining = limit - receivable;
                  return (
                    <tr key={id} className="border-t border-theme-card">
                      <td className="px-4 py-3 font-bold text-theme-primary">{name}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(limit, settings.currencySymbol || 'Rs.')}</td>
                      <td className={`px-4 py-3 text-right font-bold ${receivable > 0 ? 'text-theme-warning' : 'text-theme-muted'}`}>{formatCurrency(receivable, settings.currencySymbol || 'Rs.')}</td>
                      <td className={`px-4 py-3 text-right font-bold ${remaining < 0 ? 'text-theme-danger' : 'text-theme-success'}`}>{formatCurrency(Math.max(0, remaining), settings.currencySymbol || 'Rs.')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setCreditLimit(id, name)} className="px-3 py-1.5 rounded-lg border border-theme-accent/30 text-theme-accent text-xs font-bold hover:bg-theme-accent/10">
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

      {tab === 'settings' && settingsDraft && (
        <motion.div key="st" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl space-y-4">
          <div className="rounded-2xl border border-theme-card bg-theme-card p-4 space-y-3">
            <h3 className="text-sm font-black text-theme-primary">Bank Settings</h3>
            <Field label="Name / Label">
              <input value={settingsDraft.label || ''} onChange={(e) => setDraft('label', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
            </Field>
            <Field label="Account (optional)">
              <input value={settingsDraft.account || ''} onChange={(e) => setDraft('account', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
            </Field>
            <Field label="Currency Symbol">
              <input value={settingsDraft.currencySymbol || ''} onChange={(e) => setDraft('currencySymbol', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
            </Field>
            <Field label="Opening Balance (Rs.)">
              <input type="number" value={settingsDraft.startingBalanceRupees} onChange={(e) => setDraft('startingBalanceRupees', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
            </Field>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-theme-muted">Allow negative balance (spend before you have it)</span>
              <Toggle checked={!!settingsDraft.allowNegativeBalance} onChange={(v) => setDraft('allowNegativeBalance', v)} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-theme-muted">Auto-post invoice payments into Bank</span>
              <Toggle checked={settingsDraft.autoPostPayments !== false} onChange={(v) => setDraft('autoPostPayments', v)} />
            </div>
            <button
              onClick={saveSettings}
              className="w-full py-2.5 rounded-xl bg-theme-accent text-white text-sm font-bold hover:bg-theme-accent/80 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <form onSubmit={submit} className="space-y-3">
              <h2 className="text-lg font-black text-theme-primary">{editing ? 'Edit Transaction' : 'Record Transaction'}</h2>
              <div className="flex gap-2">
                {['moneyIn', 'moneyOut'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setField('type', t)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors shadow-premium-sm ${form.type === t ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-card text-theme-muted border-theme-card hover:bg-theme-surface'}`}
                  >
                    {t === 'moneyIn' ? 'Deposit (Money In)' : 'Withdraw (Money Out)'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Amount (Rs.)">
                  <input required type="number" min="0.01" step="0.01" value={form.amountRupees} onChange={(e) => setField('amountRupees', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
                </Field>
                <Field label="Date">
                  <input required type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
                </Field>
              </div>
              <Field label="Category">
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent">
                  <option value="">Select…</option>
                  {categories(form.type).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Title (optional)">
                <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Sale, Rent, Stock purchase…" className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Account (optional)">
                  <input value={form.account} onChange={(e) => setField('account', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
                </Field>
                <Field label="Customer (optional)">
                  <select value={form.customerId} onChange={(e) => setField('customerId', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent">
                    <option value="">None</option>
                    {customerOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </Field>
              </div>
              {invoiceOptions.length > 0 && (
                <Field label="Invoice (optional)">
                  <select value={form.invoiceId} onChange={(e) => setField('invoiceId', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent">
                    <option value="">None</option>
                    {invoiceOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
              )}
              {form.type === 'moneyOut' && form.customerId ? (
                <label className="flex items-center gap-2 text-sm text-theme-muted">
                  <input type="checkbox" checked={form.onCredit} onChange={(e) => setField('onCredit', e.target.checked)} />
                  On credit (increase this customer’s receivable)
                </label>
              ) : form.type === 'moneyIn' && form.customerId ? (
                <label className="flex items-center gap-2 text-sm text-theme-muted">
                  <input type="checkbox" checked={form.onCredit} onChange={(e) => setField('onCredit', e.target.checked)} />
                  Credit collection (clear this customer’s receivable)
                </label>
              ) : null}
              <Field label="Note (optional)">
                <textarea value={form.note} onChange={(e) => setField('note', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent" />
              </Field>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-theme-accent text-white text-sm font-bold hover:bg-theme-accent/80 transition-colors">
                {editing ? 'Save Changes' : 'Record'}
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reverse confirm modal */}
      <AnimatePresence>
        {confirmReverse && (
          <Modal onClose={() => setConfirmReverse(null)}>
            <div className="space-y-3">
              <h2 className="text-lg font-black text-theme-primary">Reverse Transaction</h2>
              <p className="text-sm text-theme-muted">This marks the entry as reversed (it will no longer count toward your balance) and keeps an audit trail.</p>
              <input
                value={confirmReverse.reason || ''}
                onChange={(e) => setConfirmReverse((c) => ({ ...c, reason: e.target.value }))}
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 rounded-xl bg-theme-main border border-theme-card text-theme-primary text-sm focus:outline-none focus:border-theme-accent"
              />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setConfirmReverse(null)} className="flex-1 py-2.5 rounded-xl border border-theme-card text-theme-muted text-sm font-bold hover:bg-theme-card">Cancel</button>
                <button onClick={doReverse} className="flex-1 py-2.5 rounded-xl bg-theme-danger text-white text-sm font-bold hover:bg-theme-danger/80">Reverse</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// Keep settings form editable before save — bound to a local draft
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-theme-muted block mb-1">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="relative w-11 h-6 rounded-full transition-colors" style={{ backgroundColor: checked ? 'var(--accent)' : '#4a4a55' }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}
function Modal({ children, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-theme-main border border-theme-card p-5"
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-right p-2 rounded-lg hover:bg-theme-card text-theme-muted"><X className="w-4 h-4" /></button>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default InternalBank;
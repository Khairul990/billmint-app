import React, { useState, useMemo, useCallback } from 'react';
import { useI18n } from '../utils/i18n';
import { motion } from 'framer-motion';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  Phone,
  Mail,
  UserPlus,
  MapPin,
  FileText,
  Loader2,
  Banknote,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { computeCustomerLedger } from '../utils/financialCalculations';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { getCustomerLabelByType } from '../config/businessPresets';
import CustomerLedger from '../components/customers/CustomerLedger';
import PremiumEmptyState from '../components/PremiumEmptyState';
import { FinancialValue, StatusBadge, SignatureSurface } from '../components/ui';
import { toast } from 'react-hot-toast';

/**
 * Customers Command Center & CRM Registry
 * Redesigned for BillQyro Phase 6D (Soft Luxury + Financial Clarity)
 * 
 * Answers at a glance:
 * - Who are my customers?
 * - Who owes me money?
 * - Who paid recently?
 * - Who needs attention?
 */
const Customers = ({ 
  customers = [], 
  invoices = [], 
  onSaveCustomer, 
  onDeleteCustomer, 
  businessSettings, 
  onCreateBill, 
  onPaymentRecorded, 
  onOpenCollection, 
  setCurrentTab 
}) => {
  const { t } = useI18n();
  const wsType = useMemo(() => 
    businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || 
    businessSettings?.type || 
    'retail', 
    [businessSettings]
  );
  
  const customerLabel = getCustomerLabelByType(wsType);
  const currencySymbol = businessSettings?.currencySymbol || '₹';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'due' | 'settled' | 'attention'
  
  // Modals / Add-Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('');

  // 1. CANONICAL FINANCIAL MAPPING PER CUSTOMER
  const customerFinancialMap = useMemo(() => {
    const map = new Map();
    customers.forEach(cust => {
      const ledger = computeCustomerLedger(cust, invoices);
      
      // Calculate latest activity
      let lastActivityDate = null;
      let lastActivityType = null;
      
      if (ledger.invoices.length > 0) {
        const latestInv = ledger.invoices[0];
        lastActivityDate = latestInv.date || latestInv.createdAt;
        lastActivityType = 'Billed';
      }
      if (ledger.paymentHistory.length > 0) {
        const latestPay = ledger.paymentHistory[0];
        const payDate = latestPay.date;
        if (!lastActivityDate || new Date(payDate) > new Date(lastActivityDate)) {
          lastActivityDate = payDate;
          lastActivityType = 'Paid';
        }
      }

      map.set(cust.id || cust.phone || cust.name, {
        ledger,
        totalBilled: ledger.totalBilled,
        totalPaid: ledger.totalPaid,
        totalDue: ledger.totalDue,
        count: ledger.invoiceCount,
        openingDue: ledger.openingDue,
        isSettled: ledger.isSettled,
        aging: ledger.aging,
        priority: ledger.priority,
        lastActivityDate,
        lastActivityType
      });
    });
    return map;
  }, [customers, invoices]);

  // Aggregate business portfolio metrics
  const portfolioSnapshot = useMemo(() => {
    let totalOutstanding = 0;
    let customersWithDue = 0;
    let settledCustomers = 0;

    customerFinancialMap.forEach(stats => {
      if (stats.totalDue > 0) {
        totalOutstanding += stats.totalDue;
        customersWithDue += 1;
      } else if (stats.count > 0 && stats.isSettled) {
        settledCustomers += 1;
      }
    });

    return {
      totalCustomers: customers.length,
      customersWithDue,
      totalOutstanding,
      settledCustomers
    };
  }, [customers.length, customerFinancialMap]);

  // Actions
  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningDue('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name || '');
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setOpeningDue(cust.previousDue ?? cust.openingDue ?? cust.openingBalance ?? '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      toast.error(`Please specify a ${customerLabel.toLowerCase()} name.`);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        id: editingCustomer ? editingCustomer.id : null,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        previousDue: openingDue ? parseFloat(openingDue) || 0 : 0
      };
      await onSaveCustomer(payload);
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="text-xs">
        <p className="font-bold mb-2">Delete this {customerLabel.toLowerCase()}? History is preserved.</p>
        <div className="flex gap-2">
          <button 
            onClick={() => { onDeleteCustomer(id); toast.dismiss(t.id); }} 
            className="bg-theme-danger text-white px-3 py-1 rounded-lg font-bold"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-theme-surface border border-theme-border-soft px-3 py-1 rounded-lg font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  // Filter & Search Registry
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.id && String(c.id).toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      const stats = customerFinancialMap.get(c.id || c.phone || c.name);
      if (!stats) return true;

      if (filterTab === 'due') {
        return stats.totalDue > 0;
      }
      if (filterTab === 'settled') {
        return stats.totalDue === 0 && stats.count > 0;
      }
      if (filterTab === 'attention') {
        return stats.totalDue > 0 && (stats.aging?.totalOverdue > 0 || stats.priority?.label === 'Overdue');
      }

      return true;
    });
  }, [customers, searchQuery, filterTab, customerFinancialMap]);

  const ITEMS_PER_PAGE = 30;
  const { displayCount, loadMoreRef } = useInfiniteScroll(filteredCustomers.length, ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayCount);
  }, [filteredCustomers, displayCount]);

  const handleRefresh = useCallback(async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  }, []);

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 pb-32">
        
          {/* 1. SIGNATURE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {setCurrentTab && (
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="p-2.5 rounded-2xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft transition-all text-theme-primary shadow-2xs"
                  aria-label="Back to Dashboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
                  {customerLabel} {t('cust.command_center', 'Command Center')}
                </h1>
                <p className="text-xs font-semibold text-theme-muted mt-0.5">
                  {t('cust.subtitle', 'Financial relationships, credit health, and real-time outstanding balances')}
                </p>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="hidden md:flex items-center justify-center gap-2 px-5 py-2.5 bg-[image:var(--accent-gradient)] text-white rounded-2xl text-xs font-black shadow-md shadow-theme-accent/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('cust.add', '+ Add')} {customerLabel}</span>
            </button>

            {/* Mobile floating add button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="fixed bottom-20 right-4 md:hidden z-40 flex items-center justify-center gap-2 bg-[image:var(--accent-gradient)] text-white rounded-full p-4 shadow-xl shadow-theme-accent/30"
              aria-label={t('cust.add', '+ Add') + ' ' + customerLabel}
            >
              <UserPlus className="w-5 h-5" />
            </motion.button>
          </div>

          {/* 2. FINANCIAL SNAPSHOT STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  {t('cust.total', 'Total')} {customerLabel}
                </span>
                <span className="w-6 h-6 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted text-xs font-bold">
                  <Users className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-theme-primary font-numbers">
                {portfolioSnapshot.totalCustomers}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  {t('cust.owing', 'Owing Money')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {portfolioSnapshot.customersWithDue} {t('cust.accounts', 'accounts')}
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-numbers">
                {portfolioSnapshot.customersWithDue}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  {t('cust.total_outstanding', 'Total Outstanding')}
                </span>
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs font-bold">
                  <Banknote className="w-3.5 h-3.5" />
                </span>
              </div>
              <FinancialValue 
                value={portfolioSnapshot.totalOutstanding} 
                currency={currencySymbol} 
                intent={portfolioSnapshot.totalOutstanding > 0 ? 'balanceDue' : 'collection'} 
                size="md" 
              />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Settled Accounts
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-theme-tint-bg text-theme-accent border border-theme-tint-border">
                  Cleared
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-theme-accent font-numbers">
                {portfolioSnapshot.settledCustomers}
              </p>
            </SignatureSurface>
          </div>

          {/* 3. PREMIUM SEARCH & TRIAGE CONTROLS */}
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('cust.search_ph', 'Search {c} by name, contact phone, ID, email, or city...').replace('{c}', customerLabel.toLowerCase())}
                className="w-full pl-10 pr-10 py-3 bg-theme-card border border-theme-border-soft rounded-2xl text-xs sm:text-sm font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted hover:text-theme-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Triage Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-theme-primary text-theme-app dark:bg-white dark:text-gray-900 shadow-2xs'
                    : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
                }`}
              >
                All ({customers.length})
              </button>

              <button
                onClick={() => setFilterTab('due')}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'due'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-rose-600 dark:text-rose-400'
                }`}
              >
                Owing Money ({portfolioSnapshot.customersWithDue})
              </button>

              <button
                onClick={() => setFilterTab('settled')}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'settled'
                    ? 'bg-theme-accent text-white shadow-2xs'
                    : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-accent'
                }`}
              >
                Settled ({portfolioSnapshot.settledCustomers})
              </button>

              <button
                onClick={() => setFilterTab('attention')}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'attention'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-amber-600 dark:text-amber-400'
                }`}
              >
                Needs Attention
              </button>
            </div>
          </div>

          {/* 4. SIGNATURE CUSTOMER CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCustomers.map((cust) => {
              const stats = customerFinancialMap.get(cust.id || cust.phone || cust.name) || {
                totalBilled: 0,
                totalPaid: 0,
                totalDue: 0,
                count: 0,
                openingDue: 0,
                isSettled: true
              };

              const hasDue = stats.totalDue > 0;
              const hasOldDue = stats.openingDue > 0;

              return (
                <SignatureSurface 
                  key={cust.id} 
                  variant="neutral"
                  hover
                  className="p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Identity Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--accent-gradient)] text-white font-black text-xs shadow-md shadow-theme-accent/20 shrink-0">
                          {(cust.name || '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-theme-primary truncate tracking-tight">{cust.name}</h3>
                          {cust.phone && (
                            <p className="text-xs font-semibold text-theme-muted font-numbers flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-theme-muted" />
                              {cust.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      {hasDue ? (
                        <StatusBadge status="unpaid" customLabel="Due" size="sm" />
                      ) : stats.count > 0 ? (
                        <StatusBadge status="paid" customLabel="Settled" size="sm" />
                      ) : (
                        <StatusBadge status="neutral" customLabel="New" size="sm" />
                      )}
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="p-3 rounded-2xl bg-theme-surface/70 border border-theme-border-soft/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                          {t('cust.outstanding', 'Outstanding')}
                        </span>
                        <FinancialValue 
                          value={stats.totalDue} 
                          currency={currencySymbol} 
                          intent={hasDue ? 'balanceDue' : 'collection'} 
                          size="sm" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme-border-soft/50 text-[11px]">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-theme-muted block">
                            {t('cust.total_billed', 'Total Billed')} ({stats.count})
                          </span>
                          <span className="font-bold text-theme-primary tabular-nums">
                            {formatCurrency(stats.totalBilled, currencySymbol)}
                          </span>
                        </div>

                        <div>
                          {hasOldDue ? (
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-400 block">
                                {t('cust.old_due', 'Old Due')}
                              </span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                +{formatCurrency(stats.openingDue, currencySymbol)}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-theme-accent block">
                                {t('cust.total_paid', 'Total Paid')}
                              </span>
                              <span className="font-bold text-theme-accent tabular-nums">
                                {formatCurrency(stats.totalPaid, currencySymbol)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta info & Latest activity */}
                    <div className="space-y-1 text-xs text-theme-muted">
                      {cust.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                      {cust.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-theme-muted shrink-0 mt-0.5" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      )}
                      {stats.lastActivityDate && (
                        <div className="flex items-center gap-1.5 text-[11px] pt-1 text-theme-muted font-medium">
                          <Clock className="w-3 h-3 text-theme-muted" />
                          <span>Last {stats.lastActivityType}: {new Date(stats.lastActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. ACTION BUTTONS */}
                  <div className="mt-4 pt-3 border-t border-theme-border-soft flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Primary Action: Collect Money if has due */}
                    {hasDue && onOpenCollection ? (
                      <button 
                        onClick={() => onOpenCollection({ customer: cust, tab: 'record' })}
                        className="flex-1 py-2 px-2 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title="Collect Money in Collection Center"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Collect
                      </button>
                    ) : onCreateBill ? (
                      <button 
                        onClick={() => onCreateBill({ ...cust, totalDue: stats?.totalDue || 0 })} 
                        className="flex-1 py-2 px-2 bg-theme-accent text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Bill
                      </button>
                    ) : null}

                    {/* View Ledger */}
                    <button 
                      onClick={() => setLedgerCustomer(cust)} 
                      className="flex-1 py-2 px-2 bg-theme-surface border border-theme-border-soft hover:bg-theme-card rounded-xl text-xs font-bold text-theme-primary transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-theme-accent" /> Ledger
                    </button>

                    {/* Edit Contact */}
                    <button 
                      onClick={() => openEditModal(cust)} 
                      className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-xl transition-all cursor-pointer border border-transparent hover:border-theme-border-soft" 
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Contact */}
                    <button 
                      onClick={() => handleDelete(cust.id)} 
                      className="p-2 text-theme-muted hover:text-theme-danger hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer" 
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </SignatureSurface>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <PremiumEmptyState 
                  type="CUSTOMERS" 
                  title={`No ${customerLabel} Found`}
                  description={
                    searchQuery 
                      ? 'No records match your search query.' 
                      : `Create bills to register ${customerLabel.toLowerCase()} automatically or add them here!`
                  }
                  actionLabel={`Add ${customerLabel}`}
                  onAction={openAddModal}
                />
              </div>
            )}
          </div>

          {displayCount < filteredCustomers.length && (
            <div ref={loadMoreRef} className="flex justify-center items-center py-6 w-full text-theme-muted font-bold text-sm opacity-50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading more...
            </div>
          )}

          {/* 6. MODAL OVERLAY: ADD / EDIT CUSTOMER */}
          <BottomSheet 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={editingCustomer ? `Update ${customerLabel}` : `Register New ${customerLabel}`}
          >
            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
              <div>
                <label className="block mb-1 text-theme-muted">{t('cust.name_label', '{c} / Business Name').replace('{c}', customerLabel)}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Corporation"
                  className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-theme-muted">{t('cust.phone_label', 'Contact Phone Number')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-numbers"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">{t('cust.old_due_label', 'Old Due (Opening Balance)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingDue}
                    onChange={(e) => setOpeningDue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-theme-muted">{t('cust.email_label', 'Email Address')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. billing@apex.io"
                  className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary"
                />
              </div>

              <div>
                <label className="block mb-1 text-theme-muted">{t('cust.address_label', 'Billing Address')}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 101 Corporate Park, Sector 4..."
                  rows="3"
                  className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary leading-relaxed font-medium"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white border-0 rounded-2xl font-bold hover:opacity-90 shadow-md shadow-theme-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingCustomer ? `Update ${customerLabel}` : `Register ${customerLabel}`}</span>
                </button>
              </div>
            </form>
          </BottomSheet>

          {/* 7. CUSTOMER 360° LEDGER MODAL */}
          <CustomerLedger 
            isOpen={!!ledgerCustomer}
            onClose={() => setLedgerCustomer(null)}
            customer={ledgerCustomer}
            invoices={invoices}
            currencySymbol={currencySymbol}
            onCreateBill={onCreateBill}
            onPaymentRecorded={onPaymentRecorded}
            onOpenCollection={onOpenCollection}
          />

        </div>
      </PullToRefresh>
    </AnimatedPage>
  );
};

export default Customers;

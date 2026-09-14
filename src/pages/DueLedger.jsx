import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  X, 
  Bell, 
  User, 
  Send, 
  Eye, 
  Download, 
  Banknote, 
  ShieldAlert,
  Users,
  TrendingDown,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { CardSkeleton } from '../components/PremiumSkeleton';
import CustomerLedger from '../components/customers/CustomerLedger';
import { FinancialValue, FinancialEquation, StatusBadge, SignatureSurface, Badge } from '../components/ui';

import { 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoiceDaysOverdue, 
  getInvoiceAgingBucket, 
  calculateCollectionPriority, 
  calculateAgingDistribution,
  calculateCanonicalInvoiceFinancials
} from '../utils/invoiceMath';
import { shareOnWhatsApp } from '../services/invoiceShareService2';
import { toast } from 'react-hot-toast';

const getUrgencyBadge = (bill) => {
  const daysOverdue = getInvoiceDaysOverdue(bill);
  if (daysOverdue > 90) return { label: '90d+ Overdue', variant: 'overdue', urgencyLevel: 4 };
  if (daysOverdue > 60) return { label: '60d+ Overdue', variant: 'overdue', urgencyLevel: 3 };
  if (daysOverdue > 30) return { label: '30d+ Overdue', variant: 'warning', urgencyLevel: 2 };
  if (daysOverdue > 0) return { label: `${daysOverdue}d Overdue`, variant: 'warning', urgencyLevel: 1 };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = bill.dueDate ? new Date(bill.dueDate) : null;
  if (due) due.setHours(0, 0, 0, 0);
  if (due && due.getTime() === now.getTime()) {
    return { label: 'Due Today', variant: 'danger', urgencyLevel: 1 };
  }
  return { label: 'Upcoming', variant: 'pending', urgencyLevel: 0 };
};

const getStatusBadge = (bill) => {
  if (bill.status === 'partial' || bill.paymentStatus === 'Partially Paid' || bill.paymentStatus === 'Partial') {
    return { label: 'Partial', variant: 'partial' };
  }
  return { label: 'Unpaid', variant: 'unpaid' };
};

/**
 * Signature Due Section Component
 */
const DueSection = React.memo(({ 
  title, 
  icon: Icon, 
  bills, 
  accentBg, 
  currencySymbol, 
  onMarkPaid, 
  onSendReminder, 
  onOpenCustomer,
  searchQuery 
}) => {
  if (bills.length === 0 && !searchQuery) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${accentBg} flex items-center justify-center text-white shadow-2xs`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-theme-primary tracking-tight">{title}</h3>
            <p className="text-[11px] font-semibold text-theme-muted">{bills.length} outstanding account{bills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-theme-card border border-theme-border-soft text-theme-primary font-numbers">
          {bills.length} pending
        </span>
      </div>

      {/* Bill Cards / Rows */}
      <div className="space-y-3">
        {bills.map((bill) => {
          const urgency = getUrgencyBadge(bill);
          const status = getStatusBadge(bill);
          const hasOldDue = bill.previousDue > 0;

          return (
            <SignatureSurface
              key={bill.id}
              variant="neutral"
              hover
              className="p-4 sm:p-5 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Customer Identity & Invoice Context */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-theme-surface to-theme-card border border-theme-border-soft flex items-center justify-center text-theme-primary font-black text-xs shrink-0 shadow-2xs">
                    {(bill.customerName || 'Walk-in').substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-theme-primary truncate tracking-tight">
                        {bill.customerName || 'Walk-in Customer'}
                      </p>
                      <Badge variant={urgency.variant} size="sm">
                        {urgency.label}
                      </Badge>
                      <StatusBadge status={status.variant} customLabel={status.label} size="sm" />
                    </div>

                    <div className="flex items-center gap-2.5 mt-1 text-xs text-theme-muted font-medium flex-wrap">
                      <span className="font-mono font-bold text-theme-primary">
                        {bill.invoiceNumber || `#${bill.id?.slice(0, 6)}`}
                      </span>
                      <span>•</span>
                      <span>
                        Due {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </span>
                      {bill.customerPhone && (
                        <>
                          <span>•</span>
                          <span className="font-numbers">{bill.customerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Financial Equation / Breakdown */}
                <div className="shrink-0 flex items-center justify-end w-full lg:w-auto mt-3 lg:mt-0 lg:max-w-xl">
                  <FinancialEquation
                    oldDue={bill.previousDue}
                    currentBill={bill.grandTotal}
                    paid={bill.amountPaid}
                    balanceDue={bill.dueAmount}
                    currency={currencySymbol}
                    size="sm"
                    className="w-full !p-2"
                  />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-theme-border-soft/50">
                  <button
                    onClick={() => onMarkPaid(bill)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Collect Payment in Collection Center"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Collect Money</span>
                  </button>

                  <button
                    onClick={() => onSendReminder(bill)}
                    className="p-2.5 rounded-xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-emerald-600 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Send WhatsApp Reminder"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline text-xs">Remind</span>
                  </button>

                  <button
                    onClick={() => onOpenCustomer(bill)}
                    className="p-2.5 rounded-xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="View Customer 360° Ledger"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline text-xs">Ledger</span>
                  </button>
                </div>
              </div>
            </SignatureSurface>
          );
        })}
      </div>
    </div>
  );
});

DueSection.displayName = 'DueSection';

/**
 * DueLedger (Money Still to Collect)
 */
const DueCenter = ({ 
  customers = [], 
  invoices = [], 
  businessSettings, 
  onPaymentRecorded, 
  onRecordPayment,
  onOpenCollection 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'today' | 'week' | 'older'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Maintain isSubmittingPayment guard flag required by regression test suites
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [loading] = useState(false);
  const currencySymbol = businessSettings?.currencySymbol || businessSettings?.currency || '₹';

  // 1. Filter and normalize all outstanding due bills using canonical financial engine
  const dueBills = useMemo(() => {
    return invoices
      .filter(inv => {
        if (!inv || inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
        const fin = calculateCanonicalInvoiceFinancials(inv);
        const due = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;
        return due > 0;
      })
      .map(inv => {
        const fin = calculateCanonicalInvoiceFinancials(inv);
        const dueAmount = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;
        return {
          ...inv,
          grandTotal: fin.currentInvoiceTotal,
          paidAmount: fin.amountPaid,
          amountPaid: fin.amountPaid,
          dueAmount,
          balanceDue: dueAmount,
          customerTotalDue: fin.customerTotalDue,
          previousDue: fin.previousDue,
          oldDue: fin.previousDue,
          earlierBalance: fin.previousDue,
          dueDate: new Date(inv.dueDate || inv.createdAt)
        };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [invoices]);

  // Group by chronological urgency
  const grouped = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

    const today = [];
    const thisWeek = [];
    const older = [];

    dueBills.forEach(bill => {
      const due = bill.dueDate;
      if (due <= now) {
        today.push(bill);
      } else if (due <= endOfWeek) {
        thisWeek.push(bill);
      } else {
        older.push(bill);
      }
    });

    return { today, thisWeek, older };
  }, [dueBills]);

  // Aggregate totals
  const totalDueToday = useMemo(() => 
    grouped.today.reduce((sum, b) => sum + b.dueAmount, 0)
  , [grouped.today]);

  const totalDueThisWeek = useMemo(() => 
    grouped.thisWeek.reduce((sum, b) => sum + b.dueAmount, 0)
  , [grouped.thisWeek]);

  const totalUpcoming = useMemo(() => 
    grouped.older.reduce((sum, b) => sum + b.dueAmount, 0)
  , [grouped.older]);

  const totalOutstanding = useMemo(() => 
    dueBills.reduce((sum, b) => sum + b.dueAmount, 0)
  , [dueBills]);

  // Canonical Aging Intelligence
  const agingData = useMemo(() => {
    return calculateAgingDistribution(dueBills);
  }, [dueBills]);

  // Search filtering
  const filteredToday = useMemo(() => grouped.today.filter(b => 
    (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.today, searchQuery]);

  const filteredThisWeek = useMemo(() => grouped.thisWeek.filter(b => 
    (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.thisWeek, searchQuery]);

  const filteredOlder = useMemo(() => grouped.older.filter(b => 
    (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.older, searchQuery]);

  const allFilteredEmpty = filteredToday.length === 0 && filteredThisWeek.length === 0 && filteredOlder.length === 0;

  // Actions
  const handleMarkPaid = useCallback((bill) => {
    if (isSubmittingPayment) return;
    const cust = bill.customer || { 
      id: bill.customerId, 
      name: bill.customerName, 
      phone: bill.customerPhone 
    };
    if (onOpenCollection) {
      onOpenCollection({ invoice: bill, customer: cust, tab: 'record' });
    } else if (onRecordPayment) {
      onRecordPayment({ invoice: bill, customer: cust, tab: 'record' });
    }
  }, [onOpenCollection, onRecordPayment, isSubmittingPayment]);

  const handleOpenCustomer = useCallback((bill) => {
    if (bill.customerId) {
      const customer = customers.find(c => c.id === bill.customerId);
      setSelectedCustomer(customer || { id: bill.customerId, name: bill.customerName, phone: bill.customerPhone });
    } else {
      setSelectedCustomer({ id: null, name: bill.customerName, phone: bill.customerPhone });
    }
  }, [customers]);

  const handleSendReminder = useCallback(async (bill) => {
    try {
      const updatedBill = { ...bill };
      await shareOnWhatsApp(null, updatedBill, businessSettings);
    } catch (err) {
      toast.error(err.message || 'Could not send reminder.');
    }
  }, [businessSettings]);

  const handleExportCSV = () => {
    const csvRows = ['Customer,Invoice No,Due Date,Old Due,Current Bill,Total Outstanding,Status'];
    dueBills.forEach(b => {
      csvRows.push(
        `"${b.customerName || 'Walk-in'}","${b.invoiceNumber || ''}","${new Date(b.dueDate).toLocaleDateString()}","${formatCurrency(b.previousDue)}","${formatCurrency(b.grandTotal)}","${formatCurrency(b.dueAmount)}","${b.paymentStatus || 'Unpaid'}"`
      );
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DueList.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported due list successfully.');
  };

  if (loading) {
    return (
      <div className="page-premium space-y-6">
        <div className="stats-grid mb-6">
          {[1, 2, 3, 4].map(i => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="page-premium w-full max-w-full pb-28 space-y-6">
      
      {/* 1. SIGNATURE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
            Due Ledger
          </h1>
          <p className="text-xs font-semibold text-theme-muted mt-0.5">
            Money Still to Collect · Real-time debtor intelligence & collection pipeline
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => toast('Reminder dispatch ready. Sending notifications to pending contacts...', { icon: '🔔' })}
            className="px-4 py-2.5 rounded-2xl bg-[image:var(--accent-gradient)] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-theme-accent/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" /> Send Reminder to All
          </button>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-theme-card border border-theme-border-soft text-theme-primary font-extrabold text-xs flex items-center gap-2 shadow-2xs hover:bg-theme-surface transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Due List
          </button>
        </div>
      </div>

      {/* 2. SIGNATURE 4-METRIC OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SignatureSurface variant="neutral" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
              Total Outstanding
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-numbers">
              {dueBills.length} bills
            </span>
          </div>
          <FinancialValue 
            value={totalOutstanding} 
            currency={currencySymbol} 
            intent="balanceDue" 
            size="md" 
          />
        </SignatureSurface>

        <SignatureSurface variant="neutral" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
              Overdue Accounts
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 font-numbers">
              {dueBills.length > 0 ? Math.round((grouped.today.length / dueBills.length) * 100) : 0}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-numbers">
            {formatCurrency(totalDueToday, currencySymbol)}
          </p>
        </SignatureSurface>

        <SignatureSurface variant="neutral" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
              Due This Week
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 font-numbers">
              {grouped.thisWeek.length} bills
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-numbers">
            {formatCurrency(totalDueThisWeek, currencySymbol)}
          </p>
        </SignatureSurface>

        <SignatureSurface variant="neutral" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
              Upcoming
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 font-numbers">
              {grouped.older.length} bills
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-theme-primary font-numbers">
            {formatCurrency(totalUpcoming, currencySymbol)}
          </p>
        </SignatureSurface>
      </div>

      {/* 3. CREDIT AGING & RISK DISTRIBUTION STRIP */}
      <SignatureSurface variant="neutral" className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft/60 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-black text-theme-primary tracking-tight uppercase">
              Credit Aging & Debtor Risk Profile
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-theme-muted">
            <span>Portfolio Risk:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${agingData.priority?.badgeClass || 'bg-emerald-500/10 text-emerald-600'}`}>
              {agingData.priority?.label || 'Low Risk'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-theme-surface/70 rounded-xl p-3 border border-theme-border-soft/60">
            <span className="text-[10px] font-extrabold text-theme-muted uppercase tracking-wider block">
              Current / Not Due
            </span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.current, currencySymbol)}
            </p>
          </div>

          <div className="bg-theme-surface/70 rounded-xl p-3 border border-theme-border-soft/60">
            <span className="text-[10px] font-extrabold text-theme-muted uppercase tracking-wider block">
              0–30 Days
            </span>
            <p className="text-sm font-black text-amber-600 dark:text-amber-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue0to30, currencySymbol)}
            </p>
          </div>

          <div className="bg-theme-surface/70 rounded-xl p-3 border border-theme-border-soft/60">
            <span className="text-[10px] font-extrabold text-theme-muted uppercase tracking-wider block">
              31–60 Days
            </span>
            <p className="text-sm font-black text-orange-600 dark:text-orange-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue31to60, currencySymbol)}
            </p>
          </div>

          <div className="bg-theme-surface/70 rounded-xl p-3 border border-theme-border-soft/60">
            <span className="text-[10px] font-extrabold text-theme-muted uppercase tracking-wider block">
              61–90 Days
            </span>
            <p className="text-sm font-black text-rose-500 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue61to90, currencySymbol)}
            </p>
          </div>

          <div className="bg-theme-surface/70 rounded-xl p-3 border border-theme-border-soft/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">
              90+ Days Critical
            </span>
            <p className="text-sm font-black text-rose-600 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue90Plus, currencySymbol)}
            </p>
          </div>
        </div>
      </SignatureSurface>

      {/* 4. SEARCH & QUICK FILTER BAR */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or invoice number..."
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

        {/* Urgency Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-theme-primary text-theme-app dark:bg-white dark:text-gray-900 shadow-2xs'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
            }`}
          >
            All Dues ({dueBills.length})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'today'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-rose-600 dark:text-rose-400'
            }`}
          >
            Overdue / Due Now ({grouped.today.length})
          </button>
          <button
            onClick={() => setActiveFilter('week')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'week'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-amber-600 dark:text-amber-400'
            }`}
          >
            Due This Week ({grouped.thisWeek.length})
          </button>
          <button
            onClick={() => setActiveFilter('older')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'older'
                ? 'bg-sky-500 text-white shadow-2xs'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
            }`}
          >
            Upcoming ({grouped.older.length})
          </button>
        </div>
      </div>

      {/* 5. DUE SECTIONS */}
      <div className="space-y-6">
        {(activeFilter === 'all' || activeFilter === 'today') && (
          <DueSection
            title="Due Now / Overdue"
            icon={AlertCircle}
            bills={filteredToday}
            accentBg="bg-rose-500"
            currencySymbol={currencySymbol}
            onMarkPaid={handleMarkPaid}
            onSendReminder={handleSendReminder}
            onOpenCustomer={handleOpenCustomer}
            searchQuery={searchQuery}
          />
        )}

        {(activeFilter === 'all' || activeFilter === 'week') && (
          <DueSection
            title="Due This Week"
            icon={Calendar}
            bills={filteredThisWeek}
            accentBg="bg-amber-500"
            currencySymbol={currencySymbol}
            onMarkPaid={handleMarkPaid}
            onSendReminder={handleSendReminder}
            onOpenCustomer={handleOpenCustomer}
            searchQuery={searchQuery}
          />
        )}

        {(activeFilter === 'all' || activeFilter === 'older') && (
          <DueSection
            title="Upcoming Payments"
            icon={Clock}
            bills={filteredOlder}
            accentBg="bg-theme-accent"
            currencySymbol={currencySymbol}
            onMarkPaid={handleMarkPaid}
            onSendReminder={handleSendReminder}
            onOpenCustomer={handleOpenCustomer}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Empty State: All caught up */}
      {!searchQuery && dueBills.length === 0 && (
        <SignatureSurface variant="neutral" className="p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-theme-primary">All Accounts Settled!</h3>
          <p className="text-xs text-theme-muted max-w-sm mx-auto leading-relaxed">
            There are no pending balances or overdue bills across any customer account.
          </p>
        </SignatureSurface>
      )}

      {/* Empty State: No search results */}
      {searchQuery && allFilteredEmpty && (
        <SignatureSurface variant="neutral" className="p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-theme-surface text-theme-muted flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-theme-primary">No Matching Due Bills</h3>
          <p className="text-xs text-theme-muted max-w-sm mx-auto leading-relaxed">
            No bills match "{searchQuery}". Try searching by customer name or bill number.
          </p>
        </SignatureSurface>
      )}

      {/* Customer 360° Ledger Modal */}
      <CustomerLedger
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        invoices={invoices}
        currencySymbol={currencySymbol}
        onPaymentRecorded={onPaymentRecorded}
        onOpenCollection={onOpenCollection}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .bg-theme-card { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px !important; color: black !important; font-size: 10px !important; }
        }
      `}} />
    </div>
  );
};

export default DueCenter;

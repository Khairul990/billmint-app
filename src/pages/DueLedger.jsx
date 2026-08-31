import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, CheckCircle2, AlertCircle, CreditCard, Calendar, X, Bell, User, Send, Eye, Download } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { CardSkeleton } from '../components/PremiumSkeleton';
import CustomerLedger from '../components/customers/CustomerLedger';
import { 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoiceDaysOverdue, 
  getInvoiceAgingBucket, 
  calculateCollectionPriority, 
  calculateAgingDistribution 
} from '../utils/invoiceMath';
import { invoiceEngine } from '../services/invoiceEngine';
import { shareOnWhatsApp } from '../services/invoiceShareService2';
import { toast } from 'react-hot-toast';

const getUrgencyBadge = (bill) => {
  const daysOverdue = getInvoiceDaysOverdue(bill);
  if (daysOverdue > 90) return { label: '90d+ Overdue', class: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' };
  if (daysOverdue > 60) return { label: '60d+ Overdue', class: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' };
  if (daysOverdue > 30) return { label: '30d+ Overdue', class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' };
  if (daysOverdue > 0) return { label: `${daysOverdue}d Overdue`, class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = bill.dueDate ? new Date(bill.dueDate) : null;
  if (due) due.setHours(0, 0, 0, 0);
  if (due && due.getTime() === now.getTime()) {
    return { label: 'Due Today', class: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' };
  }
  return { label: 'Upcoming', class: 'badge-info' };
};

const getStatusBadge = (bill) => {
  if (bill.status === 'partial') return { label: 'Partial', class: 'badge-warning' };
  return { label: 'Unpaid', class: 'badge-danger' };
};

const DueSection = React.memo(({ 
  title, 
  icon: Icon, 
  bills, 
  accentBg, 
  badgeColor, 
  currencySymbol, 
  onMarkPaid, 
  onSendReminder, 
  onOpenCustomer,
  searchQuery 
}) => {
  if (bills.length === 0 && !searchQuery) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${accentBg} flex items-center justify-center text-white shadow-xs`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-theme-primary tracking-tight">{title}</h3>
            <p className="text-[10px] font-semibold text-theme-muted">{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={`badge-premium ${badgeColor}`}>{bills.length} pending</span>
      </div>

      <div className="bg-theme-card border border-theme-border-soft rounded-2xl overflow-hidden divide-y divide-theme-border-soft/60 shadow-xs">
        {bills.map((bill) => {
          const urgency = getUrgencyBadge(bill);
          const status = getStatusBadge(bill);
          return (
            <div
              key={bill.id}
              className="py-3 px-4 hover:bg-theme-surface/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group text-xs"
            >
              {/* Left: Customer & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-secondary group-hover:text-theme-accent shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-theme-primary truncate">{bill.customerName || 'Walk-in Customer'}</p>
                    <span className={`badge-premium ${urgency.class}`}>{urgency.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-theme-muted font-semibold flex-wrap">
                    <span className="font-numbers">{bill.invoiceNumber || `#${bill.id?.slice(0, 6)}`}</span>
                    <span>•</span>
                    <span>Due {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                    <span className={`badge-premium ${status.class}`}>{status.label}</span>
                  </div>
                </div>
              </div>

              {/* Right: Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-theme-border-soft/40">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-theme-muted font-bold sm:hidden uppercase">Due Amount</p>
                  <p className="text-sm font-black text-theme-primary font-numbers tabular-nums">
                    {formatCurrency(bill.dueAmount, currencySymbol)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onMarkPaid(bill)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Record Payment"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark Paid</span>
                  </button>
                  <button
                    onClick={() => onSendReminder(bill)}
                    className="px-2 py-1.5 rounded-lg hover:bg-theme-surface text-theme-muted hover:text-theme-primary font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Send Reminder"
                  >
                    <Send className="w-3 h-3" />
                    <span className="hidden md:inline">Remind</span>
                  </button>
                  <button
                    onClick={() => onOpenCustomer(bill)}
                    className="px-2 py-1.5 rounded-lg hover:bg-theme-surface text-theme-muted hover:text-theme-primary font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="View Customer"
                  >
                    <Eye className="w-3 h-3" />
                    <span className="hidden md:inline">Customer</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DueSection.displayName = 'DueSection';

const DueCenter = ({ customers = [], invoices = [], businessSettings, onPaymentRecorded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recordingPaymentBill, setRecordingPaymentBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [loading] = useState(false);
  const currencySymbol = businessSettings?.currency || '₹';

  const dueBills = useMemo(() => {
    return invoices
      .filter(inv => {
        if (!inv || inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
        const due = getInvoiceBalanceDue(inv);
        return due > 0;
      })
      .map(inv => {
        const grandTotal = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
        const paidAmount = getInvoicePaidTotal(inv);
        const dueAmount = getInvoiceBalanceDue(inv);
        return {
          ...inv,
          grandTotal,
          paidAmount,
          amountPaid: paidAmount,
          dueAmount,
          balanceDue: dueAmount,
          dueDate: new Date(inv.dueDate || inv.createdAt)
        };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [invoices]);

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

  const agingData = useMemo(() => {
    return calculateAgingDistribution(dueBills);
  }, [dueBills]);

  const filteredToday = useMemo(() => grouped.today.filter(b => 
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.today, searchQuery]);

  const filteredThisWeek = useMemo(() => grouped.thisWeek.filter(b => 
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.thisWeek, searchQuery]);

  const filteredOlder = useMemo(() => grouped.older.filter(b => 
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [grouped.older, searchQuery]);

  const allFilteredEmpty = filteredToday.length === 0 && filteredThisWeek.length === 0 && filteredOlder.length === 0;

  const handleMarkPaid = useCallback((bill) => {
    setRecordingPaymentBill(bill);
    setPaymentAmount(bill.dueAmount.toString());
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
  }, []);

  const handleSubmitPayment = async (e) => {
    e?.preventDefault?.();
    if (!recordingPaymentBill) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await invoiceEngine.recordPayment(recordingPaymentBill.id, {
        amount,
        method: paymentMethod,
        date: paymentDate,
        notes: paymentNotes
      });
      toast.success(`Payment of ${formatCurrency(amount, currencySymbol)} recorded!`);
      setRecordingPaymentBill(null);
      if (onPaymentRecorded) onPaymentRecorded();
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
    } catch (err) {
      toast.error(err.message || 'Payment could not be recorded.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

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

  if (loading) {
    return (
      <div className="page-premium">
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
    <div className="page-premium w-full max-w-full pb-24 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Due Ledger</h1>
          <p className="text-xs font-semibold text-theme-muted mt-0.5">Track and collect outstanding payments across all accounts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="px-3.5 py-2 rounded-xl bg-theme-accent text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-all cursor-pointer">
            <Bell className="w-3.5 h-3.5" /> Send Reminder to All
          </button>
          <button onClick={() => {
            const csvRows = ['Customer,Invoice No,Due Date,Amount,Status'];
            dueBills.forEach(b => {
              csvRows.push(`"${b.customerName || 'Walk-in'}","${b.invoiceNumber || ''}","${new Date(b.dueDate).toLocaleDateString()}","${formatCurrency(b.dueAmount)}","${b.paymentStatus || 'Unpaid'}"`);
            });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'DueList.csv'; a.click();
            URL.revokeObjectURL(url);
          }} className="px-3.5 py-2 rounded-xl bg-theme-card border border-theme-border-soft text-theme-primary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-theme-surface transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export Due List
          </button>
        </div>
      </div>

      {/* 4-METRIC OVERVIEW STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Outstanding</span>
            <span className="badge-premium badge-danger font-numbers">{dueBills.length} bills</span>
          </div>
          <p className="text-xl font-black text-theme-primary font-numbers tabular-nums">{formatCurrency(totalOutstanding, currencySymbol)}</p>
        </div>

        <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Overdue Bills</span>
            <span className="badge-premium badge-danger">
              {dueBills.length > 0 ? Math.round((grouped.today.length / dueBills.length) * 100) : 0}%
            </span>
          </div>
          <p className="text-xl font-black text-rose-500 font-numbers tabular-nums">{formatCurrency(totalDueToday, currencySymbol)}</p>
        </div>

        <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Due This Week</span>
            <span className="badge-premium badge-warning font-numbers">{grouped.thisWeek.length} bills</span>
          </div>
          <p className="text-xl font-black text-amber-500 font-numbers tabular-nums">{formatCurrency(totalDueThisWeek, currencySymbol)}</p>
        </div>

        <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Upcoming</span>
            <span className="badge-premium badge-info font-numbers">{grouped.older.length} bills</span>
          </div>
          <p className="text-xl font-black text-theme-primary font-numbers tabular-nums">{formatCurrency(totalUpcoming, currencySymbol)}</p>
        </div>
      </div>

      {/* 5-BUCKET AGING & CREDIT INTELLIGENCE STRIP */}
      <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-black text-theme-primary tracking-tight uppercase">Credit Aging Intelligence</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-theme-muted">
            <span>Portfolio Risk:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${agingData.priority?.badgeClass || 'bg-emerald-500/10 text-emerald-600'}`}>
              {agingData.priority?.label || 'Low Risk'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-theme-surface/50 rounded-xl p-2.5 border border-theme-border-soft/60">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Current / Not Due</span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.current, currencySymbol)}
            </p>
          </div>
          <div className="bg-theme-surface/50 rounded-xl p-2.5 border border-theme-border-soft/60">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">0–30 Days</span>
            <p className="text-sm font-black text-amber-600 dark:text-amber-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue0to30, currencySymbol)}
            </p>
          </div>
          <div className="bg-theme-surface/50 rounded-xl p-2.5 border border-theme-border-soft/60">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">31–60 Days</span>
            <p className="text-sm font-black text-orange-600 dark:text-orange-400 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue31to60, currencySymbol)}
            </p>
          </div>
          <div className="bg-theme-surface/50 rounded-xl p-2.5 border border-theme-border-soft/60">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">61–90 Days</span>
            <p className="text-sm font-black text-rose-500 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue61to90, currencySymbol)}
            </p>
          </div>
          <div className="bg-theme-surface/50 rounded-xl p-2.5 border border-theme-border-soft/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">90+ Days</span>
            <p className="text-sm font-black text-rose-600 font-numbers tabular-nums mt-0.5">
              {formatCurrency(agingData.overdue90Plus, currencySymbol)}
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer or bill number..."
          className="w-full pl-10 pr-10 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <DueSection
          title="Due Now / Overdue"
          icon={AlertCircle}
          bills={filteredToday}
          accentBg="bg-rose-500"
          badgeColor="badge-danger"
          currencySymbol={currencySymbol}
          onMarkPaid={handleMarkPaid}
          onSendReminder={handleSendReminder}
          onOpenCustomer={handleOpenCustomer}
          searchQuery={searchQuery}
        />
        <DueSection
          title="Due This Week"
          icon={Calendar}
          bills={filteredThisWeek}
          accentBg="bg-amber-500"
          badgeColor="badge-warning"
          currencySymbol={currencySymbol}
          onMarkPaid={handleMarkPaid}
          onSendReminder={handleSendReminder}
          onOpenCustomer={handleOpenCustomer}
          searchQuery={searchQuery}
        />
        <DueSection
          title="Upcoming"
          icon={Clock}
          bills={filteredOlder}
          accentBg="bg-theme-accent"
          badgeColor="badge-info"
          currencySymbol={currencySymbol}
          onMarkPaid={handleMarkPaid}
          onSendReminder={handleSendReminder}
          onOpenCustomer={handleOpenCustomer}
          searchQuery={searchQuery}
        />
      </div>

      {!searchQuery && grouped.today.length === 0 && grouped.thisWeek.length === 0 && grouped.older.length === 0 && (
        <div className="card-premium p-5">
          <div className="empty-state py-6">
            <div className="empty-state-icon">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="empty-state-title">All clear!</p>
            <p className="empty-state-text">No pending bills due. You're all caught up.</p>
          </div>
          <div className="border-t border-theme-border-soft pt-4 mt-2">
            <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-2">Collection Tips</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-theme-muted font-semibold">
                <span className="w-5 h-5 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                <span>Send invoice reminders 24 hours before the due date for best results.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-theme-muted font-semibold">
                <span className="w-5 h-5 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                <span>Offer a 2% early payment discount to encourage faster settlements.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-theme-muted font-semibold">
                <span className="w-5 h-5 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
                <span>Follow up overdue accounts with a phone call — it works better than email.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchQuery && allFilteredEmpty && (
        <div className="card-premium p-5">
          <div className="empty-state py-8">
            <div className="empty-state-icon">
              <Search className="w-5 h-5" />
            </div>
            <p className="empty-state-title">No matching bills</p>
            <p className="empty-state-text">Try adjusting your search to find what you're looking for.</p>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT POPUP MODAL */}
      <AnimatePresence>
        {recordingPaymentBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-theme-card border border-theme-border-soft rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-theme-primary">Record Payment</h3>
                    <p className="text-[11px] font-semibold text-theme-muted font-mono">{recordingPaymentBill.invoiceNumber || 'Invoice'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRecordingPaymentBill(null)}
                  className="w-7 h-7 rounded-lg hover:bg-theme-surface flex items-center justify-center text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-theme-surface/60 rounded-xl border border-theme-border-soft flex items-center justify-between text-xs font-semibold">
                <div>
                  <span className="text-theme-muted block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-theme-primary">{recordingPaymentBill.customerName || 'Walk-in Customer'}</span>
                </div>
                <div className="text-right">
                  <span className="text-theme-muted block text-[10px] uppercase font-bold">Balance Due</span>
                  <span className="text-sm font-black text-rose-500 font-numbers tabular-nums">
                    {formatCurrency(recordingPaymentBill.dueAmount, currencySymbol)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-theme-secondary mb-1">Payment Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={recordingPaymentBill.dueAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-black text-theme-primary font-numbers focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-theme-secondary mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:border-theme-accent"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-secondary mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:border-theme-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-secondary mb-1">Notes / Transaction ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref #123456"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecordingPaymentBill(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-theme-muted hover:text-theme-primary hover:bg-theme-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingPayment ? 'Recording...' : 'Confirm Payment'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomerLedger
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        invoices={invoices}
        currencySymbol={currencySymbol}
        onPaymentRecorded={onPaymentRecorded}
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

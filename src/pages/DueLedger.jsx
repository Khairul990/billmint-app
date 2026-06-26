import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, CheckCircle2, AlertCircle, CreditCard, ChevronRight, Calendar, X, Bell, User, DollarSign, TrendingUp, TrendingDown, Send, Eye, Ban, Download } from 'lucide-react';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';
import { formatCurrency } from '../utils/invoiceUtils';
import { CardSkeleton } from '../components/PremiumSkeleton';
import CustomerLedger from '../components/customers/CustomerLedger';

const DueCenter = ({ customers = [], invoices = [], businessSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const currencySymbol = businessSettings?.currency || '₹';

  const dueBills = useMemo(() => {
    return invoices
      .filter(inv => {
        const s = (inv.paymentStatus || '').toLowerCase();
        return s === 'unpaid' || s === 'partial' || s === 'partially paid';
      })
      .map(inv => ({
        ...inv,
        dueAmount: inv.dueAmount || (inv.grandTotal || inv.total || 0) - (inv.amountPaid || 0),
        dueDate: new Date(inv.dueDate || inv.createdAt)
      }))
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

  const totalOverdue = useMemo(() => 
    grouped.today.length
  , [grouped.today]);

  const totalUpcoming = useMemo(() => 
    grouped.older.reduce((sum, b) => sum + b.dueAmount, 0)
  , [grouped.older]);

  const totalOutstanding = useMemo(() => 
    dueBills.reduce((sum, b) => sum + b.dueAmount, 0)
  , [dueBills]);

  const filteredToday = grouped.today.filter(b => 
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredThisWeek = grouped.thisWeek.filter(b =>
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOlder = grouped.older.filter(b =>
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilteredEmpty = filteredToday.length === 0 && filteredThisWeek.length === 0 && filteredOlder.length === 0;

  const getUrgencyBadge = (bill) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((now - bill.dueDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return { label: 'Critical', class: 'badge-danger' };
    if (diffDays > 0) return { label: 'Overdue', class: 'badge-warning' };
    if (diffDays === 0) return { label: 'Due Today', class: 'badge-danger' };
    return { label: 'Upcoming', class: 'badge-info' };
  };

  const getStatusBadge = (bill) => {
    if (bill.status === 'partial') return { label: 'Partial', class: 'badge-warning' };
    return { label: 'Unpaid', class: 'badge-danger' };
  };

  const handleMarkPaid = (bill) => {
    if (bill.customerId) {
      const customer = customers.find(c => c.id === bill.customerId);
      setSelectedCustomer(customer || { id: bill.customerId, name: bill.customerName });
    } else {
      setSelectedCustomer({ id: null, name: bill.customerName });
    }
  };

  const handleOpenCustomer = (bill) => {
    if (bill.customerId) {
      const customer = customers.find(c => c.id === bill.customerId);
      setSelectedCustomer(customer || { id: bill.customerId, name: bill.customerName });
    } else {
      setSelectedCustomer({ id: null, name: bill.customerName });
    }
  };

  const handleSendReminder = (bill) => {
    if (bill.customerId) {
      const customer = customers.find(c => c.id === bill.customerId);
      setSelectedCustomer(customer || { id: bill.customerId, name: bill.customerName });
    } else {
      setSelectedCustomer({ id: null, name: bill.customerName });
    }
  };

  const Section = ({ title, icon: Icon, bills, accent, accentBg, badgeColor }) => {
    if (bills.length === 0 && !searchQuery) return null;
    return (
      <motion.div variants={staggerItem} className="mb-6">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${accentBg} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="section-header-title">{title}</h3>
              <p className="section-header-subtitle">{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className={`badge-premium ${badgeColor}`}>{bills.length} pending</span>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          {bills.map((bill, idx) => {
            const urgency = getUrgencyBadge(bill);
            const status = getStatusBadge(bill);
            return (
              <motion.div
                key={bill.id}
                variants={staggerItem}
                className="card-premium p-4 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-theme-primary truncate">{bill.customerName || 'Walk-in Customer'}</p>
                        <span className={`badge-premium ${urgency.class}`}>{urgency.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-theme-muted font-semibold">
                          {bill.invoiceNumber || `#${bill.id?.slice(0, 6)}`}
                        </p>
                        <span className="text-theme-border-strong">•</span>
                        <p className="text-xs text-theme-muted font-semibold">
                          Due {bill.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className={`badge-premium ${status.class}`}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-theme-primary tabular-nums">{formatCurrency(bill.dueAmount, currencySymbol)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-theme-border-soft">
                  <button
                    onClick={() => handleMarkPaid(bill)}
                    className="btn-premium-ghost text-[10px] !min-h-[32px] !py-1.5 !px-3"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark Paid
                  </button>
                  <button
                    onClick={() => handleSendReminder(bill)}
                    className="btn-premium-ghost text-[10px] !min-h-[32px] !py-1.5 !px-3"
                  >
                    <Send className="w-3 h-3" /> Remind
                  </button>
                  <button
                    onClick={() => handleOpenCustomer(bill)}
                    className="btn-premium-ghost text-[10px] !min-h-[32px] !py-1.5 !px-3"
                  >
                    <Eye className="w-3 h-3" /> Customer
                  </button>
                </div>
              </motion.div>
            );
          })}
          {bills.length === 0 && searchQuery && (
            <div className="empty-state py-6">
              <div className="empty-state-icon">
                <Search className="w-5 h-5" />
              </div>
              <p className="empty-state-title">No results found</p>
              <p className="empty-state-text">No bills match your search for "{searchQuery}"</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

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
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="page-premium w-full max-w-full pb-24"
    >
      <div className="hero-premium">
        <h1 className="hero-premium-title">Due Ledger</h1>
        <p className="hero-premium-subtitle">Track and collect pending payments</p>
      </div>

      <div className="stats-grid mb-6">
        <div className="stat-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-premium icon-premium-sm">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="badge-premium badge-danger">{totalOverdue} bills</span>
          </div>
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Overdue</p>
          <p className="text-xl font-black text-theme-primary tabular-nums">{formatCurrency(totalDueToday, currencySymbol)}</p>
        </div>
        <div className="stat-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-premium icon-premium-sm bg-amber-500/10 text-amber-500">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="badge-premium badge-warning">{grouped.thisWeek.length} bills</span>
          </div>
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Due This Week</p>
          <p className="text-xl font-black text-theme-primary tabular-nums">{formatCurrency(totalDueThisWeek, currencySymbol)}</p>
        </div>
        <div className="stat-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-premium icon-premium-sm">
              <Clock className="w-4 h-4" />
            </div>
            <span className="badge-premium badge-info">{grouped.older.length} bills</span>
          </div>
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Upcoming</p>
          <p className="text-xl font-black text-theme-primary tabular-nums">{formatCurrency(totalUpcoming, currencySymbol)}</p>
        </div>
        <div className="stat-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-premium icon-premium-sm bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="badge-premium badge-success">{dueBills.length} total</span>
          </div>
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Total Outstanding</p>
          <p className="text-xl font-black text-theme-primary tabular-nums">{formatCurrency(totalOutstanding, currencySymbol)}</p>
        </div>
      </div>

      {/* DUE SUMMARY */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="stat-premium !p-3">
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Total Due Amount</p>
          <p className="text-lg font-black text-theme-primary tabular-nums">{formatCurrency(totalOutstanding, currencySymbol)}</p>
        </div>
        <div className="stat-premium !p-3">
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Overdue %</p>
          <p className="text-lg font-black text-rose-500 tabular-nums">
            {dueBills.length > 0 ? Math.round((grouped.today.length / dueBills.length) * 100) : 0}%
          </p>
        </div>
        <div className="stat-premium !p-3">
          <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Avg Days Overdue</p>
          <p className="text-lg font-black text-theme-primary tabular-nums">
            {grouped.today.length > 0
              ? Math.round(grouped.today.reduce((s, b) => s + Math.max(0, Math.floor((new Date() - b.dueDate) / (1000 * 60 * 60 * 24))), 0) / grouped.today.length)
              : 0}d
          </p>
        </div>
      </motion.div>

      {/* QUICK ACTIONS */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 mb-4 flex-wrap">
        <button className="btn-premium text-[10px] !min-h-[36px] !px-4 flex items-center gap-1.5 bg-theme-accent text-white">
          <Bell className="w-3.5 h-3.5" /> Send Reminder to All
        </button>
        <button className="btn-premium text-[10px] !min-h-[36px] !px-4 flex items-center gap-1.5 bg-emerald-500 text-white">
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
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
        }} className="btn-premium text-[10px] !min-h-[36px] !px-4 flex items-center gap-1.5 bg-theme-card border border-theme-border-soft text-theme-primary">
          <Download className="w-3.5 h-3.5" /> Export Due List
        </button>
      </motion.div>

      <div className="toolbar-premium mb-6">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer or bill number..."
          className="input-premium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="btn-premium-ghost !min-h-[44px] !px-3"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <Section
          title="Due Now / Overdue"
          icon={AlertCircle}
          bills={filteredToday}
          accent="bg-rose-500"
          accentBg="bg-rose-500"
          badgeColor="badge-danger"
        />
        <Section
          title="Due This Week"
          icon={Calendar}
          bills={filteredThisWeek}
          accent="bg-amber-500"
          accentBg="bg-amber-500"
          badgeColor="badge-warning"
        />
        <Section
          title="Upcoming"
          icon={Clock}
          bills={filteredOlder}
          accent="bg-theme-accent"
          accentBg="bg-theme-accent"
          badgeColor="badge-info"
        />
      </motion.div>

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

      <CustomerLedger
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        invoices={invoices}
        currencySymbol={currencySymbol}
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
    </motion.div>
  );
};

export default DueCenter;

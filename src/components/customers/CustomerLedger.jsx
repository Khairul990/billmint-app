import React, { useState, useMemo } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Receipt, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Banknote, 
  Plus,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeCustomerLedger } from '../../utils/financialCalculations';
import { FinancialValue, FinancialEquation, StatusBadge, SignatureSurface, Button } from '../ui';
import { toast } from 'react-hot-toast';

/**
 * BillQyro Signature Customer Ledger & 360° Financial Story
 * 
 * Visualizes the complete customer financial lifecycle:
 * OLD DUE + CURRENT BILLS - PAYMENTS = BALANCE DUE
 * 
 * Reuses the canonical computeCustomerLedger calculation.
 * Delegates all payment actions directly to Collection Center.
 */
const CustomerLedger = ({ 
  isOpen, 
  onClose, 
  customer, 
  invoices = [], 
  currencySymbol = '₹', 
  onCreateBill, 
  onPaymentRecorded,
  onOpenCollection 
}) => {
  const [activeView, setActiveView] = useState('all'); // 'all' | 'invoices' | 'payments'

  // Canonical Customer Ledger calculation with credit intelligence & aging
  const ledgerData = useMemo(() => {
    if (!customer) return null;
    return computeCustomerLedger(customer, invoices);
  }, [customer, invoices]);

  const customerInvoices = ledgerData?.invoices || [];
  const paymentHistory = ledgerData?.paymentHistory || [];

  // Build a unified chronological timeline of financial events unconditionally
  const timelineEvents = useMemo(() => {
    if (!customerInvoices.length && !paymentHistory.length) return [];
    const events = [];

    // Add Invoices
    customerInvoices.forEach(inv => {
      const fin = inv.canonicalFinancials || {
        currentInvoiceTotal: parseFloat(inv.grandTotal || inv.total) || 0,
        previousDue: parseFloat(inv.oldDue || inv.previousDue) || 0,
        amountPaid: parseFloat(inv.amountPaid ?? inv.paidAmount) || 0,
        customerTotalDue: inv.due ?? 0,
        balanceDue: inv.due ?? 0,
        paymentStatus: inv.paymentStatus || 'Unpaid'
      };

      const billDate = inv.date || inv.createdAt;
      const dueOnInv = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

      events.push({
        id: `inv-${inv.id || inv.invoiceNumber}`,
        type: 'invoice',
        date: new Date(billDate || Date.now()),
        dateString: billDate,
        title: `Bill ${inv.invoiceNumber || '#' + (inv.id ? String(inv.id).slice(0, 6) : '')}`,
        invoice: inv,
        amount: fin.currentInvoiceTotal,
        oldDue: fin.previousDue,
        totalPayable: fin.currentInvoiceTotal + fin.previousDue,
        amountPaid: fin.amountPaid,
        balanceDue: dueOnInv,
        status: fin.paymentStatus || (dueOnInv === 0 ? 'Paid' : 'Unpaid'),
        rawInv: inv
      });
    });

    // Add Payments
    paymentHistory.forEach((p, idx) => {
      events.push({
        id: `pay-${p.invoiceId || 'direct'}-${idx}`,
        type: 'payment',
        date: new Date(p.date || Date.now()),
        dateString: p.date,
        title: `Payment Received · ${p.method || 'Cash'}`,
        amount: p.amount,
        invoiceNumber: p.invoiceNumber,
        notes: p.notes,
        rawPayment: p
      });
    });

    // Sort newest first
    return events.sort((a, b) => b.date - a.date);
  }, [customerInvoices, paymentHistory]);

  const filteredEvents = useMemo(() => {
    if (activeView === 'invoices') return timelineEvents.filter(e => e.type === 'invoice');
    if (activeView === 'payments') return timelineEvents.filter(e => e.type === 'payment');
    return timelineEvents;
  }, [timelineEvents, activeView]);

  if (!isOpen || !customer || !ledgerData) return null;

  const {
    totalBilled,
    totalPaid,
    totalDue,
    openingDue,
    isSettled,
    aging,
    priority,
    oldestDueDate
  } = ledgerData;

  const formatCurrency = (amount) => {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${currencySymbol}${formattedNum}`;
  };

  const generateWhatsAppReminder = () => {
    const amount = formatCurrency(totalDue);
    const message = `Hello ${customer.name},%0A%0AThis is a gentle reminder that your current outstanding due balance with us is *${amount}*. Please clear it at your convenience.%0A%0AThank you for your business!`;
    const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      toast.error("No phone number found for this customer.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.8, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="w-full max-h-[94vh] sm:max-h-[88vh] sm:max-w-2xl bg-theme-surface rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-theme-border-soft"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. SIGNATURE HEADER */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-theme-card via-theme-surface to-theme-card border-b border-theme-border-soft shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-theme-app hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary transition-colors cursor-pointer border border-theme-border-soft shadow-2xs"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
              {/* Customer Avatar & Identity */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-black text-xl shadow-md shadow-theme-accent/20 shrink-0">
                  {customer.name ? customer.name.substring(0, 2).toUpperCase() : '??'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black text-theme-primary truncate tracking-tight">{customer.name}</h2>
                    {isSettled ? (
                      <StatusBadge status="paid" customLabel="Settled" size="sm" />
                    ) : (
                      <StatusBadge 
                        status={priority?.label === 'Overdue' ? 'overdue' : 'unpaid'} 
                        customLabel={priority?.label || 'Due'} 
                        size="sm" 
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-theme-muted font-medium mt-1 flex-wrap">
                    {customer.phone && (
                      <span className="flex items-center gap-1 font-numbers">
                        <Phone className="w-3.5 h-3.5 text-theme-muted" /> {customer.phone}
                      </span>
                    )}
                    {customer.email && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Mail className="w-3.5 h-3.5 text-theme-muted" /> {customer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Outstanding Hero Metric */}
              <div className="sm:text-right bg-theme-surface/70 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-theme-border-soft/60">
                <span className="text-[10px] uppercase font-black tracking-wider text-theme-muted block mb-0.5">Outstanding Balance</span>
                <FinancialValue 
                  value={totalDue} 
                  currency={currencySymbol} 
                  intent={totalDue > 0 ? 'balanceDue' : 'collection'} 
                  size="md" 
                />
              </div>
            </div>

            {customer.address && (
              <div className="mt-3.5 flex items-start gap-1.5 text-xs text-theme-muted bg-theme-surface/80 rounded-xl px-3 py-1.5 border border-theme-border-soft/50">
                <MapPin className="w-3.5 h-3.5 text-theme-muted shrink-0 mt-0.5" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}
          </div>

          {/* 2. SCROLLABLE STORY CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* 2A. CANONICAL FINANCIAL EQUATION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-theme-accent" />
                  Financial Relationship Breakdown
                </span>
                {openingDue > 0 && (
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Old Due Included: {formatCurrency(openingDue)}
                  </span>
                )}
              </div>

              <FinancialEquation
                oldDue={openingDue}
                currentBill={totalBilled}
                totalPayable={openingDue + totalBilled}
                paid={totalPaid}
                balanceDue={totalDue}
                currency={currencySymbol}
                size="sm"
                className="shadow-premium-sm"
              />
            </div>

            {/* 2B. CREDIT AGING & DELAY INTELLIGENCE */}
            {totalDue > 0 && aging && (
              <SignatureSurface variant="neutral" className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-theme-border-soft/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-theme-accent" />
                    <span className="font-extrabold text-theme-primary">Payment Delay Breakdown</span>
                  </div>
                  {oldestDueDate && (
                    <span className="text-[11px] text-theme-muted font-medium">
                      Oldest Unsettled: {new Date(oldestDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-theme-surface/70 rounded-xl p-2 border border-theme-border-soft/50">
                    <span className="block text-[9px] font-extrabold text-theme-muted uppercase">Current</span>
                    <span className="block text-xs font-black text-theme-accent tabular-nums mt-0.5">
                      {formatCurrency(aging.current)}
                    </span>
                  </div>
                  <div className="bg-theme-surface/70 rounded-xl p-2 border border-theme-border-soft/50">
                    <span className="block text-[9px] font-extrabold text-theme-muted uppercase">1–30 Days</span>
                    <span className="block text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                      {formatCurrency(aging.overdue0to30)}
                    </span>
                  </div>
                  <div className="bg-theme-surface/70 rounded-xl p-2 border border-theme-border-soft/50">
                    <span className="block text-[9px] font-extrabold text-theme-muted uppercase">31–60 Days</span>
                    <span className="block text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums mt-0.5">
                      {formatCurrency(aging.overdue31to60)}
                    </span>
                  </div>
                  <div className="bg-theme-surface/70 rounded-xl p-2 border border-theme-border-soft/50">
                    <span className="block text-[9px] font-extrabold text-theme-muted uppercase">61d+ Overdue</span>
                    <span className="block text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                      {formatCurrency(aging.overdue61to90 + aging.overdue90Plus)}
                    </span>
                  </div>
                </div>
              </SignatureSurface>
            )}

            {/* 2C. TIMELINE NAVIGATION TABS */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-theme-border-soft/60">
              <div className="flex items-center gap-1.5 p-1 bg-theme-surface rounded-xl border border-theme-border-soft">
                <button
                  onClick={() => setActiveView('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'all' 
                      ? 'bg-theme-card text-theme-primary shadow-2xs' 
                      : 'text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  All Activity ({timelineEvents.length})
                </button>
                <button
                  onClick={() => setActiveView('invoices')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'invoices' 
                      ? 'bg-theme-card text-theme-primary shadow-2xs' 
                      : 'text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  Bills ({customerInvoices.length})
                </button>
                <button
                  onClick={() => setActiveView('payments')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'payments' 
                      ? 'bg-theme-card text-theme-primary shadow-2xs' 
                      : 'text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  Payments ({paymentHistory.length})
                </button>
              </div>

              {totalDue > 0 && (
                <button
                  onClick={generateWhatsAppReminder}
                  className="px-3 py-1.5 rounded-xl bg-theme-tint-bg hover:bg-theme-tint-bg text-theme-accent border border-theme-tint-border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span> Reminder
                </button>
              )}
            </div>

            {/* 2D. CHRONOLOGICAL TIMELINE LIST */}
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-theme-muted font-medium text-xs bg-theme-app rounded-2xl border border-dashed border-theme-border-soft">
                  No activity found in this category.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-theme-border-soft">
                  {filteredEvents.map((evt) => {
                    const isInvoice = evt.type === 'invoice';

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className={`absolute -left-6 top-3 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-theme-surface shadow-2xs ${
                          isInvoice 
                            ? 'bg-theme-accent' 
                            : 'bg-theme-accent'
                        }`}>
                          {isInvoice ? <Receipt className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                        </div>

                        {/* Event Card */}
                        <SignatureSurface 
                          variant="neutral" 
                          className="p-3.5 sm:p-4 hover:border-theme-accent/30 transition-all shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-theme-primary tracking-tight">
                                  {evt.title}
                                </span>
                                {isInvoice && (
                                  <StatusBadge 
                                    status={evt.status === 'Paid' ? 'paid' : evt.amountPaid > 0 ? 'partial' : 'unpaid'} 
                                    customLabel={evt.status}
                                    size="sm"
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-theme-muted font-medium mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-theme-muted" />
                                  {evt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {isInvoice && evt.oldDue > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                                      Old Due: +{formatCurrency(evt.oldDue)}
                                    </span>
                                  </>
                                )}
                              </div>

                              {evt.notes && (
                                <p className="text-xs text-theme-muted mt-1 italic">
                                  "{evt.notes}"
                                </p>
                              )}
                            </div>

                            {/* Event Financial Totals */}
                            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-theme-border-soft/60">
                              <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
                                <span className="text-[10px] uppercase font-bold text-theme-muted sm:hidden">
                                  {isInvoice ? 'Bill Amount' : 'Collected'}
                                </span>
                                <span className={`text-sm font-black tabular-nums font-numbers ${
                                  isInvoice ? 'text-theme-primary' : 'text-theme-accent'
                                }`}>
                                  {isInvoice ? formatCurrency(evt.amount) : `+${formatCurrency(evt.amount)}`}
                                </span>
                              </div>

                              {isInvoice && evt.balanceDue > 0 && (
                                <span className="text-[11px] font-extrabold text-rose-500 tabular-nums block mt-0.5">
                                  Still Due: {formatCurrency(evt.balanceDue)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Invoice Action: Quick Collect via Canonical Collection Center */}
                          {isInvoice && evt.balanceDue > 0 && onOpenCollection && (
                            <div className="mt-3 pt-2.5 border-t border-theme-border-soft/60 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-theme-muted font-medium">
                                Collect against this specific bill:
                              </span>
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenCollection({ customer, invoice: evt.rawInv, tab: 'record' });
                                }}
                                className="px-3 py-1.5 bg-theme-tint-bg hover:bg-theme-tint-bg text-theme-accent border border-theme-tint-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Collect in Collection Center</span>
                              </button>
                            </div>
                          )}
                        </SignatureSurface>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>

          {/* 3. SIGNATURE ACTION FOOTER */}
          <div className="p-4 sm:p-5 bg-theme-card border-t border-theme-border-soft flex items-center gap-3 shrink-0">
            {onCreateBill && (
              <button
                onClick={() => {
                  onClose();
                  onCreateBill(customer);
                }}
                className="flex-1 py-3 px-4 bg-theme-surface hover:bg-theme-border-soft text-theme-primary border border-theme-border-soft rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-theme-accent" />
                <span>Create Bill</span>
              </button>
            )}

            {totalDue > 0 && onOpenCollection && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCollection({ customer, tab: 'record' });
                }}
                className="flex-1 py-3 px-4 bg-[image:var(--accent-gradient)] text-white hover:opacity-95 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-theme-glow transition-all cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Collect Money ({formatCurrency(totalDue)})</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerLedger;

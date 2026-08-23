import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Banknote, 
  Save, 
  Loader2, 
  Plus,
  ArrowUpRight,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoiceEngine } from '../../services/invoiceEngine';
import { computeCustomerLedger } from '../../utils/financialCalculations';
import { toast } from 'react-hot-toast';

/**
 * Customer 360° / Customer Ledger Modal
 * Compact, responsive, and uses the canonical computeCustomerLedger calculation.
 */
const CustomerLedger = ({ isOpen, onClose, customer, invoices = [], currencySymbol = '₹', onCreateBill }) => {
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !customer) return null;

  // 1. Canonical Customer Ledger Calculation
  const {
    totalBilled,
    totalPaid,
    totalDue,
    isSettled,
    invoices: customerInvoices
  } = computeCustomerLedger(customer, invoices);

  const formatCurrency = (amount) => {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${currencySymbol}${formattedNum}`;
  };

  const handleUpdatePayment = async (inv) => {
    const payVal = parseFloat(paymentAmount);
    if (!payVal || isNaN(payVal) || payVal <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setIsSaving(true);
    try {
      const currentPaid = parseFloat(inv.amountPaid ?? inv.paidAmount) || 0;
      const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
      const newPaid = Math.min(grandTotal, currentPaid + payVal);
      const newBalanceDue = Math.max(0, grandTotal - newPaid);
      
      let newStatus = 'Partially Paid';
      if (newPaid >= grandTotal) {
        newStatus = 'Paid';
      } else if (newPaid === 0) {
        newStatus = 'Unpaid';
      }

      const historyItem = {
        date: new Date().toISOString().split('T')[0],
        amount: payVal,
        method: paymentMethod,
        transactionId: paymentNote || `PAY-${Date.now().toString().slice(-4)}`,
        verified: true,
        verifiedAt: new Date().toISOString()
      };

      const updatedInvoice = {
        ...inv,
        amountPaid: newPaid,
        paidAmount: newPaid,
        balanceDue: newBalanceDue,
        paymentStatus: newStatus,
        paymentMethod: paymentMethod,
        paymentNote: paymentNote,
        paymentDate: new Date().toISOString(),
        paymentHistory: [...(inv.paymentHistory || []), historyItem]
      };

      await invoiceEngine.saveInvoice(updatedInvoice);
      setUpdatingInvoiceId(null);
      setPaymentAmount('');
      setPaymentNote('');
      toast.success('Payment recorded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment.');
    } finally {
      setIsSaving(false);
    }
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.8, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-xl bg-theme-surface dark:bg-theme-surface rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-theme-border-soft"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Area */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-r from-theme-card to-theme-surface border-b border-theme-border-soft shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-theme-app hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary transition-colors cursor-pointer border border-theme-border-soft"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white flex items-center justify-center font-black text-lg shadow-md shadow-theme-accent/20 shrink-0">
                {customer.name ? customer.name.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-theme-primary truncate tracking-tight">{customer.name}</h2>
                  {isSettled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                      <CheckCircle2 className="w-3 h-3" /> Settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                      Due
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-theme-muted font-semibold mt-1 flex-wrap">
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-theme-muted" /> {customer.phone}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <Mail className="w-3 h-3 text-theme-muted" /> {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-theme-app border border-theme-border-soft rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] uppercase font-black tracking-wider text-theme-muted mb-0.5">Total Billed</span>
                <span className="block text-sm sm:text-base font-black text-theme-primary tabular-nums">{formatCurrency(totalBilled)}</span>
              </div>
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">Total Paid</span>
                <span className="block text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400 mb-0.5">Balance Due</span>
                <span className="block text-sm sm:text-base font-black text-rose-700 dark:text-rose-300 tabular-nums">{formatCurrency(totalDue)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {onCreateBill && (
                <button
                  onClick={() => {
                    onCreateBill(customer);
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-gradient-to-r from-theme-accent to-theme-accent-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-theme-accent/20 hover:opacity-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Bill</span>
                </button>
              )}
              {totalDue > 0 ? (
                <button
                  onClick={generateWhatsAppReminder}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Reminder</span>
                </button>
              ) : (
                <div className="py-2.5 px-3 bg-theme-app border border-theme-border-soft text-theme-muted font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>All Cleared</span>
                </div>
              )}
            </div>

            {/* Address bar if available */}
            {customer.address && (
              <div className="flex items-start gap-2 text-xs font-semibold text-theme-muted bg-theme-app/60 border border-theme-border-soft/60 rounded-xl px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-theme-muted shrink-0 mt-0.5" />
                <span className="line-clamp-1">{customer.address}</span>
              </div>
            )}

            {/* Billing Timeline */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-theme-accent" />
                  Invoice History ({customerInvoices.length})
                </h3>
              </div>
              
              {customerInvoices.length === 0 ? (
                <div className="text-center py-6 text-theme-muted font-semibold text-xs bg-theme-app rounded-2xl border border-dashed border-theme-border-soft">
                  No billing history found for this customer.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerInvoices.map((inv) => {
                    const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
                    const paid = inv.paymentStatus === 'Paid' ? grandTotal : (parseFloat(inv.amountPaid ?? inv.paidAmount) || 0);
                    const due = Math.max(0, grandTotal - paid);
                    const isPaid = due === 0;

                    return (
                      <div key={inv.id} className="bg-theme-card border border-theme-border-soft rounded-2xl p-3.5 shadow-xs hover:border-theme-accent/30 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-theme-primary font-mono">{inv.invoiceNumber}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isPaid 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              }`}>
                                {inv.paymentStatus || (isPaid ? 'Paid' : 'Unpaid')}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-theme-muted flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" /> {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-black text-theme-primary block tabular-nums">
                              {formatCurrency(grandTotal)}
                            </span>
                            {!isPaid && (
                              <span className="text-[10px] font-extrabold text-rose-500 tabular-nums">
                                Due: {formatCurrency(due)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Payment Form */}
                        {!isPaid && (
                          <div className="mt-2.5 pt-2.5 border-t border-theme-border-soft">
                            {updatingInvoiceId === inv.id ? (
                              <div className="space-y-2 bg-theme-app p-2.5 rounded-xl border border-theme-border-soft">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] font-bold text-theme-muted uppercase block mb-1">Amount</label>
                                    <input
                                      type="number"
                                      value={paymentAmount}
                                      onChange={e => setPaymentAmount(e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-bold text-theme-primary focus:border-theme-accent focus:outline-none"
                                      placeholder={`Max ${formatCurrency(due)}`}
                                      max={due}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-theme-muted uppercase block mb-1">Method</label>
                                    <select
                                      value={paymentMethod}
                                      onChange={e => setPaymentMethod(e.target.value)}
                                      className="w-full px-2 py-1.5 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-bold text-theme-primary focus:border-theme-accent focus:outline-none"
                                    >
                                      <option value="Cash">Cash</option>
                                      <option value="UPI / QR">UPI / QR</option>
                                      <option value="Bank Transfer">Bank Transfer</option>
                                      <option value="Credit Card">Credit Card</option>
                                    </select>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={paymentNote}
                                  onChange={e => setPaymentNote(e.target.value)}
                                  placeholder="Note (optional / Txn ID)"
                                  className="w-full px-2.5 py-1.5 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-medium text-theme-primary focus:border-theme-accent focus:outline-none"
                                />
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={() => setUpdatingInvoiceId(null)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-theme-muted hover:bg-theme-surface transition-colors cursor-pointer"
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePayment(inv)}
                                    disabled={!paymentAmount || isSaving}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Record
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setUpdatingInvoiceId(inv.id);
                                  setPaymentAmount(due.toString());
                                }}
                                className="w-full py-1.5 bg-theme-app hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-theme-border-soft hover:border-emerald-300 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" /> Record Payment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerLedger;


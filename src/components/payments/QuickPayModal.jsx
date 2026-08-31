import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Loader2, 
  User, 
  Receipt,
  Smartphone,
  Building2
} from 'lucide-react';
import { formatCurrency } from '../../utils/invoiceUtils';
import { calculateCanonicalInvoiceFinancials, roundTo2 } from '../../utils/invoiceMath';
import { invoiceEngine } from '../../services/invoiceEngine';
import { triggerPaymentSuccessFeedback, triggerVoiceFeedback } from '../../utils/feedback';
import { toast } from 'react-hot-toast';

/**
 * QuickPayModal — Canonical Merchant Fast Payment Collection Interface
 * Provides 1-click smart presets ("Pay Current Invoice", "Pay Total Due"),
 * rigorous overpayment protection, and zero-loss offline-first persistence.
 */
const QuickPayModal = ({
  isOpen,
  onClose,
  invoice,
  currencySymbol = '₹',
  businessSettings = {},
  onPaymentSuccess
}) => {
  if (!isOpen || !invoice) return null;

  const fin = useMemo(() => {
    return calculateCanonicalInvoiceFinancials(invoice);
  }, [invoice]);

  const currentBillBalance = fin.balanceDue; // Current invoice remaining due
  const previousDue = fin.previousDue; // Previous / old due
  const totalReceivable = fin.totalReceivable; // Grand Total + Previous Due
  const customerTotalDue = fin.customerTotalDue ?? (previousDue > 0 ? (fin.remainingOldDue + fin.currentBillDue) : fin.balanceDue);

  const [paymentAmount, setPaymentAmount] = useState(() => {
    return (currentBillBalance > 0 ? currentBillBalance : customerTotalDue).toString();
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = parseFloat(paymentAmount) || 0;
  const maxPayable = customerTotalDue > 0 ? customerTotalDue : currentBillBalance;
  const isOverpaying = numericAmount > maxPayable && maxPayable > 0;
  const isValidAmount = numericAmount > 0 && !isOverpaying;

  const paymentMethods = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
    { id: 'Bank', label: 'Bank Transfer', icon: Building2 },
    { id: 'Card', label: 'Card', icon: CreditCard }
  ];

  const handleSelectPreset = (amount) => {
    setPaymentAmount(amount.toString());
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    if (numericAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (isOverpaying) {
      toast.error(`Payment cannot exceed the total payable amount of ${formatCurrency(maxPayable, currencySymbol)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const pmtId = `pmt_${invoice.id}_${Date.now()}`;
      const payload = {
        id: pmtId,
        amount: roundTo2(numericAmount),
        method: paymentMethod,
        date: paymentDate || new Date().toISOString(),
        notes: paymentNotes.trim(),
        transactionId: transactionId.trim()
      };

      const updated = await invoiceEngine.recordPayment(invoice.id, payload);
      
      triggerPaymentSuccessFeedback();
      triggerVoiceFeedback("Payment recorded successfully!");
      toast.success(`Payment of ${formatCurrency(numericAmount, currencySymbol)} recorded!`);

      if (onPaymentSuccess) {
        onPaymentSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('[QuickPayModal] Payment recording failed:', err);
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
        onClick={() => { if (!isSubmitting) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.8, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-lg bg-theme-surface rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-theme-border-soft"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-r from-theme-card to-theme-surface border-b border-theme-border-soft shrink-0">
            <button
              onClick={() => { if (!isSubmitting) onClose(); }}
              className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-theme-app hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary transition-colors cursor-pointer border border-theme-border-soft"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0 border border-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-theme-primary truncate tracking-tight">Quick Pay Collection</h2>
                <p className="text-xs text-theme-muted font-semibold flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-bold text-theme-primary truncate">{invoice.customerName || invoice.customer?.name || 'Customer'}</span>
                  <span>•</span>
                  <span className="font-numbers">{invoice.invoiceNumber || 'Invoice'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Financial Overview Cards */}
            <div className="bg-theme-app/60 border border-theme-border-soft rounded-2xl p-3.5 space-y-2.5 shadow-xs font-numbers">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted font-bold">Current Invoice</span>
                <span className="font-black text-theme-primary">{formatCurrency(fin.currentInvoiceTotal, currencySymbol)}</span>
              </div>

              {previousDue > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                  <span className="font-bold">+ Previous / Old Due</span>
                  <span className="font-black">+{formatCurrency(previousDue, currencySymbol)}</span>
                </div>
              )}

              {fin.amountPaid > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">- Already Paid</span>
                  <span className="font-black">-{formatCurrency(fin.amountPaid, currencySymbol)}</span>
                </div>
              )}

              <div className="border-t border-theme-border-soft/60 pt-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-theme-primary">
                  {previousDue > 0 ? 'Total Customer Due' : 'Balance Due'}
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(customerTotalDue, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Smart Preset Options */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Smart Amount Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset(currentBillBalance)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    numericAmount === currentBillBalance 
                      ? 'bg-theme-accent/10 border-theme-accent text-theme-accent font-black shadow-xs' 
                      : 'bg-theme-card border-theme-border-soft hover:bg-theme-surface text-theme-primary font-bold'
                  }`}
                >
                  <span className="text-[10px] text-theme-muted block font-semibold uppercase">Current Invoice</span>
                  <span className="text-xs font-numbers block mt-0.5">{formatCurrency(currentBillBalance, currencySymbol)}</span>
                </button>

                {previousDue > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(customerTotalDue)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      numericAmount === customerTotalDue 
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 font-black shadow-xs' 
                        : 'bg-theme-card border-theme-border-soft hover:bg-theme-surface text-theme-primary font-bold'
                    }`}
                  >
                    <span className="text-[10px] text-theme-muted block font-semibold uppercase">Total Customer Due</span>
                    <span className="text-xs font-numbers block mt-0.5 text-rose-600">{formatCurrency(customerTotalDue, currencySymbol)}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-theme-primary uppercase tracking-wider block">
                Payment Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted font-black text-sm pointer-events-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxPayable > 0 ? maxPayable : undefined}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-9 pr-4 py-2.5 bg-theme-card border rounded-xl text-sm font-black font-numbers text-theme-primary focus:outline-none focus:ring-2 transition-all ${
                    isOverpaying 
                      ? 'border-rose-500 focus:ring-rose-500/20' 
                      : 'border-theme-border-soft focus:border-theme-accent focus:ring-theme-accent/20'
                  }`}
                  required
                />
              </div>
              {isOverpaying && (
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Amount cannot exceed total due of {formatCurrency(maxPayable, currencySymbol)}</span>
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                        active 
                          ? 'bg-theme-accent text-white border-theme-accent shadow-xs' 
                          : 'bg-theme-card border-theme-border-soft hover:bg-theme-surface text-theme-secondary font-bold'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Reference Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-muted block">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-muted block">Txn Ref / UTR (Optional)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI Ref / Cheque No."
                  className="w-full px-3 py-2 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            {/* Payment Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-theme-muted block">Payment Note (Optional)</label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Received by manager"
                className="w-full px-3 py-2 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:border-theme-accent"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-theme-surface hover:bg-theme-border-soft text-theme-secondary font-bold text-xs transition-colors cursor-pointer border border-theme-border-soft"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!isValidAmount || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Payment ({formatCurrency(numericAmount, currencySymbol)})</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickPayModal;

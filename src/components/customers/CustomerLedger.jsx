import React from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Banknote,
  Save,
  Loader2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveInvoice } from '../../services/dbEngine';

/**
 * Customer Ledger Modal
 * Displays a comprehensive view of a customer's history and metrics.
 */
const CustomerLedger = ({ isOpen, onClose, customer, invoices = [], currencySymbol = '₹', onCreateBill }) => {
  if (!isOpen || !customer) return null;

  // 1. Filter invoices for this customer
  const customerInvoices = invoices.filter(
    (inv) => inv.customerName?.toLowerCase() === customer.name?.toLowerCase()
  );

  // 2. Calculate Metrics
  const totalBilled = customerInvoices.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);
  const totalPaid = customerInvoices.reduce((acc, inv) => {
    const paid = inv.status === 'Paid' ? (parseFloat(inv.total) || 0) : (parseFloat(inv.amountPaid) || 0);
    return acc + paid;
  }, 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  // 3. Sort invoices chronologically (newest first)
  const timeline = [...customerInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatCurrency = (amount) => {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${currencySymbol} ${formattedNum}`;
  };

  const [updatingInvoiceId, setUpdatingInvoiceId] = React.useState(null);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [paymentNote, setPaymentNote] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleUpdatePayment = async (inv) => {
    setIsSaving(true);
    try {
      const newPaid = (parseFloat(inv.amountPaid) || 0) + parseFloat(paymentAmount);
      const grandTotal = parseFloat(inv.total || inv.grandTotal);
      
      let newStatus = 'Partial';
      if (newPaid >= grandTotal) {
        newStatus = 'Paid';
      } else if (newPaid === 0) {
        newStatus = 'Unpaid';
      }

      const updatedInvoice = {
        ...inv,
        amountPaid: newPaid,
        balanceDue: Math.max(0, grandTotal - newPaid),
        paymentStatus: newStatus,
        paymentMethod: paymentMethod,
        paymentNote: paymentNote,
        paymentDate: new Date().toISOString()
      };

      await saveInvoice(updatedInvoice);
      setUpdatingInvoiceId(null);
      setPaymentAmount('');
      setPaymentNote('');
      // We don't have a direct way to trigger a re-render of App.jsx invoices here unless we pass a callback, 
      // but dbEngine's onSnapshot handles live updates if online, or the user can refresh/re-open.
      alert('Payment updated successfully! The ledger will reflect changes shortly.');
    } catch (err) {
      console.error(err);
      alert('Failed to update payment');
    } finally {
      setIsSaving(false);
    }
  };

  const generateWhatsAppReminder = () => {
    const amount = formatCurrency(totalDue);
    const message = `Hello ${customer.name},%0A%0AThis is a gentle reminder that you have a pending due of *${amount}* with us. Please clear it at your earliest convenience.%0A%0AThank you!`;
    const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      alert("No phone number found for this customer.");
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
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-theme-app dark:bg-theme-app rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative pt-6 px-6 pb-4 bg-[image:var(--accent-gradient)] text-white shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-inner">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black tracking-tight">{customer.name}</h2>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mt-0.5">Customer Ledger</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Contact Info Card */}
            <div className="glass-panel dark:glass-panel-heavy rounded-2xl p-4 flex flex-col gap-3">
              {customer.phone && (
                <div className="flex items-center gap-3 text-sm font-semibold text-theme-primary">
                  <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-sm font-semibold text-theme-primary">
                  <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 text-sm font-semibold text-theme-primary">
                  <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-theme-muted mb-1">Total Billed</span>
                <span className="block text-lg font-black text-theme-primary">{formatCurrency(totalBilled)}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Total Paid</span>
                <span className="block text-lg font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 mb-1">Total Due</span>
                <span className="block text-lg font-black text-rose-700 dark:text-rose-300">{formatCurrency(totalDue)}</span>
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
                  className="py-3.5 bg-theme-accent hover:bg-theme-accent-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Bill</span>
                </button>
              )}
              {totalDue > 0 && (
                <button
                  onClick={generateWhatsAppReminder}
                  className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Remind</span>
                </button>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-theme-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-theme-accent" />
                Billing History
              </h3>
              
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-theme-muted font-semibold text-sm bg-theme-surface rounded-2xl border border-dashed border-theme-border-strong">
                  No invoices found for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((inv, index) => {
                    const isPaid = inv.status === 'Paid';
                    return (
                      <div key={inv.id} className="relative flex gap-4 pl-2 group">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-theme-border-soft group-last:hidden"></div>
                        
                        {/* Timeline Dot */}
                        <div className="relative z-10 w-4 h-4 mt-2 rounded-full border-4 border-theme-card shadow-sm shrink-0" 
                             style={{ backgroundColor: isPaid ? 'var(--status-success)' : 'var(--status-warning)' }}>
                        </div>
                        
                        {/* Content Card */}
                        <div className="flex-1 bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs font-black text-theme-primary block">{inv.invoiceNumber}</span>
                              <span className="text-[10px] font-bold text-theme-muted flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" /> {new Date(inv.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-sm font-black text-theme-primary">
                              {formatCurrency(inv.total)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isPaid 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {inv.status || 'Unpaid'}
                            </span>
                            
                            {!isPaid && (
                              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due {formatCurrency(inv.balanceDue || (inv.total - (inv.amountPaid || 0)))}
                              </span>
                            )}
                          </div>

                          {!isPaid && (
                            <div className="mt-3 pt-3 border-t border-theme-border-soft">
                              {updatingInvoiceId === inv.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Amount ({formatCurrency(inv.balanceDue || (inv.total - (inv.amountPaid || 0)))})</label>
                                      <div className="relative">
                                        <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-success" />
                                        <input
                                          type="number"
                                          value={paymentAmount}
                                          onChange={e => setPaymentAmount(e.target.value)}
                                          className="w-full pl-8 pr-2 py-2 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
                                          placeholder="Enter amount"
                                          max={inv.balanceDue || (inv.total - (inv.amountPaid || 0))}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Method</label>
                                      <select
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        className="w-full px-2 py-2 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
                                      >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI / QR">UPI / QR</option>
                                        <option value="Credit Card">Credit Card</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={paymentNote}
                                      onChange={e => setPaymentNote(e.target.value)}
                                      placeholder="Payment Note (e.g. Txn ID)"
                                      className="flex-1 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-medium text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setUpdatingInvoiceId(null)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-theme-muted hover:bg-theme-surface transition-colors"
                                      disabled={isSaving}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleUpdatePayment(inv)}
                                      disabled={!paymentAmount || isSaving}
                                      className="px-4 py-1.5 bg-theme-success hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                                    >
                                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                      Update
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setUpdatingInvoiceId(inv.id);
                                    setPaymentAmount(inv.balanceDue || (inv.total - (inv.amountPaid || 0)));
                                  }}
                                  className="w-full py-2 bg-theme-surface hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-theme-border-soft hover:border-emerald-200 dark:hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Banknote className="w-3.5 h-3.5" /> Record Payment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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

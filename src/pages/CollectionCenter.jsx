import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Search, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  X, 
  Calendar, 
  Receipt, 
  DollarSign, 
  Layers, 
  Filter, 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  allocatePayment, 
  computeCustomerLedger,
  filterByWorkspace, 
  roundTo2 
} from '../utils/invoiceMath';
import { paymentEngine } from '../services/paymentEngine';
import { toast } from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import PullToRefresh from '../components/PullToRefresh';

const CollectionCenter = ({
  invoices = [],
  customers = [],
  pendingPayments = [],
  initialCustomer = null,
  initialInvoice = null,
  currencySymbol = '₹',
  businessSettings = {},
  activeWsId = null,
  onPaymentSuccess = null,
  setCurrentTab = null
}) => {
  const [activeTab, setActiveTab] = useState('collect'); // 'collect' | 'history' | 'requests'

  // --- 1. RECORD COLLECTION STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('total_due');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- 2. HISTORY FILTER STATE ---
  const [historySearch, setHistorySearch] = useState('');
  const [historyTimeframe, setHistoryTimeframe] = useState('all'); // 'today' | 'week' | 'month' | 'all'
  const [historyMethod, setHistoryMethod] = useState('all');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

  // --- 3. PENDING REQUESTS STATE ---
  const [selectedProof, setSelectedProof] = useState(null);
  const [processingProofId, setProcessingProofId] = useState(null);

  // Workspace Scoped Invoices & Customers
  const scopedInvoices = useMemo(() => {
    return filterByWorkspace(invoices, activeWsId).filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  }, [invoices, activeWsId]);

  const scopedCustomers = useMemo(() => {
    return filterByWorkspace(customers, activeWsId);
  }, [customers, activeWsId]);

  // Pre-selection on Mount / Update
  useEffect(() => {
    if (initialInvoice) {
      const inv = scopedInvoices.find(i => i.id === initialInvoice.id) || initialInvoice;
      setSelectedInvoice(inv);
      const cust = scopedCustomers.find(c => c.id === inv.customer?.id || c.name === inv.customerName) || {
        id: inv.customer?.id || inv.customerId || 'cust_temp',
        name: inv.customerName || inv.customer?.name || 'Walk-in Customer',
        phone: inv.customerPhone || inv.customer?.phone || ''
      };
      setSelectedCustomer(cust);
      setActiveTab('collect');
    } else if (initialCustomer) {
      const cust = scopedCustomers.find(c => c.id === initialCustomer.id) || initialCustomer;
      setSelectedCustomer(cust);
      setActiveTab('collect');
    }
  }, [initialInvoice, initialCustomer, scopedInvoices, scopedCustomers]);

  // Customer Search Results
  const customerSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return scopedCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [scopedCustomers, searchQuery]);

  // Selected Customer's Invoices & Total Ledger
  const customerLedger = useMemo(() => {
    if (!selectedCustomer) return null;
    return computeCustomerLedger(selectedCustomer, scopedInvoices);
  }, [selectedCustomer, scopedInvoices]);

  const customerUnpaidInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    const cName = (selectedCustomer.name || '').toLowerCase().trim();
    const cId = selectedCustomer.id;

    return scopedInvoices.filter(inv => {
      const matchCust = (inv.customerId && inv.customerId === cId) ||
        (inv.customer?.id && inv.customer.id === cId) ||
        ((inv.customerName || inv.customer?.name || '').toLowerCase().trim() === cName);
      
      if (!matchCust) return false;
      const fin = calculateCanonicalInvoiceFinancials(inv);
      const totalDue = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;
      return totalDue > 0;
    });
  }, [selectedCustomer, scopedInvoices]);

  // Selected Invoice Financials
  const invoiceFinancials = useMemo(() => {
    if (!selectedInvoice) return null;
    return calculateCanonicalInvoiceFinancials(selectedInvoice);
  }, [selectedInvoice]);

  // Auto-set preset amounts when invoice is selected
  useEffect(() => {
    if (invoiceFinancials) {
      const maxDue = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
      if (selectedPreset === 'old_due' && invoiceFinancials.previousDue > 0) {
        setAmountInput(invoiceFinancials.previousDue.toString());
      } else if (selectedPreset === 'current_bill') {
        setAmountInput(invoiceFinancials.currentBillDue.toString());
      } else if (selectedPreset === 'total_due') {
        setAmountInput(maxDue.toString());
      }
    }
  }, [selectedInvoice, selectedPreset, invoiceFinancials]);

  // Live Allocation Breakdown
  const liveAllocation = useMemo(() => {
    const rawAmt = parseFloat(amountInput) || 0;
    const oldDue = invoiceFinancials ? invoiceFinancials.previousDue : (customerLedger ? customerLedger.totalDue : 0);
    const billTotal = invoiceFinancials ? invoiceFinancials.currentInvoiceTotal : 0;
    return allocatePayment(rawAmt, oldDue, billTotal);
  }, [amountInput, invoiceFinancials, customerLedger]);

  // Confirmed Payment History List
  const paymentHistoryList = useMemo(() => {
    const all = paymentEngine.getPaymentHistory(scopedInvoices, activeWsId);
    return all.filter(p => {
      // Timeframe Filter
      if (historyTimeframe !== 'all') {
        const pDate = new Date(p.date || 0);
        const now = new Date();
        if (historyTimeframe === 'today') {
          if (pDate.toDateString() !== now.toDateString()) return false;
        } else if (historyTimeframe === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (pDate < weekAgo) return false;
        } else if (historyTimeframe === 'month') {
          if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Method Filter
      if (historyMethod !== 'all' && (p.paymentMethod || '').toLowerCase() !== historyMethod.toLowerCase()) {
        return false;
      }

      // Search
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const match = (p.customerName || '').toLowerCase().includes(q) ||
          (p.invoiceNumber || '').toLowerCase().includes(q) ||
          (p.reference || '').toLowerCase().includes(q) ||
          (p.note || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [scopedInvoices, activeWsId, historyTimeframe, historyMethod, historySearch]);

  // Payment Methods Available
  const paymentMethods = useMemo(() => {
    const defaults = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'];
    const custom = businessSettings?.paymentMethods || [];
    const combined = Array.from(new Set([...defaults, ...custom]));
    return combined;
  }, [businessSettings]);

  // Handle Execute Payment Collection
  const handleExecutePayment = async () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid collection amount.');
      return;
    }

    if (!selectedInvoice) {
      toast.error('Please select an invoice to record this payment against.');
      return;
    }

    const maxPayable = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
    if (amt > maxPayable && maxPayable > 0) {
      toast.error(`Amount cannot exceed total outstanding due of ${formatCurrency(maxPayable, currencySymbol)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await paymentEngine.recordCustomerPayment({
        customerId: selectedCustomer?.id || selectedInvoice.customer?.id || null,
        invoiceId: selectedInvoice.id,
        amount: amt,
        paymentMethod,
        paymentDate,
        reference,
        note,
        source: 'manual_collection',
        workspaceId: activeWsId
      });

      if (result.success) {
        toast.success(`Payment of ${formatCurrency(amt, currencySymbol)} successfully recorded!`, {
          icon: '✅',
          duration: 4000
        });
        setShowConfirmModal(false);
        setAmountInput('');
        setReference('');
        setNote('');
        setSelectedInvoice(null);
        setSelectedCustomer(null);
        onPaymentSuccess?.(result);
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Payment collection error:', err);
      toast.error(err.message || 'Failed to record payment collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Link Proof Approval
  const handleApproveProof = async (proof) => {
    setProcessingProofId(proof.id);
    try {
      await paymentEngine.approvePaymentProof(proof, businessSettings?.businessName || 'Merchant');
      toast.success(`Payment proof of ${formatCurrency(proof.amount, currencySymbol)} approved!`, { icon: '✅' });
      setSelectedProof(null);
      onPaymentSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Failed to approve payment proof.');
    } finally {
      setProcessingProofId(null);
    }
  };

  // Live Link Proof Rejection
  const handleRejectProof = async (proof) => {
    setProcessingProofId(proof.id);
    try {
      await paymentEngine.rejectPaymentProof(proof, 'Rejected by merchant');
      toast.success('Payment proof rejected.');
      setSelectedProof(null);
      onPaymentSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Failed to reject payment proof.');
    } finally {
      setProcessingProofId(null);
    }
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={async () => window.dispatchEvent(new Event('billqyro_sync'))}>
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-24 px-3 sm:px-6 pt-2">

          {/* ========================================================================= */}
          {/* HEADER & NAVIGATION TABS */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-theme-card p-4 sm:p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#c2410c]/10 text-[#c2410c] dark:bg-[#c2410c]/20 flex items-center justify-center font-black">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                  Payment Collection Center
                </h1>
                <p className="text-xs text-[#78716c] dark:text-theme-muted font-medium">
                  Record, review and manage customer collections with single-source accuracy.
                </p>
              </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex items-center gap-1.5 p-1 bg-[#faf8f5] dark:bg-theme-surface rounded-xl border border-[#f0ece6] dark:border-theme-border-soft self-start md:self-auto">
              <button
                onClick={() => setActiveTab('collect')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'collect' 
                    ? 'bg-[#c2410c] text-white shadow-xs' 
                    : 'text-[#78716c] dark:text-theme-muted hover:text-[#1c1917]'
                }`}
              >
                Record Collection
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history' 
                    ? 'bg-[#c2410c] text-white shadow-xs' 
                    : 'text-[#78716c] dark:text-theme-muted hover:text-[#1c1917]'
                }`}
              >
                Payment History
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'requests' 
                    ? 'bg-[#c2410c] text-white shadow-xs' 
                    : 'text-[#78716c] dark:text-theme-muted hover:text-[#1c1917]'
                }`}
              >
                <span>Live Link Proofs</span>
                {pendingPayments.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">
                    {pendingPayments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: RECORD COLLECTION WORKFLOW */}
          {/* ========================================================================= */}
          {activeTab === 'collect' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

              {/* LEFT COLUMN: CUSTOMER & BILL SELECTOR (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">

                {/* SECTION 1: SEARCH & SELECT CUSTOMER */}
                <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#a8a29e] dark:text-theme-muted">
                      1. Select Customer
                    </span>
                    {selectedCustomer && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setSelectedInvoice(null);
                          setSearchQuery('');
                        }}
                        className="text-xs font-bold text-[#c2410c] hover:underline"
                      >
                        Change Customer
                      </button>
                    )}
                  </div>

                  {!selectedCustomer ? (
                    <div className="space-y-2 relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search customer by name, phone or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-xs font-medium text-[#1c1917] dark:text-theme-primary placeholder:text-[#a8a29e] focus:border-[#c2410c] outline-none"
                        />
                      </div>

                      {customerSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-theme-card rounded-xl border border-[#f0ece6] dark:border-theme-border-soft shadow-lg py-1 z-30 divide-y divide-[#faf8f5] dark:divide-theme-border-soft/40 max-h-56 overflow-y-auto">
                          {customerSearchResults.map(c => {
                            const cLedger = computeCustomerLedger(c, scopedInvoices);
                            return (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-[#faf5ef] dark:hover:bg-theme-surface transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-xs text-[#1c1917] dark:text-theme-primary block">{c.name}</span>
                                  <span className="text-[10px] text-[#a8a29e] font-numbers">{c.phone || 'No phone'}</span>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs font-black font-numbers ${cLedger.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatCurrency(cLedger.totalDue, currencySymbol)} due
                                  </span>
                                  <span className="text-[9px] text-[#a8a29e] block font-numbers">{cLedger.invoiceCount} bills</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SECTION 2: CUSTOMER SUMMARY CARD */
                    <div className="p-3.5 bg-[#faf8f5] dark:bg-theme-surface/60 rounded-xl border border-[#f0ece6] dark:border-theme-border-soft flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-theme-card border border-[#f0ece6] dark:border-theme-border-soft flex items-center justify-center font-bold text-[#c2410c]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#1c1917] dark:text-theme-primary">{selectedCustomer.name}</h4>
                          <p className="text-[10px] text-[#78716c] dark:text-theme-muted font-numbers">{selectedCustomer.phone || 'No phone'}</p>
                        </div>
                      </div>

                      <div className="text-right font-numbers">
                        <span className="text-[9px] font-bold text-[#a8a29e] uppercase block">Total Outstanding</span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(customerLedger?.totalDue || 0, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: SELECT INVOICE / BILL */}
                {selectedCustomer && (
                  <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#a8a29e] dark:text-theme-muted">
                        2. Select Bill to Settle
                      </span>
                      <span className="text-[10px] font-bold text-theme-muted font-numbers">
                        {customerUnpaidInvoices.length} Unpaid / Partial
                      </span>
                    </div>

                    {customerUnpaidInvoices.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#a8a29e]">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">This customer has 0 outstanding invoices!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {customerUnpaidInvoices.map(inv => {
                          const fin = calculateCanonicalInvoiceFinancials(inv);
                          const isSelected = selectedInvoice?.id === inv.id;
                          const totalReceivable = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

                          return (
                            <div
                              key={inv.id}
                              onClick={() => setSelectedInvoice(inv)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-[#faf5ef] dark:bg-theme-surface border-[#c2410c] shadow-xs' 
                                  : 'bg-[#faf8f5] dark:bg-theme-surface/40 border-[#f0ece6] dark:border-theme-border-soft hover:border-[#c2410c]/50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-[#c2410c] bg-[#c2410c] text-white' : 'border-[#d6d3d1]'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black font-mono text-[#1c1917] dark:text-theme-primary">
                                      {inv.invoiceNumber || `INV-${inv.id.slice(0, 4)}`}
                                    </span>
                                    {fin.previousDue > 0 && (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.2 rounded">
                                        +Old Due Included
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#a8a29e] font-numbers block">
                                    {inv.date || 'Recent'} • Bill Total: {formatCurrency(fin.currentInvoiceTotal, currencySymbol)}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right font-numbers shrink-0">
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                                  {formatCurrency(totalReceivable, currencySymbol)}
                                </span>
                                <span className="text-[9px] text-theme-muted block">
                                  Paid: {formatCurrency(fin.amountPaid, currencySymbol)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: PAYMENT DETAILS & SUBMISSION (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">

                {selectedInvoice && invoiceFinancials ? (
                  <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                    
                    {/* SECTION 4: FINANCIAL BREAKDOWN */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#a8a29e] dark:text-theme-muted block mb-2">
                        3. Liability Breakdown
                      </span>
                      <div className="p-3 bg-[#faf8f5] dark:bg-theme-surface/60 rounded-xl border border-[#f0ece6] dark:border-theme-border-soft space-y-1.5 text-xs font-numbers">
                        {invoiceFinancials.previousDue > 0 && (
                          <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                            <span>Previous / Old Due</span>
                            <span>+{formatCurrency(invoiceFinancials.previousDue, currencySymbol)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#78716c] dark:text-theme-muted font-medium">
                          <span>Current Invoice Total</span>
                          <span>{formatCurrency(invoiceFinancials.currentInvoiceTotal, currencySymbol)}</span>
                        </div>
                        {invoiceFinancials.amountPaid > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Amount Already Paid</span>
                            <span>-{formatCurrency(invoiceFinancials.amountPaid, currencySymbol)}</span>
                          </div>
                        )}
                        <div className="border-t border-[#f0ece6] dark:border-theme-border-soft pt-1.5 flex justify-between font-black text-[#1c1917] dark:text-theme-primary">
                          <span>TOTAL CUSTOMER DUE</span>
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue, currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: AMOUNT INPUT & PRESETS */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#a8a29e] dark:text-theme-muted block">
                        4. Amount Received ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-[#78716c]">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="0.00"
                          value={amountInput}
                          onChange={(e) => {
                            setAmountInput(e.target.value);
                            setSelectedPreset('custom');
                          }}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-sm font-black font-numbers text-[#1c1917] dark:text-theme-primary focus:border-[#c2410c] outline-none"
                        />
                      </div>

                      {/* SMART PRESET BUTTONS (PREVIOUS DUE FIRST) */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {invoiceFinancials.previousDue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreset('old_due');
                              setAmountInput(invoiceFinancials.previousDue.toString());
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              selectedPreset === 'old_due' 
                                ? 'bg-amber-500 text-white border-amber-600' 
                                : 'bg-[#faf8f5] dark:bg-theme-surface text-amber-700 dark:text-amber-400 border-[#f0ece6]'
                            }`}
                          >
                            Clear Previous Due ({formatCurrency(invoiceFinancials.previousDue, currencySymbol)})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset('current_bill');
                            setAmountInput(invoiceFinancials.currentBillDue.toString());
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            selectedPreset === 'current_bill' 
                              ? 'bg-[#c2410c] text-white border-[#c2410c]' 
                              : 'bg-[#faf8f5] dark:bg-theme-surface text-[#78716c] dark:text-theme-muted border-[#f0ece6]'
                          }`}
                        >
                          Pay Current Bill ({formatCurrency(invoiceFinancials.currentBillDue, currencySymbol)})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset('total_due');
                            const max = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
                            setAmountInput(max.toString());
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            selectedPreset === 'total_due' 
                              ? 'bg-emerald-600 text-white border-emerald-700' 
                              : 'bg-[#faf8f5] dark:bg-theme-surface text-emerald-700 dark:text-emerald-400 border-[#f0ece6]'
                          }`}
                        >
                          Pay Total Due ({formatCurrency(invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue, currencySymbol)})
                        </button>
                      </div>
                    </div>

                    {/* SECTION 6: PAYMENT METHOD */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#a8a29e] dark:text-theme-muted block">
                        5. Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {paymentMethods.slice(0, 6).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                              paymentMethod === m 
                                ? 'bg-[#c2410c] text-white border-[#c2410c] shadow-2xs' 
                                : 'bg-[#faf8f5] dark:bg-theme-surface text-[#44403c] dark:text-theme-secondary border-[#f0ece6] dark:border-theme-border-soft'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 7: OPTIONAL METADATA */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[#a8a29e] uppercase block mb-1">Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[#a8a29e] uppercase block mb-1">Reference / Txn ID</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI Ref / Cash"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* LIVE ALLOCATION PREVIEW */}
                    {parseFloat(amountInput) > 0 && (
                      <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                          Allocation Preview
                        </span>
                        <div className="flex justify-between font-bold text-theme-primary font-numbers">
                          <span>To Previous Due:</span>
                          <span>{formatCurrency(liveAllocation.allocatedToOldDue, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-theme-primary font-numbers">
                          <span>To Current Bill:</span>
                          <span>{formatCurrency(liveAllocation.allocatedToCurrentInvoice, currencySymbol)}</span>
                        </div>
                      </div>
                    )}

                    {/* SECTION 8: CONFIRM COLLECTION BUTTON */}
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isSubmitting || !parseFloat(amountInput)}
                      className="w-full py-3 bg-[#c2410c] hover:bg-[#b43e0b] text-white rounded-2xl text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>Review & Confirm Collection</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>

                  </div>
                ) : (
                  <div className="bg-white dark:bg-theme-card p-10 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs text-center text-xs text-[#a8a29e] space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-[#d6d3d1]" />
                    <p className="font-bold">Select a customer and bill from the left to record payment.</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: CONFIRMED PAYMENT HISTORY */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
              
              {/* FILTERS HEADER */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#f5f2ed] dark:border-theme-border-soft pb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#a8a29e] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by customer, invoice #, reference..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-xs font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* TIMEFRAME BUTTONS */}
                  {['all', 'today', 'week', 'month'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setHistoryTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                        historyTimeframe === tf 
                          ? 'bg-[#c2410c] text-white shadow-2xs' 
                          : 'bg-[#faf8f5] dark:bg-theme-surface text-[#78716c] hover:bg-[#faf5ef]'
                      }`}
                    >
                      {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'Today'}
                    </button>
                  ))}
                </div>
              </div>

              {/* PAYMENT RECORDS TABLE */}
              {paymentHistoryList.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#a8a29e]">
                  <CreditCard className="w-8 h-8 mx-auto text-[#d6d3d1] mb-2" />
                  <p>No confirmed payments found matching your filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[9px] font-bold text-[#a8a29e] uppercase tracking-wider border-b border-[#f5f2ed] dark:border-theme-border-soft pb-2">
                        <th className="pb-2.5">DATE</th>
                        <th className="pb-2.5">CUSTOMER</th>
                        <th className="pb-2.5">INVOICE</th>
                        <th className="pb-2.5">METHOD</th>
                        <th className="pb-2.5 text-right">AMOUNT</th>
                        <th className="pb-2.5">ALLOCATION</th>
                        <th className="pb-2.5 text-center">STATUS</th>
                        <th className="pb-2.5 text-center">DETAILS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#faf8f5] dark:divide-theme-border-soft/40">
                      {paymentHistoryList.map(p => {
                        const dateStr = p.date ? new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                        return (
                          <tr key={p.id} className="hover:bg-[#faf8f5] dark:hover:bg-theme-surface/50 transition-colors">
                            <td className="py-3 font-medium text-[#78716c] dark:text-theme-muted whitespace-nowrap">{dateStr}</td>
                            <td className="py-3 font-bold text-[#1c1917] dark:text-theme-primary">{p.customerName}</td>
                            <td className="py-3 font-mono font-bold text-xs text-[#c2410c]">{p.invoiceNumber}</td>
                            <td className="py-3 font-medium text-[#44403c] dark:text-theme-secondary">
                              <span className="px-2 py-0.5 rounded-md bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] text-[10px] font-bold">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 text-right font-black font-numbers text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.amount, currencySymbol)}
                            </td>
                            <td className="py-3 text-[10px] font-numbers text-theme-muted">
                              {p.allocatedToOldDue > 0 && (
                                <span className="text-amber-600 block">Prev Due: {formatCurrency(p.allocatedToOldDue, currencySymbol)}</span>
                              )}
                              <span>Current: {formatCurrency(p.allocatedToCurrentInvoice, currencySymbol)}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                Confirmed
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => setSelectedPaymentDetail(p)}
                                className="p-1 hover:text-[#c2410c] rounded-md transition-colors cursor-pointer"
                                title="View Payment Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: LIVE LINK PENDING REQUESTS */}
          {/* ========================================================================= */}
          {activeTab === 'requests' && (
            <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f5f2ed] dark:border-theme-border-soft pb-3">
                <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary">
                  Live Link Payment Proof Requests ({pendingPayments.length})
                </h3>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#a8a29e]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">All caught up! Zero pending customer proof submissions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingPayments.map(proof => (
                    <div key={proof.id} className="p-4 rounded-xl border border-[#f0ece6] dark:border-theme-border-soft bg-[#faf8f5] dark:bg-theme-surface/50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-xs text-[#1c1917] dark:text-theme-primary block">
                            Invoice #{proof.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-[#78716c] font-medium">{proof.customerName || 'Customer'}</span>
                        </div>
                        <span className="text-sm font-black font-numbers text-[#1c1917] dark:text-theme-primary">
                          {formatCurrency(proof.amount, currencySymbol)}
                        </span>
                      </div>

                      <div className="text-[10px] text-theme-muted font-numbers space-y-1">
                        <div>Method: <strong>{proof.paymentMethod || 'UPI'}</strong></div>
                        {proof.transactionId && <div>Txn ID: <code className="font-mono">{proof.transactionId}</code></div>}
                      </div>

                      {proof.screenshotUrl && (
                        <button
                          onClick={() => setSelectedProof(proof)}
                          className="w-full py-2 bg-white dark:bg-theme-card border border-[#f0ece6] rounded-xl text-[10px] font-bold text-[#c2410c] flex items-center justify-center gap-1.5 hover:bg-[#faf5ef] cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Screenshot Proof</span>
                        </button>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={processingProofId === proof.id}
                          onClick={() => handleRejectProof(proof)}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          disabled={processingProofId === proof.id}
                          onClick={() => handleApproveProof(proof)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingProofId === proof.id ? 'Approving...' : 'Accept & Settle'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card w-full max-w-md rounded-3xl p-5 border border-[#f0ece6] dark:border-theme-border-soft shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#f0ece6] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#c2410c]" />
                    <h3 className="text-sm font-black text-[#1c1917] dark:text-theme-primary">
                      Confirm Collection
                    </h3>
                  </div>
                  <button onClick={() => setShowConfirmModal(false)} className="p-1 text-[#a8a29e] hover:text-[#1c1917]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-numbers">
                  <div className="p-3 bg-[#faf8f5] dark:bg-theme-surface rounded-xl border border-[#f0ece6] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#78716c]">Customer:</span>
                      <span className="font-bold text-[#1c1917] dark:text-theme-primary">{selectedCustomer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716c]">Invoice:</span>
                      <span className="font-bold font-mono text-[#c2410c]">{selectedInvoice?.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716c]">Method:</span>
                      <span className="font-bold">{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-emerald-600 dark:text-emerald-400 pt-1 border-t border-[#f0ece6]">
                      <span>Amount Received:</span>
                      <span>{formatCurrency(parseFloat(amountInput) || 0, currencySymbol)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider text-[9px]">
                      Canonical Allocation
                    </span>
                    <div className="flex justify-between">
                      <span>Applied to Previous Due:</span>
                      <span className="font-bold text-[#1c1917] dark:text-theme-primary">
                        {formatCurrency(liveAllocation.allocatedToOldDue, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applied to Current Bill:</span>
                      <span className="font-bold text-[#1c1917] dark:text-theme-primary">
                        {formatCurrency(liveAllocation.allocatedToCurrentInvoice, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#faf8f5] dark:bg-theme-surface text-[#78716c] hover:bg-[#faf5ef] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleExecutePayment}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#c2410c] hover:bg-[#b43e0b] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm & Save'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* READ-ONLY PAYMENT DETAIL MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedPaymentDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card w-full max-w-md rounded-3xl p-5 border border-[#f0ece6] dark:border-theme-border-soft shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#f0ece6] pb-3">
                  <h3 className="text-sm font-black text-[#1c1917] dark:text-theme-primary">
                    Payment Detail ({selectedPaymentDetail.id})
                  </h3>
                  <button onClick={() => setSelectedPaymentDetail(null)} className="p-1 text-[#a8a29e] hover:text-[#1c1917]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs font-numbers">
                  <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                    <span className="text-[#a8a29e]">Customer:</span>
                    <span className="font-bold">{selectedPaymentDetail.customerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                    <span className="text-[#a8a29e]">Invoice:</span>
                    <span className="font-bold font-mono text-[#c2410c]">{selectedPaymentDetail.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                    <span className="text-[#a8a29e]">Amount:</span>
                    <span className="font-black text-emerald-600">{formatCurrency(selectedPaymentDetail.amount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                    <span className="text-[#a8a29e]">Payment Method:</span>
                    <span className="font-bold">{selectedPaymentDetail.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                    <span className="text-[#a8a29e]">Date:</span>
                    <span>{new Date(selectedPaymentDetail.date).toLocaleString()}</span>
                  </div>
                  {selectedPaymentDetail.reference && (
                    <div className="flex justify-between py-1 border-b border-[#faf8f5]">
                      <span className="text-[#a8a29e]">Reference:</span>
                      <span className="font-mono">{selectedPaymentDetail.reference}</span>
                    </div>
                  )}
                  {selectedPaymentDetail.note && (
                    <div className="py-1">
                      <span className="text-[#a8a29e] block mb-1">Note:</span>
                      <p className="p-2 bg-[#faf8f5] dark:bg-theme-surface rounded-lg text-[11px] text-[#44403c]">
                        {selectedPaymentDetail.note}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPaymentDetail(null)}
                  className="w-full py-2.5 bg-[#faf8f5] dark:bg-theme-surface rounded-xl text-xs font-bold text-[#1c1917] hover:bg-[#faf5ef] cursor-pointer"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PROOF SCREENSHOT MODAL */}
        <AnimatePresence>
          {selectedProof && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card w-full max-w-lg rounded-3xl p-5 border border-[#f0ece6] shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-[#f0ece6] pb-3">
                  <h3 className="text-xs font-black">Proof for #{selectedProof.invoiceNumber}</h3>
                  <button onClick={() => setSelectedProof(null)} className="p-1 text-[#a8a29e] hover:text-[#1c1917]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto flex items-center justify-center bg-black/5 rounded-xl p-2">
                  <img
                    src={selectedProof.screenshotUrl}
                    alt="Payment Proof"
                    className="max-w-full max-h-[55vh] object-contain rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRejectProof(selectedProof)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveProof(selectedProof)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Approve & Settle
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </PullToRefresh>
    </AnimatedPage>
  );
};

export default CollectionCenter;

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Search, 
  User, 
  Users,
  Briefcase,
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
  AlertTriangle,
  Wallet,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Building2,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  Coins,
  Heart,
  Plus,
  Target
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
import { bankEngine } from '../services/bankEngine';
import { toast } from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import PullToRefresh from '../components/PullToRefresh';

const TRANSACTION_CATEGORIES = [
  { id: 'customer_payment', label: 'Customer Payment', bucket: 'Website Income', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'withdrawal', label: 'Withdraw', bucket: 'Website → Personal', icon: ArrowUpRight, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'transfer', label: 'Cash ↔ PhonePe', bucket: 'Transfer', icon: Smartphone, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'dream_transfer', label: 'My Dream Transfer', bucket: 'Savings Goal', icon: Heart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/30' },
  { id: 'personal_expense', label: 'Personal Expense', bucket: 'Cash / PhonePe', icon: Tag, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
  { id: 'my_salary', label: 'My Salary', bucket: 'Owner Allocation', icon: Wallet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { id: 'staff_salary', label: 'Staff Salary', bucket: 'Staff Payout', icon: Users, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
  { id: 'staff_advance', label: 'Staff Advance', bucket: 'Staff Advance', icon: Clock, color: 'text-amber-600 bg-amber-600/10 border-amber-600/30' },
  { id: 'vendor_payment', label: 'Vendor / Outsource', bucket: 'Vendor Payout', icon: Briefcase, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
  { id: 'customer_refund', label: 'Customer Refund', bucket: 'Customer Refund', icon: RotateCcw, color: 'text-rose-600 bg-rose-600/10 border-rose-600/30' },
  { id: 'expense', label: 'Business Expense', bucket: 'Operational', icon: Tag, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  { id: 'money_in', label: 'Other Money In', bucket: 'General Inflow', icon: ArrowDownLeft, color: 'text-teal-500 bg-teal-500/10 border-teal-500/30' },
  { id: 'money_out', label: 'Other Money Out', bucket: 'General Outflow', icon: ArrowUpRight, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' }
];

const CollectionCenter = ({
  invoices = [],
  customers = [],
  staffs = [],
  vendors = [],
  expenses = [],
  pendingPayments = [],
  initialCustomer = null,
  initialInvoice = null,
  initialStaff = null,
  initialVendor = null,
  initialPaymentType = null,
  initialTab = 'record',
  currencySymbol = '₹',
  businessSettings = {},
  activeWsId = null,
  onPaymentSuccess = null,
  setCurrentTab = null
}) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'history' ? 'history' : (initialTab === 'requests' ? 'requests' : 'record'));
  const [selectedTxType, setSelectedTxType] = useState('customer_payment');

  // --- Dynamic Store Hooks for Bank, Outsource, and Dreams ---
  const [liveBankLedger, setLiveBankLedger] = useState([]);
  const [liveVendors, setLiveVendors] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [newDreamName, setNewDreamName] = useState('');
  const [newDreamTarget, setNewDreamTarget] = useState('');
  const [newDreamDate, setNewDreamDate] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchAuxData = async () => {
      try {
        const state = await bankEngine.getState();
        if (mounted && Array.isArray(state?.ledger)) {
          setLiveBankLedger(state.ledger);
        }
      } catch (e) {
        console.warn('Bank ledger fetch notice:', e);
      }
      try {
        const { getVendors, getOutsourceJobs } = await import('../services/outsourceEngine');
        if (mounted) {
          const vList = await getVendors();
          const jList = await getOutsourceJobs();
          if (Array.isArray(vList)) setLiveVendors(vList);
          if (Array.isArray(jList)) setLiveJobs(jList);
        }
      } catch (e) {
        /* outsource optional */
      }
    };
    fetchAuxData();
    const handleBankUpdate = () => fetchAuxData();
    window.addEventListener('billqyro_bank_updated', handleBankUpdate);
    window.addEventListener('billqyro_outsource_updated', handleBankUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('billqyro_bank_updated', handleBankUpdate);
      window.removeEventListener('billqyro_outsource_updated', handleBankUpdate);
    };
  }, []);

  // --- Workspace Scoped Data ---
  const scopedInvoices = useMemo(() => {
    return filterByWorkspace(invoices, activeWsId).filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  }, [invoices, activeWsId]);

  const scopedCustomers = useMemo(() => {
    return filterByWorkspace(customers, activeWsId);
  }, [customers, activeWsId]);

  const scopedStaffs = useMemo(() => {
    return staffs || [];
  }, [staffs]);

  const combinedVendors = useMemo(() => {
    return liveVendors.length > 0 ? liveVendors : (vendors || []);
  }, [liveVendors, vendors]);

  // --- Canonical Financial Bucket Balances ---
  const bucketFinancials = useMemo(() => {
    return paymentEngine.calculateFinancialBuckets({
      invoices: scopedInvoices,
      bankLedger: liveBankLedger,
      workspaceId: activeWsId
    });
  }, [scopedInvoices, liveBankLedger, activeWsId]);

  // --- 1. RECORD TRANSACTION FORM STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDreamGoal, setSelectedDreamGoal] = useState(null);

  // Common Form Fields
  const [amountInput, setAmountInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('total_due');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transferSource, setTransferSource] = useState('my_cash');
  const [transferDest, setTransferDest] = useState('phonepe');
  const [withdrawDest, setWithdrawDest] = useState('my_cash');
  const [personalExpenseSource, setPersonalExpenseSource] = useState('my_cash');
  const [dreamTransferDirection, setDreamTransferDirection] = useState('to_dream'); // 'to_dream' | 'from_dream'
  const [dreamPaymentChannel, setDreamPaymentChannel] = useState('phonepe'); // 'phonepe' | 'my_cash'

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [categoryInput, setCategoryInput] = useState('Supplies');
  const [titleInput, setTitleInput] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- 2. HISTORY FILTER STATES ---
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyTimeframe, setHistoryTimeframe] = useState('all');
  const [historyMethod, setHistoryMethod] = useState('all');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

  // --- 3. PENDING REQUESTS STATES ---
  const [selectedProof, setSelectedProof] = useState(null);
  const [processingProofId, setProcessingProofId] = useState(null);

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
      setSelectedTxType('customer_payment');
      setActiveTab('record');
    } else if (initialCustomer) {
      const cust = scopedCustomers.find(c => c.id === initialCustomer.id) || initialCustomer;
      setSelectedCustomer(cust);
      setSelectedTxType('customer_payment');
      setActiveTab('record');
    } else if (initialStaff) {
      const st = scopedStaffs.find(s => s.id === initialStaff.id) || initialStaff;
      setSelectedStaff(st);
      if (initialPaymentType === 'Staff Advance') {
        setSelectedTxType('staff_advance');
      } else {
        setSelectedTxType('staff_salary');
      }
      setActiveTab('record');
    } else if (initialVendor) {
      const vd = combinedVendors.find(v => v.id === initialVendor.id) || initialVendor;
      setSelectedVendor(vd);
      setSelectedTxType('vendor_payment');
      setActiveTab('record');
    }
  }, [initialInvoice, initialCustomer, initialStaff, initialVendor, initialPaymentType, scopedInvoices, scopedCustomers, scopedStaffs, combinedVendors]);

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

  // Staff Search Results
  const staffSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return scopedStaffs.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    ).slice(0, 8);
  }, [scopedStaffs, searchQuery]);

  // Vendor Search Results
  const vendorSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return combinedVendors.filter(v => 
      (v.name || '').toLowerCase().includes(q) ||
      (v.phone || '').includes(q) ||
      (v.category || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [combinedVendors, searchQuery]);

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

  // Staff Financial Summary
  const staffFinancials = useMemo(() => {
    if (!selectedStaff) return null;
    const staffBills = scopedInvoices.filter(inv => inv.staffId === selectedStaff.id);
    let totalEarned = 0;
    staffBills.forEach(inv => {
      totalEarned += (inv.total || inv.grandTotal || 0);
    });

    const staffPayments = liveBankLedger.filter(tx => tx.staffId === selectedStaff.id && !tx.reversed);
    let totalPaid = 0;
    let totalAdvance = 0;

    staffPayments.forEach(tx => {
      const cat = (tx.category || '').toLowerCase();
      const amt = tx.amountRupees !== undefined ? tx.amountRupees : (tx.amountPaise ? tx.amountPaise / 100 : 0);
      if ((cat.includes('staff payment') || cat.includes('salary') || cat.includes('wages')) && tx.type !== 'moneyIn') {
        totalPaid += amt;
      }
      if (cat.includes('staff advance') && tx.type !== 'moneyIn') {
        totalAdvance += amt;
      }
    });

    const remainingPayable = Math.max(0, totalEarned - totalPaid - totalAdvance);

    return {
      totalEarned,
      totalPaid,
      totalAdvance,
      remainingPayable
    };
  }, [selectedStaff, scopedInvoices, liveBankLedger]);

  // Vendor Financial Summary
  const vendorFinancials = useMemo(() => {
    if (!selectedVendor) return null;
    const vJobs = liveJobs.filter(j => j.vendorId === selectedVendor.id && !j.isDeleted);
    const totalAgreed = vJobs.reduce((sum, j) => sum + (Number(j.agreedCost) || 0), 0);
    const vPayments = liveBankLedger.filter(tx => tx.vendorId === selectedVendor.id && !tx.reversed);
    const totalPaid = vPayments.reduce((sum, tx) => sum + (tx.amountRupees !== undefined ? tx.amountRupees : (tx.amountPaise ? tx.amountPaise / 100 : 0)), 0);
    const remainingPayable = Math.max(0, totalAgreed - totalPaid);
    return {
      totalAgreed,
      totalPaid,
      remainingPayable,
      jobs: vJobs
    };
  }, [selectedVendor, liveJobs, liveBankLedger]);

  // Auto-set preset amounts
  useEffect(() => {
    if (selectedTxType === 'customer_payment' && invoiceFinancials) {
      const maxDue = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
      if (selectedPreset === 'old_due' && invoiceFinancials.previousDue > 0) {
        setAmountInput(invoiceFinancials.previousDue.toString());
      } else if (selectedPreset === 'current_bill') {
        setAmountInput(invoiceFinancials.currentBillDue.toString());
      } else if (selectedPreset === 'total_due') {
        setAmountInput(maxDue.toString());
      }
    } else if (selectedTxType === 'staff_salary' && staffFinancials) {
      if (selectedPreset === 'full_payable') {
        setAmountInput(staffFinancials.remainingPayable > 0 ? staffFinancials.remainingPayable.toString() : '');
      }
    } else if (selectedTxType === 'vendor_payment' && vendorFinancials) {
      if (selectedPreset === 'full_payable') {
        setAmountInput(vendorFinancials.remainingPayable > 0 ? vendorFinancials.remainingPayable.toString() : '');
      }
    }
  }, [selectedTxType, selectedInvoice, selectedPreset, invoiceFinancials, staffFinancials, vendorFinancials]);

  // Live Allocation Breakdown for Customer Invoices
  const liveAllocation = useMemo(() => {
    const rawAmt = parseFloat(amountInput) || 0;
    const oldDue = invoiceFinancials ? invoiceFinancials.previousDue : (customerLedger ? customerLedger.totalDue : 0);
    const billTotal = invoiceFinancials ? invoiceFinancials.currentInvoiceTotal : 0;
    return allocatePayment(rawAmt, oldDue, billTotal);
  }, [amountInput, invoiceFinancials, customerLedger]);

  // Confirmed Unified Transaction History
  const unifiedHistoryList = useMemo(() => {
    const all = paymentEngine.getUnifiedTransactionHistory({
      invoices: scopedInvoices,
      bankLedger: liveBankLedger,
      workspaceId: activeWsId
    });

    return all.filter(p => {
      // Type Filter
      if (historyTypeFilter !== 'all') {
        if (historyTypeFilter === 'customer' && p.type !== 'customer_payment') return false;
        if (historyTypeFilter === 'staff' && p.type !== 'staff_salary' && p.type !== 'staff_advance' && p.type !== 'other_staff_payment') return false;
        if (historyTypeFilter === 'vendor' && p.type !== 'vendor_payment') return false;
        if (historyTypeFilter === 'refund' && p.type !== 'customer_refund') return false;
        if (historyTypeFilter === 'expense' && p.type !== 'expense' && p.type !== 'personal_expense') return false;
        if (historyTypeFilter === 'transfer' && !p.isTransfer && p.type !== 'transfer' && p.type !== 'withdrawal') return false;
        if (historyTypeFilter === 'in' && p.direction !== 'IN') return false;
        if (historyTypeFilter === 'out' && p.direction !== 'OUT' && p.direction !== 'WITHDRAW') return false;
      }

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

      // Search Filter
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const match = (p.customerName || '').toLowerCase().includes(q) ||
          (p.staffName || '').toLowerCase().includes(q) ||
          (p.vendorName || '').toLowerCase().includes(q) ||
          (p.invoiceNumber || '').toLowerCase().includes(q) ||
          (p.reference || '').toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.note || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [scopedInvoices, liveBankLedger, activeWsId, historyTypeFilter, historyTimeframe, historyMethod, historySearch]);

  // Financial History KPI Stats
  const historyKPIs = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    unifiedHistoryList.forEach(t => {
      if (t.direction === 'IN') {
        totalIn += t.amount;
      } else if (t.direction === 'OUT' || t.direction === 'WITHDRAW') {
        totalOut += t.amount;
      }
    });
    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      count: unifiedHistoryList.length
    };
  }, [unifiedHistoryList]);

  // Payment Methods Available
  const paymentMethods = useMemo(() => {
    const defaults = ['Cash', 'UPI', 'PhonePe', 'Bank Transfer', 'Card', 'Other'];
    const custom = businessSettings?.paymentMethods || [];
    return Array.from(new Set([...defaults, ...custom]));
  }, [businessSettings]);

  // Reset form inputs
  const resetForm = () => {
    setAmountInput('');
    setReference('');
    setNote('');
    setTitleInput('');
    setRefundReason('');
    setSelectedInvoice(null);
    setSelectedCustomer(null);
    setSelectedStaff(null);
    setSelectedVendor(null);
    setSelectedJob(null);
    setShowConfirmModal(false);
  };

  // Canonical Submission Handler
  const handleExecuteTransaction = async () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result = null;

      if (selectedTxType === 'customer_payment') {
        if (!selectedInvoice) {
          toast.error('Please select an invoice to record this payment against.');
          setIsSubmitting(false);
          return;
        }
        const maxPayable = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
        if (amt > maxPayable && maxPayable > 0) {
          toast.error(`Amount cannot exceed total outstanding due of ${formatCurrency(maxPayable, currencySymbol)}`);
          setIsSubmitting(false);
          return;
        }

        result = await paymentEngine.recordCustomerPayment({
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
      } else if (selectedTxType === 'withdrawal') {
        result = await paymentEngine.recordWithdrawal({
          amount: amt,
          destination: withdrawDest,
          paymentMethod: withdrawDest === 'phonepe' ? 'PhonePe' : 'Cash',
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'transfer') {
        result = await paymentEngine.recordMoneyTransfer({
          fromLocation: transferSource,
          toLocation: transferDest,
          amount: amt,
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'dream_transfer') {
        const dream = selectedDreamGoal || bucketFinancials.dreamGoals?.[0];
        const fromLoc = dreamTransferDirection === 'to_dream' ? dreamPaymentChannel : 'my_dream';
        const toLoc = dreamTransferDirection === 'to_dream' ? 'my_dream' : dreamPaymentChannel;

        result = await paymentEngine.recordMoneyTransfer({
          fromLocation: fromLoc,
          toLocation: toLoc,
          amount: amt,
          dreamId: dream?.id || null,
          dreamName: dream?.name || 'Dream Goal',
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'personal_expense') {
        result = await paymentEngine.recordPersonalExpense({
          location: personalExpenseSource,
          category: categoryInput || 'Personal Expense',
          title: titleInput || 'Personal Expense',
          amount: amt,
          paymentDate,
          reason: titleInput,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'my_salary') {
        result = await paymentEngine.recordOwnerSalary({
          amount: amt,
          paymentMethod,
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'staff_salary' || selectedTxType === 'staff_advance') {
        if (!selectedStaff) {
          toast.error('Please select a staff member.');
          setIsSubmitting(false);
          return;
        }
        const payType = selectedTxType === 'staff_advance' ? 'Staff Advance' : 'Salary / Wages';
        result = await paymentEngine.recordStaffPayment({
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
          amount: amt,
          paymentType: payType,
          paymentMethod,
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'vendor_payment') {
        if (!selectedVendor) {
          toast.error('Please select a vendor.');
          setIsSubmitting(false);
          return;
        }
        result = await paymentEngine.recordVendorPayment({
          vendorId: selectedVendor.id,
          vendorName: selectedVendor.name,
          jobId: selectedJob?.id || null,
          jobCode: selectedJob?.jobCode || '',
          amount: amt,
          paymentMethod,
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'customer_refund') {
        result = await paymentEngine.recordCustomerRefund({
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || 'Customer',
          invoiceId: selectedInvoice?.id || null,
          invoiceNumber: selectedInvoice?.invoiceNumber || '',
          amount: amt,
          paymentMethod,
          paymentDate,
          reference,
          note,
          reason: refundReason,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'expense') {
        result = await paymentEngine.recordExpenseTransaction({
          title: titleInput || categoryInput || 'Expense',
          category: categoryInput,
          amount: amt,
          paymentMethod,
          paymentDate,
          reference,
          note,
          workspaceId: activeWsId
        });
      } else if (selectedTxType === 'money_in' || selectedTxType === 'money_out') {
        result = await paymentEngine.recordGeneralMoneyTransaction({
          type: selectedTxType === 'money_in' ? 'moneyIn' : 'moneyOut',
          category: categoryInput || (selectedTxType === 'money_in' ? 'Other Income' : 'Other Expense'),
          title: titleInput || (selectedTxType === 'money_in' ? 'Money In' : 'Money Out'),
          amount: amt,
          paymentMethod,
          paymentDate,
          reference,
          note,
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || '',
          staffId: selectedStaff?.id || null,
          staffName: selectedStaff?.name || '',
          vendorId: selectedVendor?.id || null,
          vendorName: selectedVendor?.name || '',
          workspaceId: activeWsId
        });
      }

      toast.success(`Transaction of ${formatCurrency(amt, currencySymbol)} successfully recorded!`, {
        icon: '✅',
        duration: 4000
      });

      resetForm();
      onPaymentSuccess?.(result);
      setActiveTab('history');
    } catch (err) {
      console.error('Transaction execution error:', err);
      toast.error(err.message || 'Failed to record transaction.');
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

  const handleCreateDreamGoal = () => {
    if (!newDreamName.trim()) {
      toast.error('Please enter a dream name.');
      return;
    }
    const target = parseFloat(newDreamTarget) || 0;
    paymentEngine.saveDreamGoal({
      name: newDreamName.trim(),
      targetAmount: target,
      targetDate: newDreamDate
    }, activeWsId);
    toast.success('Dream goal created!');
    setNewDreamName('');
    setNewDreamTarget('');
    setNewDreamDate('');
    setShowDreamModal(false);
  };

  const handleRefresh = async () => {
    try {
      const { invoiceEngine } = await import('../services/invoiceEngine');
      await invoiceEngine.syncFromCloud?.();
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
    } catch (e) {
      /* non-blocking */
    }
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-28">

          {/* 1. TOP HEADER & MAIN NAVIGATION SEGMENT */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-theme-primary flex items-center gap-2">
                    Money & Payment Center
                  </h1>
                  <p className="text-xs text-theme-muted">
                    Authoritative financial ledger for all money in & out across BillQyro
                  </p>
                </div>
              </div>
            </div>

            {/* Segment Tab Controls */}
            <div className="flex items-center p-1 bg-theme-surface rounded-2xl border border-theme-border-soft self-start md:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('record')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'record'
                    ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Transaction</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Unified History</span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                  activeTab === 'requests'
                    ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Pending Approvals</span>
                {pendingPayments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-2xs font-black bg-rose-500 text-white rounded-full animate-pulse">
                    {pendingPayments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FINANCIAL BUCKETS SUMMARY STRIP (Cream / Terracotta Visuals) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Website Income */}
            <div className="card-premium p-3.5 border-l-4 border-l-emerald-500 relative overflow-hidden">
              <div className="flex items-center justify-between text-2xs font-bold text-theme-muted uppercase mb-1">
                <span>Website Income</span>
                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-lg font-black text-emerald-600 tabular-nums">
                {formatCurrency(bucketFinancials.websiteIncomeAvailable, currencySymbol)}
              </div>
              <div className="text-[10px] text-theme-muted mt-0.5">Available Business Money</div>
            </div>

            {/* 2. My Cash */}
            <div className="card-premium p-3.5 border-l-4 border-l-amber-500 relative overflow-hidden">
              <div className="flex items-center justify-between text-2xs font-bold text-theme-muted uppercase mb-1">
                <span>My Cash</span>
                <Coins className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-lg font-black text-amber-600 tabular-nums">
                {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)}
              </div>
              <div className="text-[10px] text-theme-muted mt-0.5">Physical Cash in Hand</div>
            </div>

            {/* 3. PhonePe */}
            <div className="card-premium p-3.5 border-l-4 border-l-indigo-500 relative overflow-hidden">
              <div className="flex items-center justify-between text-2xs font-bold text-theme-muted uppercase mb-1">
                <span>PhonePe</span>
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-lg font-black text-indigo-600 tabular-nums">
                {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)}
              </div>
              <div className="text-[10px] text-theme-muted mt-0.5">Online Personal Money</div>
            </div>

            {/* 4. My Dream */}
            <div className="card-premium p-3.5 border-l-4 border-l-pink-500 relative overflow-hidden">
              <div className="flex items-center justify-between text-2xs font-bold text-theme-muted uppercase mb-1">
                <span>My Dream</span>
                <Heart className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <div className="text-lg font-black text-pink-600 tabular-nums">
                {formatCurrency(bucketFinancials.myDreamBalance, currencySymbol)}
              </div>
              <div className="text-[10px] text-theme-muted mt-0.5">Allocated Savings Goals</div>
            </div>

            {/* 5. Personal Available Total */}
            <div className="card-premium p-3.5 border-l-4 border-l-theme-accent col-span-2 md:col-span-3 lg:col-span-1 bg-theme-accent/5">
              <div className="flex items-center justify-between text-2xs font-bold text-theme-muted uppercase mb-1">
                <span>Personal Available</span>
                <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
              </div>
              <div className="text-lg font-black text-theme-accent tabular-nums">
                {formatCurrency(bucketFinancials.personalAvailableTotal, currencySymbol)}
              </div>
              <div className="text-[10px] text-theme-muted mt-0.5">Cash + PhonePe + Dream</div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: RECORD TRANSACTION */}
          {/* ========================================================================= */}
          {activeTab === 'record' && (
            <div className="space-y-6">

              {/* Transaction Type Picker Bar */}
              <div className="card-premium p-4">
                <div className="text-2xs uppercase tracking-wider font-bold text-theme-muted mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-theme-accent" />
                    Select Transaction Category
                  </div>
                  {selectedTxType === 'dream_transfer' && (
                    <button
                      type="button"
                      onClick={() => setShowDreamModal(true)}
                      className="text-2xs font-bold text-pink-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Dream Goal
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {TRANSACTION_CATEGORIES.map(t => {
                    const Icon = t.icon;
                    const isSelected = selectedTxType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTxType(t.id);
                          setAmountInput('');
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? `${t.color} border-current shadow-md scale-[1.02] font-black`
                            : 'bg-theme-surface/50 border-theme-border-soft text-theme-muted hover:text-theme-primary hover:border-theme-border'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1.5">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-2xs font-bold leading-tight line-clamp-1">{t.label}</span>
                        <span className="text-[9px] font-mono text-theme-muted opacity-80 mt-0.5">
                          {t.bucket}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Body according to selected transaction type */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Entity Selection & Context */}
                <div className="lg:col-span-7 space-y-6">

                  {/* 1.A: CUSTOMER PAYMENT CONTEXT */}
                  {selectedTxType === 'customer_payment' && (
                    <>
                      {/* Customer Selector Card */}
                      <div className="card-premium p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                            <User className="w-4 h-4 text-theme-accent" />
                            1. Select Customer
                          </h3>
                          {selectedCustomer && (
                            <button
                              onClick={() => {
                                setSelectedCustomer(null);
                                setSelectedInvoice(null);
                                setAmountInput('');
                              }}
                              className="text-2xs font-bold text-rose-500 hover:underline"
                            >
                              Change Customer
                            </button>
                          )}
                        </div>

                        {!selectedCustomer ? (
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                            <input
                              type="text"
                              placeholder="Search customer by name, phone or ID..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="input-premium pl-10 w-full text-xs"
                              autoFocus
                            />
                            {customerSearchResults.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-theme-border-soft max-h-60 overflow-y-auto">
                                {customerSearchResults.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomer(c);
                                      setSearchQuery('');
                                    }}
                                    className="w-full text-left p-3 hover:bg-theme-accent/10 transition-colors flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-bold text-xs text-theme-primary">{c.name}</div>
                                      <div className="text-2xs text-theme-muted font-mono">{c.phone || 'No phone'}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-theme-muted" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-between">
                            <div>
                              <div className="text-xs font-black text-theme-primary">{selectedCustomer.name}</div>
                              <div className="text-2xs text-theme-muted font-mono">{selectedCustomer.phone || 'No phone'}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xs font-bold text-theme-muted uppercase block">Total Due</span>
                              <span className="text-sm font-black text-rose-600">
                                {formatCurrency(customerLedger?.totalDue || 0, currencySymbol)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Customer Invoices Selector */}
                      {selectedCustomer && (
                        <div className="card-premium p-5 space-y-4">
                          <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-theme-accent" />
                            2. Select Invoice for Collection
                          </h3>

                          {customerUnpaidInvoices.length === 0 ? (
                            <div className="p-6 text-center rounded-xl bg-theme-surface/40 border border-dashed border-theme-border-soft">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                              <p className="text-xs font-bold text-theme-primary">No outstanding invoices for this customer!</p>
                              <p className="text-2xs text-theme-muted mt-0.5">All bills have been fully paid and reconciled.</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {customerUnpaidInvoices.map(inv => {
                                const fin = calculateCanonicalInvoiceFinancials(inv);
                                const isSelected = selectedInvoice?.id === inv.id;
                                const maxDue = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

                                return (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-theme-accent/10 border-theme-accent shadow-sm'
                                        : 'bg-theme-surface/50 border-theme-border-soft hover:border-theme-border'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black text-theme-primary">
                                          {inv.invoiceNumber || `INV-${inv.id.slice(0, 4)}`}
                                        </span>
                                        <span className="text-2xs text-theme-muted">
                                          {inv.date || inv.createdAt?.slice(0, 10)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-2xs text-theme-muted">
                                        <span>Bill Total: {formatCurrency(fin.currentInvoiceTotal, currencySymbol)}</span>
                                        {fin.previousDue > 0 && (
                                          <span className="text-amber-600 font-bold">
                                            Prev Due: {formatCurrency(fin.previousDue, currencySymbol)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xs font-bold text-theme-muted uppercase">Due Amount</div>
                                      <div className="text-sm font-black text-rose-600 tabular-nums">
                                        {formatCurrency(maxDue, currencySymbol)}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* 1.B: WITHDRAWAL (WEBSITE INCOME -> PERSONAL) */}
                  {selectedTxType === 'withdrawal' && (
                    <div className="card-premium p-5 space-y-4">
                      <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-theme-accent" />
                        Withdrawal Details
                      </h3>
                      <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-theme-muted">Source:</span>
                          <span className="font-black text-emerald-600">Website Income (Business Available: {formatCurrency(bucketFinancials.websiteIncomeAvailable, currencySymbol)})</span>
                        </div>
                        <div className="text-2xs text-theme-muted">
                          Withdrawal moves money out of business funds into your personal money location. It is NOT an expense.
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                          Personal Destination Location
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWithdrawDest('my_cash')}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              withdrawDest === 'my_cash'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-600 font-black'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                            }`}
                          >
                            <Coins className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">My Cash</div>
                            <div className="text-[10px] text-theme-muted">Physical Cash</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setWithdrawDest('phonepe')}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              withdrawDest === 'phonepe'
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 font-black'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                            }`}
                          >
                            <Smartphone className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">PhonePe</div>
                            <div className="text-[10px] text-theme-muted">Personal Online</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.C: CASH <-> PHONEPE TRANSFER */}
                  {selectedTxType === 'transfer' && (
                    <div className="card-premium p-5 space-y-4">
                      <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-theme-accent" />
                        Personal Money Transfer
                      </h3>
                      <p className="text-2xs text-theme-muted">
                        Move money between your physical cash and PhonePe without reducing your total personal wealth.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">From Location</label>
                          <select
                            value={transferSource}
                            onChange={(e) => {
                              const s = e.target.value;
                              setTransferSource(s);
                              setTransferDest(s === 'my_cash' ? 'phonepe' : 'my_cash');
                            }}
                            className="input-premium w-full text-xs font-bold"
                          >
                            <option value="my_cash">My Cash (Bal: {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)})</option>
                            <option value="phonepe">PhonePe (Bal: {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)})</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">To Destination</label>
                          <select
                            value={transferDest}
                            onChange={(e) => setTransferDest(e.target.value)}
                            className="input-premium w-full text-xs font-bold"
                          >
                            {transferSource === 'my_cash' ? (
                              <option value="phonepe">PhonePe</option>
                            ) : (
                              <option value="my_cash">My Cash</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.D: MY DREAM TRANSFER */}
                  {selectedTxType === 'dream_transfer' && (
                    <div className="card-premium p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          Dream Goal Allocation
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowDreamModal(true)}
                          className="text-2xs font-bold text-pink-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> New Goal
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDreamTransferDirection('to_dream')}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            dreamTransferDirection === 'to_dream'
                              ? 'bg-pink-500/10 border-pink-500 text-pink-600 font-black'
                              : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                          }`}
                        >
                          <div className="text-xs">Deposit into Dream</div>
                          <div className="text-[10px] text-theme-muted">Save money for your goal</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDreamTransferDirection('from_dream')}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            dreamTransferDirection === 'from_dream'
                              ? 'bg-purple-500/10 border-purple-500 text-purple-600 font-black'
                              : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                          }`}
                        >
                          <div className="text-xs">Return from Dream</div>
                          <div className="text-[10px] text-theme-muted">Move back to Cash / PhonePe</div>
                        </button>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">Select Dream Goal</label>
                        <div className="space-y-2">
                          {bucketFinancials.dreamGoals.map(d => {
                            const isSelected = selectedDreamGoal?.id === d.id || (!selectedDreamGoal && bucketFinancials.dreamGoals[0]?.id === d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setSelectedDreamGoal(d)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                                  isSelected
                                    ? 'bg-pink-500/10 border-pink-500 shadow-sm'
                                    : 'bg-theme-surface/50 border-theme-border-soft hover:border-theme-border'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-xs text-theme-primary">{d.name}</div>
                                  <div className="text-xs font-black text-pink-600">
                                    {formatCurrency(d.savedAmount || 0, currencySymbol)} / {formatCurrency(d.targetAmount || 0, currencySymbol)}
                                  </div>
                                </div>
                                <div className="w-full bg-theme-border-soft h-1.5 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="bg-pink-500 h-full rounded-full transition-all"
                                    style={{ width: `${d.progressPercentage || 0}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-theme-muted mt-1">
                                  <span>{d.progressPercentage || 0}% completed</span>
                                  <span>Remaining: {formatCurrency(d.remainingAmount || 0, currencySymbol)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                          {dreamTransferDirection === 'to_dream' ? 'Fund from Account' : 'Return to Account'}
                        </label>
                        <select
                          value={dreamPaymentChannel}
                          onChange={(e) => setDreamPaymentChannel(e.target.value)}
                          className="input-premium w-full text-xs font-bold"
                        >
                          <option value="phonepe">PhonePe (Bal: {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)})</option>
                          <option value="my_cash">My Cash (Bal: {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)})</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 1.E: PERSONAL EXPENSE CONTEXT */}
                  {selectedTxType === 'personal_expense' && (
                    <div className="card-premium p-5 space-y-4">
                      <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                        <Tag className="w-4 h-4 text-rose-500" />
                        Personal Expense (My Cash / PhonePe)
                      </h3>

                      <div>
                        <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">Paid From Location</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPersonalExpenseSource('my_cash')}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              personalExpenseSource === 'my_cash'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-600 font-black'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                            }`}
                          >
                            <Coins className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">My Cash</div>
                            <div className="text-[10px] text-theme-muted">Bal: {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalExpenseSource('phonepe')}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              personalExpenseSource === 'phonepe'
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 font-black'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted'
                            }`}
                          >
                            <Smartphone className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">PhonePe</div>
                            <div className="text-[10px] text-theme-muted">Bal: {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)}</div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Expense Reason / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Shopping, Food, Groceries, Travel"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            className="input-premium w-full text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Expense Category</label>
                          <select
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            className="input-premium w-full text-xs font-bold"
                          >
                            <option value="Shopping">Shopping & Lifestyle</option>
                            <option value="Food & Dining">Food & Dining</option>
                            <option value="Groceries">Groceries & Household</option>
                            <option value="Travel & Fuel">Travel & Fuel</option>
                            <option value="Medical & Health">Medical & Health</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other Personal">Other Personal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.F: STAFF SALARY / ADVANCE CONTEXT */}
                  {(selectedTxType === 'staff_salary' || selectedTxType === 'staff_advance') && (
                    <div className="card-premium p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                          <Users className="w-4 h-4 text-theme-accent" />
                          Select Staff Member
                        </h3>
                        {selectedStaff && (
                          <button
                            onClick={() => {
                              setSelectedStaff(null);
                              setAmountInput('');
                            }}
                            className="text-2xs font-bold text-rose-500 hover:underline"
                          >
                            Change Staff
                          </button>
                        )}
                      </div>

                      {!selectedStaff ? (
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                          <input
                            type="text"
                            placeholder="Search staff by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10 w-full text-xs"
                            autoFocus
                          />
                          {staffSearchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-theme-border-soft max-h-60 overflow-y-auto">
                              {staffSearchResults.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStaff(s);
                                    setSearchQuery('');
                                  }}
                                  className="w-full text-left p-3 hover:bg-theme-accent/10 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-xs text-theme-primary">{s.name}</div>
                                    <div className="text-2xs text-theme-muted font-mono">{s.phone || 'No phone'}</div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-theme-muted" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-between">
                            <div>
                              <div className="text-xs font-black text-theme-primary">{selectedStaff.name}</div>
                              <div className="text-2xs text-theme-muted font-mono">{selectedStaff.phone || 'No phone'}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xs font-bold text-theme-muted uppercase block">Remaining Payable</span>
                              <span className="text-sm font-black text-rose-600">
                                {formatCurrency(staffFinancials?.remainingPayable || 0, currencySymbol)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-border-soft text-center">
                              <div className="text-[10px] text-theme-muted font-bold uppercase">Total Earned</div>
                              <div className="text-xs font-black text-theme-primary mt-0.5">
                                {formatCurrency(staffFinancials?.totalEarned || 0, currencySymbol)}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-border-soft text-center">
                              <div className="text-[10px] text-blue-500 font-bold uppercase">Total Paid</div>
                              <div className="text-xs font-black text-blue-600 mt-0.5">
                                {formatCurrency(staffFinancials?.totalPaid || 0, currencySymbol)}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-border-soft text-center">
                              <div className="text-[10px] text-amber-500 font-bold uppercase">Total Advance</div>
                              <div className="text-xs font-black text-amber-600 mt-0.5">
                                {formatCurrency(staffFinancials?.totalAdvance || 0, currencySymbol)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1.G: VENDOR / OUTSOURCE CONTEXT */}
                  {selectedTxType === 'vendor_payment' && (
                    <div className="card-premium p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-theme-accent" />
                          Select Outsource Vendor
                        </h3>
                        {selectedVendor && (
                          <button
                            onClick={() => {
                              setSelectedVendor(null);
                              setSelectedJob(null);
                              setAmountInput('');
                            }}
                            className="text-2xs font-bold text-rose-500 hover:underline"
                          >
                            Change Vendor
                          </button>
                        )}
                      </div>

                      {!selectedVendor ? (
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                          <input
                            type="text"
                            placeholder="Search vendor by name, specialization or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10 w-full text-xs"
                            autoFocus
                          />
                          {vendorSearchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-theme-border-soft max-h-60 overflow-y-auto">
                              {vendorSearchResults.map(v => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVendor(v);
                                    setSearchQuery('');
                                  }}
                                  className="w-full text-left p-3 hover:bg-theme-accent/10 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-xs text-theme-primary">{v.name}</div>
                                    <div className="text-2xs text-theme-muted">{v.category || v.phone || 'Vendor'}</div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-theme-muted" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-between">
                            <div>
                              <div className="text-xs font-black text-theme-primary">{selectedVendor.name}</div>
                              <div className="text-2xs text-theme-muted font-mono">{selectedVendor.category || selectedVendor.phone || 'Vendor'}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xs font-bold text-theme-muted uppercase block">Remaining Payable</span>
                              <span className="text-sm font-black text-purple-600">
                                {formatCurrency(vendorFinancials?.remainingPayable || 0, currencySymbol)}
                              </span>
                            </div>
                          </div>

                          {vendorFinancials?.jobs?.length > 0 && (
                            <div>
                              <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                                Link to Specific Outsource Job (Optional)
                              </label>
                              <select
                                value={selectedJob?.id || ''}
                                onChange={(e) => {
                                  const j = vendorFinancials.jobs.find(x => x.id === e.target.value);
                                  setSelectedJob(j || null);
                                }}
                                className="input-premium w-full text-xs font-bold"
                              >
                                <option value="">General Vendor Payout (No specific job)</option>
                                {vendorFinancials.jobs.map(j => (
                                  <option key={j.id} value={j.id}>
                                    {j.jobCode ? `[${j.jobCode}] ` : ''}{j.title} — Cost: {formatCurrency(j.agreedCost, currencySymbol)} (Paid: {formatCurrency(j.totalPaid || 0, currencySymbol)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1.H: MY SALARY / REFUND / EXPENSE / GENERAL METADATA */}
                  {(selectedTxType === 'my_salary' || selectedTxType === 'customer_refund' || selectedTxType === 'expense' || selectedTxType === 'money_in' || selectedTxType === 'money_out') && (
                    <div className="card-premium p-5 space-y-4">
                      <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                        <Tag className="w-4 h-4 text-theme-accent" />
                        Transaction Information
                      </h3>

                      {selectedTxType === 'my_salary' && (
                        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border-soft text-2xs space-y-1 text-theme-muted">
                          <div className="font-bold text-theme-primary">Owner Salary Allocation</div>
                          <div>Allocates business revenue to your personal salary. Maintained separately from customer invoice payments.</div>
                        </div>
                      )}

                      {selectedTxType === 'customer_refund' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Customer Name / Reference</label>
                            <input
                              type="text"
                              placeholder="e.g. John Doe"
                              value={selectedCustomer?.name || ''}
                              onChange={(e) => setSelectedCustomer({ id: 'temp_cust', name: e.target.value })}
                              className="input-premium w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Refund Reason</label>
                            <input
                              type="text"
                              placeholder="e.g. Product returned / service cancelled"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              className="input-premium w-full text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {selectedTxType === 'expense' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Business Expense Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Office Stationery, Internet Bill"
                              value={titleInput}
                              onChange={(e) => setTitleInput(e.target.value)}
                              className="input-premium w-full text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Expense Category</label>
                            <select
                              value={categoryInput}
                              onChange={(e) => setCategoryInput(e.target.value)}
                              className="input-premium w-full text-xs font-bold"
                            >
                              <option value="Supplies">Supplies & Consumables</option>
                              <option value="Utilities">Utilities & Bills</option>
                              <option value="Rent & Maintenance">Rent & Maintenance</option>
                              <option value="Marketing">Marketing & Advertising</option>
                              <option value="Salaries & Wages">Salaries & Wages</option>
                              <option value="Purchase / Stock">Purchase / Stock</option>
                              <option value="Other Expense">Other Expense</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {(selectedTxType === 'money_in' || selectedTxType === 'money_out') && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Transaction Title / Description</label>
                            <input
                              type="text"
                              placeholder="e.g. Owner Capital Injection, Bank Loan"
                              value={titleInput}
                              onChange={(e) => setTitleInput(e.target.value)}
                              className="input-premium w-full text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Category</label>
                            <select
                              value={categoryInput}
                              onChange={(e) => setCategoryInput(e.target.value)}
                              className="input-premium w-full text-xs font-bold"
                            >
                              {selectedTxType === 'money_in' ? (
                                <>
                                  <option value="Other Income">Other Income</option>
                                  <option value="Owner Investment">Owner Investment</option>
                                  <option value="Bank Loan / Advance">Bank Loan / Advance</option>
                                  <option value="Credit Collection">Credit Collection</option>
                                </>
                              ) : (
                                <>
                                  <option value="Other Expense">Other Expense</option>
                                  <option value="Withdrawal">Owner Drawings / Withdrawal</option>
                                  <option value="Purchase / Stock">Purchase / Stock</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* RIGHT COLUMN: Amount Input & Payment Settlement */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="card-premium p-5 space-y-4">
                    <h3 className="text-xs uppercase tracking-wider font-black text-theme-muted flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-theme-accent" />
                      Payment Details
                    </h3>

                    {/* Amount Input */}
                    <div>
                      <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                        Amount to Record ({currencySymbol}) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-theme-muted">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          className="input-premium pl-8 w-full text-lg font-black tabular-nums text-theme-primary"
                        />
                      </div>
                    </div>

                    {/* Smart Amount Presets for Customer Payment */}
                    {selectedTxType === 'customer_payment' && invoiceFinancials && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-theme-muted uppercase">Smart Quick Presets:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {invoiceFinancials.previousDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPreset('old_due');
                                setAmountInput(invoiceFinancials.previousDue.toString());
                              }}
                              className={`p-2 rounded-lg text-2xs font-bold border text-center transition-all ${
                                selectedPreset === 'old_due'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                  : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary'
                              }`}
                            >
                              Old Due
                              <span className="block font-mono text-[10px] font-black">
                                {formatCurrency(invoiceFinancials.previousDue, currencySymbol)}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreset('current_bill');
                              setAmountInput(invoiceFinancials.currentBillDue.toString());
                            }}
                            className={`p-2 rounded-lg text-2xs font-bold border text-center transition-all ${
                              selectedPreset === 'current_bill'
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary'
                            }`}
                          >
                            Current Bill
                            <span className="block font-mono text-[10px] font-black">
                              {formatCurrency(invoiceFinancials.currentBillDue, currencySymbol)}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreset('total_due');
                              const max = invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue;
                              setAmountInput(max.toString());
                            }}
                            className={`p-2 rounded-lg text-2xs font-bold border text-center transition-all ${
                              selectedPreset === 'total_due'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary'
                            }`}
                          >
                            Total Due
                            <span className="block font-mono text-[10px] font-black">
                              {formatCurrency(invoiceFinancials.previousDue > 0 ? invoiceFinancials.customerTotalDue : invoiceFinancials.balanceDue, currencySymbol)}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Allocation Preview for Customer Payment */}
                    {selectedTxType === 'customer_payment' && selectedInvoice && parseFloat(amountInput) > 0 && (
                      <div className="p-3 rounded-xl bg-theme-surface/70 border border-theme-border-soft space-y-1.5 text-2xs">
                        <div className="font-bold text-theme-muted uppercase text-[10px]">Allocation Breakdown:</div>
                        <div className="flex justify-between">
                          <span className="text-theme-muted">To Previous Due:</span>
                          <span className="font-mono font-bold text-amber-600">
                            {formatCurrency(liveAllocation.allocatedToOldDue, currencySymbol)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-theme-muted">To Current Invoice:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            {formatCurrency(liveAllocation.allocatedToCurrentInvoice, currencySymbol)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment Method / Account */}
                    {selectedTxType !== 'transfer' && selectedTxType !== 'withdrawal' && selectedTxType !== 'dream_transfer' && (
                      <div>
                        <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                          Payment Method / Account
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {paymentMethods.slice(0, 6).map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={`p-2 rounded-lg text-2xs font-bold border transition-all text-center ${
                                paymentMethod === m
                                  ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                                  : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Date */}
                    <div>
                      <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="input-premium w-full text-xs font-mono"
                      />
                    </div>

                    {/* Reference / Transaction ID */}
                    <div>
                      <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                        Reference / Transaction ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref, Cheque #, Txn ID"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="input-premium w-full text-xs font-mono"
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                        Note / Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Settled via cash at counter"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="input-premium w-full text-xs"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={isSubmitting || !parseFloat(amountInput)}
                      onClick={() => setShowConfirmModal(true)}
                      className="btn-premium w-full !py-3 text-xs font-black shadow-lg shadow-theme-accent/20 flex items-center justify-center gap-2 mt-4"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Record & Post Transaction</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: UNIFIED HISTORY */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-6">

              {/* KPI Aggregate Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-premium p-4">
                  <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Total Inflow (IN)</div>
                  <div className="text-xl font-black text-emerald-600 tabular-nums">
                    {formatCurrency(historyKPIs.totalIn, currencySymbol)}
                  </div>
                </div>
                <div className="card-premium p-4">
                  <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Total Outflow (OUT)</div>
                  <div className="text-xl font-black text-rose-600 tabular-nums">
                    {formatCurrency(historyKPIs.totalOut, currencySymbol)}
                  </div>
                </div>
                <div className="card-premium p-4">
                  <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Net Movement</div>
                  <div className={`text-xl font-black tabular-nums ${historyKPIs.net >= 0 ? 'text-theme-primary' : 'text-rose-600'}`}>
                    {formatCurrency(historyKPIs.net, currencySymbol)}
                  </div>
                </div>
                <div className="card-premium p-4">
                  <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Total Transactions</div>
                  <div className="text-xl font-black text-theme-primary tabular-nums">
                    {historyKPIs.count}
                  </div>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="card-premium p-4 space-y-3">
                {/* Type Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Transactions' },
                    { id: 'customer', label: 'Customer Payments' },
                    { id: 'transfer', label: 'Transfers & Withdrawals' },
                    { id: 'staff', label: 'Staff Payments' },
                    { id: 'vendor', label: 'Vendor Payments' },
                    { id: 'refund', label: 'Refunds' },
                    { id: 'expense', label: 'Expenses' },
                    { id: 'in', label: 'Money In' },
                    { id: 'out', label: 'Money Out' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setHistoryTypeFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-2xs font-bold whitespace-nowrap transition-all ${
                        historyTypeFilter === tab.id
                          ? 'bg-theme-accent text-white shadow-sm'
                          : 'bg-theme-surface text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search & Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                    <input
                      type="text"
                      placeholder="Search history by party, note, invoice #, ref..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="input-premium pl-9 w-full text-xs"
                    />
                  </div>

                  <select
                    value={historyTimeframe}
                    onChange={(e) => setHistoryTimeframe(e.target.value)}
                    className="input-premium w-full text-xs font-bold"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">This Month</option>
                  </select>

                  <select
                    value={historyMethod}
                    onChange={(e) => setHistoryMethod(e.target.value)}
                    className="input-premium w-full text-xs font-bold"
                  >
                    <option value="all">All Payment Methods</option>
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transactions Stream Table */}
              <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-theme-surface/70 text-theme-muted uppercase text-2xs font-bold tracking-wider border-b border-theme-border-soft">
                      <tr>
                        <th className="p-4">Date & Category</th>
                        <th className="p-4">Flow / Details</th>
                        <th className="p-4">Method & Ref</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft">
                      {unifiedHistoryList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-theme-muted">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-bold text-theme-primary">No transactions found.</p>
                            <p className="text-2xs text-theme-muted mt-0.5">Try adjusting your filters or record a new transaction.</p>
                          </td>
                        </tr>
                      ) : (
                        unifiedHistoryList.map(tx => {
                          const isIn = tx.direction === 'IN';
                          const isTransfer = tx.direction === 'TRANSFER' || tx.isTransfer;
                          const isWithdraw = tx.direction === 'WITHDRAW' || tx.type === 'withdrawal';
                          const partyName = tx.customerName || tx.staffName || tx.vendorName || tx.title || tx.category;

                          return (
                            <tr key={tx.id} className="hover:bg-theme-surface/40 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-theme-primary">{tx.date?.slice(0, 10)}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    isIn ? 'bg-emerald-500/10 text-emerald-600' :
                                    isTransfer ? 'bg-indigo-500/10 text-indigo-600' :
                                    isWithdraw ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                                  }`}>
                                    {isTransfer ? 'TRANSFER' : isWithdraw ? 'WITHDRAW' : isIn ? 'IN' : 'OUT'}
                                  </span>
                                  <span className="text-2xs text-theme-muted">{tx.category}</span>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="font-black text-theme-primary">{partyName}</div>
                                {tx.sourceLocation && tx.destinationLocation && (
                                  <div className="text-2xs text-theme-muted font-mono capitalize">
                                    {tx.sourceLocation.replace('_', ' ')} → {tx.destinationLocation.replace('_', ' ')}
                                  </div>
                                )}
                                {tx.invoiceNumber && (
                                  <div className="text-2xs text-theme-muted font-mono">Invoice: {tx.invoiceNumber}</div>
                                )}
                                {tx.note && (
                                  <div className="text-2xs text-theme-muted line-clamp-1 italic">{tx.note}</div>
                                )}
                              </td>

                              <td className="p-4">
                                <div className="font-bold text-theme-primary">{tx.paymentMethod}</div>
                                {tx.reference && (
                                  <div className="text-2xs text-theme-muted font-mono">{tx.reference}</div>
                                )}
                              </td>

                              <td className="p-4 text-right">
                                <div className={`font-black text-sm tabular-nums ${
                                  isIn ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : isWithdraw ? 'text-amber-600' : 'text-rose-600'
                                }`}>
                                  {isTransfer ? '⇄ ' : isIn ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                                </div>
                              </td>

                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setSelectedPaymentDetail(tx)}
                                  className="btn-premium-outline !min-h-[28px] px-2.5 py-1 text-2xs font-bold"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PENDING LIVE LINK APPROVALS */}
          {/* ========================================================================= */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="card-premium p-5">
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-theme-accent" />
                  Live Link Payment Proofs
                </h3>
                <p className="text-xs text-theme-muted">
                  Review and verify customer-submitted payment screenshots & UPI references
                </p>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="card-premium p-12 text-center text-theme-muted">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <h4 className="text-sm font-bold text-theme-primary">All Caught Up!</h4>
                  <p className="text-xs text-theme-muted mt-1">No pending customer payment proofs waiting for verification.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingPayments.map(proof => (
                    <div key={proof.id} className="card-premium p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-theme-muted">
                          {proof.date?.slice(0, 10) || 'Recent'}
                        </span>
                        <span className="px-2 py-0.5 text-2xs font-black rounded-full bg-amber-500/10 text-amber-600">
                          Pending Approval
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-theme-muted">Amount Submitted</div>
                        <div className="text-xl font-black text-emerald-600">
                          {formatCurrency(proof.amount, currencySymbol)}
                        </div>
                      </div>

                      <div className="text-2xs text-theme-muted space-y-1">
                        <div><strong className="text-theme-primary">Invoice:</strong> {proof.invoiceNumber || proof.invoiceId || 'N/A'}</div>
                        <div><strong className="text-theme-primary">Method:</strong> {proof.paymentMethod || 'UPI'}</div>
                        {proof.transactionId && <div><strong className="text-theme-primary">Txn ID:</strong> {proof.transactionId}</div>}
                      </div>

                      {proof.proofUrl && (
                        <button
                          onClick={() => setSelectedProof(proof)}
                          className="btn-premium-outline w-full !py-1.5 text-2xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          View Screenshot
                        </button>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-theme-border-soft">
                        <button
                          disabled={processingProofId === proof.id}
                          onClick={() => handleRejectProof(proof)}
                          className="btn-premium-danger flex-1 !py-1.5 text-2xs font-bold"
                        >
                          Reject
                        </button>
                        <button
                          disabled={processingProofId === proof.id}
                          onClick={() => handleApproveProof(proof)}
                          className="btn-premium flex-1 !py-1.5 text-2xs font-black flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </PullToRefresh>

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                <h3 className="text-base font-black text-theme-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-theme-accent" />
                  Confirm Transaction
                </h3>
                <button onClick={() => setShowConfirmModal(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-theme-surface/70 border border-theme-border-soft text-center">
                  <div className="text-2xs text-theme-muted font-bold uppercase">Transaction Amount</div>
                  <div className="text-2xl font-black text-theme-accent mt-0.5 tabular-nums">
                    {formatCurrency(parseFloat(amountInput) || 0, currencySymbol)}
                  </div>
                </div>

                <div className="space-y-2 text-2xs divide-y divide-theme-border-soft">
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Category:</span>
                    <span className="font-black text-theme-primary">{TRANSACTION_CATEGORIES.find(t => t.id === selectedTxType)?.label}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between pt-1.5">
                      <span className="text-theme-muted font-bold">Customer:</span>
                      <span className="font-black text-theme-primary">{selectedCustomer.name}</span>
                    </div>
                  )}
                  {selectedInvoice && (
                    <div className="flex justify-between pt-1.5">
                      <span className="text-theme-muted font-bold">Invoice:</span>
                      <span className="font-mono font-bold text-theme-primary">{selectedInvoice.invoiceNumber || selectedInvoice.id}</span>
                    </div>
                  )}
                  {selectedStaff && (
                    <div className="flex justify-between pt-1.5">
                      <span className="text-theme-muted font-bold">Staff:</span>
                      <span className="font-black text-theme-primary">{selectedStaff.name}</span>
                    </div>
                  )}
                  {selectedVendor && (
                    <div className="flex justify-between pt-1.5">
                      <span className="text-theme-muted font-bold">Vendor:</span>
                      <span className="font-black text-theme-primary">{selectedVendor.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Date:</span>
                    <span className="font-mono text-theme-primary">{paymentDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-premium-outline flex-1 !py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteTransaction}
                  className="btn-premium flex-1 !py-2.5 text-xs font-black shadow-lg shadow-theme-accent/20"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TRANSACTION DETAIL MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedPaymentDetail && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                <div>
                  <h3 className="text-base font-black text-theme-primary">Transaction Details</h3>
                  <p className="text-2xs text-theme-muted font-mono">{selectedPaymentDetail.id}</p>
                </div>
                <button onClick={() => setSelectedPaymentDetail(null)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface/70 border border-theme-border-soft text-center">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  selectedPaymentDetail.direction === 'IN' ? 'bg-emerald-500/10 text-emerald-600' :
                  selectedPaymentDetail.isTransfer ? 'bg-indigo-500/10 text-indigo-600' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {selectedPaymentDetail.isTransfer ? 'Transfer' : selectedPaymentDetail.direction} · {selectedPaymentDetail.category}
                </span>
                <div className="text-2xl font-black text-theme-primary mt-1 tabular-nums">
                  {formatCurrency(selectedPaymentDetail.amount, currencySymbol)}
                </div>
              </div>

              <div className="space-y-2 text-2xs divide-y divide-theme-border-soft">
                <div className="flex justify-between pt-1.5">
                  <span className="text-theme-muted font-bold">Date:</span>
                  <span className="font-mono text-theme-primary">{selectedPaymentDetail.date?.slice(0, 10)}</span>
                </div>
                {selectedPaymentDetail.sourceLocation && selectedPaymentDetail.destinationLocation && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Flow:</span>
                    <span className="font-black text-theme-primary capitalize">
                      {selectedPaymentDetail.sourceLocation.replace('_', ' ')} → {selectedPaymentDetail.destinationLocation.replace('_', ' ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5">
                  <span className="text-theme-muted font-bold">Method:</span>
                  <span className="font-bold text-theme-primary">{selectedPaymentDetail.paymentMethod}</span>
                </div>
                {selectedPaymentDetail.customerName && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Customer:</span>
                    <span className="font-black text-theme-primary">{selectedPaymentDetail.customerName}</span>
                  </div>
                )}
                {selectedPaymentDetail.staffName && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Staff:</span>
                    <span className="font-black text-theme-primary">{selectedPaymentDetail.staffName}</span>
                  </div>
                )}
                {selectedPaymentDetail.vendorName && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Vendor:</span>
                    <span className="font-black text-theme-primary">{selectedPaymentDetail.vendorName}</span>
                  </div>
                )}
                {selectedPaymentDetail.invoiceNumber && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Invoice #:</span>
                    <span className="font-mono font-bold text-theme-primary">{selectedPaymentDetail.invoiceNumber}</span>
                  </div>
                )}
                {selectedPaymentDetail.reference && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Reference / Txn ID:</span>
                    <span className="font-mono text-theme-primary">{selectedPaymentDetail.reference}</span>
                  </div>
                )}
                {selectedPaymentDetail.note && (
                  <div className="flex justify-between pt-1.5">
                    <span className="text-theme-muted font-bold">Note:</span>
                    <span className="text-theme-primary text-right">{selectedPaymentDetail.note}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="btn-premium w-full !py-2.5 text-xs font-bold mt-2"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DREAM GOAL MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDreamModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Add New Dream Goal
                </h3>
                <button onClick={() => setShowDreamModal(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Dream Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dream Vacation, New Bike, Camera Kit"
                    value={newDreamName}
                    onChange={(e) => setNewDreamName(e.target.value)}
                    className="input-premium w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Target Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={newDreamTarget}
                    onChange={(e) => setNewDreamTarget(e.target.value)}
                    className="input-premium w-full text-xs font-black"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={newDreamDate}
                    onChange={(e) => setNewDreamDate(e.target.value)}
                    className="input-premium w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDreamModal(false)}
                  className="btn-premium-outline flex-1 !py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateDreamGoal}
                  className="btn-premium flex-1 !py-2 text-xs font-black"
                >
                  Save Dream Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PROOF IMAGE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                <h3 className="text-sm font-black text-theme-primary">Payment Proof Screenshot</h3>
                <button onClick={() => setSelectedProof(null)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden max-h-96 flex items-center justify-center bg-black/40">
                <img
                  src={selectedProof.proofUrl}
                  alt="Proof"
                  className="max-h-96 w-auto object-contain rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProof(null)}
                  className="btn-premium-outline flex-1 !py-2 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  disabled={processingProofId === selectedProof.id}
                  onClick={() => handleApproveProof(selectedProof)}
                  className="btn-premium flex-1 !py-2 text-xs font-black"
                >
                  Approve Proof
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
};

export default CollectionCenter;

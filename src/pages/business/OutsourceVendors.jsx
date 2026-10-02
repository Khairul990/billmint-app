import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Users, Plus, Search, Filter, Phone, CheckCircle2,
  Clock, Trash2, Edit3, Eye, Printer, X, DollarSign, Calendar,
  CreditCard, ChevronDown, ChevronUp, AlertCircle, Sparkles, Check,
  ArrowRight, ShieldCheck, UserCheck, RefreshCw, FileText, ArrowLeft,
  Receipt, Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/invoiceUtils.js';
import {
  getVendors, saveVendor, deleteVendor,
  getOutsourceJobs, saveOutsourceJob, deleteOutsourceJob,
  getOutsourcePayments, recordOutsourcePayment, deleteOutsourcePayment,
  calculateVendor360, getVendorLedger, generateNextContractorBillNumber
} from '../../services/outsourceEngine.js';
import { bankEngine } from '../../services/bankEngine.js';

/**
 * BillQyro — Work Cost & Contractor Bill System (FINAL STABLE VERSION)
 * 
 * CORE DESIGN PRINCIPLE:
 * Feels like creating a normal BILL / VOUCHER, NOT filling out a tedious 13-field form.
 * 
 * 1. ONE-PAGE & EXTREMELY SIMPLE:
 *    - Select/add Worker
 *    - Select Customer / Invoice if needed (optional)
 *    - Enter Design/Product Number (e.g. GK-115)
 *    - Enter Work Description
 *    - Enter Work Amount (e.g. ₹600)
 *    - Enter Paid amount (e.g. ₹300) -> Remaining becomes Due automatically (₹300)
 *    - Save the Work Bill (Generates WB-0001, WB-0002...)
 * 
 * 2. STRICT INVARIANTS:
 *    - Customer Invoice total is 100% untouched.
 *    - Work Cost is an internal expenditure.
 *    - Payments deduct moneyOut from internal bank/cash exactly once (no double-deduction).
 */
const OutsourceVendors = ({
  invoices = [],
  customers = [],
  products = [],
  businessSettings = {},
  currentTab,
  setCurrentTab
}) => {
  // Core data states
  const [vendors, setVendors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState(['Cash', 'Bank Account', 'UPI']);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Bill Creator Slip State
  const [isBillSlipOpen, setIsBillSlipOpen] = useState(true);
  const [editingJob, setEditingJob] = useState(null);
  const billSlipRef = useRef(null);
  const workersSectionRef = useRef(null);

  // Bill Slip Field States (Fast, auto-populated, only Worker and Amount are mandatory)
  const [billWorkerId, setBillWorkerId] = useState('');
  const [billWorkerName, setBillWorkerName] = useState('');
  const [showAddWorkerInline, setShowAddWorkerInline] = useState(false);
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  const [billDesignNumber, setBillDesignNumber] = useState('');
  const [billWorkDescription, setBillWorkDescription] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billPaid, setBillPaid] = useState('0');
  const [billPaymentMethod, setBillPaymentMethod] = useState('Cash');
  const [billBankAccount, setBillBankAccount] = useState('Cash');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billNotes, setBillNotes] = useState('');

  // Optional Invoice & Customer Link
  const [showInvoiceLink, setShowInvoiceLink] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [linkedCustomerName, setLinkedCustomerName] = useState('');
  const [linkedCustomerId, setLinkedCustomerId] = useState('');
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState('');

  // Modals & Panels
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedJobForBill, setSelectedJobForBill] = useState(null);

  const [partialPayModalOpen, setPartialPayModalOpen] = useState(false);
  const [paymentTargetJob, setPaymentTargetJob] = useState(null);

  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState(null);
  const [workerLedgerModalOpen, setWorkerLedgerModalOpen] = useState(false);
  const [selectedWorkerForLedger, setSelectedWorkerForLedger] = useState(null);

  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null);
  const [deleteConfirmWorker, setDeleteConfirmWorker] = useState(null);

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Pending, Partial, Paid

  // Next Bill Number Preview
  const nextBillNumberPreview = useMemo(() => {
    return generateNextContractorBillNumber(jobs);
  }, [jobs]);

  // Load Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [vData, jData, pData, bSettings] = await Promise.all([
        getVendors(),
        getOutsourceJobs(),
        getOutsourcePayments(),
        bankEngine.getBankSettings().catch(() => ({ accounts: ['Cash', 'Bank Account', 'UPI'] }))
      ]);
      setVendors(vData || []);
      setJobs(jData || []);
      setPayments(pData || []);
      if (bSettings?.accounts && Array.isArray(bSettings.accounts) && bSettings.accounts.length > 0) {
        setBankAccounts(bSettings.accounts);
      }
    } catch (e) {
      console.error('Error loading Work Cost data:', e);
      toast.error('Failed to load Work Cost records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleUpdate = () => loadAllData();
    window.addEventListener('billqyro_outsource_updated', handleUpdate);
    window.addEventListener('billqyro_bank_updated', handleUpdate);
    return () => {
      window.removeEventListener('billqyro_outsource_updated', handleUpdate);
      window.removeEventListener('billqyro_bank_updated', handleUpdate);
    };
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalWorkCost = jobs.reduce((sum, j) => {
      return sum + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0);
    }, 0);

    const totalPaid = jobs.reduce((sum, j) => {
      return sum + (Number(j.paidAmount !== undefined ? j.paidAmount : j.totalPaid) || 0);
    }, 0);

    const pendingPayment = Math.max(0, totalWorkCost - totalPaid);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthCost = jobs.filter(j => {
      const d = new Date(j.assignedAt || j.createdAt || j.date || 0);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).reduce((sum, j) => {
      return sum + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0);
    }, 0);

    return {
      totalWorkCost,
      totalPaid,
      pendingPayment,
      thisMonthCost,
      totalJobsCount: jobs.length
    };
  }, [jobs]);

  // Live Auto-Calculation for the Bill Slip
  const numAmount = Math.max(0, Number(billAmount) || 0);
  const numPaid = Math.max(0, Math.min(numAmount, Number(billPaid) || 0));
  const autoCalculatedDue = Math.max(0, numAmount - numPaid);

  // Selected Invoice Object
  const selectedInvoiceObj = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find(i => i.id === selectedInvoiceId || i.invoiceNumber === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  // When an Invoice is selected, automatically carry customer, product, and design information
  const handleInvoiceSelect = (invId) => {
    setSelectedInvoiceId(invId);
    if (!invId) {
      setLinkedInvoiceNumber('');
      return;
    }
    const inv = invoices.find(i => i.id === invId || i.invoiceNumber === invId);
    if (inv) {
      setLinkedInvoiceNumber(inv.invoiceNumber || '');
      setLinkedCustomerName(inv.customerName || '');
      setLinkedCustomerId(inv.customerId || '');

      // Auto-carry product / design details if available
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        const item = inv.items[0];
        if (item.designNumber || item.sku) {
          setBillDesignNumber(item.designNumber || item.sku);
        }
        if (!billWorkDescription) {
          setBillWorkDescription(`Outsource work for ${item.name || item.description || 'item'}`);
        }
      }
    }
  };

  // Filtered Jobs / Work Bills
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // If filtered by a specific worker
      if (selectedWorkerFilter) {
        const matchesWorker = (j.contractorId === selectedWorkerFilter.id || j.vendorId === selectedWorkerFilter.id);
        if (!matchesWorker) return false;
      }

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        j.customerName?.toLowerCase().includes(query) ||
        j.invoiceNumber?.toLowerCase().includes(query) ||
        j.designNumber?.toLowerCase().includes(query) ||
        j.productName?.toLowerCase().includes(query) ||
        j.contractorName?.toLowerCase().includes(query) ||
        j.contractorBillNumber?.toLowerCase().includes(query) ||
        j.workDescription?.toLowerCase().includes(query);

      const cost = Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0;
      const paid = Number(j.paidAmount !== undefined ? j.paidAmount : j.totalPaid) || 0;
      const due = Math.max(0, cost - paid);

      let matchesStatus = true;
      if (statusFilter === 'Pending') {
        matchesStatus = due > 0 && paid === 0;
      } else if (statusFilter === 'Partial') {
        matchesStatus = due > 0 && paid > 0;
      } else if (statusFilter === 'Paid') {
        matchesStatus = due === 0 && cost > 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter, selectedWorkerFilter]);

  // Reset Bill Slip to blank state
  const resetBillSlip = () => {
    setEditingJob(null);
    setBillWorkerId('');
    setBillWorkerName('');
    setShowAddWorkerInline(false);
    setNewWorkerPhone('');
    setBillDesignNumber('');
    setBillWorkDescription('');
    setBillAmount('');
    setBillPaid('0');
    setBillPaymentMethod('Cash');
    setBillBankAccount(bankAccounts[0] || 'Cash');
    setBillDate(new Date().toISOString().split('T')[0]);
    setBillNotes('');
    setShowInvoiceLink(false);
    setSelectedInvoiceId('');
    setLinkedCustomerName('');
    setLinkedCustomerId('');
    setLinkedInvoiceNumber('');
  };

  // Populate Bill Slip for Editing
  const handleEditJob = (job) => {
    setEditingJob(job);
    setBillWorkerId(job.contractorId || job.vendorId || '');
    setBillWorkerName(job.contractorName || job.vendorName || '');
    setShowAddWorkerInline(false);
    setBillDesignNumber(job.designNumber || '');
    setBillWorkDescription(job.workDescription || job.productName || '');
    const cost = job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost;
    setBillAmount(cost ? String(cost) : '');
    setBillPaid(String(job.paidAmount || job.totalPaid || 0));
    setBillDate(job.assignedAt ? job.assignedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setBillNotes(job.notes || '');

    if (job.invoiceNumber || job.invoiceId || job.customerName) {
      setShowInvoiceLink(true);
      setSelectedInvoiceId(job.invoiceId || job.relatedInvoiceId || '');
      setLinkedInvoiceNumber(job.invoiceNumber || job.relatedInvoiceNumber || '');
      setLinkedCustomerName(job.customerName || '');
      setLinkedCustomerId(job.customerId || '');
    } else {
      setShowInvoiceLink(false);
      setSelectedInvoiceId('');
      setLinkedInvoiceNumber('');
      setLinkedCustomerName('');
      setLinkedCustomerId('');
    }

    setIsBillSlipOpen(true);
    if (billSlipRef.current) {
      billSlipRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Save Work Bill (Create or Update)
  const handleSaveWorkBill = async (e) => {
    e.preventDefault();

    let workerId = billWorkerId;
    let workerName = billWorkerName.trim();

    if (!workerId && !workerName) {
      toast.error('Please select or enter a Worker / Work Partner.');
      return;
    }

    if (numAmount <= 0) {
      toast.error('Please enter a valid Work Amount.');
      return;
    }

    // Auto-create worker if typed inline
    if (!workerId && workerName) {
      const existing = vendors.find(v => v.name?.toLowerCase() === workerName.toLowerCase());
      if (existing) {
        workerId = existing.id;
        workerName = existing.name;
      } else {
        const savedWorker = await saveVendor({
          name: workerName,
          phone: newWorkerPhone.trim(),
          specialization: 'Work Partner',
          category: 'Work Partner'
        });
        workerId = savedWorker.id;
      }
    } else if (workerId && !workerName) {
      const match = vendors.find(v => v.id === workerId);
      workerName = match?.name || 'Worker';
    }

    const billNumber = editingJob?.contractorBillNumber || generateNextContractorBillNumber(jobs);

    let paymentStatus = 'Pending';
    if (autoCalculatedDue === 0 && numAmount > 0) paymentStatus = 'Paid';
    else if (numPaid > 0) paymentStatus = 'Partial';

    const jobPayload = {
      id: editingJob?.id,
      contractorBillNumber: billNumber,
      billNumber,
      jobCode: billNumber,
      contractorId: workerId,
      vendorId: workerId,
      contractorName: workerName,
      vendorName: workerName,
      customerId: linkedCustomerId || null,
      customerName: linkedCustomerName || 'Walk-in / Direct Work',
      invoiceId: selectedInvoiceId || null,
      invoiceNumber: linkedInvoiceNumber || '',
      productId: null,
      productName: billWorkDescription || (billDesignNumber ? `Design ${billDesignNumber}` : 'Outsource Work'),
      designNumber: billDesignNumber.trim(),
      workDescription: billWorkDescription.trim() || (billDesignNumber ? `Design ${billDesignNumber} work` : 'Work Assignment'),
      totalContractorCost: numAmount,
      agreedCost: numAmount,
      paidAmount: editingJob ? (editingJob.paidAmount || 0) : numPaid,
      totalPaid: editingJob ? (editingJob.totalPaid || 0) : numPaid,
      dueAmount: Math.max(0, numAmount - (editingJob ? (editingJob.paidAmount || 0) : numPaid)),
      paymentStatus,
      workStatus: 'Assigned',
      status: 'Assigned',
      assignedAt: billDate ? new Date(billDate).toISOString() : new Date().toISOString(),
      notes: billNotes.trim()
    };

    try {
      const savedJob = await saveOutsourceJob(jobPayload);

      // Record disbursement if newly created with payment
      if (!editingJob && numPaid > 0) {
        await recordOutsourcePayment({
          contractorBillId: savedJob.id,
          jobId: savedJob.id,
          contractorBillNumber: savedJob.contractorBillNumber,
          jobCode: savedJob.contractorBillNumber,
          contractorId: workerId,
          contractorName: workerName,
          amount: numPaid,
          paymentMethod: billPaymentMethod || 'Cash',
          bankAccount: billBankAccount || 'Cash',
          note: `Payment for Work Bill ${savedJob.contractorBillNumber} (${billDesignNumber || 'Work'})`,
          date: billDate || new Date().toISOString().split('T')[0],
          syncWithBank: true
        });
      }

      toast.success(editingJob ? `Work Bill ${billNumber} updated!` : `Work Bill ${savedJob.contractorBillNumber} created!`);
      resetBillSlip();
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save Work Bill: ' + (err.message || 'Error'));
    }
  };

  // 1-Click "Mark as Paid" (Full Settlement)
  const handleMarkAsPaid = async (job) => {
    const cost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
    const paid = Number(job.paidAmount !== undefined ? job.paidAmount : job.totalPaid) || 0;
    const due = Math.max(0, cost - paid);

    if (due <= 0) {
      toast.success('This bill is already fully settled.');
      return;
    }

    try {
      await recordOutsourcePayment({
        contractorId: job.contractorId || job.vendorId,
        vendorId: job.contractorId || job.vendorId,
        contractorName: job.contractorName || job.vendorName || 'Worker',
        vendorName: job.contractorName || job.vendorName || 'Worker',
        contractorBillId: job.id,
        jobId: job.id,
        contractorBillNumber: job.contractorBillNumber || job.jobCode || '',
        jobCode: job.contractorBillNumber || job.jobCode || '',
        amount: due,
        paymentMethod: 'Cash',
        bankAccount: bankAccounts[0] || 'Cash',
        note: `Full settlement for ${job.contractorBillNumber || 'Job'}`,
        date: new Date().toISOString().split('T')[0],
        syncWithBank: true
      });

      toast.success(`Marked as Paid! Full settlement of ${formatCurrency(due)} recorded.`);
      loadAllData();
    } catch (err) {
      toast.error('Failed to mark as paid: ' + err.message);
    }
  };

  // Submit Partial Payment
  const handlePartialPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentTargetJob || isSubmittingPayment) return;

    const formData = new FormData(e.target);
    const amount = Number(formData.get('amount')) || 0;
    if (amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    const cost = Number(paymentTargetJob.totalContractorCost !== undefined ? paymentTargetJob.totalContractorCost : paymentTargetJob.agreedCost) || 0;
    const currentPaid = Number(paymentTargetJob.paidAmount !== undefined ? paymentTargetJob.paidAmount : paymentTargetJob.totalPaid) || 0;
    const maxDue = Math.max(0, cost - currentPaid);

    if (amount > maxDue) {
      toast.error(`Amount cannot exceed outstanding due of ${formatCurrency(maxDue)}.`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      await recordOutsourcePayment({
        contractorId: paymentTargetJob.contractorId || paymentTargetJob.vendorId,
        vendorId: paymentTargetJob.contractorId || paymentTargetJob.vendorId,
        contractorName: paymentTargetJob.contractorName || paymentTargetJob.vendorName || 'Worker',
        vendorName: paymentTargetJob.contractorName || paymentTargetJob.vendorName || 'Worker',
        contractorBillId: paymentTargetJob.id,
        jobId: paymentTargetJob.id,
        contractorBillNumber: paymentTargetJob.contractorBillNumber || paymentTargetJob.jobCode || '',
        jobCode: paymentTargetJob.contractorBillNumber || paymentTargetJob.jobCode || '',
        amount,
        paymentMethod: formData.get('paymentMethod') || 'Cash',
        bankAccount: formData.get('bankAccount') || 'Cash',
        note: formData.get('note')?.trim() || `Disbursement for ${paymentTargetJob.contractorBillNumber || 'Job'}`,
        date: formData.get('date') || new Date().toISOString().split('T')[0],
        syncWithBank: true
      });

      toast.success(`Payment of ${formatCurrency(amount)} recorded successfully.`);
      setPartialPayModalOpen(false);
      setPaymentTargetJob(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to record payment: ' + err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Delete Job Handler
  const confirmDeleteJobAction = async () => {
    if (!deleteConfirmJob) return;
    try {
      await deleteOutsourceJob(deleteConfirmJob.id);
      toast.success(`Work Bill ${deleteConfirmJob.contractorBillNumber || 'Job'} deleted.`);
      setDeleteConfirmJob(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete work: ' + err.message);
    }
  };

  const confirmDeleteWorkerAction = async () => {
    if (!deleteConfirmWorker) return;
    try {
      await deleteVendor(deleteConfirmWorker.id);
      toast.success(`Worker ${deleteConfirmWorker.name} deleted.`);
      setDeleteConfirmWorker(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete worker: ' + err.message);
    }
  };

  // Save Worker Profile
  const handleSaveWorkerSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name')?.trim();
    if (!name) {
      toast.error('Worker name is required.');
      return;
    }

    try {
      await saveVendor({
        id: editingWorker?.id,
        name,
        phone: formData.get('phone')?.trim() || '',
        address: formData.get('address')?.trim() || '',
        notes: formData.get('notes')?.trim() || '',
        specialization: formData.get('specialization')?.trim() || 'Work Partner',
        category: 'Work Partner'
      });

      toast.success(editingWorker ? 'Worker profile updated.' : 'New Worker added.');
      setWorkerModalOpen(false);
      setEditingWorker(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to save worker: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-theme-main text-theme-primary font-sans pb-32 overflow-x-hidden selection:bg-theme-accent/20">
      
      {/* ===================================================================== */}
      {/* 1. HEADER SECTION */}
      {/* ===================================================================== */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 md:pt-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-theme-border-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-theme-accent/15 border border-theme-accent/25 flex items-center justify-center text-theme-accent shrink-0 shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-theme-primary">
                  Work Cost
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                  Bill Center
                </span>
              </div>
              <p className="text-xs text-theme-secondary mt-0.5">
                Manage outsourced work, payments & worker costs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                if (workersSectionRef.current) {
                  workersSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border-soft text-xs font-bold text-theme-primary flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Users className="w-4 h-4 text-theme-accent" />
              <span>Workers ({vendors.length})</span>
            </button>

            <button
              onClick={() => {
                setIsBillSlipOpen(true);
                resetBillSlip();
                if (billSlipRef.current) {
                  billSlipRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Bill</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. SUMMARY CARDS (4 PRIMARY METRICS) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          {/* Total Work Cost */}
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-theme-muted block">
              Total Work Cost
            </span>
            <div className="text-xl sm:text-2xl font-black text-theme-primary font-mono truncate">
              {formatCurrency(summary.totalWorkCost)}
            </div>
            <p className="text-[11px] text-theme-secondary">All internal outsource work</p>
          </div>

          {/* Paid */}
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 block">
              Paid
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-500 font-mono truncate">
              {formatCurrency(summary.totalPaid)}
            </div>
            <p className="text-[11px] text-theme-secondary">Total disbursed to workers</p>
          </div>

          {/* Due */}
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-500 block">
              Due
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-500 font-mono truncate">
              {formatCurrency(summary.pendingPayment)}
            </div>
            <p className="text-[11px] text-rose-500/80 font-medium">Pending worker payout</p>
          </div>

          {/* This Month */}
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
              This Month
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono truncate">
              {formatCurrency(summary.thisMonthCost)}
            </div>
            <p className="text-[11px] text-theme-secondary">Current calendar month</p>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. WORK BILL CREATOR (FEELS LIKE A REAL BILL SLIP, NOT A LONG FORM) */}
        {/* ===================================================================== */}
        <div ref={billSlipRef} className="mt-6">
          <div className="bg-theme-surface border-2 border-theme-accent/30 rounded-2xl md:rounded-3xl shadow-lg overflow-hidden transition-all">
            
            {/* Bill Voucher Header Bar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-theme-surface to-theme-surface-elevated border-b border-theme-border-soft flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-theme-accent text-theme-accent-contrast flex items-center justify-center font-mono font-black text-sm">
                  {editingJob ? <Edit3 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-theme-primary">
                      {editingJob ? `Edit Work Bill` : `Create Work Bill`}
                    </h2>
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
                      {editingJob?.contractorBillNumber || nextBillNumberPreview}
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    Fast & simple · Only Worker & Amount needed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className="px-3 py-1.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />

                {editingJob && (
                  <button
                    type="button"
                    onClick={resetBillSlip}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Bill Slip Body */}
            <form onSubmit={handleSaveWorkBill} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Worker Selection (Mandatory) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-theme-primary flex items-center gap-1">
                      <span>Worker / Work Partner</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddWorkerInline(!showAddWorkerInline);
                        setBillWorkerId('');
                      }}
                      className="text-[11px] font-bold text-theme-accent hover:underline cursor-pointer"
                    >
                      {showAddWorkerInline ? 'Choose Existing' : '+ New Worker'}
                    </button>
                  </div>

                  {showAddWorkerInline ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Worker Name (e.g. Rahim)"
                        value={billWorkerName}
                        onChange={e => setBillWorkerName(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                        required
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Phone (optional)"
                        value={newWorkerPhone}
                        onChange={e => setNewWorkerPhone(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                      />
                    </div>
                  ) : (
                    <select
                      value={billWorkerId}
                      onChange={e => {
                        const wid = e.target.value;
                        setBillWorkerId(wid);
                        const match = vendors.find(v => v.id === wid);
                        setBillWorkerName(match ? match.name : '');
                      }}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent cursor-pointer"
                      required
                    >
                      <option value="">Select Worker / Work Partner</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.phone ? `(${v.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Design Number & Work Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-primary block">
                      Design / Product No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GK-115"
                      value={billDesignNumber}
                      onChange={e => setBillDesignNumber(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-sm font-mono font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-primary block">
                      Work / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hand Embroidery / Half Work"
                      value={billWorkDescription}
                      onChange={e => setBillWorkDescription(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Optional Link to Customer / Invoice */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowInvoiceLink(!showInvoiceLink)}
                  className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showInvoiceLink ? '− Hide Customer / Invoice Link' : '+ Link to Customer / Invoice (Optional)'}</span>
                </button>

                {showInvoiceLink && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-theme-surface-elevated border border-theme-border-soft grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-theme-muted block mb-1">
                        Select Customer Invoice
                      </label>
                      <select
                        value={selectedInvoiceId}
                        onChange={e => handleInvoiceSelect(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent cursor-pointer"
                      >
                        <option value="">None / Unlinked Work</option>
                        {invoices.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNumber || 'INV'} — {inv.customerName || 'Customer'} ({formatCurrency(inv.totals?.grandTotal || inv.grandTotal || 0)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-theme-muted block mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="Customer name (auto-filled if invoice selected)"
                        value={linkedCustomerName}
                        onChange={e => setLinkedCustomerName(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. BILL TOTALS & SETTLEMENT SLIP */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-theme-surface-elevated via-theme-surface to-theme-surface-elevated border border-theme-border-soft space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Total Work Cost Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-primary flex items-center justify-between">
                      <span>Total Work Cost (₹)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 600"
                      value={billAmount}
                      onChange={e => setBillAmount(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border focus:border-theme-accent rounded-xl text-base font-mono font-black text-theme-primary focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Paid Amount */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-500">
                        Paid Now (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() => setBillPaid(billAmount || '0')}
                        className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                      >
                        Full Paid
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={billPaid}
                      onChange={e => setBillPaid(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-base font-mono font-bold text-emerald-500 focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all"
                    />
                  </div>

                  {/* Remaining Due (AUTOMATIC CALCULATION) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-rose-500 block">
                      Remaining Due (₹)
                    </label>
                    <div className="w-full min-h-[46px] px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl flex items-center justify-between font-mono">
                      <span className="text-sm font-black text-rose-500">
                        {formatCurrency(autoCalculatedDue)}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        autoCalculatedDue === 0 && numAmount > 0
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : numPaid > 0
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {autoCalculatedDue === 0 && numAmount > 0 ? 'Fully Paid' : numPaid > 0 ? 'Partially Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method & Internal Bank when Paid > 0 */}
                {numPaid > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-theme-border-soft/60">
                    <div>
                      <label className="text-[11px] font-bold text-theme-muted block mb-1">
                        Payment Method
                      </label>
                      <select
                        value={billPaymentMethod}
                        onChange={e => setBillPaymentMethod(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none cursor-pointer"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-theme-muted block mb-1">
                        Internal Bank / Cash Account (Money-Out)
                      </label>
                      <select
                        value={billBankAccount}
                        onChange={e => setBillBankAccount(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none cursor-pointer"
                      >
                        {bankAccounts.map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-3">
                <span className="text-[11px] text-theme-secondary hidden sm:inline">
                  Customer invoice amounts are never changed. Work Cost is tracked internally.
                </span>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={resetBillSlip}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-theme-border-soft text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    className="min-h-[44px] px-6 py-2 rounded-xl bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingJob ? 'Update Work Bill' : 'Save Work Bill'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 4. WORK HISTORY SECTION (BILLS & FILTERS) */}
        {/* ===================================================================== */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-theme-primary flex items-center gap-2">
                Work Bills & History
                <span className="text-xs px-2 py-0.5 rounded-full bg-theme-surface-elevated border border-theme-border-soft text-theme-secondary font-mono">
                  {filteredJobs.length}
                </span>
              </h2>
              {selectedWorkerFilter && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-theme-secondary">Filtered by:</span>
                  <span className="text-xs font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {selectedWorkerFilter.name}
                    <button onClick={() => setSelectedWorkerFilter(null)} className="hover:text-theme-primary cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll-premium">
              {['ALL', 'Pending', 'Partial', 'Paid'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-theme-accent text-white shadow-sm'
                      : 'bg-theme-surface border border-theme-border-soft text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
                  }`}
                >
                  {filter === 'ALL' ? 'All Bills' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bill # (WB-0001), Worker, Customer, Invoice, or Design (GK-115)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-2xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all"
            />
          </div>

          {/* WORK BILLS: DESKTOP TABLE & MOBILE CARDS */}
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-theme-muted animate-pulse bg-theme-surface border border-theme-border-soft rounded-2xl">
              Loading Work Bills...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-theme-surface border border-theme-border-soft rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-center mx-auto text-theme-muted">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-theme-primary">No work bills found</h3>
              <p className="text-xs text-theme-secondary max-w-sm mx-auto">
                {searchQuery || selectedWorkerFilter ? 'No bills match your current search or worker filter.' : 'Create your first work bill above.'}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block bg-theme-surface border border-theme-border-soft rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-theme-border-soft bg-theme-surface-elevated/40 text-[11px] font-black uppercase tracking-wider text-theme-muted">
                        <th className="py-3.5 px-4">Bill #</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Worker</th>
                        <th className="py-3.5 px-4">Design / Work</th>
                        <th className="py-3.5 px-4">Customer & Invoice</th>
                        <th className="py-3.5 px-4 text-right">Amount</th>
                        <th className="py-3.5 px-4 text-right">Paid</th>
                        <th className="py-3.5 px-4 text-right">Due</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft font-medium">
                      {filteredJobs.map(job => {
                        const cost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
                        const paid = Number(job.paidAmount !== undefined ? job.paidAmount : job.totalPaid) || 0;
                        const due = Math.max(0, cost - paid);
                        const dateStr = job.assignedAt || job.createdAt || job.date;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                        const billNum = job.contractorBillNumber || job.jobCode || 'WB-0001';

                        let statusLabel = 'Unpaid';
                        let statusColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                        if (due === 0 && cost > 0) {
                          statusLabel = 'Paid';
                          statusColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                        } else if (paid > 0) {
                          statusLabel = 'Partial';
                          statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                        }

                        return (
                          <tr key={job.id} className="hover:bg-theme-surface-hover/40 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-theme-accent text-xs">
                              {billNum}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-theme-secondary font-mono text-[11px]">
                              {formattedDate}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-theme-primary">
                              {job.contractorName || job.vendorName || 'Worker'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-theme-primary flex items-center gap-1.5 flex-wrap">
                                {job.designNumber && (
                                  <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                                    {job.designNumber}
                                  </span>
                                )}
                                <span className="truncate max-w-[160px]">{job.workDescription || job.productName || 'Work'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs">
                                <span className="font-semibold text-theme-primary">{job.customerName || 'Walk-in'}</span>
                                {job.invoiceNumber && (
                                  <span className="ml-1.5 font-mono text-[10px] px-1.5 py-0.2 rounded bg-theme-surface-elevated border border-theme-border-soft text-theme-muted">
                                    {job.invoiceNumber}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-theme-primary font-mono">
                              {formatCurrency(cost)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-500 font-mono">
                              {formatCurrency(paid)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black font-mono">
                              <span className={due > 0 ? 'text-rose-500' : 'text-theme-muted'}>
                                {formatCurrency(due)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedJobForBill(job);
                                    setBillModalOpen(true);
                                  }}
                                  className="min-h-[34px] px-2.5 py-1 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary border border-theme-border-soft rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  title="View Voucher"
                                >
                                  View
                                </button>

                                {due > 0 && (
                                  <button
                                    onClick={() => {
                                      setPaymentTargetJob(job);
                                      setPartialPayModalOpen(true);
                                    }}
                                    className="min-h-[34px] px-2.5 py-1 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary border border-theme-border-soft rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                    title="Pay"
                                  >
                                    Pay
                                  </button>
                                )}

                                {due > 0 && (
                                  <button
                                    onClick={() => handleMarkAsPaid(job)}
                                    className="min-h-[34px] px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-[11px] font-black transition-all cursor-pointer"
                                    title="Mark Paid"
                                  >
                                    Mark Paid
                                  </button>
                                )}

                                <button
                                  onClick={() => handleEditJob(job)}
                                  className="min-h-[34px] w-[34px] flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface-elevated rounded-lg transition-all cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setDeleteConfirmJob(job)}
                                  className="min-h-[34px] w-[34px] flex items-center justify-center text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS VIEW (360, 375, 390, 412, 480) */}
              <div className="md:hidden space-y-3">
                {filteredJobs.map(job => {
                  const cost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
                  const paid = Number(job.paidAmount !== undefined ? job.paidAmount : job.totalPaid) || 0;
                  const due = Math.max(0, cost - paid);
                  const dateStr = job.assignedAt || job.createdAt || job.date;
                  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                  const billNum = job.contractorBillNumber || job.jobCode || 'WB-0001';

                  let statusLabel = 'Unpaid';
                  let statusColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                  if (due === 0 && cost > 0) {
                    statusLabel = 'Paid';
                    statusColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  } else if (paid > 0) {
                    statusLabel = 'Partial';
                    statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  }

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-theme-accent text-sm">
                            {billNum}
                          </span>
                          <span className="text-[11px] font-mono text-theme-muted">
                            {formattedDate}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-theme-muted text-[11px]">Worker:</span>
                          <span className="font-bold text-theme-primary">
                            {job.contractorName || job.vendorName || 'Worker'}
                          </span>
                        </div>

                        {(job.designNumber || job.workDescription) && (
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-theme-muted text-[11px] shrink-0">Design / Work:</span>
                            <div className="text-right">
                              {job.designNumber && (
                                <span className="inline-block font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-theme-accent/10 text-theme-accent border border-theme-accent/20 mr-1">
                                  {job.designNumber}
                                </span>
                              )}
                              <span className="font-medium text-theme-secondary text-[11px]">
                                {job.workDescription || job.productName}
                              </span>
                            </div>
                          </div>
                        )}

                        {job.customerName && (
                          <div className="flex items-center justify-between pt-1 border-t border-theme-border-soft/60">
                            <span className="text-theme-muted text-[11px]">Customer / Inv:</span>
                            <span className="font-semibold text-theme-primary">
                              {job.customerName}
                              {job.invoiceNumber && <span className="ml-1 text-[10px] font-mono opacity-80">({job.invoiceNumber})</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3-Box Financial Breakdown */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-theme-surface-elevated/70 border border-theme-border-soft text-center font-mono">
                        <div>
                          <span className="text-[9px] text-theme-muted block font-sans">Amount</span>
                          <span className="font-black text-xs text-theme-primary">{formatCurrency(cost)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-sans">Paid</span>
                          <span className="font-bold text-xs text-emerald-500">{formatCurrency(paid)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-sans">Due</span>
                          <span className={`font-black text-xs ${due > 0 ? 'text-rose-500' : 'text-theme-muted'}`}>
                            {formatCurrency(due)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setSelectedJobForBill(job);
                            setBillModalOpen(true);
                          }}
                          className="flex-1 min-h-[44px] px-3 py-2 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary border border-theme-border-soft rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>

                        {due > 0 && (
                          <button
                            onClick={() => {
                              setPaymentTargetJob(job);
                              setPartialPayModalOpen(true);
                            }}
                            className="flex-1 min-h-[44px] px-3 py-2 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary border border-theme-border-soft rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}

                        {due > 0 && (
                          <button
                            onClick={() => handleMarkAsPaid(job)}
                            className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleEditJob(job)}
                          className="min-h-[44px] w-[44px] flex items-center justify-center text-theme-muted hover:text-theme-primary bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmJob(job)}
                          className="min-h-[44px] w-[44px] flex items-center justify-center text-theme-muted hover:text-rose-500 bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 5. WORKER SECTION (WORKERS & TOTALS DIRECTLY ON PAGE) */}
        {/* ===================================================================== */}
        <div ref={workersSectionRef} className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-theme-border-soft">
            <div>
              <h2 className="text-lg font-black text-theme-primary flex items-center gap-2">
                Worker Section
                <span className="text-xs px-2 py-0.5 rounded-full bg-theme-surface-elevated border border-theme-border-soft text-theme-secondary font-mono">
                  {vendors.length}
                </span>
              </h2>
              <p className="text-xs text-theme-secondary">
                Worker names, total work, costs, payments, and complete bill history
              </p>
            </div>

            <button
              onClick={() => {
                setEditingWorker(null);
                setWorkerModalOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Worker</span>
            </button>
          </div>

          {vendors.length === 0 ? (
            <div className="p-8 text-center text-xs text-theme-muted bg-theme-surface border border-theme-border-soft rounded-2xl">
              No workers registered yet. Click &quot;+ New Worker&quot; to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {vendors.map(worker => {
                const workerJobs = jobs.filter(j => (j.contractorId === worker.id || j.vendorId === worker.id) && !j.isDeleted);
                const totalCost = workerJobs.reduce((acc, j) => acc + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0);
                const totalPaid = workerJobs.reduce((acc, j) => acc + (Number(j.paidAmount !== undefined ? j.paidAmount : j.totalPaid) || 0), 0);
                const totalDue = Math.max(0, totalCost - totalPaid);

                return (
                  <div
                    key={worker.id}
                    className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft space-y-3 shadow-sm hover:border-theme-border transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-sm text-theme-primary">{worker.name}</h3>
                        <p className="text-xs text-theme-secondary flex items-center gap-1 mt-0.5">
                          {worker.phone ? (
                            <>
                              <Phone className="w-3 h-3 text-theme-muted" />
                              <span>{worker.phone}</span>
                            </>
                          ) : (
                            <span className="text-theme-muted">No phone</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingWorker(worker);
                            setWorkerModalOpen(true);
                          }}
                          className="min-h-[34px] w-[34px] flex items-center justify-center text-theme-muted hover:text-theme-accent rounded-lg transition-colors cursor-pointer"
                          title="Edit Worker"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmWorker(worker);
                          }}
                          className="min-h-[34px] w-[34px] flex items-center justify-center text-theme-muted hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete Worker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Worker Stats */}
                    <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-theme-surface-elevated/70 border border-theme-border-soft text-center font-mono">
                      <div>
                        <span className="text-[9px] text-theme-muted block font-sans">Work</span>
                        <span className="font-bold text-xs text-theme-primary">{workerJobs.length}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-theme-muted block font-sans">Cost</span>
                        <span className="font-bold text-xs text-theme-primary">{formatCurrency(totalCost)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-theme-muted block font-sans">Paid</span>
                        <span className="font-bold text-xs text-emerald-500">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-theme-muted block font-sans">Due</span>
                        <span className={`font-black text-xs ${totalDue > 0 ? 'text-rose-500' : 'text-theme-muted'}`}>
                          {formatCurrency(totalDue)}
                        </span>
                      </div>
                    </div>

                    {/* Action: View bills / history */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedWorkerFilter(worker);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="flex-1 min-h-[38px] px-3 py-1.5 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary border border-theme-border-soft rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-theme-accent" />
                        <span>Filter Bills ({workerJobs.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWorkerForLedger(worker);
                          setWorkerLedgerModalOpen(true);
                        }}
                        className="min-h-[38px] px-3 py-1.5 bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary border border-theme-border-soft rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Complete Ledger Statement"
                      >
                        Ledger
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. PERSONAL WORK BILL VOUCHER MODAL (BILLQYRO VOUCHER LOOK) */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {billModalOpen && selectedJobForBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto"
            >
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-theme-border-soft pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent">
                      Work Cost Voucher
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                      (Number(selectedJobForBill.totalContractorCost || selectedJobForBill.agreedCost || 0) - Number(selectedJobForBill.paidAmount || selectedJobForBill.totalPaid || 0)) <= 0
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : Number(selectedJobForBill.paidAmount || selectedJobForBill.totalPaid || 0) > 0
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {selectedJobForBill.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-theme-primary font-mono mt-0.5">
                    {selectedJobForBill.contractorBillNumber || selectedJobForBill.jobCode || 'WB-0001'}
                  </h3>
                </div>

                <button
                  onClick={() => setBillModalOpen(false)}
                  className="min-h-[40px] w-[40px] flex items-center justify-center rounded-xl hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Voucher Slip */}
              <div id="printable-work-voucher" className="space-y-3 text-xs bg-theme-surface-elevated/40 p-4 rounded-2xl border border-theme-border-soft">
                <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                  <span className="text-theme-muted">Voucher Date:</span>
                  <span className="font-bold font-mono text-theme-primary">
                    {selectedJobForBill.assignedAt ? new Date(selectedJobForBill.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                  <span className="text-theme-muted">Worker Name:</span>
                  <span className="font-bold text-theme-primary">{selectedJobForBill.contractorName || 'Worker'}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                  <span className="text-theme-muted">Customer:</span>
                  <span className="font-bold text-theme-primary">{selectedJobForBill.customerName || 'Walk-in / Direct Work'}</span>
                </div>

                {selectedJobForBill.invoiceNumber && (
                  <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                    <span className="text-theme-muted">Invoice Ref:</span>
                    <span className="font-bold font-mono text-theme-primary">{selectedJobForBill.invoiceNumber}</span>
                  </div>
                )}

                {selectedJobForBill.designNumber && (
                  <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                    <span className="text-theme-muted">Design Number:</span>
                    <span className="font-bold font-mono text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded border border-theme-accent/20">
                      {selectedJobForBill.designNumber}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60">
                  <span className="text-theme-muted">Work Details:</span>
                  <span className="font-medium text-theme-secondary text-right">{selectedJobForBill.workDescription || 'Work Assignment'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-border-soft font-mono">
                  <span className="text-theme-muted font-sans font-bold">Total Work Cost:</span>
                  <span className="font-black text-theme-primary text-sm">
                    {formatCurrency(Number(selectedJobForBill.totalContractorCost !== undefined ? selectedJobForBill.totalContractorCost : selectedJobForBill.agreedCost) || 0)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-theme-border-soft/60 font-mono">
                  <span className="text-theme-muted font-sans">Paid:</span>
                  <span className="font-bold text-emerald-500">
                    {formatCurrency(Number(selectedJobForBill.paidAmount !== undefined ? selectedJobForBill.paidAmount : selectedJobForBill.totalPaid) || 0)}
                  </span>
                </div>

                <div className="flex justify-between py-2 font-mono">
                  <span className="text-theme-muted font-sans font-bold">Due:</span>
                  <span className="font-black text-rose-500 text-sm">
                    {formatCurrency(Math.max(0, (Number(selectedJobForBill.totalContractorCost !== undefined ? selectedJobForBill.totalContractorCost : selectedJobForBill.agreedCost) || 0) - (Number(selectedJobForBill.paidAmount !== undefined ? selectedJobForBill.paidAmount : selectedJobForBill.totalPaid) || 0)))}
                  </span>
                </div>

                {selectedJobForBill.notes && (
                  <div className="pt-2 text-[11px] text-theme-secondary italic border-t border-theme-border-soft/60">
                    Note: {selectedJobForBill.notes}
                  </div>
                )}
              </div>

              {/* Voucher Action Buttons: Print, Payment, Edit, Close */}
              <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                <button
                  onClick={() => window.print()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border-soft text-xs font-bold text-theme-primary flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBillModalOpen(false);
                      handleEditJob(selectedJobForBill);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border-soft text-xs font-bold text-theme-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {Math.max(0, (Number(selectedJobForBill.totalContractorCost !== undefined ? selectedJobForBill.totalContractorCost : selectedJobForBill.agreedCost) || 0) - (Number(selectedJobForBill.paidAmount !== undefined ? selectedJobForBill.paidAmount : selectedJobForBill.totalPaid) || 0)) > 0 && (
                    <button
                      onClick={() => {
                        setBillModalOpen(false);
                        setPaymentTargetJob(selectedJobForBill);
                        setPartialPayModalOpen(true);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payment</span>
                    </button>
                  )}

                  <button
                    onClick={() => setBillModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-theme-accent text-white text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 7. COMPLETE WORKER LEDGER MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {workerLedgerModalOpen && selectedWorkerForLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-theme-border-soft pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent px-2 py-0.5 rounded-full bg-theme-accent/10 border border-theme-accent/20">
                    Worker Statement
                  </span>
                  <h3 className="text-xl font-black text-theme-primary mt-1">
                    {selectedWorkerForLedger.name}
                  </h3>
                  <p className="text-xs text-theme-secondary">
                    {selectedWorkerForLedger.phone || 'No phone registered'} {selectedWorkerForLedger.address ? `· ${selectedWorkerForLedger.address}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => setWorkerLedgerModalOpen(false)}
                  className="min-h-[40px] w-[40px] flex items-center justify-center rounded-xl hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const wJobs = jobs.filter(j => (j.contractorId === selectedWorkerForLedger.id || j.vendorId === selectedWorkerForLedger.id) && !j.isDeleted);
                const wCost = wJobs.reduce((acc, j) => acc + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0);
                const wPaid = wJobs.reduce((acc, j) => acc + (Number(j.paidAmount !== undefined ? j.paidAmount : j.totalPaid) || 0), 0);
                const wDue = Math.max(0, wCost - wPaid);
                const ledger = getVendorLedger(selectedWorkerForLedger, jobs, payments);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-theme-surface-elevated/70 border border-theme-border-soft text-center font-mono">
                      <div>
                        <span className="text-[10px] text-theme-muted block font-sans">Total Bills</span>
                        <span className="font-bold text-xs sm:text-sm text-theme-primary">{wJobs.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-theme-muted block font-sans">Total Cost</span>
                        <span className="font-bold text-xs sm:text-sm text-theme-primary">{formatCurrency(wCost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-theme-muted block font-sans">Total Paid</span>
                        <span className="font-bold text-xs sm:text-sm text-emerald-500">{formatCurrency(wPaid)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-theme-muted block font-sans">Due</span>
                        <span className={`font-black text-xs sm:text-sm ${wDue > 0 ? 'text-rose-500' : 'text-theme-muted'}`}>{formatCurrency(wDue)}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-theme-muted mb-2">
                        Ledger Statement ({ledger.statement?.length || 0} entries)
                      </h4>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-theme-border-soft">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-theme-surface-elevated text-[10px] uppercase font-black text-theme-muted border-b border-theme-border-soft">
                            <tr>
                              <th className="p-2">Date</th>
                              <th className="p-2">Description</th>
                              <th className="p-2 text-right">Debit</th>
                              <th className="p-2 text-right">Credit</th>
                              <th className="p-2 text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border-soft font-mono text-[11px]">
                            {ledger.statement?.map((entry, idx) => (
                              <tr key={idx} className="hover:bg-theme-surface-hover/50">
                                <td className="p-2 text-theme-secondary whitespace-nowrap">
                                  {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                                </td>
                                <td className="p-2 font-sans font-medium text-theme-primary">
                                  {entry.description}
                                </td>
                                <td className="p-2 text-right text-emerald-500 font-bold">
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                                </td>
                                <td className="p-2 text-right text-theme-primary font-bold">
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                                </td>
                                <td className="p-2 text-right font-black text-rose-500">
                                  {formatCurrency(entry.balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border-soft">
                <button
                  onClick={() => setWorkerLedgerModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-theme-accent text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 8. PARTIAL PAYMENT MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {partialPayModalOpen && paymentTargetJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-theme-border-soft pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-theme-primary">
                    Record Payment to {paymentTargetJob.contractorName || 'Worker'}
                  </h3>
                  <p className="text-[11px] text-theme-secondary">
                    Bill: {paymentTargetJob.contractorBillNumber} | Due: {formatCurrency(Math.max(0, (Number(paymentTargetJob.totalContractorCost !== undefined ? paymentTargetJob.totalContractorCost : paymentTargetJob.agreedCost) || 0) - (Number(paymentTargetJob.paidAmount !== undefined ? paymentTargetJob.paidAmount : paymentTargetJob.totalPaid) || 0)))}
                  </p>
                </div>
                <button
                  onClick={() => setPartialPayModalOpen(false)}
                  className="min-h-[38px] w-[38px] flex items-center justify-center rounded-xl text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePartialPaymentSubmit} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="amount"
                    defaultValue={Math.max(0, (Number(paymentTargetJob.totalContractorCost !== undefined ? paymentTargetJob.totalContractorCost : paymentTargetJob.agreedCost) || 0) - (Number(paymentTargetJob.paidAmount !== undefined ? paymentTargetJob.paidAmount : paymentTargetJob.totalPaid) || 0))}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary font-mono font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                      Method
                    </label>
                    <select
                      name="paymentMethod"
                      defaultValue="Cash"
                      className="w-full min-h-[44px] px-3 py-2 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                      Internal Bank Account
                    </label>
                    <select
                      name="bankAccount"
                      defaultValue={bankAccounts[0] || 'Cash'}
                      className="w-full min-h-[44px] px-3 py-2 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      {bankAccounts.map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  />
                </div>

                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    name="note"
                    placeholder="Disbursement remarks"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border-soft">
                  <button
                    type="button"
                    onClick={() => setPartialPayModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-theme-border-soft text-theme-secondary text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-theme-accent text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 9. ADD / EDIT WORKER MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {workerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-theme-border-soft pb-2.5">
                <h3 className="text-sm font-black text-theme-primary">
                  {editingWorker ? 'Edit Worker Profile' : '+ Add New Worker'}
                </h3>
                <button
                  onClick={() => setWorkerModalOpen(false)}
                  className="min-h-[38px] w-[38px] flex items-center justify-center rounded-xl text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWorkerSubmit} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Worker Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingWorker?.name || ''}
                    placeholder="e.g. Rahim"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingWorker?.phone || ''}
                    placeholder="+91 98765 43210"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  />
                </div>

                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Address / Workshop (Optional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingWorker?.address || ''}
                    placeholder="Workshop address or city"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  />
                </div>

                <div>
                  <label className="block text-theme-muted uppercase text-[10px] font-black mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={editingWorker?.notes || ''}
                    placeholder="Special skills, remarks"
                    rows="2"
                    className="w-full px-3.5 py-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border-soft">
                  <button
                    type="button"
                    onClick={() => setWorkerModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-theme-border-soft text-theme-secondary text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-theme-accent text-white text-xs font-black shadow-sm cursor-pointer"
                  >
                    Save Worker
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 10. DELETE CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {deleteConfirmJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-theme-primary">
                  Delete Work Bill?
                </h3>
                <p className="text-xs text-theme-secondary mt-1">
                  Are you sure you want to delete <strong className="text-theme-primary font-mono">{deleteConfirmJob.contractorBillNumber || 'this bill'}</strong>? Associated internal disbursements will be safely reconciled.
                </p>
                <div className="mt-4">
                  <label className="text-xs font-bold text-rose-500 mb-1.5 block uppercase tracking-wider">
                    Type "DELETE" to confirm *
                  </label>
                  <input
                    type="text"
                    id="confirmDeleteInput"
                    placeholder="DELETE"
                    className="w-full px-3 py-2 bg-theme-surface border border-rose-500/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm font-mono outline-none"
                    onChange={(e) => {
                      const btn = document.getElementById('confirmDeleteBtn');
                      if (btn) {
                        if (e.target.value === 'DELETE') {
                          btn.disabled = false;
                          btn.classList.remove('opacity-50', 'cursor-not-allowed');
                          btn.classList.add('hover:bg-rose-600', 'cursor-pointer');
                        } else {
                          btn.disabled = true;
                          btn.classList.add('opacity-50', 'cursor-not-allowed');
                          btn.classList.remove('hover:bg-rose-600', 'cursor-pointer');
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmJob(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-theme-border-soft text-theme-secondary text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirmDeleteBtn"
                  disabled={true}
                  onClick={confirmDeleteJobAction}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black shadow-sm opacity-50 cursor-not-allowed transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* DELETE CONFIRM WORKER MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {deleteConfirmWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-surface border border-theme-border-soft rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-theme-primary">
                  Delete Worker?
                </h3>
                <p className="text-xs text-theme-secondary mt-1">
                  Are you sure you want to delete worker <strong className="text-theme-primary font-mono">{deleteConfirmWorker.name}</strong>?
                </p>
                <div className="mt-4">
                  <label className="text-xs font-bold text-rose-500 mb-1.5 block uppercase tracking-wider">
                    Type "DELETE" to confirm *
                  </label>
                  <input
                    type="text"
                    id="confirmDeleteWorkerInput"
                    placeholder="DELETE"
                    className="w-full px-3 py-2 bg-theme-surface border border-rose-500/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm font-mono outline-none"
                    onChange={(e) => {
                      const btn = document.getElementById('confirmDeleteWorkerBtn');
                      if (btn) {
                        if (e.target.value === 'DELETE') {
                          btn.disabled = false;
                          btn.classList.remove('opacity-50', 'cursor-not-allowed');
                          btn.classList.add('hover:bg-rose-600', 'cursor-pointer');
                        } else {
                          btn.disabled = true;
                          btn.classList.add('opacity-50', 'cursor-not-allowed');
                          btn.classList.remove('hover:bg-rose-600', 'cursor-pointer');
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmWorker(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-theme-border-soft text-theme-secondary text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirmDeleteWorkerBtn"
                  disabled={true}
                  onClick={confirmDeleteWorkerAction}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black shadow-sm opacity-50 cursor-not-allowed transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 11. MOBILE STICKY BOTTOM ACTION BAR */}
      {/* ===================================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-theme-surface/90 backdrop-blur-lg border-t border-theme-border-soft flex items-center justify-between gap-3 shadow-lg">
        <div className="text-xs font-mono">
          <span className="text-[10px] text-theme-muted block font-sans">Pending Due</span>
          <span className="font-black text-rose-500 text-sm">{formatCurrency(summary.pendingPayment)}</span>
        </div>

        <button
          onClick={() => {
            setIsBillSlipOpen(true);
            resetBillSlip();
            if (billSlipRef.current) {
              billSlipRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-theme-accent text-theme-accent-contrast text-xs font-black flex items-center gap-2 shadow-md cursor-pointer ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Bill</span>
        </button>
      </div>

    </div>
  );
};

export default OutsourceVendors;

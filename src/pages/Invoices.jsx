import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n, t } from '../utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import AnimatedPage from '../components/AnimatedPage';
import InvoiceCard from '../components/InvoiceCard';
import InvoicePreview from '../components/InvoicePreview';

import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  FileText,
  X, 
  Printer, 
  Download, 
  ImageDown, 
  Edit, 
  Mail, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  Link, 
  AlertTriangle, 
  Upload, 
  Trash2, 
  Loader2,
  ArrowRight,
  CreditCard,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Repeat,
  Scissors,
  Briefcase
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../utils/invoiceUtils';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus 
} from '../utils/invoiceMath';
import { toast } from 'react-hot-toast';
import { 
  generateWhatsAppReminderLink,
  generateEmailShareLink, 
  generateInvoiceShareText 
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import { shareOnWhatsApp } from '../services/invoiceShareService2';
import { printThermalReceipt } from '../utils/thermalPrinter';
import PullToRefresh from '../components/PullToRefresh';
import PremiumEmptyState from '../components/PremiumEmptyState';
import { getPortalLabelByType } from '../config/businessPresets';
import { triggerSuccessFeedback, triggerPaymentSuccessFeedback } from '../utils/feedback';

// Premium WhatsApp Icon SVG Component
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Invoice Command Center 5.0
 */
const Invoices = ({ 
  invoices = [], 
  editingInvoice = null,
  onEditInvoice, 
  onDeleteInvoice, 
  onDownloadPDF, 
  onDownloadImage, 
  setCurrentTab,
  businessSettings,
  onPaymentRecorded,
  onRecordPayment,
  onOpenCollection,
  onDuplicate,
  onToggleRecurring,
  onGenerateRecurring,
  products = []
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Multi-Selection State for Bulk Actions
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  // Modal Preview & Payment States
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCache, setLinkCache] = useState({});
  const [paidDeleteTarget, setPaidDeleteTarget] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Outsource Work Assignment Quick Modal States
  const [outsourceModalOpen, setOutsourceModalOpen] = useState(false);
  const [outsourceTargetInvoice, setOutsourceTargetInvoice] = useState(null);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [designNumberInput, setDesignNumberInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [workDetailsInput, setWorkDetailsInput] = useState('');
  const [totalCostInput, setTotalCostInput] = useState('');
  const [paidNowInput, setPaidNowInput] = useState('0');
  const [paymentMethodInput, setPaymentMethodInput] = useState('UPI');
  const [bankAccountInput, setBankAccountInput] = useState('Cash');
  const [bankAccountsList, setBankAccountsList] = useState(['Cash', 'Bank Account', 'UPI']);
  const [quickPartnerName, setQuickPartnerName] = useState('');
  const [showQuickAddPartner, setShowQuickAddPartner] = useState(false);
  const [invoiceOutsourceJobs, setInvoiceOutsourceJobs] = useState([]);
  
  const currencySymbol = businessSettings?.currency || '₹';
  const portalLabel = getPortalLabelByType(businessSettings?.businessType);
  const ITEMS_PER_PAGE = 30;

  // Category & Workspace Setup
  const wsType = (businessSettings?.businessType || 'retail').toLowerCase();
  const wsName = businessSettings?.businessName || 'Your Business Workspace';

  const categoryBadges = {
    embroidery: 'EMBROIDERY • DESIGN BILLING',
    tailor: 'TAILORING • CUSTOM STITCHING',
    clinic: 'CLINICAL • PATIENT BILLING',
    doctor: 'MEDICAL • CONSULTATION BILLING',
    education: 'ACADEMIC • TUITION FEES',
    teacher: 'TUITION • STUDENT BILLING',
    service: 'SERVICE & REPAIR OPERATIONS',
    repair: 'REPAIR & SERVICE BILLING',
    retail: 'RETAIL • SALES COMMAND',
    grocery: 'GROCERY & STORE BILLING',
    generic: 'FINANCIAL INVOICE COMMAND'
  };

  const categorySubtitles = {
    embroidery: 'Design & Embroidery Invoices • Manage stitch counts, advance deposits and design dues.',
    tailor: 'Tailoring & Stitching Bills • Track stitching charges, fabric deposits and balance dues.',
    clinic: 'Medical Consultations & Billing • Monitor patient invoices, treatment fees and collections.',
    doctor: 'Medical Consultations & Billing • Monitor patient invoices, treatment fees and collections.',
    education: 'Tuition & Academic Fees • Manage student fee invoices, installments and pending dues.',
    teacher: 'Tuition & Academic Fees • Manage student fee invoices, installments and pending dues.',
    service: 'Service & Repair Billing • Track job status, device repairs and service dues.',
    repair: 'Repair & Job Billing • Track device repairs, parts and outstanding collections.',
    retail: 'Sales & Billing Command Center • Manage store invoices, inventory sales and cash flow.',
    grocery: 'Daily Sales & Invoicing • Track counter bills, payments and customer ledgers.',
    generic: 'Financial Invoices Command Center • Manage, track and collect every bill from one place.'
  };

  const currentBadge = categoryBadges[wsType] || categoryBadges.generic;
  const currentSubtitle = categorySubtitles[wsType] || categorySubtitles.generic;

  // Background Firestore public proofs sweeping & syncing
  useEffect(() => {
    if (invoices.length > 0) {
      const sweepAndSync = async () => {
        const result = await invoiceEngine.syncPublicInvoices(invoices);
        if (result && result.changed) {
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      };
      const delay = setTimeout(sweepAndSync, 1000);
      return () => clearTimeout(delay);
    }
  }, [invoices]);

  // On-demand real-time public proof syncer when viewing an invoice
  useEffect(() => {
    let cancelled = false;

    if (viewingInvoice && viewingInvoice.publicToken) {
      const fetchLatestFromPublic = async () => {
        try {
          const updated = await invoiceEngine.syncSinglePublicInvoice(viewingInvoice);
          if (cancelled || !updated || updated === viewingInvoice) return;
          
          const updatedInvoices = invoices.map(inv => inv.id === viewingInvoice.id ? updated : inv);
          localStorage.setItem('billqyro_invoices', JSON.stringify(updatedInvoices));
          setViewingInvoice(updated);
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        } catch (err) {
          console.warn('Failed to sync viewingInvoice with public doc:', err);
        }
      };
      fetchLatestFromPublic();
    }

    return () => { cancelled = true; };
  }, [viewingInvoice?.id, invoices]);

  // Load Outsourced Work records linked to currently viewed invoice
  useEffect(() => {
    if (!viewingInvoice) {
      setInvoiceOutsourceJobs([]);
      return;
    }
    const loadJobsForInvoice = async () => {
      try {
        const { getOutsourceJobs } = await import('../services/outsourceEngine');
        const allJobs = await getOutsourceJobs();
        const invId = viewingInvoice.id;
        const invNum = viewingInvoice.invoiceNumber;
        const linked = allJobs.filter(j => 
          (j.invoiceId && (j.invoiceId === invId || j.invoiceId === invNum)) ||
          (j.invoiceNumber && invNum && j.invoiceNumber === invNum)
        );
        setInvoiceOutsourceJobs(linked);
      } catch (e) {
        console.warn('Failed to load linked outsource jobs for invoice:', e);
      }
    };
    loadJobsForInvoice();

    const handleUpdate = () => loadJobsForInvoice();
    window.addEventListener('billqyro_outsource_updated', handleUpdate);
    return () => window.removeEventListener('billqyro_outsource_updated', handleUpdate);
  }, [viewingInvoice?.id, viewingInvoice?.invoiceNumber]);

  // Handle Proof Approval
  const handleApproveProof = async (proof) => {
    if (!window.confirm(`Are you sure you want to APPROVE this payment proof of ${currencySymbol}${proof.amount}?`)) return;

    const freshInvoice = invoices.find(inv => inv.id === viewingInvoice.id) || viewingInvoice;
    const history = freshInvoice.paymentHistory || [];

    const alreadyApplied = history.some(p => p.proofId === proof.id || p.id === proof.id || p.id === ('pmt_' + proof.id));
    if (alreadyApplied) {
      toast.error('This payment proof has already been approved.');
      return;
    }

    const proofAmount = parseFloat(proof.amount) || 0;
    const historyItem = {
      id: 'pmt_' + (proof.id || Date.now()),
      proofId: proof.id,
      date: new Date().toISOString().split('T')[0],
      amount: proofAmount,
      method: proof.method || 'Online',
      transactionId: proof.transactionId || 'N/A',
      verified: true,
      reviewer: businessSettings?.businessName ? `Admin (${businessSettings.businessName})` : 'System Admin',
      verifiedAt: new Date().toISOString()
    };

    const newHistory = [...history, historyItem];
    const totalPaid = Math.round(newHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100;
    const grandTotal = Math.round((parseFloat(freshInvoice.grandTotal || freshInvoice.total) || 0) * 100) / 100;
    const balanceDue = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);
    
    let newStatus = freshInvoice.paymentStatus;
    if (balanceDue <= 0 && grandTotal > 0) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partially Paid';
    }

    const updatedProofs = (freshInvoice.paymentProofs || []).map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'Approved' };
      }
      return p;
    });

    const updatedInvoice = {
      ...freshInvoice,
      grandTotal,
      amountPaid: totalPaid,
      paidAmount: totalPaid,
      balanceDue,
      paymentStatus: newStatus,
      paymentHistory: newHistory,
      paymentProofs: updatedProofs
    };

    await invoiceEngine.saveInvoice(updatedInvoice);

    try {
      const { bankEngine } = await import('../services/bankEngine');
      await bankEngine.autoPostPayment({
        id: historyItem.id,
        amount: historyItem.amount,
        method: historyItem.method,
        date: historyItem.date,
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        customerId: updatedInvoice.customer?.id || updatedInvoice.customerId || null,
        customerName: updatedInvoice.customer?.name || updatedInvoice.customerName || '',
        note: `Approved proof txn: ${historyItem.transactionId}`
      });
    } catch (e) {
      console.warn('[BANK] auto-post proof payment skipped:', e);
    }
    
    setViewingInvoice(updatedInvoice);
    triggerPaymentSuccessFeedback();
    toast.success('Payment proof successfully APPROVED!');
  };

  const handleOpenAddOutsource = async (inv) => {
    setOutsourceTargetInvoice(inv);
    setShowQuickAddPartner(false);
    setQuickPartnerName('');
    try {
      const { getVendors } = await import('../services/outsourceEngine');
      const vList = await getVendors();
      setAvailablePartners(vList);
      if (vList.length > 0) {
        setSelectedPartnerId(vList[0].id);
      } else {
        setSelectedPartnerId('');
        setShowQuickAddPartner(true);
      }
      
      const { bankEngine } = await import('../services/bankEngine');
      const bSet = await bankEngine.getBankSettings().catch(() => ({ accounts: ['Cash', 'Main Bank', 'UPI'] }));
      setBankAccountsList(bSet?.accounts || ['Cash', 'Main Bank', 'UPI']);
    } catch (e) {
      console.warn('Failed to load partners for outsource modal:', e);
    }
    
    // Auto-prefill product/design from first item if present
    if (inv?.items && inv.items.length > 0) {
      const first = inv.items[0];
      const dNo = first.designNumber || first.sku || first.itemCode || first.code || '';
      setDesignNumberInput(dNo);
      setProductNameInput(first.name || '');
      setWorkDetailsInput(first.name ? `Outsourced work for ${first.name}` : 'Custom Design');
      setTotalCostInput(first.rate ? String(Math.round(first.rate * 0.4)) : '600');
    } else {
      setDesignNumberInput('');
      setProductNameInput('');
      setWorkDetailsInput('Custom Design');
      setTotalCostInput('600');
    }
    setPaidNowInput('0');
    setPaymentMethodInput('UPI');
    setBankAccountInput('Cash');
    setOutsourceModalOpen(true);
  };

  const handleSubmitOutsource = async (e) => {
    e.preventDefault();
    if (!outsourceTargetInvoice) return;
    const cost = parseFloat(totalCostInput) || 0;
    const paid = parseFloat(paidNowInput) || 0;
    if (cost <= 0) {
      toast.error('Please enter a valid total cost.');
      return;
    }
    let partnerId = selectedPartnerId;
    let partner = availablePartners.find(p => p.id === partnerId);
    
    if (showQuickAddPartner || !partnerId) {
      if (!quickPartnerName.trim()) {
        toast.error('Please enter contractor / work partner name.');
        return;
      }
      const { saveVendor } = await import('../services/outsourceEngine');
      const newV = await saveVendor({ name: quickPartnerName.trim(), specialization: 'Specialist' });
      partnerId = newV.id;
      partner = newV;
    }

    try {
      const { saveOutsourceJob, recordOutsourcePayment } = await import('../services/outsourceEngine');
      const savedJob = await saveOutsourceJob({
        contractorId: partnerId,
        contractorName: partner?.name || 'Partner',
        customerId: outsourceTargetInvoice.customerId || null,
        customerName: outsourceTargetInvoice.customerName || 'Customer',
        invoiceId: outsourceTargetInvoice.id,
        invoiceNumber: outsourceTargetInvoice.invoiceNumber,
        designNumber: designNumberInput.trim(),
        productName: productNameInput.trim() || 'Custom Work',
        workDescription: workDetailsInput.trim() || 'Outsource Task',
        assignedQuantity: 1,
        contractorRate: cost,
        totalContractorCost: cost,
        ownerWorkPercentage: 50,
        contractorWorkPercentage: 50,
        workStatus: 'Assigned',
        assignedAt: new Date().toISOString()
      });

      if (paid > 0) {
        await recordOutsourcePayment({
          contractorBillId: savedJob.id,
          contractorBillNumber: savedJob.contractorBillNumber,
          contractorId: partnerId,
          contractorName: partner?.name || 'Partner',
          amount: paid,
          paymentMethod: paymentMethodInput,
          bankAccount: bankAccountInput,
          note: `Advance for Bill ${savedJob.contractorBillNumber}`,
          syncWithBank: true
        });
      }

      toast.success(`Work assigned to ${partner?.name || 'Partner'} (Bill ${savedJob.contractorBillNumber}). Customer invoice total remains unchanged.`);
      setOutsourceModalOpen(false);
      setOutsourceTargetInvoice(null);
    } catch (err) {
      toast.error('Failed to assign work: ' + err.message);
    }
  };

  // Handle Proof Rejection
  const handleRejectProof = async (proof) => {
    if (!window.confirm(`Are you sure you want to REJECT this payment proof of ${currencySymbol}${proof.amount}?`)) return;

    const updatedProofs = (viewingInvoice.paymentProofs || []).map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'Rejected' };
      }
      return p;
    });

    const updatedInvoice = {
      ...viewingInvoice,
      paymentProofs: updatedProofs
    };

    await invoiceEngine.saveInvoice(updatedInvoice);
    setViewingInvoice(updatedInvoice);
    toast.error('Payment proof REJECTED.');
  };


  // --- FINANCIAL SUMMARY METRICS ---
  const activeInvoices = useMemo(() => {
    return invoices.filter(inv => !inv.isDeleted);
  }, [invoices]);

  // Monthly recurring bills not yet generated for the current month
  const dueRecurringInvoices = useMemo(() => {
    const cur = new Date().toISOString().slice(0, 7);
    const seriesKey = (inv) => inv.recurringSeriesId || `${inv.customerName || 'customer'}|${(inv.items || []).map(i => i.itemService || i.name).join('+')}`;
    const posted = new Set();
    invoices.forEach(inv => {
      if (inv.recurring && String(inv.date || '').slice(0, 7) === cur) posted.add(seriesKey(inv));
    });
    const seen = new Set();
    return invoices
      .filter(inv => inv.recurring && !inv.isDeleted && String(inv.date || '').slice(0, 7) !== cur && !posted.has(seriesKey(inv)))
      .filter(inv => { const k = seriesKey(inv); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [invoices]);

  const summaryMetrics = useMemo(() => {
    const totalCount = activeInvoices.length;
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let overdueCount = 0;
    const now = new Date();

    activeInvoices.forEach(inv => {
      const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
      const paid = getInvoicePaidTotal(inv);
      const due = getInvoiceBalanceDue(inv);
      totalRevenue += grandTotal;
      totalPaid += paid;
      totalDue += due;

      if (due > 0 && inv.dueDate) {
        const dueDate = new Date(inv.dueDate);
        if (!isNaN(dueDate) && dueDate < now) {
          overdueCount++;
        }
      }
    });

    return {
      totalCount,
      totalRevenue,
      totalPaid,
      totalDue,
      overdueCount
    };
  }, [activeInvoices]);

  // Real Collection Rate
  const collectionRate = summaryMetrics.totalRevenue > 0
    ? Math.round((summaryMetrics.totalPaid / summaryMetrics.totalRevenue) * 100)
    : 0;

  // Filter Counts for Pills
  const filterCounts = useMemo(() => {
    let all = 0, paid = 0, partial = 0, pending = 0, overdue = 0;
    const now = new Date();

    (viewMode === 'active' ? activeInvoices : invoices.filter(i => i.isDeleted)).forEach(inv => {
      all++;
      const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
      const p = getInvoicePaidTotal(inv);
      const d = getInvoiceBalanceDue(inv);

      if (inv.paymentStatus === 'Paid' || p >= grandTotal) {
        paid++;
      } else if (p > 0 && d > 0) {
        partial++;
      }
      
      if (d > 0) {
        pending++;
        if (inv.dueDate) {
          const dt = new Date(inv.dueDate);
          if (!isNaN(dt) && dt < now) overdue++;
        }
      }
    });

    return { all, paid, partial, pending, overdue };
  }, [invoices, activeInvoices, viewMode]);

  // Top Outstanding Client
  const topDueInvoice = useMemo(() => {
    if (summaryMetrics.totalDue <= 0) return null;
    return [...activeInvoices]
      .filter(inv => {
        const fin = calculateCanonicalInvoiceFinancials(inv);
        return (fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue) > 0;
      })
      .sort((a, b) => {
        const finA = calculateCanonicalInvoiceFinancials(a);
        const finB = calculateCanonicalInvoiceFinancials(b);
        const dueA = finA.previousDue > 0 ? finA.customerTotalDue : finA.balanceDue;
        const dueB = finB.previousDue > 0 ? finB.customerTotalDue : finB.balanceDue;
        return dueB - dueA;
      })[0] || null;
  }, [activeInvoices, summaryMetrics.totalDue]);

  // --- FILTER & SORT LOGIC ---
  const filteredInvoices = useMemo(() => {
    const result = invoices.filter((inv) => {
      const isDeleted = inv.isDeleted === true;
      if (viewMode === 'active' && isDeleted) return false;
      if (viewMode === 'trash' && !isDeleted) return false;

      const q = searchQuery.toLowerCase();
      const matchSearch = (
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.customerPhone || '').toLowerCase().includes(q) ||
        (inv.paymentStatus || '').toLowerCase().includes(q) ||
        (inv.date || '').includes(q) ||
        (inv.items || []).some(it => (it.name || it.description || '').toLowerCase().includes(q))
      );

      let matchStatus = true;
      if (statusFilter === 'Paid') {
        matchStatus = inv.paymentStatus === 'Paid' || getInvoicePaidTotal(inv) >= (parseFloat(inv.grandTotal || inv.total) || 0);
      } else if (statusFilter === 'Partial' || statusFilter === 'Partially Paid') {
        const paid = getInvoicePaidTotal(inv);
        const due = getInvoiceBalanceDue(inv);
        matchStatus = paid > 0 && due > 0;
      } else if (statusFilter === 'Pending' || statusFilter === 'Pending / Due' || statusFilter === 'Unpaid') {
        matchStatus = getInvoiceBalanceDue(inv) > 0;
      } else if (statusFilter === 'Overdue') {
        if (inv.paymentStatus === 'Overdue') matchStatus = true;
        else {
          const due = getInvoiceBalanceDue(inv);
          if (due > 0 && inv.dueDate) {
            const d = new Date(inv.dueDate);
            matchStatus = !isNaN(d) && d < new Date();
          } else {
            matchStatus = false;
          }
        }
      }

      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
      }
      if (sortBy === 'amount_desc') {
        return (parseFloat(b.grandTotal || b.total) || 0) - (parseFloat(a.grandTotal || a.total) || 0);
      }
      if (sortBy === 'amount_asc') {
        return (parseFloat(a.grandTotal || a.total) || 0) - (parseFloat(b.grandTotal || b.total) || 0);
      }
      if (sortBy === 'due_desc') {
        return getInvoiceBalanceDue(b) - getInvoiceBalanceDue(a);
      }
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });
  }, [invoices, searchQuery, statusFilter, viewMode, sortBy]);

  const { displayCount, loadMoreRef } = useInfiniteScroll(filteredInvoices.length, ITEMS_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(0, displayCount);
  }, [filteredInvoices, displayCount]);

  // Multi-Selection Helpers
  const handleToggleSelect = (id) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    }
  };

  // Bulk Actions
  const handleBulkExport = () => {
    const selected = invoices.filter(i => selectedInvoiceIds.includes(i.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `billqyro-invoices-bulk-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${selected.length} invoices!`);
  };

  const handleBulkTrash = () => {
    if (!window.confirm(`Move ${selectedInvoiceIds.length} selected invoices to trash?`)) return;
    selectedInvoiceIds.forEach(id => {
      onDeleteInvoice(id, false);
    });
    setSelectedInvoiceIds([]);
    toast.success('Invoices moved to trash.');
  };

  const handleBulkReminders = () => {
    const dueInvoices = invoices.filter(i => selectedInvoiceIds.includes(i.id) && getInvoiceBalanceDue(i) > 0);
    if (dueInvoices.length === 0) {
      toast.error('None of the selected invoices have an outstanding balance due.');
      return;
    }
    toast.success(`Generated reminders for ${dueInvoices.length} invoices.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBackup = (invoice) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${invoice.invoiceNumber}.billqyro`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportInvoice = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const toastId = toast.loading('Reading PDF invoice...');
        const { parseInvoiceFromPdf } = await import('../utils/pdfParser.js');
        const draftInvoice = await parseInvoiceFromPdf(file);
        
        await invoiceEngine.saveInvoice(draftInvoice);
        toast.success(`PDF Invoice ${draftInvoice.invoiceNumber} imported!`, { id: toastId });
        window.dispatchEvent(new Event('billqyro_sync'));
      } catch (err) {
        toast.error('Failed to parse PDF: ' + (err.message || ''));
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          let listToImport = [];
          if (Array.isArray(parsed)) {
            listToImport = parsed;
          } else if (Array.isArray(parsed?.invoices)) {
            listToImport = parsed.invoices;
          } else if (Array.isArray(parsed?.data?.invoices)) {
            listToImport = parsed.data.invoices;
          } else if (parsed && (parsed.invoiceNumber || parsed.id)) {
            listToImport = [parsed];
          }

          if (listToImport.length === 0) {
            toast.error('No valid invoices found in the imported file.');
            return;
          }

          let importedCount = 0;
          for (const inv of listToImport) {
            if (inv && (inv.invoiceNumber || inv.id)) {
              await invoiceEngine.saveInvoice(inv);
              importedCount++;
            }
          }

          toast.success(importedCount === 1 ? `Invoice ${listToImport[0].invoiceNumber || 'file'} imported!` : `${importedCount} invoices imported successfully!`);
          window.dispatchEvent(new Event('billqyro_sync'));
        } catch (err) {
          console.error('Import file error:', err);
          toast.error('Could not import invoice file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
  };

  const handleRefresh = async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div 
          className="space-y-6 pb-32"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* 1. COMMAND CENTER HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent bg-theme-accent/10 px-2.5 py-0.5 rounded-full border border-theme-accent/20">
                  {currentBadge}
                </span>
                <span className="text-theme-muted text-xs">•</span>
                <span className="text-xs font-bold text-theme-secondary">
                  {wsName}
                </span>
                <span className="text-theme-muted text-xs">•</span>
                <span className="text-[11px] font-semibold text-theme-accent flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent"></span>
                  {t('inv.cloud_synced', 'Cloud Synced')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
                {viewMode === 'active' ? t('inv.title', 'Invoices') : t('inv.trash_title', 'Recently Deleted Invoices')}
              </h2>
              <p className="text-xs font-semibold text-theme-muted leading-relaxed">
                {viewMode === 'active' ? currentSubtitle : t('inv.trash_sub', 'Restorable deleted invoices (auto-purged after 30 days)')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'trash' 
                    ? 'bg-theme-danger/10 text-theme-danger border-theme-danger/30' 
                    : 'bg-theme-card text-theme-secondary border-theme-border-soft hover:bg-theme-surface shadow-xs'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{viewMode === 'active' ? t('inv.view_trash', 'View Trash') : t('inv.active', 'Active Invoices')}</span>
              </button>
              
              <label className="flex items-center justify-center gap-1.5 bg-theme-card text-theme-primary font-bold text-xs px-3.5 py-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface shadow-xs transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-theme-accent" />
                <span className="hidden sm:inline">{t('inv.import', 'Import')}</span>
                <input 
                  type="file" 
                  accept=".json,.billqyro,.pdf" 
                  onChange={handleImportInvoice} 
                  className="hidden" 
                />
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onEditInvoice(null);
                  setCurrentTab('create-invoice');
                }}
                className="flex items-center justify-center gap-1.5 bg-theme-accent text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('inv.create_invoice', '+ Create Invoice')}</span>
              </motion.button>
            </div>
          </div>

          {/* 2. KPI COMMAND STRIP */}
          {/* 2. KPI COMMAND STRIP */}
          {viewMode === 'active' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Invoices */}
              <div className="relative overflow-hidden p-5 rounded-3xl border border-white/20 bg-gradient-to-br from-white/60 to-theme-surface/30 dark:from-[#0B1220]/60 dark:to-theme-surface/40 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] ring-1 ring-white/30 group transition-all hover:shadow-premium-hover hover:border-theme-accent/50 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
                    Total Invoices
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-surface/50 border border-theme-border-soft text-theme-muted">
                    {activeInvoices.length} Active
                  </span>
                </div>
                <p className="text-2xl font-black text-theme-primary font-numbers tabular-nums relative z-10">
                  {summaryMetrics.totalCount}
                </p>
              </div>

              {/* Invoice Revenue */}
              <div className="relative overflow-hidden p-5 rounded-3xl border border-white/20 bg-gradient-to-br from-white/60 to-theme-surface/30 dark:from-[#0B1220]/60 dark:to-theme-surface/40 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] ring-1 ring-white/30 group transition-all hover:shadow-premium-hover hover:border-theme-accent/50 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--bq26-emerald-bright)]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
                    Invoice Revenue
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-theme-surface/50 border border-theme-border-soft flex items-center justify-center text-theme-muted text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-2xl font-black text-theme-primary font-numbers tabular-nums relative z-10">
                  {formatCurrency(summaryMetrics.totalRevenue, currencySymbol)}
                </p>
              </div>

              {/* Total Collected */}
              <div className="relative overflow-hidden p-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-white/80 to-emerald-500/5 dark:from-theme-surface dark:to-emerald-500/10 backdrop-blur-xl shadow-lg shadow-emerald-500/5 group transition-all hover:shadow-premium-hover cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
                    {t('inv.total_collected', 'Total Collected')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-theme-tint-bg text-theme-accent border border-theme-tint-border font-numbers">
                    {collectionRate}% rate
                  </span>
                </div>
                <p className="text-2xl font-black text-theme-accent font-numbers tabular-nums relative z-10">
                  {formatCurrency(summaryMetrics.totalPaid, currencySymbol)}
                </p>
              </div>

              {/* Outstanding Due */}
              <div className="relative overflow-hidden p-5 rounded-3xl border border-rose-500/20 bg-gradient-to-br from-white/80 to-rose-500/5 dark:from-theme-surface dark:to-rose-500/10 backdrop-blur-xl shadow-lg shadow-rose-500/5 group transition-all hover:shadow-premium-hover cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
                    Outstanding Due
                  </span>
                  {summaryMetrics.overdueCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {summaryMetrics.overdueCount} Overdue
                    </span>
                  ) : summaryMetrics.totalDue > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
                  )}
                </div>
                <p className={`text-2xl font-black font-numbers tabular-nums relative z-10 ${
                  summaryMetrics.totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-theme-muted'
                }`}>
                  {formatCurrency(summaryMetrics.totalDue, currencySymbol)}
                </p>
              </div>
            </div>
          )}

          {/* 3. ATTENTION REQUIRED INTELLIGENCE STRIP */}
          {viewMode === 'active' && summaryMetrics.totalDue > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl p-5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.2)] backdrop-blur-md group">
              <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-[50px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              <div className="flex items-center gap-4 min-w-0 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold border border-amber-500/30 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      ATTENTION REQUIRED
                    </span>
                    <span className="text-amber-500/50 text-[10px]">•</span>
                    <span className="font-bold text-theme-primary text-sm">
                      {formatCurrency(summaryMetrics.totalDue, currencySymbol)} pending across {filterCounts.pending} invoices
                    </span>
                  </div>
                  {topDueInvoice && (
                    <p className="text-[11px] font-medium text-theme-muted truncate">
                      Highest pending balance: <strong className="text-theme-secondary">{topDueInvoice.customerName || 'Customer'}</strong> ({formatCurrency(
                        calculateCanonicalInvoiceFinancials(topDueInvoice).previousDue > 0 
                          ? calculateCanonicalInvoiceFinancials(topDueInvoice).customerTotalDue 
                          : getInvoiceBalanceDue(topDueInvoice), 
                        currencySymbol
                      )} due)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 relative z-10">
                <button
                  onClick={() => setStatusFilter('Pending')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/50 dark:bg-theme-surface/50 border border-amber-500/30 hover:bg-amber-500/10 text-theme-primary transition-all cursor-pointer backdrop-blur-sm"
                >
                  Filter Pending
                </button>
                <button
                  onClick={() => setCurrentTab && setCurrentTab('due-ledger')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 4. UNIFIED FINANCIAL FILTER & SEARCH TOOLBAR */}
          <div className="relative overflow-hidden p-4 rounded-3xl border border-white/40 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-white/60 to-theme-surface/30 backdrop-blur-2xl ring-1 ring-white/30 dark:bg-gradient-to-br dark:from-[#0B1220]/60 dark:to-theme-surface/40 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between group">
            
            {/* Filter Pills with real counts */}
            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={handleSelectAll}
                title={selectedInvoiceIds.length === filteredInvoices.length ? "Deselect All" : "Select All"}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/40 dark:bg-theme-surface/40 backdrop-blur-md border border-white/40 hover:bg-white/70 shadow-sm text-theme-secondary transition-all cursor-pointer flex items-center gap-2"
              >
                {selectedInvoiceIds.length > 0 && selectedInvoiceIds.length === filteredInvoices.length ? (
                  <CheckSquare className="w-4 h-4 text-theme-accent" />
                ) : (
                  <Square className="w-4 h-4 text-theme-muted" />
                )}
                <span className="hidden sm:inline">Select All</span>
              </button>

              <div className="flex gap-1.5 p-1.5 bg-white/40 dark:bg-theme-surface/40 rounded-2xl border border-white/40 shadow-inner overflow-x-auto no-scrollbar">
                {[
                  { id: 'All', label: `${t('inv.tab_all', 'All')} (${filterCounts.all})` },
                  { id: 'Paid', label: `${t('inv.tab_paid', 'Paid')} (${filterCounts.paid})` },
                  { id: 'Partial', label: `${t('inv.tab_partial', 'Partial')} (${filterCounts.partial})` },
                  { id: 'Pending', label: `${t('inv.tab_pending', 'Pending')} (${filterCounts.pending})` },
                  { id: 'Overdue', label: `${t('inv.tab_overdue', 'Overdue')} (${filterCounts.overdue})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-white dark:bg-theme-surface text-theme-primary shadow-sm border border-theme-border-soft'
                        : 'text-theme-muted hover:text-theme-primary hover:bg-white/50 dark:hover:bg-theme-surface/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search + Sort Dropdown */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative flex-1 md:w-80 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-theme-accent/20 to-[var(--bq26-emerald-bright)]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-full flex items-center gap-2 bg-white/60 dark:bg-[#0B1220]/60 border border-theme-border-soft rounded-xl px-2 shadow-inner backdrop-blur-md">
                  <div className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask AI or search invoices..."
                    className="w-full py-2.5 bg-transparent border-none text-sm font-semibold focus:outline-none focus:ring-0 transition-all text-theme-primary placeholder:text-theme-muted/50"
                  />
                </div>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/50 dark:bg-[#0B1220]/50 border border-theme-border-soft rounded-xl text-sm font-bold text-theme-secondary px-4 py-2.5 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-inner transition-all backdrop-blur-md cursor-pointer shrink-0"
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Amount: High → Low</option>
                <option value="amount_asc">Amount: Low → High</option>
                <option value="due_desc">Highest Balance Due</option>
              </select>
            </div>
          </div>

          {/* 5. FLOATING BULK COMMAND BAR */}
          <AnimatePresence>
            {selectedInvoiceIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="sticky top-4 z-40 bg-slate-900 text-white rounded-2xl p-3 px-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-theme-accent text-white font-black text-xs font-numbers">
                    {selectedInvoiceIds.length}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    invoices selected
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleBulkExport}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('inv.export_json', 'Export JSON')}</span>
                  </button>

                  <button
                    onClick={handleBulkReminders}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Due Reminders</span>
                  </button>

                  <button
                    onClick={handleBulkTrash}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>

                  <button
                    onClick={() => setSelectedInvoiceIds([])}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5.5 RECURRING BILLS DUE THIS MONTH */}
          {dueRecurringInvoices.length > 0 && viewMode === 'active' && (
            <div className="bg-theme-accent/5 border border-theme-accent/25 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/25 shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-theme-primary">
                      {dueRecurringInvoices.length} monthly bill{dueRecurringInvoices.length !== 1 ? 's' : ''} to generate for {new Date().toLocaleString('en-IN', { month: 'long' })}
                    </p>
                    <p className="text-[11px] text-theme-muted">Duplicate the latest bill of each monthly customer with a fresh number and today's date.</p>
                  </div>
                </div>
                {onGenerateRecurring && (
                  <button
                    onClick={async () => { for (const inv of dueRecurringInvoices) { await onGenerateRecurring(inv); } }}
                    className="btn-premium !min-h-[36px] !px-4 text-xs shrink-0"
                  >
                    Generate All ({dueRecurringInvoices.length})
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {dueRecurringInvoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 text-[11px] bg-theme-card border border-theme-border-soft rounded-xl px-3 py-2">
                    <span className="font-bold text-theme-primary truncate">
                      {inv.customerName || 'Customer'} <span className="text-theme-muted">• last {inv.invoiceNumber} ({inv.date}) • {currencySymbol}{inv.grandTotal}</span>
                    </span>
                    {onGenerateRecurring && (
                      <button onClick={() => onGenerateRecurring(inv)} className="btn-premium-ghost !min-h-[26px] !px-2.5 text-[10px] shrink-0">
                        Generate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. INVOICE FINANCIAL LEDGER LIST */}
          <div className="space-y-2.5">
            {paginatedInvoices.map((invoice) => (
              <motion.div key={invoice.id} variants={itemVariants}>
                <InvoiceCard
                  invoice={invoice}
                  currencySymbol={currencySymbol}
                  businessSettings={businessSettings}
                  isSelected={selectedInvoiceIds.includes(invoice.id)}
                  onToggleSelect={handleToggleSelect}
                  onView={(inv) => setViewingInvoice(inv)}
                  onRecordPayment={(inv) => {
                    const cust = inv.customer || { id: inv.customerId, name: inv.customerName, phone: inv.customerPhone, email: inv.customerEmail, address: inv.customerAddress };
                    return onOpenCollection ? onOpenCollection({ invoice: inv, customer: cust }) : (onRecordPayment && onRecordPayment({ invoice: inv, customer: cust }));
                  }}
                  onEdit={(inv) => {
                    onEditInvoice(inv);
                    setCurrentTab('create-invoice');
                  }}
                  onDelete={(id) => {
                    if (viewMode === 'active') {
                      if (invoice.paymentStatus === 'Paid') {
                        setPaidDeleteTarget(invoice);
                      } else {
                        onDeleteInvoice(id, false);
                      }
                    } else {
                      setPermanentDeleteTarget(invoice);
                      setDeleteConfirmText('');
                    }
                  }}
                  onRestore={viewMode === 'trash' ? (id) => {
                    import('../services/invoiceEngine').then(({ invoiceEngine }) => invoiceEngine.restoreInvoice(id)).then(() => {
                      toast.success('Invoice restored!');
                      window.dispatchEvent(new Event('billqyro_sync'));
                    });
                  } : null}
                  onDownload={onDownloadPDF}
                  onDownloadImage={onDownloadImage}
                  onDownloadBackup={() => handleDownloadBackup(invoice)}
                  onDuplicate={onDuplicate}
                  onToggleRecurring={onToggleRecurring}
                  onAddOutsourcedWork={(inv) => handleOpenAddOutsource(inv)}
                  isDeleted={viewMode === 'trash'}
                />
              </motion.div>
            ))}

            {filteredInvoices.length === 0 && (
              <PremiumEmptyState 
                icon={Search}
                title={searchQuery ? 'No Invoices Found' : 'No Invoices Yet'}
                description={searchQuery ? 'Try adjusting your search or filters.' : 'Create your first invoice to get started.'}
                actionLabel={!searchQuery ? t('create_invoice', 'Create Invoice') : null}
                onAction={() => setCurrentTab('create-invoice')}
              />
            )}

            {displayCount < filteredInvoices.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-6 w-full text-theme-muted font-bold text-sm opacity-50">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading more invoices...
              </div>
            )}
          </div>
        </motion.div>
      </PullToRefresh>



      {/* Paid Invoice Delete Confirmation */}
      {paidDeleteTarget && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPaidDeleteTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-surface/90 backdrop-blur-xl border border-rose-500/20 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] w-full max-w-sm p-6 overflow-hidden relative"
          >
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-theme-primary mb-1.5">Move Paid Invoice to Trash?</h3>
              <p className="text-xs font-semibold text-theme-muted mb-6 leading-relaxed">
                This invoice contains recorded payments. Are you sure you want to move it to trash?
              </p>

              <div className="flex w-full gap-2.5">
                <button
                  onClick={() => setPaidDeleteTarget(null)}
                  className="flex-1 bg-theme-app border border-theme-border-soft text-theme-primary font-bold py-2.5 rounded-xl transition-all hover:bg-theme-border-soft text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteInvoice(paidDeleteTarget.id, false, true);
                    setPaidDeleteTarget(null);
                  }}
                  className="flex-1 bg-rose-600 text-white font-bold py-2.5 rounded-xl transition-all hover:bg-rose-700 text-xs shadow-md shadow-rose-500/20"
                >
                  {(paidDeleteTarget?.paymentHistory?.length > 0) ? "Force Move To Trash" : "Move To Trash"}
                </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Permanent Delete Confirmation */}
      {permanentDeleteTarget && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPermanentDeleteTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-surface/95 backdrop-blur-2xl border border-rose-500/30 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.2)] w-full max-w-md p-8 overflow-hidden relative"
          >
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-rose-600/10 text-rose-500 flex items-center justify-center mb-5 border border-rose-500/20">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-theme-primary mb-2">Permanent Deletion</h3>
              <p className="text-xs font-semibold text-theme-muted mb-5 leading-relaxed">
                Permanently delete <span className="text-rose-500 font-bold">{permanentDeleteTarget.invoiceNumber}</span>. This cannot be undone. Type <span className="text-theme-primary font-black bg-theme-app px-2 py-0.5 rounded border border-theme-border-soft">DELETE</span> to confirm.
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('inv.delete_ph', 'Type DELETE')}
                className="w-full text-center text-sm font-black tracking-widest uppercase bg-theme-app border-2 border-theme-border-soft focus:border-rose-500 rounded-xl px-4 py-3 mb-5 text-theme-primary focus:outline-none transition-all"
              />

              <div className="flex w-full gap-2.5">
                <button
                  onClick={() => setPermanentDeleteTarget(null)}
                  className="flex-1 bg-theme-app border border-theme-border-soft text-theme-primary font-bold py-3 rounded-xl transition-all hover:bg-theme-border-soft text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText !== 'DELETE' || (permanentDeleteTarget?.paymentHistory?.length > 0) || getInvoicePaidTotal(permanentDeleteTarget) > 0}
                  onClick={() => {
                    onDeleteInvoice(permanentDeleteTarget.id, true);
                    setPermanentDeleteTarget(null);
                  }}
                  className="flex-1 bg-rose-600 disabled:bg-theme-border-soft disabled:text-theme-muted disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-xs shadow-md"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* DYNAMIC ELEVEN-STAR PREVIEW & TIMELINE MODAL */}
      {viewingInvoice && createPortal(
        <div 
          onClick={() => {
            setViewingInvoice(null);
            onEditInvoice(null);
          }}
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-10 bq-print-portal"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-app dark:bg-theme-surface w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-premium relative animate-scaleUp border border-white/10 flex flex-col my-10 bq-print-card"
          >
            
            {/* Modal Top Actions Header Bar */}
            <div className="bg-theme-card dark:bg-theme-card border-b border-theme-border-soft px-6 py-4 flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-theme-accent" />
                <span className="font-extrabold text-theme-primary text-sm">{viewingInvoice.invoiceNumber} - Preview & Timeline</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {getInvoiceBalanceDue(viewingInvoice) > 0 && (
                  <button
                    onClick={() => {
                      const inv = viewingInvoice;
                      setViewingInvoice(null);
                      const cust = inv.customer || { id: inv.customerId, name: inv.customerName, phone: inv.customerPhone, email: inv.customerEmail, address: inv.customerAddress };
                      if (onOpenCollection) {
                        onOpenCollection({ invoice: inv, customer: cust });
                      } else if (onRecordPayment) {
                        onRecordPayment({ invoice: inv, customer: cust });
                      }
                    }}
                    className="px-3 py-1.5 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs mr-1"
                    title="Collect Payment in Collection Center"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Collect Payment</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Print Invoice (A4/A5)"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    printThermalReceipt(viewingInvoice, businessSettings);
                    toast.success('Printing Thermal POS receipt...');
                  }}
                  className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Print Thermal POS Receipt (80mm / 58mm)"
                >
                  <Receipt className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingInvoice)}
                  className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadImage && onDownloadImage(viewingInvoice)}
                  className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Download Image (PNG)"
                >
                  <ImageDown className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                    if (!isLiveLinkEnabled) {
                      toast.error(`${portalLabel} is disabled in Settings.`);
                      return;
                    }
                    const invoiceId = viewingInvoice?.id;
                    if (!invoiceId) return;
                    if (linkCache[invoiceId]) {
                      await navigator.clipboard.writeText(linkCache[invoiceId]);
                      toast.success(`${portalLabel} Link copied!`);
                      return;
                    }
                    setGeneratingLink(true);
                    try {
                      const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                      if (!token) {
                        toast.error(`Could not create ${portalLabel.toLowerCase()}.`);
                        return;
                      }
                      const liveLink = `${window.location.origin}/invoice/${token}`;
                      setLinkCache(prev => ({ ...prev, [invoiceId]: liveLink }));
                      await navigator.clipboard.writeText(liveLink);
                      toast.success(`${portalLabel} Link copied!`);
                    } catch {
                      toast.error(`Could not create ${portalLabel.toLowerCase()}.`);
                    } finally {
                      setGeneratingLink(false);
                    }
                  }}
                  className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title={`Copy ${portalLabel}`}
                  disabled={generatingLink}
                >
                  {generatingLink ? <span className="w-4 h-4 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin block" /> : <Link className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleOpenAddOutsource(viewingInvoice)}
                  className="tap-target px-2.5 py-1.5 text-xs font-bold text-theme-accent bg-theme-accent/10 hover:bg-theme-accent/20 border border-theme-accent/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Add Outsourced Work / Contractor Assignment"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Outsourced Work</span>
                </button>

                <div className="w-px h-6 bg-theme-border-soft mx-1" />

                <button
                  onClick={() => {
                    setViewingInvoice(null);
                    onEditInvoice(null);
                  }}
                  className="tap-target p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-4 md:p-6 bg-theme-app dark:bg-theme-surface space-y-6">
              
              {/* Payment Timeline Component */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-3 no-print">
                <div className="flex items-center justify-between border-b border-theme-border-soft pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-theme-accent" />
                    <h4 className="text-xs font-black text-theme-primary uppercase tracking-wider">Payment & Status Timeline</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-theme-surface text-theme-secondary border border-theme-border-soft">
                    {getInvoicePaymentStatus(viewingInvoice)}
                  </span>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  {/* Step 1: Invoice Created */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-theme-tint-bg text-theme-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-theme-primary">Invoice Issued</p>
                      <p className="text-[11px] text-theme-muted">
                        Grand Total: {formatCurrency(parseFloat(viewingInvoice.grandTotal || viewingInvoice.total) || 0, currencySymbol)} • {viewingInvoice.date ? new Date(viewingInvoice.date).toLocaleDateString() : 'Initial'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2+: Payments in history */}
                  {(viewingInvoice.paymentHistory || []).map((pmt, idx) => (
                    <div key={pmt.id || idx} className="flex items-start gap-3 pl-0.5">
                      <div className="w-5 h-5 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-theme-accent">
                          +{formatCurrency(parseFloat(pmt.amount) || 0, currencySymbol)} received ({pmt.method || 'Payment'})
                        </p>
                        <p className="text-[11px] text-theme-muted">
                          {pmt.date || 'Recorded'} {pmt.transactionId && `• Txn: ${pmt.transactionId}`} {pmt.reviewer && `• Verified by ${pmt.reviewer}`}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Step End: Current Balance */}
                  <div className="flex items-start gap-3 pt-1 border-t border-theme-border-soft">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      getInvoiceBalanceDue(viewingInvoice) > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-theme-tint-bg text-theme-accent'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
                      <p className={`font-black ${getInvoiceBalanceDue(viewingInvoice) > 0 ? 'text-rose-500' : 'text-theme-accent'}`}>
                        {getInvoiceBalanceDue(viewingInvoice) > 0 
                          ? `Remaining Outstanding: ${formatCurrency(getInvoiceBalanceDue(viewingInvoice), currencySymbol)}` 
                          : 'Fully Settled & Paid in Full'}
                      </p>
                      {getInvoiceBalanceDue(viewingInvoice) > 0 && (
                        <button
                          onClick={() => {
                            const inv = viewingInvoice;
                            setViewingInvoice(null);
                            const cust = inv.customer || { id: inv.customerId, name: inv.customerName, phone: inv.customerPhone, email: inv.customerEmail, address: inv.customerAddress };
                            if (onOpenCollection) {
                              onOpenCollection({ invoice: inv, customer: cust });
                            } else if (onRecordPayment) {
                              onRecordPayment({ invoice: inv, customer: cust });
                            }
                          }}
                          className="px-3 py-1 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Collect Money</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Outsourced Work & Net Margin Card (Owner Only) */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-3 no-print">
                <div className="flex items-center justify-between border-b border-theme-border-soft pb-2.5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-theme-accent" />
                    <h4 className="text-xs font-black text-theme-primary uppercase tracking-wider">Outsourced Work (Internal Cost)</h4>
                  </div>
                  <button
                    onClick={() => handleOpenAddOutsource(viewingInvoice)}
                    className="text-[11px] font-bold text-theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Work</span>
                  </button>
                </div>

                {invoiceOutsourceJobs.length === 0 ? (
                  <div className="text-center py-2 text-xs text-theme-muted">
                    No outsourced work assigned to this invoice yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoiceOutsourceJobs.map((oj, idx) => {
                      const cost = Number(oj.totalContractorCost !== undefined ? oj.totalContractorCost : oj.agreedCost) || 0;
                      return (
                        <div key={oj.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-theme-primary">
                              {oj.contractorName || oj.vendorName || 'Worker'}
                            </span>
                            <div className="text-[11px] text-theme-secondary flex items-center gap-1.5 font-mono">
                              {oj.designNumber && (
                                <span className="px-1.5 py-0.5 rounded bg-theme-accent/10 text-theme-accent font-bold">
                                  {oj.designNumber}
                                </span>
                              )}
                              <span>{oj.productName || oj.workDescription || 'Work'}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="font-black text-rose-400">
                              {formatCurrency(cost, currencySymbol)}
                            </div>
                            <span className="text-[10px] text-theme-muted uppercase">
                              {oj.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total Work Cost & Net Margin Calculation */}
                    <div className="pt-2 border-t border-theme-border-soft flex items-center justify-between text-xs font-bold">
                      <span className="text-theme-muted">Total Outsourced Cost:</span>
                      <span className="font-mono font-black text-rose-500">
                        {formatCurrency(invoiceOutsourceJobs.reduce((sum, j) => sum + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0), currencySymbol)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-theme-muted">Net Profit Contribution:</span>
                      <span className="font-mono font-black text-emerald-500">
                        {formatCurrency(Math.max(0, (parseFloat(viewingInvoice.grandTotal || viewingInvoice.total) || 0) - invoiceOutsourceJobs.reduce((sum, j) => sum + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0)), currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Payment Verification Panel */}
              {viewingInvoice && (viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length > 0 && (
                <div className="p-5 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-theme-border-soft rounded-2xl shadow-sm no-print">
                  <div className="flex items-center gap-2 text-theme-accent font-extrabold mb-4">
                    <ShieldCheck className="w-5 h-5 text-theme-accent" />
                    <span className="text-sm">Pending Payment Verification ({(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length})</span>
                  </div>
                  
                  <div className="space-y-4">
                    {(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').map((proof) => (
                      <div key={proof.id} className="bg-theme-card border border-theme-border-soft rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-theme-muted">Method:</span>
                            <span className="bg-theme-accent/10 text-theme-accent px-2 py-0.5 rounded-md font-bold uppercase">{proof.method}</span>
                            <span className="font-bold text-theme-muted ml-2">Amount:</span>
                            <span className="font-extrabold text-theme-primary">{currencySymbol}{proof.amount}</span>
                          </div>
                          
                          {proof.transactionId && (
                            <div>
                              <span className="font-bold text-theme-muted">Transaction ID:</span>{' '}
                              <span className="font-mono text-theme-primary select-all font-semibold bg-theme-surface px-1.5 py-0.5 rounded">{proof.transactionId}</span>
                            </div>
                          )}
                          
                          {proof.screenshot && (
                            <div className="mt-2">
                              <span className="font-bold text-theme-muted block mb-1">Receipt Screenshot:</span>
                              <a 
                                href={proof.screenshot} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block relative rounded-lg overflow-hidden border border-theme-border-soft hover:border-indigo-300 transition-all max-w-[200px]"
                              >
                                <img 
                                  src={proof.screenshot} 
                                  alt="Payment receipt proof" 
                                  className="max-h-32 object-cover object-center"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex sm:flex-row md:flex-col justify-end gap-2 md:w-48 shrink-0">
                          <button
                            onClick={() => handleApproveProof(proof)}
                            className="flex items-center justify-center gap-1.5 bg-theme-accent hover:bg-theme-accent text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer w-full text-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Proof</span>
                          </button>
                          <button
                            onClick={() => handleRejectProof(proof)}
                            className="flex items-center justify-center gap-1.5 bg-theme-surface hover:bg-rose-500/10 text-rose-600 border border-theme-border-soft hover:border-rose-500/30 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer w-full text-center"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject Proof</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Printable Template Letterhead Preview */}
              <div className="print-only-preview">
                <InvoicePreview 
                  invoice={viewingInvoice} 
                  businessSettings={businessSettings} 
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* ADD OUTSOURCED WORK MODAL */}
      {/* ========================================================================= */}
      {outsourceModalOpen && outsourceTargetInvoice && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-5 py-4 border-b border-theme-border-soft flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-theme-accent" />
                  Add Outsourced Work
                </h3>
                <span className="text-[11px] text-theme-secondary">
                  Invoice #{outsourceTargetInvoice.invoiceNumber} · {outsourceTargetInvoice.customerName || 'Customer'}
                </span>
              </div>
              <button
                onClick={() => {
                  setOutsourceModalOpen(false);
                  setOutsourceTargetInvoice(null);
                }}
                className="p-1 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOutsource} className="p-5 space-y-3.5 text-xs">
              {/* 1. Worker Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black text-theme-muted uppercase">
                    Worker / Work Partner *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddPartner(!showQuickAddPartner)}
                    className="text-[10px] font-bold text-theme-accent hover:underline"
                  >
                    {showQuickAddPartner ? 'Select Existing Partner' : '+ New Contractor'}
                  </button>
                </div>

                {showQuickAddPartner ? (
                  <input
                    type="text"
                    value={quickPartnerName}
                    onChange={(e) => setQuickPartnerName(e.target.value)}
                    placeholder="Enter worker / contractor name (e.g. Rahim)"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent font-bold"
                    autoFocus
                  />
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent font-bold"
                    required
                  >
                    <option value="">-- Select Worker / Contractor --</option>
                    {availablePartners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.specialization || p.category || 'Specialist'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Product / Design Selection & Autofill from Invoice Items */}
              {outsourceTargetInvoice.items && outsourceTargetInvoice.items.length > 0 && (
                <div className="p-2.5 rounded-xl bg-theme-surface-elevated border border-theme-border-soft space-y-1.5">
                  <span className="text-[10px] font-bold text-theme-muted uppercase block">
                    Pick item from Invoice #{outsourceTargetInvoice.invoiceNumber}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {outsourceTargetInvoice.items.map((itm, idx) => {
                      const dNo = itm.designNumber || itm.sku || itm.itemCode || itm.code || '';
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDesignNumberInput(dNo);
                            setProductNameInput(itm.name || '');
                            setWorkDetailsInput(itm.name ? `Outsourced work for ${itm.name}` : 'Custom Design');
                            if (itm.rate) {
                              setTotalCostInput(String(Math.round(itm.rate * 0.4)));
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-theme-surface border border-theme-border-soft hover:border-theme-accent/50 text-[10px] font-bold text-theme-secondary hover:text-theme-primary flex items-center gap-1"
                        >
                          {dNo && <span className="font-mono text-amber-500">[{dNo}]</span>}
                          <span>{itm.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Product / Design Number & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted uppercase block mb-1">
                    Design / Product Number
                  </label>
                  <input
                    type="text"
                    value={designNumberInput}
                    onChange={(e) => setDesignNumberInput(e.target.value)}
                    placeholder="e.g. GK-115"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary font-mono font-bold focus:outline-none focus:border-theme-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted uppercase block mb-1">
                    Product / Design Name
                  </label>
                  <input
                    type="text"
                    value={productNameInput}
                    onChange={(e) => setProductNameInput(e.target.value)}
                    placeholder="e.g. Custom Embroidered Kurti"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent font-bold"
                  />
                </div>
              </div>

              {/* 4. Work Details */}
              <div>
                <label className="text-[10px] font-black text-theme-muted uppercase block mb-1">
                  Work Details *
                </label>
                <input
                  type="text"
                  value={workDetailsInput}
                  onChange={(e) => setWorkDetailsInput(e.target.value)}
                  placeholder="e.g. Custom Neck Embroidery Work"
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  required
                />
              </div>

              {/* 5. Financials: Total Cost, Paid, Due */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft">
                <div>
                  <label className="text-[9px] font-black text-theme-muted uppercase block mb-1">
                    Total Cost (₹) *
                  </label>
                  <input
                    type="number"
                    value={totalCostInput}
                    onChange={(e) => setTotalCostInput(e.target.value)}
                    placeholder="600"
                    min="1"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-primary font-black text-sm focus:outline-none focus:border-theme-accent"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-theme-muted uppercase block mb-1">
                    Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    value={paidNowInput}
                    onChange={(e) => setPaidNowInput(e.target.value)}
                    placeholder="300"
                    min="0"
                    max={totalCostInput || undefined}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-accent font-black text-sm focus:outline-none focus:border-theme-accent"
                  />
                </div>

                <div>
                  <span className="text-[9px] font-black text-theme-muted uppercase block mb-1">
                    Due Balance (₹)
                  </span>
                  <div className="px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border-soft font-black text-sm text-rose-500">
                    {formatCurrency(Math.max(0, (parseFloat(totalCostInput) || 0) - (parseFloat(paidNowInput) || 0)), currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Payment Details if Paid > 0 */}
              {(parseFloat(paidNowInput) || 0) > 0 && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-theme-accent/5 border border-theme-accent/20">
                  <div>
                    <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethodInput}
                      onChange={(e) => setPaymentMethodInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-primary font-bold text-xs"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-muted uppercase block mb-1">
                      Internal Bank Outflow Account
                    </label>
                    <select
                      value={bankAccountInput}
                      onChange={(e) => setBankAccountInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-primary font-bold text-xs"
                    >
                      {bankAccountsList.map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Invariant Financial Truth Banner */}
              {(() => {
                const invTotal = parseFloat(outsourceTargetInvoice.grandTotal || outsourceTargetInvoice.total) || 0;
                const cost = parseFloat(totalCostInput) || 0;
                const margin = Math.max(0, invTotal - cost);
                return (
                  <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft space-y-1">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-theme-primary">Customer Invoice: {formatCurrency(invTotal, currencySymbol)}</span>
                      <span className="text-theme-accent">Net Margin: {formatCurrency(margin, currencySymbol)}</span>
                    </div>
                    <p className="text-[10px] text-theme-muted">
                      Customer invoice amount remains untouched. Contractor cost is an internal business expense.
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border-soft">
                <button
                  type="button"
                  onClick={() => {
                    setOutsourceModalOpen(false);
                    setOutsourceTargetInvoice(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-extrabold shadow-sm"
                >
                  Assign Work & Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AnimatedPage>
  );
};

export default Invoices;



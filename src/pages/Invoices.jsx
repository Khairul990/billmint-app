import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import AnimatedPage from '../components/AnimatedPage';
import InvoiceCard from '../components/InvoiceCard';
import InvoicePreview from '../components/InvoicePreview';
import QuickPayModal from '../components/payments/QuickPayModal';
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
  RotateCcw
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
  onOpenCollection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Multi-Selection State for Bulk Actions
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  // Modal Preview & Payment States
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [recordingPaymentInvoice, setRecordingPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCache, setLinkCache] = useState({});
  const [paidDeleteTarget, setPaidDeleteTarget] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
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

  // Quick Record Payment Handler
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!recordingPaymentInvoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const freshInvoice = invoices.find(i => i.id === recordingPaymentInvoice.id) || recordingPaymentInvoice;
      const history = freshInvoice.paymentHistory || [];

      const historyItem = {
        id: 'pmt_' + Date.now(),
        date: paymentDate || new Date().toISOString().split('T')[0],
        amount: amt,
        method: paymentMethod || 'Cash',
        note: paymentNotes || 'Recorded in Invoice Command Center',
        verified: true,
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

      const updatedInvoice = {
        ...freshInvoice,
        grandTotal,
        amountPaid: totalPaid,
        paidAmount: totalPaid,
        balanceDue,
        paymentStatus: newStatus,
        paymentHistory: newHistory
      };

      await invoiceEngine.saveInvoice(updatedInvoice);

      // Auto-post to bank ledger
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
          note: historyItem.note
        });
      } catch (e) {
        console.warn('[BANK] auto-post payment skipped:', e);
      }

      triggerPaymentSuccessFeedback();
      toast.success(`Payment of ${formatCurrency(amt, currencySymbol)} recorded successfully!`);
      setRecordingPaymentInvoice(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      toast.error('Failed to record payment: ' + (err.message || ''));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // --- FINANCIAL SUMMARY METRICS ---
  const activeInvoices = useMemo(() => {
    return invoices.filter(inv => !inv.isDeleted);
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
          const invoiceData = Array.isArray(parsed) ? parsed[0] : parsed;
          if (!invoiceData || !invoiceData.invoiceNumber) {
            toast.error('Invalid invoice format.');
            return;
          }
          await invoiceEngine.saveInvoice(invoiceData);
          toast.success(`Invoice ${invoiceData.invoiceNumber} imported!`);
          window.dispatchEvent(new Event('billqyro_sync'));
        } catch {
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
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cloud Synced
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
                {viewMode === 'active' ? 'Invoices' : 'Recently Deleted Invoices'}
              </h2>
              <p className="text-xs font-semibold text-theme-muted leading-relaxed">
                {viewMode === 'active' ? currentSubtitle : 'Restorable deleted invoices (auto-purged after 30 days)'}
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
                <span>{viewMode === 'active' ? 'View Trash' : 'Active Invoices'}</span>
              </button>
              
              <label className="flex items-center justify-center gap-1.5 bg-theme-card text-theme-primary font-bold text-xs px-3.5 py-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface shadow-xs transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-theme-accent" />
                <span className="hidden sm:inline">Import</span>
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
                <span>+ Create Invoice</span>
              </motion.button>
            </div>
          </div>

          {/* 2. KPI COMMAND STRIP */}
          {viewMode === 'active' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Total Invoices */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-1 hover:border-theme-border-strong transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                    Total Invoices
                  </p>
                  <span className="text-[10px] font-bold text-theme-muted">
                    {activeInvoices.length} Active
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-theme-primary font-numbers tabular-nums">
                  {summaryMetrics.totalCount}
                </p>
              </div>

              {/* Invoice Revenue */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-1 hover:border-theme-border-strong transition-all">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                  Invoice Revenue
                </p>
                <p className="text-xl sm:text-2xl font-black text-theme-primary font-numbers tabular-nums">
                  {formatCurrency(summaryMetrics.totalRevenue, currencySymbol)}
                </p>
              </div>

              {/* Total Collected */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-1 hover:border-theme-border-strong transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                    Total Collected
                  </p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-numbers">
                    {collectionRate}% rate
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-numbers tabular-nums">
                  {formatCurrency(summaryMetrics.totalPaid, currencySymbol)}
                </p>
              </div>

              {/* Outstanding Due */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-1 hover:border-theme-border-strong transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                    Outstanding Due
                  </p>
                  {summaryMetrics.overdueCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {summaryMetrics.overdueCount} Overdue
                    </span>
                  ) : summaryMetrics.totalDue > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <p className={`text-xl sm:text-2xl font-black font-numbers tabular-nums ${
                  summaryMetrics.totalDue > 0 ? 'text-rose-500' : 'text-theme-muted'
                }`}>
                  {formatCurrency(summaryMetrics.totalDue, currencySymbol)}
                </p>
              </div>
            </div>
          )}

          {/* 3. ATTENTION REQUIRED INTELLIGENCE STRIP */}
          {viewMode === 'active' && summaryMetrics.totalDue > 0 && (
            <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      ATTENTION REQUIRED
                    </span>
                    <span className="text-theme-muted text-[10px]">•</span>
                    <span className="font-bold text-theme-primary">
                      {formatCurrency(summaryMetrics.totalDue, currencySymbol)} pending across {filterCounts.pending} invoices
                    </span>
                  </div>
                  {topDueInvoice && (
                    <p className="text-[11px] font-medium text-theme-muted truncate mt-0.5">
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStatusFilter('Pending')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft hover:bg-theme-card text-theme-primary transition-all cursor-pointer"
                >
                  Filter Pending
                </button>
                <button
                  onClick={() => setCurrentTab && setCurrentTab('due-ledger')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Open Collections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 4. UNIFIED FINANCIAL FILTER & SEARCH TOOLBAR */}
          <div className="bg-theme-card rounded-2xl p-3 border border-theme-border-soft shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Filter Pills with real counts */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                title={selectedInvoiceIds.length === filteredInvoices.length ? "Deselect All" : "Select All"}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft hover:bg-theme-card text-theme-secondary transition-all cursor-pointer flex items-center gap-1.5"
              >
                {selectedInvoiceIds.length > 0 && selectedInvoiceIds.length === filteredInvoices.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-theme-accent" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-theme-muted" />
                )}
                <span className="hidden sm:inline">Select All</span>
              </button>

              <div className="flex gap-1 bg-theme-surface/60 p-1 rounded-xl overflow-x-auto no-scrollbar border border-theme-border-soft">
                {[
                  { id: 'All', label: `All (${filterCounts.all})` },
                  { id: 'Paid', label: `Paid (${filterCounts.paid})` },
                  { id: 'Partial', label: `Partial (${filterCounts.partial})` },
                  { id: 'Pending', label: `Pending (${filterCounts.pending})` },
                  { id: 'Overdue', label: `Overdue (${filterCounts.overdue})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border-soft font-bold'
                        : 'text-theme-muted hover:text-theme-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search + Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-theme-muted pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoices, clients, items..."
                  className="w-full pl-9 pr-3 py-1.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-secondary px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent cursor-pointer shrink-0"
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
                    <span>Export JSON</span>
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
                  onRecordPayment={(inv) => onOpenCollection ? onOpenCollection({ invoice: inv }) : (onRecordPayment ? onRecordPayment({ invoice: inv }) : setRecordingPaymentInvoice(inv))}
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
                  isDeleted={viewMode === 'trash'}
                />
              </motion.div>
            ))}

            {filteredInvoices.length === 0 && (
              <PremiumEmptyState 
                icon={Search}
                title={searchQuery ? 'No Invoices Found' : 'No Invoices Yet'}
                description={searchQuery ? 'Try adjusting your search or filters.' : 'Create your first invoice to get started.'}
                actionLabel={!searchQuery ? 'Create Invoice' : null}
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

      {/* QUICK RECORD PAYMENT MODAL */}
      {recordingPaymentInvoice && createPortal(
        <div 
          onClick={() => setRecordingPaymentInvoice(null)}
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-hidden relative"
          >
            <div className="flex items-center justify-between border-b border-theme-border-soft pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-theme-primary">Record Payment</h3>
                  <p className="text-xs font-semibold text-theme-muted">
                    {recordingPaymentInvoice.invoiceNumber} • {recordingPaymentInvoice.customerName || 'Customer'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecordingPaymentInvoice(null)}
                className="p-1 text-theme-muted hover:text-theme-primary rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs font-semibold">
              {/* Financial Balance Summary */}
              <div className="bg-theme-surface/70 rounded-2xl p-3.5 border border-theme-border-soft flex items-center justify-between font-numbers">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-theme-muted block font-extrabold">Total Invoiced</span>
                  <span className="text-sm font-bold text-theme-primary">
                    {formatCurrency(parseFloat(recordingPaymentInvoice.grandTotal || recordingPaymentInvoice.total) || 0, currencySymbol)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-rose-500 block font-extrabold">Current Balance Due</span>
                  <span className="text-sm font-black text-rose-500">
                    {formatCurrency(getInvoiceBalanceDue(recordingPaymentInvoice), currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-primary">Payment Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-primary">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-primary">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-primary">Transaction Note / ID (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. UPI Ref #4928192"
                  className="w-full px-3.5 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-medium text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordingPaymentInvoice(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-theme-border-soft text-theme-secondary hover:bg-theme-surface font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-theme-accent hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

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
                  Move To Trash
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
                placeholder="Type DELETE"
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
                  disabled={deleteConfirmText !== 'DELETE'}
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
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-10 no-print"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-app dark:bg-theme-surface w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-premium relative animate-scaleUp border border-white/10 flex flex-col my-10"
          >
            
            {/* Modal Top Actions Header Bar */}
            <div className="bg-theme-card dark:bg-theme-card border-b border-theme-border-soft px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-theme-accent" />
                <span className="font-extrabold text-theme-primary text-sm">{viewingInvoice.invoiceNumber} - Preview & Timeline</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handlePrint}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingInvoice)}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadImage && onDownloadImage(viewingInvoice)}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
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
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                  title={`Copy ${portalLabel}`}
                  disabled={generatingLink}
                >
                  {generatingLink ? <span className="w-4 h-4 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin block" /> : <Link className="w-4 h-4" />}
                </button>

                <div className="w-px h-6 bg-theme-border-soft mx-1" />

                <button
                  onClick={() => {
                    setViewingInvoice(null);
                    onEditInvoice(null);
                  }}
                  className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-4 md:p-6 bg-theme-app dark:bg-theme-surface space-y-6">
              
              {/* Payment Timeline Component */}
              <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs space-y-3">
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
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
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
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
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
                      getInvoiceBalanceDue(viewingInvoice) > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-black ${getInvoiceBalanceDue(viewingInvoice) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {getInvoiceBalanceDue(viewingInvoice) > 0 
                          ? `Remaining Outstanding: ${formatCurrency(getInvoiceBalanceDue(viewingInvoice), currencySymbol)}` 
                          : 'Fully Settled & Paid in Full'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Payment Verification Panel */}
              {viewingInvoice && (viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length > 0 && (
                <div className="p-5 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-theme-border-soft rounded-2xl shadow-sm">
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
                            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer w-full text-center"
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
              <InvoicePreview 
                invoice={viewingInvoice} 
                businessSettings={businessSettings} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QUICK PAY MODAL */}
      <QuickPayModal
        isOpen={Boolean(recordingPaymentInvoice)}
        onClose={() => setRecordingPaymentInvoice(null)}
        invoice={recordingPaymentInvoice}
        currencySymbol={currencySymbol}
        businessSettings={businessSettings}
        onPaymentSuccess={() => {
          setRecordingPaymentInvoice(null);
        }}
      />
    </AnimatedPage>
  );
};

export default Invoices;

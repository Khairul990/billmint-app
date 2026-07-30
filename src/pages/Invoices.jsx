import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Edit,
  ArrowDownWideNarrow,
  FileDown,
  Mail,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Link,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import { 
  generateWhatsAppShareLink, 
  generateWhatsAppReminderLink,
  generateEmailShareLink, 
  generateInvoiceShareText 
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import PullToRefresh from '../components/PullToRefresh';
import { addNotification } from '../services/notificationsService';
import PremiumEmptyState from '../components/PremiumEmptyState';

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
 * Invoice List and Manager Page
 * @param {Array} invoices
 * @param {Function} onEditInvoice
 * @param {Function} onDeleteInvoice
 * @param {Function} onDownloadPDF
 * @param {Function} setCurrentTab
 * @param {Object} businessSettings
 */
const Invoices = ({ 
  invoices = [], 
  editingInvoice = null,
  onEditInvoice, 
  onDeleteInvoice, // Used for both soft and permanent delete now
  onDownloadPDF, 
  setCurrentTab,
  businessSettings 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  
  // Removed manual currentPage state
  const ITEMS_PER_PAGE = 30; // Increased base load for infinite scroll
  // Modal Preview State
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCache, setLinkCache] = useState({});
  const [paidDeleteTarget, setPaidDeleteTarget] = useState(null);
  const currencySymbol = businessSettings?.currency || '₹';

  useEffect(() => {
    if (editingInvoice) {
      setViewingInvoice(editingInvoice);
    }
  }, [editingInvoice]);

  // Background Firestore public proofs sweeping & syncing
  useEffect(() => {
    if (invoices.length > 0) {
      const sweepAndSync = async () => {
        const result = await invoiceEngine.syncPublicInvoices(invoices);
        if (result && result.changed) {
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      };
      // Run sweep after a short delay to prioritize initial page load
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

  const handleApproveProof = async (proof) => {
    if (!window.confirm(`Are you sure you want to APPROVE this payment proof of ${currencySymbol}${proof.amount}?`)) return;

    // 0. Fetch the latest invoice snapshot to prevent stale overwrite
    const freshInvoice = invoices.find(inv => inv.id === viewingInvoice.id) || viewingInvoice;

    // 1. Calculate new figures
    const totalPaid = (freshInvoice.amountPaid || 0) + proof.amount;
    const balanceDue = Math.max(0, freshInvoice.grandTotal - totalPaid);
    
    let newStatus = freshInvoice.paymentStatus;
    if (balanceDue <= 0) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partially Paid';
    }

    // 2. Map new payment history item
    const historyItem = {
      date: new Date().toISOString().split('T')[0],
      amount: proof.amount,
      method: proof.method,
      transactionId: proof.transactionId || 'N/A',
      verified: true,
      reviewer: businessSettings?.businessName ? `Admin (${businessSettings.businessName})` : 'System Admin',
      verifiedAt: new Date().toISOString()
    };

    // 3. Update the matching proof status to Approved
    const updatedProofs = (freshInvoice.paymentProofs || []).map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'Approved' };
      }
      return p;
    });

    const updatedInvoice = {
      ...freshInvoice,
      amountPaid: totalPaid,
      balanceDue,
      paymentStatus: newStatus,
      paymentHistory: [...(freshInvoice.paymentHistory || []), historyItem],
      paymentProofs: updatedProofs
    };

    // 4. Save
    await invoiceEngine.saveInvoice(updatedInvoice);
    
    setViewingInvoice(updatedInvoice);
    toast.success('Payment proof successfully APPROVED!');
  };

  const handleRejectProof = async (proof) => {
    if (!window.confirm(`Are you sure you want to REJECT this payment proof of ${currencySymbol}${proof.amount}?`)) return;

    // Update matching proof status to Rejected
    const updatedProofs = (viewingInvoice.paymentProofs || []).map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'Rejected' };
      }
      return p;
    });

    // Re-verify if there are other pending proofs, otherwise restore to Partially Paid or Pending
    const hasOtherPending = updatedProofs.some(p => p.status === 'Pending');
    let revertedStatus = viewingInvoice.paymentStatus;
    if (!hasOtherPending) {
      if (viewingInvoice.amountPaid >= viewingInvoice.grandTotal) {
        revertedStatus = 'Paid';
      } else if (viewingInvoice.amountPaid > 0) {
        revertedStatus = 'Partially Paid';
      } else {
        revertedStatus = 'Pending';
      }
    }

    const updatedInvoice = {
      ...viewingInvoice,
      paymentStatus: revertedStatus,
      paymentProofs: updatedProofs
    };

    // Save
    await invoiceEngine.saveInvoice(updatedInvoice);
    
    setViewingInvoice(updatedInvoice);
    toast.error('Payment proof REJECTED.');
  };

  // --- FILTER LOGIC ---
  const filteredInvoices = useMemo(() => {
    const result = invoices.filter((inv) => {
      // 1. Filter by viewMode (Trash vs Active)
      const isDeleted = inv.isDeleted === true;
      if (viewMode === 'active' && isDeleted) return false;
      if (viewMode === 'trash' && !isDeleted) return false;

      // 2. Filter by Search Query
      const q = searchQuery.toLowerCase();
      const matchSearch = (
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.paymentStatus || '').toLowerCase().includes(q) ||
        (inv.date || '').includes(q)
      );

      // 3. Filter by Status
      const matchStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;

      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [invoices, searchQuery, statusFilter, viewMode]);

  const { displayCount, loadMoreRef } = useInfiniteScroll(filteredInvoices.length, ITEMS_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(0, displayCount);
  }, [filteredInvoices, displayCount]);

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

  const handleImportInvoice = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.id || !data.invoiceNumber || !data.items) {
          throw new Error('Not a valid invoice backup format.');
        }
        await invoiceEngine.saveInvoice(data);
        toast.success(`Invoice ${data.invoiceNumber} imported successfully!`);
        window.dispatchEvent(new Event('billqyro_sync'));
      } catch (err) {
        toast.error('Failed to import invoice: ' + err.message);
      }
    };
    reader.onerror = () => toast.error('Failed to read file.');
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
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
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">
            {viewMode === 'active' ? 'Active Invoices' : 'Recently Deleted'}
          </h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">MANAGE TRANSACTION HISTORY</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all ${
              viewMode === 'trash' 
                ? 'bg-theme-danger/5 text-theme-danger border-theme-danger/30' 
                : 'bg-theme-card text-theme-muted border-theme-border-soft hover:bg-theme-app'
            }`}
          >
            {viewMode === 'active' ? 'View Trash' : 'View Active Invoices'}
          </button>
          
          <label className="flex items-center justify-center gap-2 bg-theme-surface text-theme-primary font-bold text-xs px-4 py-3.5 rounded-2xl border border-theme-border-soft hover:bg-theme-app transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-theme-accent" />
            <span className="hidden sm:inline">Import Invoice</span>
            <input 
              type="file" 
              accept=".json,.billqyro" 
              onChange={handleImportInvoice} 
              className="hidden" 
            />
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onEditInvoice(null); // Clear editing state
              setCurrentTab('create-invoice');
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-premium transition-shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </motion.button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side: Filter Tabs */}
        <div className="flex gap-1 bg-theme-app dark:bg-theme-surface p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Paid', 'Pending', 'Unpaid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-theme-card dark:bg-theme-card text-theme-primary dark:text-theme-primary shadow-sm border border-theme-border-soft dark:border-theme-border-soft/50'
                  : 'text-theme-muted hover:text-theme-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Right Side: Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted pointer-events-none">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, client..."
            className="w-full pl-12 pr-4 py-4 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
          />
        </div>
      </div>

      {/* INVOICE GRID LIST */}
      <div className="space-y-4">
        {paginatedInvoices.map((invoice) => (
          <motion.div key={invoice.id} variants={itemVariants}>
              <InvoiceCard
                invoice={invoice}
                currencySymbol={currencySymbol}
                businessSettings={businessSettings}
                onView={(inv) => setViewingInvoice(inv)}
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
                    const confirmText = window.prompt('Type DELETE to permanently delete this invoice:');
                    if (confirmText === 'DELETE') {
                      onDeleteInvoice(id, true); // permanent delete
                    } else if (confirmText !== null) {
                      toast.error('Deletion cancelled. You must type DELETE exactly.');
                    }
                  }
                }}
                onRestore={viewMode === 'trash' ? (id) => {
                  import('../services/invoiceEngine').then(({ invoiceEngine }) => invoiceEngine.restoreInvoice(id)).then(() => {
                    toast.success('Invoice restored!');
                    window.dispatchEvent(new Event('billqyro_sync'));
                  });
                } : null}
                onDownload={onDownloadPDF}
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

      {/* Paid Invoice Delete Confirmation */}
      {paidDeleteTarget && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPaidDeleteTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-theme-primary leading-tight">Delete Paid Invoice?</h3>
            </div>

            <p className="text-sm font-bold text-theme-muted mb-6">
              This invoice contains completed payment records. Moving it to trash is recommended.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onDeleteInvoice(paidDeleteTarget.id, false);
                  setPaidDeleteTarget(null);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Move To Trash
              </button>
              <button
                onClick={() => setPaidDeleteTarget(null)}
                className="w-full py-3 bg-transparent hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary text-sm font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Floating Create Invoice button for mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { onEditInvoice(null); setCurrentTab('create-invoice'); }}
        className="fixed bottom-4 right-4 md:hidden flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-sm px-4 py-3 rounded-full shadow-premium z-20"
      >
        <Plus className="w-5 h-5" />
        <span>Create Invoice</span>
      </motion.button>

      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}
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
            <div className="bg-theme-card dark:bg-theme-card border-b border-theme-border-soft dark:border-theme-border-soft px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-theme-accent" />
                <span className="font-extrabold text-theme-primary dark:text-theme-primary text-sm">{viewingInvoice.invoiceNumber} - Preview Mode</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingInvoice)}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                    if (!isLiveLinkEnabled) {
                      toast.error('Live Link is disabled. Enable it from Settings.');
                      return;
                    }
                    const invoiceId = viewingInvoice?.id;
                    if (!invoiceId) return;
                    if (linkCache[invoiceId]) {
                      await navigator.clipboard.writeText(linkCache[invoiceId]);
                      toast.success('Live Invoice Link copied to clipboard!');
                      return;
                    }
                    setGeneratingLink(true);
                    try {
                      const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                      if (!token) {
                        toast.error('Could not create live link. Please try again.');
                        return;
                      }
                      const liveLink = `${window.location.origin}/invoice/${token}`;
                      setLinkCache(prev => ({ ...prev, [invoiceId]: liveLink }));
                      await navigator.clipboard.writeText(liveLink);
                      toast.success('Live Invoice Link copied to clipboard!');
                    } catch (err) {
                      toast.error('Could not create live link. Please try again.');
                    } finally {
                      setGeneratingLink(false);
                    }
                  }}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  title="Copy Live Link"
                  disabled={generatingLink}
                >
                  {generatingLink ? <span className="w-4 h-4 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin block" /> : <Link className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    onEditInvoice(viewingInvoice);
                    setViewingInvoice(null);
                    setCurrentTab('create-invoice');
                  }}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Edit Invoice"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-theme-surface dark:bg-theme-card mx-1"></div>

                {/* SaaS Invoice Sharing Suite */}
                <button
                   onClick={async () => {
                     try {
                       const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                       if (!token) {
                         toast.error('Could not create live link. Please try again.');
                         return;
                       }
                       const updatedInvoice = { ...viewingInvoice, publicToken: token };
                       const link = generateWhatsAppShareLink(updatedInvoice, currencySymbol, businessSettings);
                       window.open(link, '_blank');
                     } catch (err) {
                       toast.error('Could not create live link. Please try again.');
                     }
                   }}
                   className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Share via WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 text-theme-accent" />
                </button>
                {viewingInvoice.paymentStatus !== 'Paid' && (
                  <button
                     onClick={async () => {
                       try {
                         const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                         if (!token) {
                           toast.error('Could not create live link. Please try again.');
                           return;
                         }
                         const updatedInvoice = { ...viewingInvoice, publicToken: token };
                         const link = generateWhatsAppReminderLink(updatedInvoice, currencySymbol, businessSettings);
                         window.open(link, '_blank');
                       } catch (err) {
                         toast.error('Could not create live link. Please try again.');
                       }
                     }}
                     className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                     title="Send Reminder via WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-theme-danger" />
                  </button>
                )}
                <button
                   onClick={async () => {
                     try {
                       const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                       if (!token) {
                         toast.error('Could not create live link. Please try again.');
                         return;
                       }
                       const updatedInvoice = { ...viewingInvoice, publicToken: token };
                       const { mailto } = generateEmailShareLink(updatedInvoice, currencySymbol, businessSettings);
                       window.open(mailto, '_blank');
                     } catch (err) {
                       toast.error('Could not create live link. Please try again.');
                     }
                   }}
                   className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Share via Email"
                >
                  <Mail className="w-4 h-4 text-theme-accent" />
                </button>
                <button
                   onClick={async () => {
                     try {
                       const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                       if (!token) {
                         toast.error('Could not create live link. Please try again.');
                         return;
                       }
                       const updatedInvoice = { ...viewingInvoice, publicToken: token };
                       const text = generateInvoiceShareText(updatedInvoice, currencySymbol, businessSettings);
                       await navigator.clipboard.writeText(text);
                       toast.success('Invoicing summary copied to clipboard!');
                     } catch (err) {
                       toast.error('Could not create live link. Please try again.');
                     }
                   }}
                   className="p-2 text-theme-muted hover:text-theme-warning hover:bg-theme-warning/5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Copy Invoice Text"
                >
                  <Copy className="w-4 h-4 text-theme-warning" />
                </button>

                <div className="w-px h-6 bg-theme-surface dark:bg-theme-card mx-1"></div>
                <button
                  onClick={() => {
                    setViewingInvoice(null);
                    onEditInvoice(null);
                  }}
                  className="p-2 text-theme-muted hover:text-theme-primary dark:text-theme-primary hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Wrapper (No internal scroll) */}
            <div className="p-4 md:p-6 bg-theme-app dark:bg-theme-surface">
              {/* Pending Payment Verification Panel */}
              {viewingInvoice && (viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length > 0 && (
                <div className="mb-6 p-5 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-theme-border-soft rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-theme-accent font-extrabold mb-4">
                    <ShieldCheck className="w-5 h-5 text-theme-accent" />
                    <span className="text-sm">Pending Payment Verification ({(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length})</span>
                  </div>
                  
                  <div className="space-y-4">
                    {(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').map((proof) => (
                      <div key={proof.id} className="bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-theme-muted">Method:</span>
                            <span className="bg-theme-accent-light text-theme-accent px-2 py-0.5 rounded-md font-bold uppercase">{proof.method}</span>
                            <span className="font-bold text-theme-muted ml-2">Amount:</span>
                            <span className="font-extrabold text-theme-primary dark:text-theme-primary">{currencySymbol}{proof.amount}</span>
                          </div>
                          
                          {proof.transactionId && (
                            <div>
                              <span className="font-bold text-theme-muted">Transaction ID:</span>{' '}
                              <span className="font-mono text-theme-primary dark:text-theme-primary select-all font-semibold bg-theme-app dark:bg-theme-surface px-1.5 py-0.5 rounded">{proof.transactionId}</span>
                            </div>
                          )}
                          
                          {proof.notes && (
                            <div>
                              <span className="font-bold text-theme-muted">Customer Note:</span>{' '}
                              <span className="text-theme-muted italic">"{proof.notes}"</span>
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
                                <div className="absolute inset-0 bg-theme-card/10 hover:bg-theme-card/30 flex items-center justify-center transition-all opacity-0 hover:opacity-100 text-white font-bold text-[10px]">
                                  Click to View Full
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex sm:flex-row md:flex-col justify-end gap-2 md:w-48 shrink-0">
                          <button
                            onClick={() => handleApproveProof(proof)}
                            className="flex items-center justify-center gap-1.5 bg-gradient-to-tr from-theme-accent to-theme-accent-dark hover:opacity-90 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer w-full text-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Verify</span>
                          </button>
                          <button
                            onClick={() => handleRejectProof(proof)}
                            className="flex items-center justify-center gap-1.5 bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer w-full text-center"
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

              <InvoicePreview 
                invoice={viewingInvoice}
                businessSettings={businessSettings}
              />
            </div>
            
            {/* Mobile Sticky Bottom Action Bar (thumb zone) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[10000] bg-theme-card/95 backdrop-blur-xl border-t border-theme-border-soft px-4 py-3 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                onClick={async () => {
                  try {
                    const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                    if (!token) { toast.error('Could not create live link.'); return; }
                    const updatedInvoice = { ...viewingInvoice, publicToken: token };
                    const link = generateWhatsAppShareLink(updatedInvoice, currencySymbol, businessSettings);
                    window.open(link, '_blank');
                  } catch (err) { toast.error('Could not create live link.'); }
                }}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-theme-muted">Share</span>
              </button>
              <button
                onClick={() => onDownloadPDF(viewingInvoice)}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-theme-muted">PDF</span>
              </button>
              <button
                onClick={async () => {
                  const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                  if (!isLiveLinkEnabled) { toast.error('Live Link is disabled.'); return; }
                  try {
                    const token = await invoiceEngine.ensurePublicToken(viewingInvoice);
                    if (!token) { toast.error('Could not create live link.'); return; }
                    const liveLink = `${window.location.origin}/invoice/${token}`;
                    await navigator.clipboard.writeText(liveLink);
                    toast.success('Live Link copied!');
                  } catch (err) { toast.error('Could not create live link.'); }
                }}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                  <Link className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-theme-muted">Link</span>
              </button>
              <button
                onClick={() => {
                  onEditInvoice(viewingInvoice);
                  setViewingInvoice(null);
                  setCurrentTab('create-invoice');
                }}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-theme-muted">Edit</span>
              </button>
            </div>

            {/* Print Only Embedded Capture Zone */}
            <div className="hidden print:block print:absolute print:inset-0 bg-theme-card dark:bg-theme-card">
              <InvoicePreview 
                invoice={viewingInvoice}
                businessSettings={businessSettings}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      </motion.div>
      </PullToRefresh>
    </AnimatedPage>
  );
};

export default Invoices;

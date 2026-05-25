import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceCard from '../components/InvoiceCard';
import InvoicePreview from '../components/InvoicePreview';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
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
  Link
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import { 
  generateWhatsAppShareLink, 
  generateWhatsAppReminderLink,
  generateEmailShareLink, 
  generateInvoiceShareText 
} from '../utils/shareUtils';
import { ensureInvoicePublicToken, saveInvoice, syncFromFirestore } from '../utils/storage';
import { db, firebaseReady } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PullToRefresh from '../components/PullToRefresh';

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
  onDeleteInvoice, 
  onDownloadPDF, 
  setCurrentTab,
  businessSettings 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal Preview State
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const currencySymbol = businessSettings?.currency || '₹';

  useEffect(() => {
    if (editingInvoice) {
      setViewingInvoice(editingInvoice);
    }
  }, [editingInvoice]);

  // Background Firestore public proofs sweeping & syncing
  useEffect(() => {
    if (firebaseReady && invoices.length > 0) {
      const sweepAndSync = async () => {
        let changed = false;
        const updatedInvoices = [...invoices];
        for (let i = 0; i < updatedInvoices.length; i++) {
          const inv = updatedInvoices[i];
          if (inv.publicToken) {
            try {
              const docRef = doc(db, 'publicInvoices', inv.publicToken);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                const pubData = snap.data();
                // Compare paymentProofs or status to detect changes
                const localProofsStr = JSON.stringify(inv.paymentProofs || []);
                const pubProofsStr = JSON.stringify(pubData.paymentProofs || []);
                if (localProofsStr !== pubProofsStr || inv.paymentStatus !== pubData.paymentStatus) {
                  updatedInvoices[i] = {
                    ...inv,
                    paymentStatus: pubData.paymentStatus,
                    paymentProofs: pubData.paymentProofs || [],
                    paymentHistory: pubData.paymentHistory || [],
                    amountPaid: pubData.amountPaid || inv.amountPaid,
                    balanceDue: pubData.balanceDue !== undefined ? pubData.balanceDue : inv.balanceDue
                  };
                  changed = true;
                  // Persist to private collection
                  await saveInvoice(updatedInvoices[i]);
                }
              }
            } catch (err) {
              console.warn('Failed to background sweep public invoice:', inv.publicToken, err);
            }
          }
        }
        if (changed) {
          localStorage.setItem('billqyro_invoices', JSON.stringify(updatedInvoices));
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      };
      // Run sweep after a short delay to prioritize initial page load
      const delay = setTimeout(sweepAndSync, 1000);
      return () => clearTimeout(delay);
    }
  }, [firebaseReady]);

  // On-demand real-time public proof syncer when viewing an invoice
  useEffect(() => {
    if (viewingInvoice && viewingInvoice.publicToken && firebaseReady) {
      const fetchLatestFromPublic = async () => {
        try {
          const docRef = doc(db, 'publicInvoices', viewingInvoice.publicToken);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const pubData = snap.data();
            const localProofsStr = JSON.stringify(viewingInvoice.paymentProofs || []);
            const pubProofsStr = JSON.stringify(pubData.paymentProofs || []);
            if (localProofsStr !== pubProofsStr || viewingInvoice.paymentStatus !== pubData.paymentStatus) {
              const updated = {
                ...viewingInvoice,
                paymentStatus: pubData.paymentStatus,
                paymentProofs: pubData.paymentProofs || [],
                paymentHistory: pubData.paymentHistory || [],
                amountPaid: pubData.amountPaid || viewingInvoice.amountPaid,
                balanceDue: pubData.balanceDue !== undefined ? pubData.balanceDue : viewingInvoice.balanceDue
              };
              
              // Save to Firestore collections (both private and public)
              await saveInvoice(updated);
              
              // Update state locally
              const updatedInvoices = invoices.map(inv => inv.id === viewingInvoice.id ? updated : inv);
              localStorage.setItem('billqyro_invoices', JSON.stringify(updatedInvoices));
              setViewingInvoice(updated);
              
              // Sync components
              window.dispatchEvent(new CustomEvent('billqyro_sync'));
            }
          }
        } catch (err) {
          console.warn('Failed to sync viewingInvoice with public doc:', err);
        }
      };
      fetchLatestFromPublic();
    }
  }, [viewingInvoice?.id, firebaseReady]);

  const handleApproveProof = async (proof) => {
    if (!window.confirm(`Are you sure you want to APPROVE this payment proof of ${currencySymbol}${proof.amount}?`)) return;

    // 1. Calculate new figures
    const totalPaid = (viewingInvoice.amountPaid || 0) + proof.amount;
    const balanceDue = Math.max(0, viewingInvoice.grandTotal - totalPaid);
    
    let newStatus = viewingInvoice.paymentStatus;
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
      verified: true
    };

    // 3. Update the matching proof status to Approved
    const updatedProofs = (viewingInvoice.paymentProofs || []).map(p => {
      if (p.id === proof.id) {
        return { ...p, status: 'Approved' };
      }
      return p;
    });

    const updatedInvoice = {
      ...viewingInvoice,
      amountPaid: totalPaid,
      balanceDue,
      paymentStatus: newStatus,
      paymentHistory: [...(viewingInvoice.paymentHistory || []), historyItem],
      paymentProofs: updatedProofs
    };

    // 4. Save
    await saveInvoice(updatedInvoice);
    
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
    await saveInvoice(updatedInvoice);
    
    setViewingInvoice(updatedInvoice);
    toast.error('Payment proof REJECTED.');
  };

  // --- FILTER LOGIC ---
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.paymentStatus.toLowerCase().includes(q) ||
      inv.date.includes(q)
    );

    const matchStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  const handlePrint = () => {
    window.print();
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
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div 
        className="space-y-6 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Active Invoices</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">MANAGE TRANSACTION HISTORY</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onEditInvoice(null); // Clear editing state
            setCurrentTab('create-invoice');
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md transition-shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </motion.button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side: Filter Tabs */}
        <div className="flex gap-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Paid', 'Pending', 'Unpaid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Right Side: Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, client..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* INVOICE GRID LIST */}
      <div className="space-y-3">
        {filteredInvoices.map((invoice) => (
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
              onDelete={onDeleteInvoice}
              onDownload={onDownloadPDF}
            />
          </motion.div>
        ))}

        {filteredInvoices.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 text-center shadow-premium">
            <FileSpreadsheet className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
            <h4 className="font-extrabold text-slate-700 dark:text-slate-300">No invoices yet</h4>
            <p className="text-xs text-slate-400 font-semibold mt-1 max-w-xs mx-auto">
              No invoices found. Create your first bill to see transaction records here!
            </p>
          </div>
        )}
      </div>

      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}
      {viewingInvoice && (
        <div 
          onClick={() => {
            setViewingInvoice(null);
            onEditInvoice(null);
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 no-print"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-50 dark:bg-slate-800/50 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative animate-scaleUp border border-white/10 max-h-[92vh] flex flex-col"
          >
            
            {/* Modal Top Actions Header Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{viewingInvoice.invoiceNumber} - Preview Mode</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingInvoice)}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all"
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
                    try {
                      const token = await ensureInvoicePublicToken(viewingInvoice);
                      if (!token) {
                        toast.error('Could not create live link. Please try again.');
                        return;
                      }
                      const liveLink = `${window.location.origin}/i/${token}`;
                      await navigator.clipboard.writeText(liveLink);
                      toast.success('Live Invoice Link copied to clipboard!');
                    } catch (err) {
                      toast.error('Could not create live link. Please try again.');
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
                  title="Copy Live Link"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onEditInvoice(viewingInvoice);
                    setViewingInvoice(null);
                    setCurrentTab('create-invoice');
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all"
                  title="Edit Invoice"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>

                {/* SaaS Invoice Sharing Suite */}
                <button
                   onClick={async () => {
                     try {
                       const token = await ensureInvoicePublicToken(viewingInvoice);
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
                   className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Share via WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                </button>
                {viewingInvoice.paymentStatus !== 'Paid' && (
                  <button
                     onClick={async () => {
                       try {
                         const token = await ensureInvoicePublicToken(viewingInvoice);
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
                     className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                     title="Send Reminder via WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-rose-500" />
                  </button>
                )}
                <button
                   onClick={async () => {
                     try {
                       const token = await ensureInvoicePublicToken(viewingInvoice);
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
                   className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Share via Email"
                >
                  <Mail className="w-4 h-4 text-sky-500" />
                </button>
                <button
                   onClick={async () => {
                     try {
                       const token = await ensureInvoicePublicToken(viewingInvoice);
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
                   className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                   title="Copy Invoice Text"
                >
                  <Copy className="w-4 h-4 text-amber-500" />
                </button>

                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                <button
                  onClick={() => {
                    setViewingInvoice(null);
                    onEditInvoice(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Wrapper */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50">
              {/* Pending Payment Verification Panel */}
              {viewingInvoice && (viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length > 0 && (
                <div className="mb-6 p-5 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-indigo-200/50 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-900 font-extrabold mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm">Pending Payment Verification ({(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').length})</span>
                  </div>
                  
                  <div className="space-y-4">
                    {(viewingInvoice.paymentProofs || []).filter(p => p.status === 'Pending').map((proof) => (
                      <div key={proof.id} className="bg-white dark:bg-slate-900 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-500">Method:</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase">{proof.method}</span>
                            <span className="font-bold text-slate-500 ml-2">Amount:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">{currencySymbol}{proof.amount}</span>
                          </div>
                          
                          {proof.transactionId && (
                            <div>
                              <span className="font-bold text-slate-500">Transaction ID:</span>{' '}
                              <span className="font-mono text-slate-800 dark:text-slate-100 select-all font-semibold bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{proof.transactionId}</span>
                            </div>
                          )}
                          
                          {proof.notes && (
                            <div>
                              <span className="font-bold text-slate-500">Customer Note:</span>{' '}
                              <span className="text-slate-600 italic">"{proof.notes}"</span>
                            </div>
                          )}
                          
                          {proof.screenshot && (
                            <div className="mt-2">
                              <span className="font-bold text-slate-500 block mb-1">Receipt Screenshot:</span>
                              <a 
                                href={proof.screenshot} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block relative rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-300 transition-all max-w-[200px]"
                              >
                                <img 
                                  src={proof.screenshot} 
                                  alt="Payment receipt proof" 
                                  className="max-h-32 object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-slate-900/10 hover:bg-slate-900/30 flex items-center justify-center transition-all opacity-0 hover:opacity-100 text-white font-bold text-[10px]">
                                  Click to View Full
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex sm:flex-row md:flex-col justify-end gap-2 md:w-48 shrink-0">
                          <button
                            onClick={() => handleApproveProof(proof)}
                            className="flex items-center justify-center gap-1.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer w-full text-center"
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
            
            {/* Print Only Embedded Capture Zone */}
            <div className="hidden print:block print:absolute print:inset-0 bg-white dark:bg-slate-900">
              <InvoicePreview 
                invoice={viewingInvoice}
                businessSettings={businessSettings}
              />
            </div>
          </div>
        </div>
      )}
      </motion.div>
    </PullToRefresh>
  );
};

export default Invoices;

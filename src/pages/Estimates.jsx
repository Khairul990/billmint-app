import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import InvoiceCard from '../components/InvoiceCard';
import InvoicePreview from '../components/InvoicePreview';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  X, 
  Printer, 
  Download, 
  ImageDown,
  Edit,
  Mail,
  Copy,
  Check,
  Share2,
  Link,
  ArrowRightLeft
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { 
  generateWhatsAppShareLink, 
  generateEmailShareLink, 
  generateInvoiceShareText 
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
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

const Estimates = ({ 
  invoices = [], 
  editingInvoice = null,
  onEditInvoice, 
  onDeleteInvoice,
  onDownloadPDF, 
  onDownloadImage, 
  setCurrentTab,
  businessSettings,
  onSaveInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewingEstimate, setViewingEstimate] = useState(null);
  
  const currencySymbol = businessSettings?.currency || '₹';

  useEffect(() => {
    if (editingInvoice && (editingInvoice.billType === 'Estimate' || editingInvoice.billType === 'Quotation' || editingInvoice.documentType === 'estimate' || editingInvoice.documentType === 'quotation')) {
      setViewingEstimate(editingInvoice);
    }
  }, [editingInvoice]);

  // Extract only estimates from the invoices array
  const estimates = invoices.filter(inv => {
    if (inv.isDeleted) return false;
    const type = (inv.billType || inv.documentType || '').toLowerCase();
    return type === 'estimate' || type === 'quotation';
  });

  // Calculate KPIs
  const totalEstimates = estimates.length;
  const pendingCount = estimates.filter(e => !e.status || e.status === 'Draft' || e.status === 'Pending').length;
  const acceptedCount = estimates.filter(e => e.status === 'Accepted').length;
  const convertedCount = estimates.filter(e => e.status === 'Converted').length;

  // Filter Logic
  const filteredEstimates = estimates.filter((inv) => {
    // 1. Filter by Search Query
    const q = searchQuery.toLowerCase();
    const matchSearch = (
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.status || inv.paymentStatus || '').toLowerCase().includes(q) ||
      (inv.date || '').includes(q)
    );

    // 2. Filter by Status
    let matchStatus = true;
    if (statusFilter !== 'All') {
      const invStatus = inv.status || 'Pending'; // Default to Pending if no status
      matchStatus = (invStatus === statusFilter) || (invStatus === 'Draft' && statusFilter === 'Pending');
    }

    return matchSearch && matchStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (estimate, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this estimate as ${newStatus}?`)) return;
    
    const updatedEstimate = {
      ...estimate,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    await onSaveInvoice(updatedEstimate);
    if (viewingEstimate?.id === estimate.id) {
      setViewingEstimate(updatedEstimate);
    }
    toast.success(`Estimate marked as ${newStatus}`);
  };

  const handleConvertToInvoice = async (estimate) => {
    if (!window.confirm('Convert this estimate into a new invoice? The original estimate will be marked as Converted.')) return;

    try {
      // 1. generate new ID
      const newInvoiceId = crypto.randomUUID();
      const newInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      // 2. clone estimate into a new invoice
      const newInvoice = {
        ...estimate,
        id: newInvoiceId,
        invoiceNumber: newInvoiceNumber,
        billType: 'Invoice',
        documentType: 'Invoice',
        amountPaid: 0,
        balanceDue: estimate.grandTotal,
        paymentStatus: 'Unpaid',
        paymentHistory: [],
        paymentProofs: [],
        status: 'Draft',
        publicToken: '', // Clear token so it gets a fresh one
        convertedFromEstimateId: estimate.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      // 3. update old estimate status
      const updatedEstimate = {
        ...estimate,
        status: 'Converted',
        convertedToInvoiceId: newInvoiceId,
        updatedAt: new Date().toISOString()
      };

      await onSaveInvoice(newInvoice);
      await onSaveInvoice(updatedEstimate);
      
      if (viewingEstimate?.id === estimate.id) {
        setViewingEstimate(updatedEstimate);
      }
      
      toast.success('Successfully converted to Invoice!');
      
      // Optionally redirect to new invoice
      onEditInvoice(newInvoice);
      setCurrentTab('create-invoice');
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert estimate');
    }
  };

  const handleRefresh = async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <AnimatedPage>
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
          <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">
            Estimates & Quotations
          </h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">MANAGE QUOTES AND PROPOSALS</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onEditInvoice(null); 
              setCurrentTab('create-invoice');
              // The user needs to manually select "Estimate" in the wizard for now, as CreateInvoiceWizard manages the dropdown
              toast('Remember to select "Estimate" as the Bill Type!', { icon: '💡' });
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-premium transition-shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Estimate</span>
          </motion.button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border-soft shadow-premium">
          <h3 className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Total Estimates</h3>
          <p className="text-2xl font-black text-theme-primary">{totalEstimates}</p>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border-soft shadow-premium">
          <h3 className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Pending</h3>
          <p className="text-2xl font-black text-theme-warning">{pendingCount}</p>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border-soft shadow-premium">
          <h3 className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Accepted</h3>
          <p className="text-2xl font-black text-theme-success">{acceptedCount}</p>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border-soft shadow-premium">
          <h3 className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Converted</h3>
          <p className="text-2xl font-black text-theme-primary">{convertedCount}</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side: Filter Tabs */}
        <div className="flex gap-1 bg-theme-app dark:bg-theme-surface p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Pending', 'Accepted', 'Rejected', 'Converted'].map((status) => (
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
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search estimate number, client..."
            className="w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
          />
        </div>
      </div>

      {/* ESTIMATES GRID LIST */}
      <div className="space-y-3">
        {filteredEstimates.map((estimate) => (
          <motion.div key={estimate.id} variants={itemVariants}>
              <InvoiceCard
                invoice={estimate}
                currencySymbol={currencySymbol}
                businessSettings={businessSettings}
                onView={(inv) => setViewingEstimate(inv)}
                onEdit={(inv) => {
                  onEditInvoice(inv);
                  setCurrentTab('create-invoice');
                }}
                onDelete={(id) => {
                  onDeleteInvoice(id, false);
                }}
                onDownload={onDownloadPDF}
                isDeleted={false}
              />
          </motion.div>
        ))}

        {filteredEstimates.length === 0 && (
            <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-12 border border-theme-border-soft dark:border-theme-border-soft text-center shadow-premium relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-5 grayscale">
                <img src="/brand/billqyro-icon.png" alt="Watermark" className="w-64 h-64 object-contain scale-125" />
              </div>
              <div className="relative z-10">
                <img src="/brand/billqyro-icon.png" alt="Empty" className="w-12 h-12 object-contain mx-auto mb-3 opacity-40 grayscale drop-shadow-sm" />
                <h4 className="font-extrabold text-theme-primary dark:text-theme-muted">No estimates yet</h4>
                <p className="text-xs text-theme-muted font-semibold mt-1 max-w-xs mx-auto">
                  Create your first estimate to see it here!
                </p>
              </div>
            </div>
          )}
      </div>

      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}
      {viewingEstimate && createPortal(
        <div 
          onClick={() => {
            setViewingEstimate(null);
            onEditInvoice(null);
          }}
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-10 no-print"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-app dark:bg-theme-surface w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative animate-scaleUp border border-white/10 flex flex-col my-10"
          >
            
            {/* Modal Top Actions Header Bar */}
            <div className="bg-theme-card dark:bg-theme-card border-b border-theme-border-soft dark:border-theme-border-soft px-6 py-4 flex items-center justify-between shrink-0 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-theme-accent" />
                <span className="font-extrabold text-theme-primary dark:text-theme-primary text-sm">{viewingEstimate.invoiceNumber} - Preview</span>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ml-2 uppercase ${
                  viewingEstimate.status === 'Accepted' ? 'bg-theme-success/10 text-theme-success' :
                  viewingEstimate.status === 'Rejected' ? 'bg-theme-danger/10 text-theme-danger' :
                  viewingEstimate.status === 'Converted' ? 'bg-theme-primary/10 text-theme-primary' :
                  'bg-theme-warning/10 text-theme-warning'
                }`}>
                  {viewingEstimate.status || 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Convert to Invoice Action */}
                {viewingEstimate.status !== 'Converted' && (
                  <button
                    onClick={() => handleConvertToInvoice(viewingEstimate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-tr from-theme-accent to-indigo-600 text-white font-bold text-xs rounded-lg shadow-sm hover:opacity-90 transition-all mr-2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Convert to Invoice
                  </button>
                )}

                {/* Status Toggles */}
                {viewingEstimate.status !== 'Converted' && (
                  <div className="flex bg-theme-app rounded-lg p-1 mr-2 border border-theme-border-soft">
                    <button
                      onClick={() => handleStatusChange(viewingEstimate, 'Accepted')}
                      className={`p-1.5 rounded transition-all ${viewingEstimate.status === 'Accepted' ? 'bg-theme-success/20 text-theme-success' : 'text-theme-muted hover:text-theme-success'}`}
                      title="Mark Accepted"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(viewingEstimate, 'Rejected')}
                      className={`p-1.5 rounded transition-all ${viewingEstimate.status === 'Rejected' ? 'bg-theme-danger/20 text-theme-danger' : 'text-theme-muted hover:text-theme-danger'}`}
                      title="Mark Rejected"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handlePrint}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Print Estimate"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingEstimate)}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadImage && onDownloadImage(viewingEstimate)}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Download Image (PNG)"
                >
                  <ImageDown className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    onEditInvoice(viewingEstimate);
                    setViewingEstimate(null);
                    setCurrentTab('create-invoice');
                  }}
                  className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all"
                  title="Edit Estimate"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-theme-surface dark:bg-theme-card mx-1"></div>

                <button
                  onClick={() => {
                    setViewingEstimate(null);
                    onEditInvoice(null);
                  }}
                  className="p-2 text-theme-muted hover:text-theme-primary dark:text-theme-primary hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Wrapper */}
            <div className="p-4 md:p-6 bg-theme-app dark:bg-theme-surface">
              <InvoicePreview 
                invoice={viewingEstimate}
                businessSettings={businessSettings}
              />
            </div>
            
            {/* Print Only Embedded Capture Zone */}
            <div className="hidden print:block print:absolute print:inset-0 bg-theme-card dark:bg-theme-card">
              <InvoicePreview 
                invoice={viewingEstimate}
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

export default Estimates;

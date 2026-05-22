import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import { 
  generateWhatsAppShareLink, 
  generateEmailShareLink, 
  generateInvoiceShareText 
} from '../utils/shareUtils';

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

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Active Invoices</h2>
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
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-premium flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side: Filter Tabs */}
        <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Paid', 'Pending', 'Unpaid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50'
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
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
          <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center shadow-premium">
            <FileSpreadsheet className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
            <h4 className="font-extrabold text-slate-700">No invoices yet</h4>
            <p className="text-xs text-slate-400 font-semibold mt-1 max-w-xs mx-auto">
              No invoices found. Create your first bill to see transaction records here!
            </p>
          </div>
        )}
      </div>

      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 no-print">
          <div className="bg-slate-50 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative animate-scaleUp border border-white/10 max-h-[92vh] flex flex-col">
            
            {/* Modal Top Actions Header Bar */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                <span className="font-extrabold text-slate-800 text-sm">{viewingInvoice.invoiceNumber} - Preview Mode</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadPDF(viewingInvoice)}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onEditInvoice(viewingInvoice);
                    setViewingInvoice(null);
                    setCurrentTab('create-invoice');
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="Edit Invoice"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-slate-100 mx-1"></div>

                {/* SaaS Invoice Sharing Suite */}
                <a
                  href={generateWhatsAppShareLink(viewingInvoice, currencySymbol, businessSettings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  title="Share via WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                </a>
                <a
                  href={generateEmailShareLink(viewingInvoice, currencySymbol, businessSettings).mailto}
                  className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  title="Share via Email"
                >
                  <Mail className="w-4 h-4 text-sky-500" />
                </a>
                <button
                  onClick={() => {
                    const text = generateInvoiceShareText(viewingInvoice, currencySymbol, businessSettings);
                    navigator.clipboard.writeText(text);
                    toast.success('Invoicing summary copied to clipboard!');
                  }}
                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  title="Copy Invoice Text"
                >
                  <Copy className="w-4 h-4 text-amber-500" />
                </button>

                <div className="w-px h-6 bg-slate-100 mx-1"></div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Wrapper */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <InvoicePreview 
                invoice={viewingInvoice}
                businessSettings={businessSettings}
              />
            </div>
            
            {/* Print Only Embedded Capture Zone */}
            <div className="hidden print:block print:absolute print:inset-0 bg-white">
              <InvoicePreview 
                invoice={viewingInvoice}
                businessSettings={businessSettings}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Invoices;

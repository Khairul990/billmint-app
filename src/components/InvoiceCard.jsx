import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  Edit2, 
  Trash2, 
  Download, 
  ImageDown, 
  Share2, 
  Mail, 
  Copy, 
  Check, 
  Link, 
  RefreshCw,
  MoreHorizontal,
  RotateCcw,
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Scissors,
  Stethoscope,
  ShoppingBag,
  GraduationCap,
  Wrench,
  Package, Repeat
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus 
} from '../utils/invoiceMath';
import { toast } from 'react-hot-toast';
import {
  generateEmailShareLink,
  generateInvoiceShareText
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import { shareOnWhatsApp } from '../services/invoiceShareService2';
import { isEducationCategory } from '../utils/categoryChecks';
import { getPortalLabelByType } from '../config/businessPresets';
import WhatsAppCommunicationPreview from './communication/WhatsAppCommunicationPreview';

// Premium WhatsApp Icon SVG Component
const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Premium Modular Financial Ledger Row / Invoice Command Card 5.0
 */
const InvoiceCard = ({ 
  invoice, 
  currencySymbol = '₹', 
  businessSettings = {}, 
  compact = false, 
  onView, 
  onEdit, 
  onDelete, 
  onDownload, 
  onDownloadImage, 
  onRestore, 
  onDownloadBackup, 
  isDeleted,
  isSelected = false,
  onToggleSelect,
  onRecordPayment,
  onDuplicate,
  onToggleRecurring
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const menuRef = useRef(null);

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };
  const portalLabel = getPortalLabelByType(businessSettings?.businessType);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  const fin = useMemo(() => {
    return calculateCanonicalInvoiceFinancials(invoice);
  }, [invoice]);

  const grandTotal = fin.previousDue > 0 ? fin.totalReceivable : fin.currentInvoiceTotal;
  const currentBillTotal = fin.currentInvoiceTotal;
  const previousDue = fin.previousDue;
  const paidTotal = fin.amountPaid;
  const balanceDue = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

  // Progress percentage
  const progressPercent = grandTotal > 0 ? Math.min(100, Math.max(0, Math.round((paidTotal / grandTotal) * 100))) : (paidTotal > 0 ? 100 : 0);

  // Check overdue
  const isOverdue = useMemo(() => {
    if (!invoice || balanceDue <= 0 || !invoice.dueDate) return false;
    const due = new Date(invoice.dueDate);
    return !isNaN(due) && due < new Date();
  }, [invoice, balanceDue]);

  // Category Icon & Context
  const categoryIcon = useMemo(() => {
    const type = (businessSettings?.businessType || '').toLowerCase();
    if (type.includes('embroidery') || type.includes('tailor') || type.includes('fashion')) return Scissors;
    if (type.includes('clinic') || type.includes('doctor') || type.includes('medical')) return Stethoscope;
    if (type.includes('education') || type.includes('teacher') || type.includes('tuition')) return GraduationCap;
    if (type.includes('service') || type.includes('repair')) return Wrench;
    if (type.includes('retail') || type.includes('store') || type.includes('grocery')) return ShoppingBag;
    return FileText;
  }, [businessSettings?.businessType]);

  const CategoryIconComponent = categoryIcon;

  // Category Metadata Line
  const categoryMetadata = useMemo(() => {
    if (!invoice) return null;
    const items = invoice.items || [];
    if (items.length === 0) {
      return invoice.notes ? `Note: ${invoice.notes.slice(0, 45)}...` : null;
    }
    
    // Check for stitch count or specific attributes
    const firstItem = items[0] || {};
    const itemName = firstItem.name || firstItem.description || firstItem.item || 'Item';
    const stitches = firstItem.stitches || firstItem.stitchCount;
    const fabric = firstItem.fabric || firstItem.fabricType;
    const garment = firstItem.garment || firstItem.garmentType;

    const parts = [];
    if (items.length === 1) {
      parts.push(itemName);
      if (stitches) parts.push(`${stitches} stitches`);
      if (fabric) parts.push(fabric);
      if (garment) parts.push(garment);
    } else {
      parts.push(`${items.length} items (${itemName}, +${items.length - 1} more)`);
    }

    return parts.join(' • ');
  }, [invoice]);

  if (!invoice) return null;

  const handleSendReminder = async () => {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
      toast.success(`[DEMO PREVIEW] WhatsApp Due Reminder modal triggered!`);
      return;
    }

    try {
      setIsSendingReminder(true);
      const customerId = invoice.customerId || invoice.customer?.id || invoice.customerPhone;
      if (!customerId) {
        toast.error('Cannot find customer details to send reminder.');
        return;
      }

      setPreviewPayload({
        workspaceId: invoice.workspaceId || 'default',
        userId: invoice.userId || 'current',
        invoiceId: invoice.id
      });
      setShowWhatsAppPreview(true);
      setShowMoreMenu(false);
    } catch (err) {
      toast.error('Failed to trigger reminder.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const getStatusBadge = (status) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
          OVERDUE
        </span>
      );
    }

    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-theme-accent/20 to-theme-accent/5 text-theme-accent border border-theme-accent/30 shadow-md shadow-theme-accent/20 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-accent shadow-[0_0_8px_currentColor]"></span>
            PAID
          </span>
        );
      case 'Partially Paid':
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
            PARTIAL
          </span>
        );
      case 'Payment Submitted':
      case 'Payment Submitted / Pending Verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-500/20 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
            SUBMITTED
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-theme-surface text-theme-muted border border-theme-border-soft tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-muted"></span>
            CANCELLED
          </span>
        );
      case 'Unpaid':
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            PENDING
          </span>
        );
    }
  };

  const isPaid = balanceDue <= 0 && grandTotal > 0;
  
  return (
    <>
      <motion.div 
        whileHover={{ y: -4, scale: 1.002 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`luxury-glass-card rounded-[1.5rem] p-5 transition-all duration-500 group relative ${
          showMoreMenu ? 'z-30' : 'z-1'
        } ${
          isSelected 
            ? '!border-theme-accent !bg-theme-accent/5 ring-2 ring-theme-accent/40 shadow-premium' 
            : isPaid
              ? 'border-theme-accent/40 bg-theme-accent/5 shadow-lg shadow-theme-accent/10 dark:bg-theme-accent/10 ring-1 ring-theme-accent/20 hover:shadow-2xl hover:shadow-theme-accent/20 hover:border-theme-accent/60'
              : 'hover:shadow-2xl hover:shadow-theme-primary/10 hover:border-theme-border-soft/80'
        }`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[1.5rem] pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=')] opacity-0 group-hover:opacity-[0.04] transition-opacity duration-700 pointer-events-none text-theme-primary mix-blend-overlay"></div>
          {isPaid && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/10 rounded-full blur-[60px] pointer-events-none transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          )}
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          
          {/* LEFT & CENTER: Selection + Identity + Customer Metadata */}
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            
            {/* Multi-Select Checkbox */}
            {onToggleSelect && !isDeleted && (
              <div className="pt-2 sm:pt-0 shrink-0">
                <label className="flex items-center justify-center p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(invoice.id)}
                    className="w-5 h-5 rounded-md border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer transition-all"
                    aria-label={`Select invoice ${invoice.invoiceNumber}`}
                  />
                </label>
              </div>
            )}

            {/* Document Type Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner ${
              isPaid 
                ? 'bg-gradient-to-br from-theme-accent to-theme-accent/80 text-white shadow-lg shadow-theme-accent/30 border border-theme-accent/50 scale-105' 
                : 'bg-gradient-to-br from-theme-surface to-theme-surface/50 border border-theme-border-soft text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/5 group-hover:shadow-lg group-hover:shadow-theme-accent/20'
            }`}>
              <CategoryIconComponent className="w-6 h-6" />
            </div>

            {/* Center Content: Invoice Number, Customer & Category Metadata */}
            <div className="min-w-0 flex-1 space-y-2">
              
              {/* Row 1: Invoice ID + Customer Name + Status Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button 
                  onClick={handleCopyId}
                  title="Click to copy Invoice ID"
                  className="font-mono font-black text-theme-muted hover:text-theme-primary text-sm tracking-tight bg-theme-surface hover:bg-theme-surface-elevated px-2 py-0.5 rounded-md border border-theme-border-soft transition-all flex items-center gap-1.5 group/copy cursor-pointer relative shadow-sm hover:shadow-md"
                >
                  {invoice.invoiceNumber}
                  {copiedId ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-40 group-hover/copy:opacity-100 transition-opacity" />
                  )}
                </button>

                <span className={`font-black text-xl sm:text-2xl truncate max-w-[280px] sm:max-w-[350px] tracking-tight ${
                  isPaid ? 'bg-gradient-to-r from-theme-primary to-theme-accent bg-clip-text text-transparent' : 'text-theme-primary'
                }`}>
                  {invoice.customerName || 'Walk-in Customer'}
                  {isPaid && <CheckCircle2 className="w-5 h-5 inline-block ml-2 text-theme-accent mb-1" />}
                </span>

                {invoice.customerPhone && (
                  <span className="hidden sm:flex items-center gap-1 text-sm text-theme-muted font-numbers font-medium bg-theme-surface/50 px-2 py-0.5 rounded-lg border border-theme-border-soft">
                    {invoice.customerPhone}
                  </span>
                )}

                <div className="ml-2">
                  {getStatusBadge(invoice.paymentStatus)}
                </div>

                {invoice.orderStatus && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border-soft text-theme-secondary">
                    {invoice.orderStatus}
                  </span>
                )}
              </div>

              {/* Row 2: Category Details & Date Breakdown (More Details) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-theme-muted font-medium mt-1">
                {categoryMetadata && (
                  <span className="font-bold text-theme-secondary flex items-center gap-1.5 bg-theme-surface/50 px-2.5 py-1 rounded-lg border border-theme-border-soft shadow-sm">
                    <Package className="w-3.5 h-3.5 text-theme-accent" />
                    {categoryMetadata}
                  </span>
                )}

                {previousDue > 0 && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 font-numbers flex items-center gap-1 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    +Old Due: {formatCurrency(previousDue, currencySymbol)}
                  </span>
                )}

                <div className="flex items-center gap-3 text-xs bg-theme-surface/30 px-2.5 py-1 rounded-lg border border-theme-border-soft/50 shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-theme-muted" />
                    {invoice.date ? new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </span>
                  
                  {invoice.date && (
                    <span className="flex items-center gap-1.5 border-l border-theme-border-soft pl-3 text-theme-muted font-bold">
                      <Clock className="w-3 h-3 text-theme-muted" />
                      {getTimeAgo(invoice.createdAt || invoice.date)}
                    </span>
                  )}

                  {invoice.dueDate && (
                    <>
                      <span className="border-l border-theme-border-soft pl-3"></span>
                      <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-500 font-bold' : ''}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {invoice.dueDate}
                      </span>
                    </>
                  )}
                </div>

                {invoice.syncStatus === 'failed' && (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                    Sync Error
                  </span>
                )}
              </div>

              {/* Row 3: Ultra Premium Payment Progress Indicator / Paid Stamp */}
              {grandTotal > 0 && (
                <div className="flex items-center pt-2">
                  {isPaid ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-accent/10 border border-theme-accent/30 rounded-xl shadow-sm">
                      <span className="text-theme-accent">🎉</span>
                      <span className="text-xs font-black text-theme-accent uppercase tracking-widest">
                        Payment Settled
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-48 sm:w-72 h-3 bg-theme-surface/80 rounded-full overflow-hidden border border-theme-border-soft/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-fast pointer-events-none"></div>
                        <div 
                          className={`h-full transition-all duration-1000 ease-out relative ${
                            paidTotal > 0 
                              ? 'bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]' 
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        >
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-theme-secondary font-numbers flex items-center gap-1.5 tracking-tight">
                        {progressPercent}% <span className="text-[10px] uppercase text-theme-muted tracking-widest hidden sm:inline">Collected</span>
                        {paidTotal > 0 && <span className="font-bold text-theme-primary ml-1 bg-theme-surface/80 px-2 py-0.5 rounded-lg border border-theme-border-soft shadow-sm tabular-nums">({formatCurrency(paidTotal, currencySymbol)} / {formatCurrency(grandTotal, currencySymbol)})</span>}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Tabular Financial Numerals & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-theme-border-soft/60">
            
            {/* Tabular Financial Numbers */}
            <div className={`flex items-center justify-between sm:justify-end gap-5 sm:gap-6 rounded-2xl px-5 py-3 border font-numbers shadow-sm transition-all duration-300 group-hover:shadow-md ${
              isPaid 
                ? 'bg-gradient-to-r from-theme-accent/10 to-theme-accent/5 border-theme-accent/30 backdrop-blur-md relative overflow-hidden' 
                : 'bg-theme-surface/60 border-theme-border-soft backdrop-blur-sm group-hover:bg-theme-surface/80'
            }`}>
              {isPaid ? (
                <>
                  <div className="absolute inset-0 opacity-20 text-theme-accent bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+')] [mask-image:linear-gradient(to_right,transparent,black)]"></div>
                  <div className="text-left sm:text-right relative z-10 flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent block mb-0.5">Amount Settled</span>
                      <span className="text-xl font-black text-theme-accent tabular-nums drop-shadow-sm">
                        {formatCurrency(paidTotal, currencySymbol)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center border border-theme-accent/30 shadow-sm shadow-theme-accent/30">
                      <CheckCircle2 className="w-5 h-5 text-theme-accent" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted block mb-0.5">
                      {previousDue > 0 ? 'Total Due' : 'Total'}
                    </span>
                    <span className="text-lg font-black text-theme-primary tabular-nums">
                      {formatCurrency(grandTotal, currencySymbol)}
                    </span>
                    {previousDue > 0 && (
                      <span className="text-[9px] font-bold text-theme-muted block font-numbers mt-0.5">
                        Bill: {formatCurrency(currentBillTotal, currencySymbol)}
                      </span>
                    )}
                  </div>

                  <div className="w-px h-10 bg-theme-border-soft" />

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted block mb-0.5">Paid</span>
                    <span className="text-lg font-black tabular-nums text-theme-accent">
                      {formatCurrency(paidTotal, currencySymbol)}
                    </span>
                  </div>

                  <div className="w-px h-10 bg-theme-border-soft" />

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted block mb-0.5">Balance</span>
                    <span className={`text-lg font-black tabular-nums ${
                      balanceDue > 0 ? 'text-rose-500' : 'text-theme-muted'
                    }`}>
                      {formatCurrency(balanceDue, currencySymbol)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Direct Contextual Action Buttons */}
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              {!isDeleted ? (
                <>
                  <button
                    onClick={() => onView(invoice)}
                    title="View & Preview Invoice"
                    aria-label="View Invoice"
                    className="px-3 py-1.5 text-xs font-bold text-theme-primary bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-theme-accent group-hover:scale-110 transition-transform" />
                    <span>View</span>
                  </button>

                  {balanceDue > 0 && onRecordPayment && (
                    <button
                      onClick={() => onRecordPayment(invoice)}
                      title="Collect Payment"
                      aria-label="Collect Payment"
                      className="group/btn relative overflow-hidden px-3.5 py-1.5 text-xs font-black text-white bg-theme-accent hover:bg-theme-accent/90 border border-theme-accent/80 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-md shadow-theme-accent/30 hover:shadow-xl hover:shadow-theme-accent/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                      <CreditCard className="w-3.5 h-3.5 text-white relative z-10" />
                      <span className="hidden sm:inline relative z-10">Collect</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(invoice)}
                    title="Edit Invoice"
                    aria-label="Edit Invoice"
                    className="px-3 py-1.5 text-xs font-bold text-theme-secondary hover:text-theme-primary bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group/edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-theme-muted group-hover/edit:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Organized More Actions Dropdown */}
                  <div className="relative inline-block shrink-0" ref={menuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      title="More Options"
                      aria-label="More Options"
                      className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        showMoreMenu
                          ? 'text-white bg-theme-accent border-theme-accent shadow-md shadow-theme-accent/30'
                          : 'text-theme-secondary bg-theme-surface hover:bg-theme-surface-elevated border-theme-border-soft'
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -6 }}
                          transition={{ duration: 0.12 }}
                          style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', zIndex: 9999 }}
                          className="w-60 bg-theme-surface/80 backdrop-blur-3xl border border-theme-accent/20 rounded-[1.5rem] p-2 shadow-2xl shadow-theme-accent/20 flex flex-col gap-1 text-xs max-h-[380px] overflow-y-auto ring-1 ring-theme-border-soft"
                        >
                          <button
                            onClick={() => {
                              onDownload(invoice);
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-theme-accent" />
                            <span>Download PDF</span>
                          </button>

                          {onDownloadImage && (
                            <button
                              onClick={() => {
                                onDownloadImage(invoice);
                                setShowMoreMenu(false);
                              }}
                              className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <ImageDown className="w-3.5 h-3.5 text-theme-muted" />
                              <span>Download PNG</span>
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              if (isSharingWhatsApp) return;
                              setIsSharingWhatsApp(true);
                              try {
                                const updatedInvoice = { ...invoice };
                                await shareOnWhatsApp(null, updatedInvoice, businessSettings);
                                setShowMoreMenu(false);
                              } catch (err) {
                                toast.error(err.message || 'Could not share via WhatsApp.');
                              } finally {
                                setIsSharingWhatsApp(false);
                              }
                            }}
                            disabled={isSharingWhatsApp}
                            className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-theme-accent" />
                            <span>{isSharingWhatsApp ? 'Preparing...' : 'Share on WhatsApp'}</span>
                          </button>

                          {balanceDue > 0 && (
                            <button
                              onClick={handleSendReminder}
                              className="flex items-center gap-2 px-2.5 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>Send Due Reminder</span>
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                              if (!isLiveLinkEnabled) {
                                toast.error(`${portalLabel} is disabled in Settings.`);
                                return;
                              }
                              try {
                                const customerId = invoice.customerId || invoice.customer?.id || invoice.customerPhone;
                                if (!customerId) {
                                  toast.error('Assign a customer to share the Portal.');
                                  return;
                                }
                                const isEdu = isEducationCategory(businessSettings?.businessCategory);
                                const portalPath = isEdu ? '/student-portal' : '/billing';
                                const liveLink = `${window.location.origin}${portalPath}/${encodeURIComponent(customerId)}`;
                                await navigator.clipboard.writeText(liveLink);
                                toast.success(`${portalLabel} link copied!`);
                                setShowMoreMenu(false);
                              } catch (err) {
                                toast.error(err.message || 'Could not copy portal link.');
                              }
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <Link className="w-3.5 h-3.5 text-theme-accent" />
                            <span>Copy {portalLabel} Link</span>
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                const customerId = invoice.customerId || invoice.customer?.id;
                                if (!customerId) {
                                  toast.error('Assign a customer to email invoice.');
                                  return;
                                }
                                const updatedInvoice = { ...invoice };
                                const { mailto } = generateEmailShareLink(updatedInvoice, currencySymbol, businessSettings);
                                window.open(mailto, '_blank');
                                setShowMoreMenu(false);
                              } catch (err) {
                                toast.error(err.message || 'Could not create email link.');
                              }
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-theme-muted" />
                            <span>Email Invoice</span>
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                const updatedInvoice = { ...invoice };
                                const text = generateInvoiceShareText(updatedInvoice, currencySymbol, businessSettings);
                                await navigator.clipboard.writeText(text);
                                toast.success('Summary copied to clipboard!');
                                setShowMoreMenu(false);
                              } catch (err) {
                                toast.error(err.message || 'Could not copy summary.');
                              }
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-theme-muted" />
                            <span>Copy Summary</span>
                          </button>

                          {onDuplicate && !isDeleted && (
                            <button
                              onClick={() => {
                                onDuplicate(invoice);
                                setShowMoreMenu(false);
                              }}
                              className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-theme-accent" />
                              <span>Duplicate Bill</span>
                            </button>
                          )}

                          {onToggleRecurring && !isDeleted && (
                            <button
                              onClick={() => {
                                onToggleRecurring(invoice);
                                setShowMoreMenu(false);
                              }}
                              className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <Repeat className="w-3.5 h-3.5 text-theme-accent" />
                              <span>{invoice.recurring ? 'Turn Off Monthly Billing' : 'Make Monthly Bill'}</span>
                            </button>
                          )}

                          {onDownloadBackup && (
                            <button
                              onClick={() => {
                                onDownloadBackup();
                                setShowMoreMenu(false);
                              }}
                              className="flex items-center gap-2 px-2.5 py-2 text-theme-primary hover:bg-theme-surface rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-theme-muted" />
                              <span>Export Backup (.billqyro)</span>
                            </button>
                          )}

                          {invoice.syncStatus === 'failed' && (
                            <button
                              onClick={() => {
                                toast.loading('Retrying sync...', { id: 'retrySync' });
                                import('../services/invoiceEngine').then(m => m.invoiceEngine.retrySync(invoice.id)).then(() => {
                                  toast.dismiss('retrySync');
                                  setShowMoreMenu(false);
                                });
                              }}
                              className="flex items-center gap-2 px-2.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                              <span>Retry Cloud Sync</span>
                            </button>
                          )}

                          <div className="h-px bg-theme-border-soft my-1" />

                          <button
                            onClick={() => {
                              onDelete(invoice.id);
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-semibold w-full text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Move to Trash</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                onRestore && (
                  <button
                    onClick={() => onRestore(invoice.id)}
                    title="Restore Invoice"
                    aria-label="Restore Invoice"
                    className="px-3 py-1.5 text-xs font-bold bg-theme-accent text-white hover:opacity-95 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {showWhatsAppPreview && previewPayload && (
        <WhatsAppCommunicationPreview
          workspaceId={previewPayload.workspaceId}
          userId={previewPayload.userId}
          invoiceId={previewPayload.invoiceId}
          onClose={() => setShowWhatsAppPreview(false)}
        />
      )}
    </>
  );
};

export default React.memo(InvoiceCard, (prevProps, nextProps) => {
  return (
    prevProps.invoice?.updatedAt === nextProps.invoice?.updatedAt &&
    prevProps.invoice?.paymentStatus === nextProps.invoice?.paymentStatus &&
    prevProps.isDeleted === nextProps.isDeleted &&
    prevProps.isSelected === nextProps.isSelected
  );
});

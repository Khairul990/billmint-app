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
  Package
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { getInvoicePaidTotal, getInvoiceBalanceDue } from '../utils/financialCalculations';
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
  onRecordPayment
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);
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

  const grandTotal = parseFloat(invoice?.grandTotal || invoice?.total) || 0;
  const paidTotal = invoice ? getInvoicePaidTotal(invoice) : 0;
  const balanceDue = invoice ? getInvoiceBalanceDue(invoice) : 0;

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          OVERDUE
        </span>
      );
    }

    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PAID
          </span>
        );
      case 'Partially Paid':
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            PARTIAL
          </span>
        );
      case 'Payment Submitted':
      case 'Payment Submitted / Pending Verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            SUBMITTED
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-theme-surface text-theme-muted border border-theme-border-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-muted"></span>
            CANCELLED
          </span>
        );
      case 'Unpaid':
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            PENDING
          </span>
        );
    }
  };

  return (
    <>
      <div className={`bg-theme-card rounded-2xl p-4 border transition-all duration-200 group shadow-xs hover:shadow-md relative ${
        showMoreMenu ? 'z-30' : 'z-1'
      } ${
        isSelected 
          ? 'border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent/30' 
          : 'border-theme-border-soft hover:border-theme-border-strong'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* LEFT & CENTER: Selection + Identity + Customer Metadata */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            
            {/* Multi-Select Checkbox */}
            {onToggleSelect && !isDeleted && (
              <div className="pt-1 sm:pt-0 shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(invoice.id)}
                  className="w-4 h-4 rounded-md border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer transition-all"
                  aria-label={`Select invoice ${invoice.invoiceNumber}`}
                />
              </div>
            )}

            {/* Document Type Icon */}
            <div className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 flex items-center justify-center shrink-0 transition-colors">
              <CategoryIconComponent className="w-4 h-4" />
            </div>

            {/* Center Content: Invoice Number, Customer & Category Metadata */}
            <div className="min-w-0 flex-1 space-y-1.5">
              
              {/* Row 1: Invoice ID + Customer Name + Status Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-black text-theme-primary text-sm tracking-tight">
                  {invoice.invoiceNumber}
                </span>
                
                <span className="text-theme-muted text-xs">•</span>

                <span className="font-bold text-theme-primary text-sm truncate max-w-[220px]">
                  {invoice.customerName || 'Walk-in Customer'}
                </span>

                {invoice.customerPhone && (
                  <span className="hidden sm:inline text-xs text-theme-muted font-numbers">
                    ({invoice.customerPhone})
                  </span>
                )}

                {getStatusBadge(invoice.paymentStatus)}

                {invoice.orderStatus && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border-soft text-theme-secondary">
                    {invoice.orderStatus}
                  </span>
                )}
              </div>

              {/* Row 2: Category Details & Date Breakdown */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-muted font-medium">
                {categoryMetadata && (
                  <span className="font-semibold text-theme-secondary truncate max-w-[320px]">
                    {categoryMetadata}
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>
                    Created {invoice.date ? new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </span>
                  {invoice.dueDate && (
                    <>
                      <span>•</span>
                      <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>
                        Due {invoice.dueDate}
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

              {/* Row 3: Slim Payment Progress Indicator */}
              {grandTotal > 0 && (
                <div className="flex items-center gap-2.5 pt-0.5">
                  <div className="w-32 sm:w-44 h-1.5 bg-theme-surface rounded-full overflow-hidden border border-theme-border-soft/40">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        balanceDue <= 0 
                          ? 'bg-emerald-500' 
                          : paidTotal > 0 
                            ? 'bg-amber-500' 
                            : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-theme-muted font-numbers">
                    {progressPercent}% collected {paidTotal > 0 && `(${formatCurrency(paidTotal, currencySymbol)} of ${formatCurrency(grandTotal, currencySymbol)})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Tabular Financial Numerals & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-theme-border-soft/60">
            
            {/* Tabular Financial Numbers */}
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 bg-theme-surface/60 rounded-xl px-4 py-2 border border-theme-border-soft font-numbers">
              <div className="text-left sm:text-right">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-theme-muted block">Total</span>
                <span className="text-sm font-black text-theme-primary tabular-nums">
                  {formatCurrency(grandTotal, currencySymbol)}
                </span>
              </div>

              <div className="w-px h-6 bg-theme-border-soft" />

              <div className="text-left sm:text-right">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-theme-muted block">Paid</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(paidTotal, currencySymbol)}
                </span>
              </div>

              <div className="w-px h-6 bg-theme-border-soft" />

              <div className="text-left sm:text-right">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-theme-muted block">Balance</span>
                <span className={`text-sm font-black tabular-nums ${
                  balanceDue > 0 ? 'text-rose-500' : 'text-theme-muted'
                }`}>
                  {formatCurrency(balanceDue, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Direct Contextual Action Buttons */}
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              {!isDeleted ? (
                <>
                  <button
                    onClick={() => onView(invoice)}
                    title="View & Preview Invoice"
                    aria-label="View Invoice"
                    className="px-3 py-1.5 text-xs font-bold text-theme-primary bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-theme-accent" />
                    <span>View</span>
                  </button>

                  {balanceDue > 0 && onRecordPayment && (
                    <button
                      onClick={() => onRecordPayment(invoice)}
                      title="Record Payment"
                      aria-label="Record Payment"
                      className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Payment</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(invoice)}
                    title="Edit Invoice"
                    aria-label="Edit Invoice"
                    className="px-2.5 py-1.5 text-xs font-bold text-theme-secondary hover:text-theme-primary bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-theme-muted" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Organized More Actions Dropdown */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      title="More Options"
                      aria-label="More Options"
                      className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        showMoreMenu
                          ? 'text-theme-accent bg-theme-accent/10 border-theme-accent/30'
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
                          className="absolute right-0 top-full mt-1.5 w-56 bg-theme-card border border-theme-border-soft rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 text-xs"
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
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
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
      </div>

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

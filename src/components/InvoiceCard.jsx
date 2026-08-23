import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Eye, Edit2, Trash2, Download, ImageDown, Share2, Mail, Copy, Check, Link, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import {
  generateEmailShareLink,
  generateInvoiceShareText
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import { shareOnWhatsApp } from '../services/invoiceShareService2';
import { isEducationCategory } from '../utils/categoryChecks';
import { getPortalLabelByType } from '../config/businessPresets';
// Button component not needed in this file; removed import.
import WhatsAppCommunicationPreview from './communication/WhatsAppCommunicationPreview';
import { communicationEngine } from '../services/communication/communicationEngine';



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
 * Responsive Invoice Card item
 * @param {Object} invoice - Invoice object
 * @param {string} currencySymbol - e.g. "₹"
 * @param {Function} onView - View callback
 * @param {Function} onEdit - Edit callback
 * @param {Function} onDelete - Delete callback
 * @param {Function} onDownload - Download PDF callback
 * @param {Function} onDownloadImage - Download Image (PNG) callback
 */
const InvoiceCard = ({ invoice, currencySymbol = '₹', businessSettings = {}, compact = false, onView, onEdit, onDelete, onDownload, onDownloadImage, onRestore, onDownloadBackup, isDeleted }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const menuRef = useRef(null);
  const portalLabel = getPortalLabelByType(businessSettings?.businessType);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const handleSendReminder = async () => {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
      toast.error('Reminder is disabled in Demo mode.');
      return;
    }
    if (!navigator.onLine) {
      toast.error('Cannot send reminder while offline.');
      return;
    }
    if (isSendingReminder) return;
    setIsSendingReminder(true);
    try {
      const workspaceId = businessSettings?.workspaceId || null;
      const userId = businessSettings?.userId || null;
      const payload = await communicationEngine.prepareCommunication({
        workspaceId,
        userId,
        invoiceId: invoice.id,
        overrides: {}
      });
      setPreviewPayload(payload);
      setShowWhatsAppPreview(true);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to prepare reminder.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Close sharing popover on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  if (!invoice) return null;

  const getSyncStatusStyle = (status) => {
    switch (status) {
      case 'synced':
        return 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-theme-accent-light/20 dark:text-theme-accent dark:border-theme-accent/30';
      case 'pending':
        return 'bg-theme-warning/5 text-theme-warning border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'failed':
        return 'bg-theme-danger/5 text-theme-danger border-rose-100 dark:bg-rose-950/20 dark:text-theme-danger dark:border-rose-900/30';
      case 'offline':
        return 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-sky-950/20 dark:text-theme-accent dark:border-sky-900/30';
      default:
        return 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:border-theme-border-soft dark:bg-theme-app/20 dark:text-theme-muted dark:border-theme-border-soft/30';
    }
  };

  const getSyncStatusLabel = (status) => {
    switch (status) {
      case 'synced': return 'Saved to Cloud';
      case 'pending': return 'Pending Sync';
      case 'failed': return 'Sync Failed';
      case 'offline': return 'Offline Draft';
      default: return '';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'Payment Submitted':
      case 'Payment Submitted / Pending Verification':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-theme-accent-light dark:text-purple-400 dark:border-purple-900/30';
      case 'Partially Paid':
      case 'Partial':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
      case 'Cancelled':
        return 'bg-theme-surface dark:bg-theme-card text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-theme-border-soft/30';
      case 'Unpaid':
      case 'Pending':
      default:
        return 'bg-theme-app text-theme-secondary border-theme-border-soft dark:bg-theme-surface/60 dark:text-theme-primary dark:border-theme-border-strong/50';
    }
  };

  const getOrderStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-theme-accent-light/20 dark:text-theme-accent dark:border-theme-accent/30';
      case 'Ready':
        return 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-theme-accent/10 dark:text-theme-accent dark:border-theme-accent/30';
      case 'In Progress':
        return 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-theme-accent/10 dark:text-theme-accent dark:border-theme-accent/30';
      case 'Cancelled':
        return 'bg-theme-danger/5 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-theme-danger dark:border-rose-900/30';
      case 'Pending':
      default:
        return 'bg-theme-warning/5 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
  };

  return (
    <>
    <div className="bg-theme-card dark:bg-theme-card rounded-2xl p-4 sm:p-4.5 border border-theme-border-soft hover:border-theme-accent/40 shadow-premium transition-all duration-300 group">
      <div className={`flex flex-col ${compact ? '' : 'lg:flex-row lg:items-center'} justify-between gap-3.5`}>
        {/* Left Section: Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-theme-app dark:bg-theme-surface text-theme-accent flex items-center justify-center border border-theme-border-soft shadow-xs shrink-0 group-hover:border-theme-accent/30 group-hover:scale-105 transition-all">
            <FileText className="w-5 h-5" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-theme-primary text-sm sm:text-base tracking-tight">{invoice.invoiceNumber}</span>
              {invoice.customerName && (
                <>
                  <span className="text-theme-muted text-xs hidden sm:inline">•</span>
                  <span className="font-bold text-theme-accent text-xs sm:text-sm bg-theme-accent/5 px-2 py-0.5 rounded-lg border border-theme-accent/15 truncate max-w-[200px]">
                    {invoice.customerName}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${getStatusStyle(invoice.paymentStatus)}`}>
                {invoice.paymentStatus}
              </span>
              {invoice.orderStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${getOrderStatusStyle(invoice.orderStatus)}`}>
                  {invoice.orderStatus}
                </span>
              )}
              {invoice.syncStatus && getSyncStatusLabel(invoice.syncStatus) && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-extrabold uppercase tracking-wider ${getSyncStatusStyle(invoice.syncStatus)}`}>
                  {getSyncStatusLabel(invoice.syncStatus)}
                </span>
              )}
              <span className="text-[10px] font-semibold text-theme-muted ml-1">
                Due: {invoice.dueDate || (invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Compact Financial Summary & Actions */}
        <div className={`flex flex-col sm:flex-row sm:items-center ${compact ? 'pt-2 border-t' : 'lg:border-t-0 pt-2 lg:pt-0'} justify-between lg:justify-end gap-3 border-theme-border-soft`}>
          
          {/* Pro+ Payment Stats Pill */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 bg-theme-app dark:bg-theme-surface rounded-xl px-3 py-1.5 border border-theme-border-soft shadow-inner">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[8px] text-theme-muted font-black uppercase tracking-wider">Total</span>
              <span className="text-xs sm:text-sm font-black text-theme-primary tabular-nums">{formatCurrency(invoice.grandTotal, currencySymbol)}</span>
            </div>
            <div className="w-px h-5 bg-theme-border-soft"></div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[8px] text-theme-muted font-black uppercase tracking-wider">Paid</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(invoice.amountPaid || invoice.paidAmount || 0, currencySymbol)}</span>
            </div>
            <div className="w-px h-5 bg-theme-border-soft"></div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[8px] text-theme-muted font-black uppercase tracking-wider">Due</span>
              <span className={`text-xs sm:text-sm font-black tabular-nums ${invoice.balanceDue > 0 ? 'text-rose-500' : 'text-theme-muted'}`}>{formatCurrency(invoice.balanceDue || 0, currencySymbol)}</span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-1 shrink-0">
            {!isDeleted && (
              <>
                <button
                  onClick={() => onView(invoice)}
                  title="View Invoice"
                  aria-label="View Invoice"
                  className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onEdit(invoice)}
                  title="Edit Invoice"
                  aria-label="Edit Invoice"
                  className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onDownload(invoice)}
                  title="Download PDF"
                  aria-label="Download PDF"
                  className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                {onDownloadImage && (
                  <button
                    onClick={() => onDownloadImage(invoice)}
                    title="Download PNG Image"
                    aria-label="Download PNG Image"
                    className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
                  >
                    <ImageDown className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={async () => {
                    const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                    if (!isLiveLinkEnabled) {
                      toast.error(`${portalLabel} is disabled. Enable it from Settings.`);
                      return;
                    }
                    try {
                      const customerId = invoice.customerId || invoice.customer?.id || invoice.customerPhone;
                      if (!customerId) {
                        toast.error('Please assign a customer to share the Portal.');
                        return;
                      }
                      const isEdu = isEducationCategory(businessSettings?.businessCategory);
                      const portalPath = isEdu ? '/student-portal' : '/billing';
                      const liveLink = `${window.location.origin}${portalPath}/${encodeURIComponent(customerId)}`;
                      await navigator.clipboard.writeText(liveLink);
                      toast.success(`${portalLabel} Link copied to clipboard!`);
                    } catch (err) {
                      toast.error(err.message || `Could not create ${portalLabel.toLowerCase()}. Please try again.`);
                    }
                  }}
                  title={`Copy ${portalLabel} Link`}
                  aria-label={`Copy ${portalLabel} Link`}
                  className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
                >
                  <Link className="w-4 h-4" />
                </button>

                {/* Quick Share Popover Dropdown */}
                <div className="relative flex" ref={menuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    title="Share Invoice"
                    aria-label="Share Invoice"
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-theme-accent/30 ${showShareMenu
                      ? 'text-theme-accent bg-theme-accent/15'
                      : 'text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10'
                      }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 bottom-full mb-2 w-48 bg-theme-surface border border-theme-border-soft rounded-2xl p-1.5 shadow-2xl z-20 flex flex-col gap-1 text-[11px]"
                      >
                        <div className="px-3 py-1 font-black text-[9px] text-theme-muted uppercase tracking-wider border-b border-theme-border-soft mb-1">
                          Quick Share
                        </div>

                        <button
                          onClick={async () => {
                            if (isSharingWhatsApp) return;
                            setIsSharingWhatsApp(true);
                            try {
                              const updatedInvoice = { ...invoice };
                              await shareOnWhatsApp(null, updatedInvoice, businessSettings);
                              setShowShareMenu(false);
                            } catch (err) {
                              toast.error(err.message || 'Could not create WhatsApp share. Please try again.');
                            } finally {
                              setIsSharingWhatsApp(false);
                            }
                          }}
                          disabled={isSharingWhatsApp}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-theme-primary hover:bg-theme-accent/10 hover:text-theme-accent rounded-xl transition-colors font-bold w-full text-left cursor-pointer disabled:opacity-60"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isSharingWhatsApp ? 'Preparing...' : 'WhatsApp Share'}</span>
                        </button>

                        {invoice.paymentStatus !== 'Paid' && (
                          <button
                            onClick={handleSendReminder}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-theme-primary hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-rose-500" />
                            <span>Send Reminder</span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            try {
                              const customerId = invoice.customerId || invoice.customer?.id;
                              if (!customerId) {
                                toast.error('Please assign a customer to share the Portal.');
                                return;
                              }
                              const updatedInvoice = { ...invoice };
                              const { mailto } = generateEmailShareLink(updatedInvoice, currencySymbol, businessSettings);
                              window.open(mailto, '_blank');
                              setShowShareMenu(false);
                            } catch (err) {
                              toast.error(err.message || 'Could not create email link. Please try again.');
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-theme-primary hover:bg-theme-accent/10 hover:text-theme-accent rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-theme-accent" />
                          <span>Email Invoice</span>
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const updatedInvoice = { ...invoice };
                              const text = generateInvoiceShareText(updatedInvoice, currencySymbol, businessSettings);
                              await navigator.clipboard.writeText(text);
                              toast.success('Invoicing summary copied!');
                              setShowShareMenu(false);
                            } catch (err) {
                              toast.error(err.message || 'Could not copy summary.');
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-theme-primary hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Copy Summary</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {isDeleted && onRestore && (
              <button
                onClick={() => onRestore(invoice.id)}
                title="Restore Invoice"
                aria-label="Restore Invoice"
                className="text-xs font-bold px-3 py-1.5 bg-theme-accent/15 text-theme-accent hover:bg-theme-accent/25 rounded-xl transition-all cursor-pointer"
              >
                Restore
              </button>
            )}

            {!isDeleted && onDownloadBackup && (
              <button
                onClick={() => onDownloadBackup()}
                title="Download Editable Backup (.billqyro)"
                aria-label="Download Backup"
                className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus:ring-2 focus:ring-theme-accent/30 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {!isDeleted && (
              <button
                onClick={() => onDelete(invoice.id)}
                title="Move to Trash"
                aria-label="Move to Trash"
                className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:ring-2 focus:ring-rose-500/30 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {!isDeleted && invoice.syncStatus === 'failed' && (
              <button
                onClick={() => {
                  toast.loading('Retrying sync...', { id: 'retrySync' });
                  import('../services/invoiceEngine').then(m => m.invoiceEngine.retrySync(invoice.id)).then(() => {
                    toast.dismiss('retrySync');
                  });
                }}
                title={`Retry Sync: ${invoice.syncError || 'Unknown error'}`}
                aria-label="Retry Sync"
                className="w-9 h-9 flex items-center justify-center text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
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
    prevProps.isDeleted === nextProps.isDeleted
  );
});


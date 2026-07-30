import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Eye, Edit2, Trash2, Download, Share2, Mail, Copy, Check, Link, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import {
  generateWhatsAppShareLink,
  generateWhatsAppReminderLink,
  generateEmailShareLink,
  generateInvoiceShareText
} from '../utils/shareUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import { isEducationCategory } from '../utils/categoryChecks';

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
 */
const InvoiceCard = ({ invoice, currencySymbol = '₹', businessSettings = {}, compact = false, onView, onEdit, onDelete, onDownload, onRestore, onDownloadBackup, isDeleted }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const menuRef = useRef(null);

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
    <div className="bg-theme-card dark:bg-theme-card rounded-2xl p-5 md:p-5 border border-theme-border-soft dark:border-theme-border-soft/80 shadow-premium hover:shadow-2xl hover:border-theme-accent/30 dark:hover:border-theme-accent/40 transition-all duration-500 group">
      <div className={`flex flex-col ${compact ? '' : 'md:flex-row md:items-center'} justify-between gap-4`}>
        {/* Top/Left Section: Metadata */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-theme-app to-theme-surface dark:from-theme-surface dark:to-theme-card text-theme-accent dark:text-theme-accent rounded-xl border border-theme-border-soft shadow-sm hidden sm:block group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-theme-accent/20 transition-all duration-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-theme-primary dark:text-theme-primary text-base md:text-lg">{invoice.invoiceNumber}</span>
              {invoice.customerName && (
                <>
                   <span className="text-theme-muted hidden sm:inline">•</span>
                   <span className="font-extrabold text-theme-accent dark:text-theme-accent text-sm md:text-base bg-theme-accent/5 px-2 py-0.5 rounded-lg border border-theme-accent/10">{invoice.customerName}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold uppercase tracking-wider shadow-sm ${getStatusStyle(invoice.paymentStatus)}`}>
                {invoice.paymentStatus}
              </span>
              {invoice.orderStatus && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold uppercase tracking-wider shadow-sm ${getOrderStatusStyle(invoice.orderStatus)}`}>
                  {invoice.orderStatus}
                </span>
              )}
              {invoice.syncStatus && getSyncStatusLabel(invoice.syncStatus) && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold uppercase tracking-wider shadow-sm ${getSyncStatusStyle(invoice.syncStatus)}`}>
                  {getSyncStatusLabel(invoice.syncStatus)}
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-theme-muted dark:text-theme-muted mt-2">Due Date: {invoice.dueDate || 'N/A'}</p>
          </div>
        </div>

        {/* Right Section: Price & Quick CTA Buttons */}
        <div className={`flex ${compact ? 'flex-col items-start border-t pt-3' : 'md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-3'} border-theme-border-soft dark:border-theme-border-soft/80`}>
          
          {/* Pro+ Payment Stats Bar */}
          <div className="flex items-center gap-3 bg-theme-app dark:bg-theme-surface rounded-xl px-3 py-2 border border-theme-border-soft dark:border-theme-border-soft/50 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex flex-col items-start md:items-end min-w-[70px]">
              <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Bill Total</span>
              <span className="text-sm font-black text-theme-primary dark:text-theme-primary">{formatCurrency(invoice.grandTotal, currencySymbol)}</span>
            </div>
            <div className="w-px h-6 bg-theme-border-soft dark:bg-theme-border-soft/50"></div>
            <div className="flex flex-col items-start md:items-end min-w-[70px]">
              <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Paid</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.amountPaid || 0, currencySymbol)}</span>
            </div>
            <div className="w-px h-6 bg-theme-border-soft dark:bg-theme-border-soft/50"></div>
            <div className="flex flex-col items-start md:items-end min-w-[70px]">
              <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Due</span>
              <span className={`text-sm font-black ${invoice.balanceDue > 0 ? 'text-rose-500' : 'text-theme-muted'}`}>{formatCurrency(invoice.balanceDue || 0, currencySymbol)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {!isDeleted && (
              <>
                <button
                  onClick={() => onView(invoice)}
                  title="Preview Invoice"
                  className="p-2 text-theme-muted dark:text-theme-muted hover:text-theme-accent dark:hover:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light rounded-xl transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {invoice.paymentStatus !== 'Paid' && (
                  <button
                    onClick={() => onEdit(invoice)}
                    title="Edit Invoice"
                    className="p-2 text-theme-muted dark:text-theme-muted hover:text-theme-accent dark:hover:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light rounded-xl transition-all cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDownload(invoice)}
                  title="Download PDF"
                  className="p-2 text-theme-muted dark:text-theme-muted hover:text-theme-accent dark:hover:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light/30 rounded-xl transition-all cursor-pointer"
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
                      const customerId = invoice.customerId || invoice.customer?.id;
                      if (!customerId) {
                        toast.error('Please assign a customer to share the Portal.');
                        return;
                      }
                      const isEdu = isEducationCategory(businessSettings?.businessCategory);
                      const portalPath = isEdu ? '/student-portal' : '/portal';
                      const liveLink = `${window.location.origin}${portalPath}/${customerId}`;
                      await navigator.clipboard.writeText(liveLink);
                      toast.success('Live Invoice Link copied to clipboard!');
                    } catch (err) {
                      toast.error(err.message || 'Could not create live link. Please try again.');
                    }
                  }}
                  title="Copy Live Link"
                  className="p-2 text-theme-muted dark:text-theme-muted hover:text-theme-accent dark:hover:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light/30 rounded-xl transition-all cursor-pointer"
                >
                  <Link className="w-4 h-4" />
                </button>

                {/* Quick Share Popover Dropdown */}
                <div className="relative flex" ref={menuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    title="Share Invoice"
                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${showShareMenu
                      ? 'text-theme-accent bg-theme-accent-light dark:text-theme-accent dark:bg-theme-accent-light'
                      : 'text-theme-muted dark:text-theme-muted hover:text-theme-accent dark:hover:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light'
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
                        className="absolute right-0 bottom-full mb-2 w-48 bg-theme-card dark:bg-theme-card/95 dark:bg-theme-card/95 backdrop-blur-md border border-theme-border-soft dark:border-theme-border-soft rounded-2xl p-2 shadow-2xl z-20 flex flex-col gap-1 text-[11px]"
                      >
                        <div className="px-3 py-1 font-black text-[9px] text-theme-muted dark:text-theme-muted uppercase tracking-wider border-b border-theme-border-soft dark:border-theme-border-soft/60 mb-1">
                          Quick Share
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              const customerId = invoice.customerId || invoice.customer?.id;
                              if (!customerId) {
                                toast.error('Please assign a customer to share the Portal.');
                                return;
                              }
                              const updatedInvoice = { ...invoice };
                              const link = generateWhatsAppShareLink(updatedInvoice, currencySymbol, businessSettings);
                              window.open(link, '_blank');
                              setShowShareMenu(false);
                            } catch (err) {
                              toast.error(err.message || 'Could not create live link. Please try again.');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-theme-primary dark:text-theme-muted hover:bg-theme-accent-light dark:hover:bg-theme-accent-light/20 hover:text-theme-accent dark:hover:text-theme-accent rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-theme-accent" />
                          <span>WhatsApp Share</span>
                        </button>

                        {invoice.paymentStatus !== 'Paid' && (
                          <button
                            onClick={async () => {
                              try {
                                const customerId = invoice.customerId || invoice.customer?.id;
                                if (!customerId) {
                                  toast.error('Please assign a customer to share the Portal.');
                                  return;
                                }
                                const updatedInvoice = { ...invoice };
                                const link = generateWhatsAppReminderLink(updatedInvoice, currencySymbol, businessSettings);
                                window.open(link, '_blank');
                                setShowShareMenu(false);
                              } catch (err) {
                                toast.error('Could not create live link. Please try again.');
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-theme-primary dark:text-theme-muted hover:bg-theme-danger/5 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-theme-danger rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-theme-danger" />
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
                              toast.error(err.message || 'Could not create live link. Please try again.');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-theme-primary dark:text-theme-muted hover:bg-theme-accent-light dark:hover:bg-sky-950/20 hover:text-theme-accent dark:hover:text-theme-accent rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-theme-accent" />
                          <span>Email Invoice</span>
                        </button>


                        <button
                          onClick={async () => {
                            try {
                              const customerId = invoice.customerId || invoice.customer?.id;
                              if (!customerId) {
                                toast.error('Please assign a customer to share the Portal.');
                                return;
                              }
                              const updatedInvoice = { ...invoice };
                              const text = generateInvoiceShareText(updatedInvoice, currencySymbol, businessSettings);
                              await navigator.clipboard.writeText(text);
                              toast.success('Invoicing summary copied to clipboard!');
                              setShowShareMenu(false);
                            } catch (err) {
                              toast.error(err.message || 'Could not create live link. Please try again.');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-theme-primary dark:text-theme-muted hover:bg-theme-warning/5 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-theme-warning" />
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
                className="text-xs font-bold px-3 py-1.5 bg-theme-accent-light text-theme-accent hover:bg-theme-accent-light rounded-lg transition-all"
              >
                Restore
              </button>
            )}

            {!isDeleted && onDownloadBackup && (
              <button
                onClick={() => onDownloadBackup()}
                title="Download Editable Backup (.billqyro)"
                className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {!isDeleted && (
              <button
                onClick={() => onDelete(invoice.id)}
                title={isDeleted ? "Permanently Delete" : "Move to Trash"}
                className="p-2 text-theme-muted dark:text-theme-muted hover:text-theme-danger dark:hover:text-theme-danger hover:bg-theme-danger/5 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {!isDeleted && invoice.syncStatus === 'failed' && (
              <button
                onClick={() => {
                  toast.loading('Retrying sync...', { id: 'retrySync' });
                  import('../services/invoiceEngine').then(m => m.invoiceEngine.retrySync(invoice.id)).then(res => {
                    toast.dismiss('retrySync');
                  });
                }}
                title={`Retry Sync. Error: ${invoice.syncError || 'Unknown'}`}
                className="p-2 text-theme-danger dark:text-theme-danger hover:text-white dark:hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InvoiceCard, (prevProps, nextProps) => {
  return (
    prevProps.invoice?.updatedAt === nextProps.invoice?.updatedAt &&
    prevProps.invoice?.paymentStatus === nextProps.invoice?.paymentStatus &&
    prevProps.isDeleted === nextProps.isDeleted
  );
});

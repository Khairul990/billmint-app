import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Eye, Edit2, Trash2, Download, Share2, Mail, Copy, Check, Link } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import {
  generateWhatsAppShareLink,
  generateWhatsAppReminderLink,
  generateEmailShareLink,
  generateInvoiceShareText
} from '../utils/shareUtils';
import { ensureInvoicePublicToken } from '../utils/storage';

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
const InvoiceCard = ({ invoice, currencySymbol = '₹', businessSettings = {}, onView, onEdit, onDelete, onDownload }) => {
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

  const getSyncStatusStyle = (status) => {
    switch (status) {
      case 'synced':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'failed':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'offline':
        return 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800/30';
    }
  };

  const getSyncStatusLabel = (status) => {
    switch (status) {
      case 'synced': return 'Synced';
      case 'pending': return 'Sync Pending';
      case 'failed': return 'Sync Failed';
      case 'offline': return 'Offline Saved';
      default: return '';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Payment Submitted':
      case 'Payment Submitted / Pending Verification':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'Partially Paid':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/30';
      case 'Unpaid':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    }
  };

  const getOrderStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-800/80 shadow-premium hover:shadow-premium-hover transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Top/Left Section: Metadata */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 text-indigo-500 dark:text-indigo-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">{invoice.invoiceNumber}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusStyle(invoice.paymentStatus)}`}>
                {invoice.paymentStatus}
              </span>
              {invoice.orderStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getOrderStatusStyle(invoice.orderStatus)}`}>
                  {invoice.orderStatus}
                </span>
              )}
              {invoice.syncStatus && getSyncStatusLabel(invoice.syncStatus) && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getSyncStatusStyle(invoice.syncStatus)}`}>
                  {getSyncStatusLabel(invoice.syncStatus)}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{invoice.customerName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Due: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Right Section: Price & Quick CTA Buttons */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800/80">
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-150 sm:text-right">
            {formatCurrency(invoice.grandTotal, currencySymbol)}
          </span>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onView(invoice)}
              title="Preview Invoice"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(invoice)}
              title="Edit Invoice"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownload(invoice)}
              title="Download PDF"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Quick Share Popover Dropdown */}
            <div className="relative flex" ref={menuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                title="Share Invoice"
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${showShareMenu
                  ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30'
                  : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
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
                    className="absolute right-0 bottom-full mb-2 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-2xl p-2 shadow-2xl z-20 flex flex-col gap-1 text-[11px]"
                  >
                    <div className="px-3 py-1 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800/60 mb-1">
                      Quick Share
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const token = await ensureInvoicePublicToken(invoice);
                          if (!token) {
                            toast.error('Could not create live link. Please try again.');
                            return;
                          }
                          const updatedInvoice = { ...invoice, publicToken: token };
                          const link = generateWhatsAppShareLink(updatedInvoice, currencySymbol, businessSettings);
                          window.open(link, '_blank');
                          setShowShareMenu(false);
                        } catch (err) {
                          toast.error('Could not create live link. Please try again.');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Share</span>
                    </button>

                    {invoice.paymentStatus !== 'Paid' && (
                      <button
                        onClick={async () => {
                          try {
                            const token = await ensureInvoicePublicToken(invoice);
                            if (!token) {
                              toast.error('Could not create live link. Please try again.');
                              return;
                            }
                            const updatedInvoice = { ...invoice, publicToken: token };
                            const link = generateWhatsAppReminderLink(updatedInvoice, currencySymbol, businessSettings);
                            window.open(link, '_blank');
                            setShowShareMenu(false);
                          } catch (err) {
                            toast.error('Could not create live link. Please try again.');
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-rose-500" />
                        <span>Send Reminder</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          const token = await ensureInvoicePublicToken(invoice);
                          if (!token) {
                            toast.error('Could not create live link. Please try again.');
                            return;
                          }
                          const updatedInvoice = { ...invoice, publicToken: token };
                          const { mailto } = generateEmailShareLink(updatedInvoice, currencySymbol, businessSettings);
                          window.open(mailto, '_blank');
                          setShowShareMenu(false);
                        } catch (err) {
                          toast.error('Could not create live link. Please try again.');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-700 dark:hover:text-sky-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                      <span>Email Invoice</span>
                    </button>

                    <button
                      onClick={async () => {
                        const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                        if (!isLiveLinkEnabled) {
                          toast.error('Live Link is disabled. Enable it from Settings.');
                          return;
                        }
                        try {
                          const token = await ensureInvoicePublicToken(invoice);
                          if (!token) {
                            toast.error('Could not create live link. Please try again.');
                            return;
                          }
                          const liveLink = `${window.location.origin}/i/${token}`;
                          await navigator.clipboard.writeText(liveLink);
                          toast.success('Live Invoice Link copied to clipboard!');
                          setShowShareMenu(false);
                        } catch (err) {
                          toast.error('Could not create live link. Please try again.');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Copy Live Link</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const token = await ensureInvoicePublicToken(invoice);
                          if (!token) {
                            toast.error('Could not create live link. Please try again.');
                            return;
                          }
                          const updatedInvoice = { ...invoice, publicToken: token };
                          const text = generateInvoiceShareText(updatedInvoice, currencySymbol, businessSettings);
                          await navigator.clipboard.writeText(text);
                          toast.success('Invoicing summary copied to clipboard!');
                          setShowShareMenu(false);
                        } catch (err) {
                          toast.error('Could not create live link. Please try again.');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 rounded-xl transition-colors font-bold w-full text-left cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Copy Summary</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => onDelete(invoice.id)}
              title="Delete Invoice"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;

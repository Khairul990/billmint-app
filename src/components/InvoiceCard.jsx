import React from 'react';
import { FileText, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

/**
 * Responsive Invoice Card item
 * @param {Object} invoice - Invoice object
 * @param {string} currencySymbol - e.g. "₹"
 * @param {Function} onView - View callback
 * @param {Function} onEdit - Edit callback
 * @param {Function} onDelete - Delete callback
 * @param {Function} onDownload - Download PDF callback
 */
const InvoiceCard = ({ invoice, currencySymbol = '₹', onView, onEdit, onDelete, onDownload }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
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

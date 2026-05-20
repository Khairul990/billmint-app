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
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Unpaid':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Top/Left Section: Metadata */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
            <FileText className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm md:text-base">{invoice.invoiceNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusStyle(invoice.paymentStatus)}`}>
                {invoice.paymentStatus}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{invoice.customerName}</p>
            <p className="text-xs text-slate-400 mt-1">Due: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Right Section: Price & Quick CTA Buttons */}
        <div className="flex sm:flex-col items-between sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <span className="text-lg font-extrabold text-slate-800 sm:text-right">
            {formatCurrency(invoice.grandTotal, currencySymbol)}
          </span>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onView(invoice)}
              title="Preview Invoice"
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(invoice)}
              title="Edit Invoice"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownload(invoice)}
              title="Download PDF"
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(invoice.id)}
              title="Delete Invoice"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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

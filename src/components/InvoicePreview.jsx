import React from 'react';
import { formatCurrency } from '../utils/invoiceUtils';
import { ShieldCheck, Calendar, Hash, FileText } from 'lucide-react';

/**
 * High-fidelity Printable Invoice Letterhead Layout
 * @param {Object} invoice - Invoice object
 * @param {Object} businessSettings - Company's active profile settings
 */
const InvoicePreview = ({ invoice, businessSettings }) => {
  if (!invoice) return null;

  const currencySymbol = businessSettings?.currency || '₹';

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Unpaid':
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  return (
    <div 
      id="invoice-preview-capture" 
      className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-premium max-w-4xl mx-auto text-slate-800"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 1. BRAND HEADER & METADATA GRID */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
        {/* Left Side: Business logo & details */}
        <div>
          <div className="flex items-center gap-3">
            {businessSettings?.logoUrl ? (
              <img
                src={businessSettings.logoUrl}
                alt="Business Logo"
                className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-50 border border-slate-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-lg">
                {businessSettings?.businessName?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">{businessSettings?.businessName || 'BillMint Client'}</h3>
              {businessSettings?.gstNumber && (
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">GSTIN: {businessSettings.gstNumber}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 space-y-1 text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
            <p>{businessSettings?.address || 'Company Address Not Set'}</p>
            <p>Phone: {businessSettings?.phone}</p>
            <p>Email: {businessSettings?.email}</p>
          </div>
        </div>

        {/* Right Side: Invoice Info */}
        <div className="flex flex-col items-start md:items-end justify-start md:text-right gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusBadgeStyle(invoice.paymentStatus)}`}>
              {invoice.paymentStatus}
            </span>
          </div>
          
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5 justify-start md:justify-end text-slate-950 text-sm">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>Invoice: <strong className="font-extrabold">{invoice.invoiceNumber}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date: {invoice.date}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-rose-500">Due Date: {invoice.dueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLIENT CRM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-b border-slate-100 text-xs">
        <div>
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">Billed To</span>
          <h4 className="font-extrabold text-sm text-slate-800">{invoice.customerName}</h4>
          <div className="text-slate-500 space-y-1 mt-2 max-w-xs leading-relaxed font-medium">
            <p>{invoice.customerAddress || 'No address provided'}</p>
            <p>Phone: {invoice.customerPhone || 'N/A'}</p>
            <p>Email: {invoice.customerEmail || 'N/A'}</p>
          </div>
        </div>
        
        <div className="md:text-right">
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">Payment Terms</span>
          <p className="font-semibold text-slate-700 leading-relaxed">
            Please pay online on or before the due date.<br />
            Amounts are calculated in <strong className="text-indigo-600 font-extrabold">{currencySymbol}</strong>.
          </p>
        </div>
      </div>

      {/* 3. ITEM TABLE */}
      <div className="py-6 overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3 text-left">Item Description</th>
              <th className="pb-3 text-center w-20">Qty</th>
              <th className="pb-3 text-right w-32">Unit Price</th>
              <th className="pb-3 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoice.items && invoice.items.map((item, idx) => (
              <tr key={idx} className="text-slate-700 hover:bg-slate-50/50">
                <td className="py-4 font-semibold text-slate-800">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {item.designNo && item.designNo !== 'N/A' && (
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black tracking-wider uppercase">
                        {item.designNo}
                      </span>
                    )}
                    {item.workType && (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                        {item.workType}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-800 font-semibold">{item.description || item.name || 'Stitching Service'}</span>
                  {item.size && item.size !== 'N/A' && (
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Size: {item.size}</span>
                  )}
                </td>
                <td className="py-4 text-center font-bold text-slate-600">
                  {item.qty !== undefined ? item.qty : item.quantity}
                </td>
                <td className="py-4 text-right font-semibold text-slate-600">
                  {formatCurrency(item.rate !== undefined ? item.rate : item.price, currencySymbol)}
                </td>
                <td className="py-4 text-right font-extrabold text-slate-900">
                  {formatCurrency(item.amount !== undefined ? item.amount : item.total, currencySymbol)}
                </td>
              </tr>
            ))}
            {(!invoice.items || invoice.items.length === 0) && (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-400 font-semibold">
                  No items listed on this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS SUM BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-100 pt-6">
        {/* Invoice Notes */}
        <div className="flex-1 max-w-sm">
          {invoice.notes && (
            <>
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1.5">Notes & Terms</span>
              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 italic">
                "{invoice.notes}"
              </p>
            </>
          )}
        </div>

        {/* Math summary */}
        <div className="w-full sm:w-64 space-y-2 text-xs font-semibold text-slate-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-800 font-bold">{formatCurrency(invoice.subtotal, currencySymbol)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-rose-500 font-bold">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discountAmount, currencySymbol)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax ({invoice.taxPercentage}%)</span>
            <span className="text-slate-800 font-bold">{formatCurrency(invoice.taxAmount, currencySymbol)}</span>
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-slate-900">
            <span className="text-sm font-extrabold text-slate-800">Grand Total</span>
            <span className="text-lg font-black text-indigo-600">
              {formatCurrency(invoice.grandTotal, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. BRAND FOOTER SIGNATURE */}
      <div className="flex justify-center items-center gap-1.5 border-t border-slate-100/80 pt-8 mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Generated Securely via BillMint Invoicing SaaS</span>
      </div>
    </div>
  );
};

export default InvoicePreview;

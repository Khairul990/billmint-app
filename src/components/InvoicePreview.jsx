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
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Unpaid':
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    }
  };

  const steps = ['Pending', 'In Progress', 'Ready', 'Delivered'];
  const isCancelled = invoice.orderStatus === 'Cancelled';
  
  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'In Progress': return 1;
      case 'Ready': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(invoice.orderStatus);

  return (
    <div 
      id="invoice-preview-capture" 
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-premium max-w-4xl mx-auto text-slate-800 dark:text-slate-100 transition-all duration-300"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 0. ORDER TRACKING TIMELINE STEPPER */}
      {invoice.orderStatus && (
        <div className="mb-8 p-4 md:p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Order Dispatch Progress</span>
            {isCancelled ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 font-extrabold uppercase tracking-wider animate-pulse">
                Cancelled
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30 font-extrabold uppercase tracking-wider">
                {invoice.orderStatus}
              </span>
            )}
          </div>

          {!isCancelled && (
            <div className="relative flex items-center justify-between w-full mt-4 pb-2">
              {/* Stepper Progress Bar Background */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
              
              {/* Stepper Active Progress Line */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
              ></div>

              {/* Step Nodes */}
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    {/* Node Dot */}
                    <div 
                      className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[9px] border transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                          : isActive 
                          ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {/* Node Label */}
                    <span 
                      className={`text-[9px] font-bold mt-1.5 tracking-tight ${
                        isCompleted 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : isActive 
                          ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
                          : 'text-slate-400 dark:text-slate-600 font-semibold'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. BRAND HEADER & METADATA GRID */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        {/* Left Side: Business logo & details */}
        <div>
          <div className="flex items-center gap-3">
            {businessSettings?.logoUrl ? (
              <img
                src={businessSettings.logoUrl}
                alt="Business Logo"
                className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-50 border border-slate-100 dark:border-slate-800"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-lg">
                {businessSettings?.businessName?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 tracking-tight">{businessSettings?.businessName || 'BillQyro Client'}</h3>
              {businessSettings?.gstNumber && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">GSTIN: {businessSettings.gstNumber}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
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
          
          <div className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 justify-start md:justify-end text-slate-950 dark:text-slate-200 text-sm">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>Invoice: <strong className="font-extrabold">{invoice.invoiceNumber}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Date: {invoice.date}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-rose-500 dark:text-rose-400">Due Date: {invoice.dueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLIENT CRM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Billed To</span>
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-250">{invoice.customerName}</h4>
          <div className="text-slate-500 dark:text-slate-400 space-y-1 mt-2 max-w-xs leading-relaxed font-medium">
            <p>{invoice.customerAddress || 'No address provided'}</p>
            <p>Phone: {invoice.customerPhone || 'N/A'}</p>
            <p>Email: {invoice.customerEmail || 'N/A'}</p>
          </div>
        </div>
        
        <div className="md:text-right">
          <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Payment Terms</span>
          <p className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
            Please pay online on or before the due date.<br />
            Amounts are calculated in <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{currencySymbol}</strong>.
          </p>
        </div>
      </div>

      {/* 3. ITEM TABLE */}
      <div className="py-6 overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <th className="pb-3 text-left">Item Description</th>
              <th className="pb-3 text-center w-20">Qty</th>
              <th className="pb-3 text-right w-32">Unit Price</th>
              <th className="pb-3 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {invoice.items && invoice.items.map((item, idx) => (
              <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {item.designNo && item.designNo !== 'N/A' && (
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded text-[9px] font-black tracking-wider uppercase border border-indigo-100/10">
                        {item.designNo}
                      </span>
                    )}
                    {item.workType && (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-bold">
                        {item.workType}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{item.description || item.name || 'Stitching Service'}</span>
                  {item.size && item.size !== 'N/A' && (
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Size: {item.size}</span>
                  )}
                </td>
                <td className="py-4 text-center font-bold text-slate-600 dark:text-slate-400">
                  {item.qty !== undefined ? item.qty : item.quantity}
                </td>
                <td className="py-4 text-right font-semibold text-slate-600 dark:text-slate-400">
                  {formatCurrency(item.rate !== undefined ? item.rate : item.price, currencySymbol)}
                </td>
                <td className="py-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.amount !== undefined ? item.amount : item.total, currencySymbol)}
                </td>
              </tr>
            ))}
            {(!invoice.items || invoice.items.length === 0) && (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-400 dark:text-slate-500 font-semibold">
                  No items listed on this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS SUM BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
        {/* Invoice Notes */}
        <div className="flex-1 max-w-sm">
          {invoice.notes && (
            <>
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px] mb-1.5">Notes & Terms</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100/50 dark:border-slate-800/40 italic">
                "{invoice.notes}"
              </p>
            </>
          )}
        </div>

        {/* Math summary */}
        <div className="w-full sm:w-64 space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(invoice.subtotal, currencySymbol)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-rose-500 dark:text-rose-450 font-bold">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discountAmount, currencySymbol)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax ({invoice.taxPercentage}%)</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(invoice.taxAmount, currencySymbol)}</span>
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-900 dark:text-slate-100">
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Grand Total</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(invoice.grandTotal, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 4.5. PREMIUM PAYMENT QR CARD (CLIENT VIEW) */}
      {businessSettings?.paymentQrEnabled && businessSettings?.showQrInPreview && (
        (() => {
          const dueAmount = (invoice.balanceDue !== undefined && invoice.balanceDue !== null && invoice.balanceDue !== 0)
            ? invoice.balanceDue
            : invoice.grandTotal;
          const paymentMethod = businessSettings.paymentMethod || 'UPI';
          
          let qrText = '';
          if (paymentMethod === 'UPI') {
            const upiId = businessSettings.upiId || '';
            const payeeName = businessSettings.payeeName || businessSettings.businessName || '';
            qrText = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${dueAmount}&cu=INR&tn=${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'bKash') {
            const bkashNumber = businessSettings.bkashNumber || '';
            qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'Nagad') {
            const nagadNumber = businessSettings.nagadNumber || '';
            qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'Manual') {
            qrText = businessSettings.customPaymentLink || '';
          }

          if (!qrText) return null;

          const encodedQrText = encodeURIComponent(qrText);
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedQrText}`;

          return (
            <div className="mt-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl relative overflow-hidden border border-slate-700/50 dark:border-slate-800/80">
              {/* Subtle background glow */}
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -top-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                {/* QR Code Frame */}
                <div className="p-3 bg-white rounded-2xl shadow-lg border border-white/10 shrink-0">
                  <img 
                    src={qrCodeUrl} 
                    alt={`${paymentMethod} QR Code`} 
                    className="w-32 h-32 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/150x150?text=QR+Code";
                    }}
                  />
                </div>

                {/* Info details */}
                <div className="flex-1 text-center md:text-left space-y-3 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-350 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                      Scan to Pay with {paymentMethod}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight mt-2 text-white">
                      {businessSettings.payeeName || businessSettings.businessName || 'Business Payee'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    {paymentMethod === 'UPI' && businessSettings.upiId && (
                      <div className="text-slate-300">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">UPI ID</span>
                        <span className="font-mono text-slate-200 font-semibold break-all">{businessSettings.upiId}</span>
                      </div>
                    )}
                    {paymentMethod === 'bKash' && businessSettings.bkashNumber && (
                      <div className="text-slate-300">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">bKash Number</span>
                        <span className="font-mono text-slate-200 font-semibold break-all">{businessSettings.bkashNumber}</span>
                      </div>
                    )}
                    {paymentMethod === 'Nagad' && businessSettings.nagadNumber && (
                      <div className="text-slate-300">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">Nagad Number</span>
                        <span className="font-mono text-slate-200 font-semibold break-all">{businessSettings.nagadNumber}</span>
                      </div>
                    )}
                    {paymentMethod === 'Manual' && businessSettings.customPaymentLink && (
                      <div className="text-slate-300 col-span-2">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">Payment Details / Link</span>
                        <span className="font-mono text-slate-200 font-semibold break-all truncate block max-w-md">{businessSettings.customPaymentLink}</span>
                      </div>
                    )}
                    
                    <div className="text-slate-300">
                      <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">Due Amount</span>
                      <span className="font-extrabold text-sm text-teal-300">
                        {formatCurrency(dueAmount, currencySymbol)}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500">Invoice Number</span>
                      <span className="font-semibold text-slate-200">{invoice.invoiceNumber}</span>
                    </div>
                  </div>

                  {businessSettings.paymentNote && (
                    <div className="border-t border-white/10 pt-2.5 mt-1.5">
                      <p className="text-[10px] text-slate-400 italic">
                        Note: {businessSettings.paymentNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 5. BRAND FOOTER SIGNATURE */}
      <div className="flex justify-center items-center gap-1.5 border-t border-slate-100/80 dark:border-slate-800/80 pt-8 mt-8 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        <span>Generated Securely via BillQyro Invoicing SaaS</span>
      </div>
    </div>
  );
};

export default InvoicePreview;

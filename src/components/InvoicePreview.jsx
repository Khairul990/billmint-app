import React from 'react';
import DynamicQRCode from './DynamicQRCode';
import { formatCurrency } from '../utils/invoiceUtils';
import { getInvoiceColumns, getItemValue } from '../utils/invoiceSchema';
import { ShieldCheck, Calendar, Hash, FileText, Phone, Mail, Globe, MapPin, Building2, Receipt, CheckCircle2, Zap, Scissors, Briefcase, QrCode } from 'lucide-react';
import { getCategoryWording } from '../config/businessPresets';
import { getTemplateLayoutFamily } from '../services/TemplateEngine';
import { buildCanonicalRenderModel } from '../utils/normalizeInvoiceModel';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * High-fidelity Printable Invoice Letterhead Layout
 * @param {Object} invoice - Invoice object
 * @param {Object} businessSettings - Company's active profile settings
 */
const InvoicePreview = ({ invoice, businessSettings, isLiveLink = false }) => {
  const {
    templateId,
    isDarkTheme,
    businessPrefs,
    regionalPrefs,
    paymentPrefs,
    bankDetails,
    currencySymbol,
    categoryWords,
    financials
  } = buildCanonicalRenderModel(invoice, businessSettings, businessSettings?.selectedPdfTemplate);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-theme-accent-light text-theme-primary border-theme-border-soft dark:bg-theme-accent-light/20 dark:text-theme-accent dark:border-theme-accent/30';
      case 'Pending':
      case 'Partially Paid':
        return 'bg-theme-warning/5 text-amber-800 border-theme-warning/30 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Unpaid':
      default:
        return 'bg-theme-danger/5 text-rose-800 border-theme-danger/30 dark:bg-rose-950/20 dark:text-theme-danger dark:border-rose-900/30';
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
      className={`bg-theme-card dark:bg-theme-card border ${templateId === 'minimal' ? 'border-black rounded-none shadow-none' : templateId === 'classic-elegant' ? 'border-emerald-800 rounded-none shadow-md' : 'border-theme-border-soft dark:border-theme-border-soft rounded-3xl shadow-premium'} p-6 md:p-10 max-w-4xl mx-auto text-theme-primary dark:text-theme-primary transition-all duration-300 relative overflow-hidden`}
      style={{ fontFamily: (templateId === 'classic-elegant' || templateId === 'premium-gold') ? "'Georgia', serif" : "'Inter', sans-serif" }}
    >

      {/* 1. BRAND HEADER & METADATA GRID */}
      <div className={`flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8 ${templateId === 'modern' ? 'bg-slate-900 text-slate-200 -mx-6 -mt-6 md:-mx-10 md:-mt-10 p-6 md:p-10 rounded-t-3xl border-slate-800' : templateId === 'gold' ? 'bg-slate-900 text-amber-100 -mx-6 -mt-6 md:-mx-10 md:-mt-10 p-6 md:p-10 rounded-t-3xl border-amber-500/30' : templateId === 'corporate' ? 'border-b-4 border-emerald-800' : templateId === 'minimal' ? 'border-black' : 'border-theme-border-soft dark:border-theme-border-soft'}`}>
        {/* Left Side: Business logo & details */}
        <div>
          <div className="flex items-center gap-3">
            {businessPrefs?.logoUrl ? (
              <img
                src={businessPrefs.logoUrl}
                alt="Business Logo"
                className={`w-12 h-12 object-cover shadow-sm bg-theme-app dark:bg-theme-surface border ${templateId === 'minimal' ? 'rounded-none border-black' : 'rounded-xl border-theme-border-soft dark:border-theme-border-soft'}`}
              />
            ) : (
              <div className={`w-12 h-12 bg-gradient-to-tr from-theme-accent to-theme-accent-dark flex items-center justify-center text-white font-extrabold text-lg ${templateId === 'minimal' ? 'rounded-none' : 'rounded-xl'}`}>
                {businessPrefs?.businessName?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <h3 className={`font-extrabold text-xl tracking-tight ${templateId === 'modern' ? 'text-white' : templateId === 'gold' ? 'text-amber-400' : templateId === 'corporate' ? 'text-emerald-900' : 'text-theme-primary dark:text-theme-primary'}`}>{businessPrefs?.businessName || 'BillQyro Client'}</h3>
              {businessPrefs?.gstNumber && (
                <p className="text-xs text-theme-muted dark:text-theme-muted font-semibold uppercase tracking-wider mt-0.5">{regionalPrefs.taxLabel || 'GST'}: {businessPrefs.gstNumber}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 space-y-1 text-xs text-theme-muted dark:text-theme-muted font-medium max-w-sm leading-relaxed">
            <p>{businessPrefs?.address || 'Company Address Not Set'}</p>
            <p>Phone: {businessPrefs?.phone}</p>
            <p>Email: {businessPrefs?.email}</p>
          </div>
        </div>

        {/* Right Side: Invoice Info */}
        <div className="flex flex-col items-start md:items-end justify-start md:text-right gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusBadgeStyle(invoice.paymentStatus)}`}>
              {invoice.paymentStatus}
            </span>
          </div>
          
          <div className="space-y-1 text-xs font-semibold text-theme-muted dark:text-theme-muted">
            <div className="flex flex-col md:items-end gap-1.5">
              <div className="flex items-center gap-1.5 justify-start md:justify-end text-theme-primary dark:text-theme-secondary text-sm">
                <Hash className="w-3.5 h-3.5 text-theme-accent" />
                <span>Invoice: <strong className="font-extrabold">{invoice.invoiceNumber}</strong></span>
              </div>
              {templateId === 'retail' && (
                <div className="px-3 py-1 bg-white border border-slate-200 rounded text-center text-slate-800 hidden md:block">
                  <div className="font-mono text-[8px] tracking-[0.3em] font-bold opacity-80 leading-none mb-0.5">||| |||| || |||</div>
                  <div className="text-[7px] uppercase tracking-widest font-black leading-none opacity-50">{invoice.invoiceNumber}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-theme-muted dark:text-theme-muted" />
              <span>Date: {invoice.date}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-start md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-theme-muted dark:text-theme-muted" />
              <span className="text-theme-danger dark:text-theme-danger">Due Date: {invoice.dueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLIENT CRM GRID */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-b text-xs ${templateId === 'minimal' ? 'border-black' : templateId === 'corporate' ? 'border-emerald-800/30' : 'border-theme-border-soft dark:border-theme-border-soft'}`}>
        <div>
          <span className="font-bold text-theme-muted dark:text-theme-muted uppercase tracking-wider block mb-2">{templateId === 'teacher' ? 'Student Details' : 'Billed To'}</span>
          <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary dark:text-theme-primary">{invoice.customerName}</h4>
          
          {templateId === 'doctor' && (
            <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-500 rounded-r-md mb-2">
              <p className="font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Patient Details</p>
              <div className="space-y-0.5 text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                <p>Name: {invoice.customerName}</p>
                {invoice.orderNotes && <p>Diagnosis/Ref: {invoice.orderNotes}</p>}
              </div>
            </div>
          )}
          <div className="text-theme-muted dark:text-theme-muted space-y-1 mt-2 max-w-xs leading-relaxed font-medium">
            <p>{invoice.customerAddress || 'No address provided'}</p>
            <p>Phone: {invoice.customerPhone || 'N/A'}</p>
            <p>Email: {invoice.customerEmail || 'N/A'}</p>
          </div>
        </div>
        
        <div className="md:text-right">
          {templateId === 'repair' && invoice.orderNotes ? (
            <>
              <span className="font-bold text-theme-muted dark:text-theme-muted uppercase tracking-wider block mb-2">Device & Job Notes</span>
              <div className="flex md:justify-end">
                <p className="font-medium text-theme-primary leading-relaxed bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/30 text-amber-900 dark:text-amber-200 text-left text-xs max-w-xs w-full">
                  {invoice.orderNotes}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="font-bold text-theme-muted dark:text-theme-muted uppercase tracking-wider block mb-2">Payment Terms</span>
              <p className="font-semibold text-theme-primary dark:text-theme-muted dark:text-theme-muted leading-relaxed">
                Please pay online on or before the due date.<br />
                Amounts are calculated in <strong className="text-theme-accent dark:text-theme-accent font-extrabold">{currencySymbol}</strong>.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 3. ITEM TABLE (DYNAMIC SYNC) */}
      <div className="py-6 overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b text-theme-muted dark:text-theme-muted font-bold uppercase tracking-wider ${templateId === 'classic-elegant' ? 'border-emerald-800 text-emerald-900' : 'border-theme-border-soft dark:border-theme-border-soft'}`}>
              {getInvoiceColumns(invoice, businessSettings).map(col => (
                <th key={col.id} className={`pb-3 px-2 text-${col.align}`} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {invoice.items && invoice.items.map((item, idx) => (
              <tr key={idx} className="text-theme-primary dark:text-theme-muted hover:bg-theme-app dark:bg-theme-surface/50 dark:hover:bg-theme-card/20">
                {getInvoiceColumns(invoice, businessSettings).map(col => {
                  if (col.id === 'sn') return <td key={col.id} className={`py-4 px-2 text-${col.align} text-theme-muted font-bold`}>{idx + 1}</td>;
                  
                  const val = getItemValue(item, col.id, invoice.billType);
                  
                  // Primary Column 1 gets slightly richer UI in preview
                  if (col.id === 'item') {
                    return (
                      <td key={col.id} className={`py-4 px-2 font-semibold text-theme-primary dark:text-theme-primary dark:text-theme-secondary text-${col.align}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {item.designNo && item.designNo !== 'N/A' && (
                            <span className="inline-block px-2 py-0.5 bg-theme-accent-light dark:bg-theme-accent-light text-theme-accent dark:text-theme-accent rounded text-[9px] font-black tracking-wider uppercase border border-theme-border-soft/10">
                              {item.designNo}
                            </span>
                          )}
                          {item.workType && (
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${(templateId === 'embroidery' || templateId === 'tailor') ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200 dark:border-pink-800' : 'bg-theme-surface dark:bg-theme-card text-theme-muted dark:text-theme-muted'}`}>
                              {item.workType}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-semibold">{val}</span>
                        {item.size && item.size !== 'N/A' && (
                          <span className={`block text-[10px] font-medium mt-0.5 ${(templateId === 'embroidery' || templateId === 'tailor') ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-sm inline-block' : 'text-theme-muted dark:text-theme-muted'}`}>Size: {item.size}</span>
                        )}
                      </td>
                    );
                  }
                  
                  if (col.id === 'qty') {
                    return (
                      <td key={col.id} className={`py-4 px-2 text-${col.align} font-bold text-theme-muted dark:text-theme-muted`}>
                        {val}
                        {item.unit && <span className="text-[10px] ml-1 uppercase">{item.unit}</span>}
                      </td>
                    );
                  }
                  
                  if (col.id === 'amount' || col.id === 'rate' || col.id === 'discount' || col.id === 'tax') {
                    return (
                      <td key={col.id} className={`py-4 px-2 text-${col.align} ${col.id === 'amount' ? 'font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-primary' : col.id === 'discount' && val > 0 ? 'text-theme-danger dark:text-theme-danger font-semibold' : 'font-semibold text-theme-muted dark:text-theme-muted'}`}>
                        {col.id === 'discount' && val > 0 ? '-' : ''}{formatCurrency(val, currencySymbol, regionalPrefs.numberFormat)}
                      </td>
                    );
                  }
                  
                  return (
                    <td key={col.id} className={`py-4 px-2 text-${col.align} text-theme-muted dark:text-theme-muted font-medium`}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
            {(!invoice.items || invoice.items.length === 0) && (
              <tr>
                <td colSpan="10" className="py-6 text-center text-theme-muted dark:text-theme-muted font-semibold">
                  No items listed on this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS SUM BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-theme-border-soft dark:border-theme-border-soft pt-6">
        {/* Invoice Notes */}
        <div className="flex-1 max-w-sm">
          {invoice.notes && (
            <>
              <span className="font-bold text-theme-muted dark:text-theme-muted uppercase tracking-wider block text-[10px] mb-1.5">{categoryWords.noteLabel}</span>
              <p className="text-xs text-theme-muted dark:text-theme-muted font-medium leading-relaxed bg-theme-app dark:bg-theme-surface/50 dark:bg-theme-app/20 rounded-2xl p-4 border border-theme-border-soft dark:border-theme-border-soft/50 dark:border-theme-border-soft/40 italic">
                "{invoice.notes}"
              </p>
            </>
          )}
        </div>

        {/* Math summary */}
        <div className="w-full sm:w-72 space-y-2 text-xs font-semibold text-theme-muted dark:text-theme-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-bold tabular-nums">{formatCurrency(financials.subtotal, currencySymbol, regionalPrefs.numberFormat)}</span>
          </div>
          {(businessSettings?.invoiceBuilderSettings?.showDiscount !== false) && financials.discountAmount > 0 && (
            <div className="flex justify-between text-theme-danger dark:text-rose-450 font-bold">
              <span>Discount</span>
              <span className="tabular-nums">-{formatCurrency(financials.discountAmount, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}
          {(businessSettings?.invoiceBuilderSettings?.showTax !== false) && financials.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>{regionalPrefs.taxLabel || 'Tax'} ({invoice.taxPercentage || 0}%)</span>
              <span className="text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-bold tabular-nums">{formatCurrency(financials.taxAmount, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}
          {(businessSettings?.invoiceBuilderSettings?.showShipping) && financials.shipping > 0 && (
            <div className="flex justify-between text-theme-primary dark:text-theme-secondary font-bold">
              <span>Shipping</span>
              <span className="tabular-nums">{formatCurrency(financials.shipping, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}
          {(financials.previousDue > 0 || financials.amountPaid > 0) && (
            <div className={`flex justify-between items-center border-t pt-2 text-theme-primary dark:text-theme-secondary font-bold ${templateId === 'classic-elegant' ? 'border-emerald-800/30' : 'border-theme-border-soft'}`}>
              <span>Current Invoice</span>
              <span className="font-extrabold tabular-nums">{formatCurrency(financials.currentInvoiceTotal, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}

          {((businessSettings?.invoiceBuilderSettings?.showOldDue) || financials.previousDue > 0) && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
              <span>Previous / Old Due</span>
              <span className="tabular-nums">+{formatCurrency(financials.previousDue, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}

          {((businessSettings?.invoiceBuilderSettings?.showOldDue) || financials.previousDue > 0) && (
            <div className="flex justify-between items-center text-theme-primary dark:text-theme-primary font-bold text-xs pt-1 border-t border-dashed border-theme-border-soft">
              <span>Total Receivable</span>
              <span className="font-black tabular-nums">{formatCurrency(financials.totalReceivable, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}

          {financials.amountPaid > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Amount Paid</span>
              <span className="tabular-nums">-{formatCurrency(financials.amountPaid, currencySymbol, regionalPrefs.numberFormat)}</span>
            </div>
          )}
          
          <div className={`flex justify-between items-center border-t pt-3 text-theme-primary dark:text-theme-primary ${templateId === 'classic-elegant' ? 'border-emerald-800/50' : 'border-theme-border-soft dark:border-theme-border-soft'}`}>
            <span className="text-sm font-extrabold text-theme-primary dark:text-theme-secondary">
              {(financials.amountPaid > 0 || financials.previousDue > 0) ? 'Balance Due' : 'Grand Total'}
            </span>
            <span className="text-lg font-black text-theme-accent dark:text-theme-accent tabular-nums">
              {formatCurrency(financials.balanceDue, currencySymbol, regionalPrefs.numberFormat)}
            </span>
          </div>
        </div>
      </div>

      {/* 4.5. PREMIUM PAYMENT QR CARD (CLIENT VIEW) */}
      {paymentPrefs?.paymentQrEnabled && paymentPrefs?.showQrInPreview && (
        (() => {
          const dueAmount = financials.balanceDue > 0 ? financials.balanceDue : financials.totalReceivable;
          const paymentMethod = paymentPrefs.paymentMethod || 'UPI';
          
          let qrText = '';
          if (paymentMethod === 'UPI') {
            const upiId = paymentPrefs.upiId || '';
            const payeeName = paymentPrefs.payeeName || businessPrefs.businessName || '';
            qrText = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${dueAmount}&cu=${regionalPrefs.currencyCode || 'INR'}&tn=${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'bKash') {
            const bkashNumber = paymentPrefs.bkashNumber || '';
            qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'Nagad') {
            const nagadNumber = paymentPrefs.nagadNumber || '';
            qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
          } else if (paymentMethod === 'Manual') {
            qrText = paymentPrefs.customPaymentLink || '';
          }

          if (!qrText) return null;

          return (
            <div className="mt-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-theme-surface to-theme-card text-white shadow-xl relative overflow-hidden border border-theme-border-strong/50 dark:border-theme-border-soft/80">
              {/* Subtle background glow */}
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -top-20 w-60 h-60 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                {/* QR Code Frame */}
                <div className="p-3 bg-theme-card dark:bg-theme-card rounded-2xl shadow-lg border border-white/10 shrink-0 bg-white">
                  <DynamicQRCode value={qrText} size={128} />
                </div>

                {/* Info details */}
                <div className="flex-1 text-center md:text-left space-y-3 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent bg-theme-accent/10 px-2.5 py-1 rounded-full border border-theme-border-soft">
                      Scan to Pay with {paymentMethod}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight mt-2 text-white">
                      {paymentPrefs.payeeName || businessPrefs.businessName || 'Business Payee'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    {paymentMethod === 'UPI' && paymentPrefs.upiId && (
                      <div className="text-theme-muted">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">UPI ID</span>
                        <span className="font-mono text-theme-primary font-semibold break-all">{paymentPrefs.upiId}</span>
                      </div>
                    )}
                    {paymentMethod === 'bKash' && paymentPrefs.bkashNumber && (
                      <div className="text-theme-muted">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">bKash Number</span>
                        <span className="font-mono text-theme-primary font-semibold break-all">{paymentPrefs.bkashNumber}</span>
                      </div>
                    )}
                    {paymentMethod === 'Nagad' && paymentPrefs.nagadNumber && (
                      <div className="text-theme-muted">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">Nagad Number</span>
                        <span className="font-mono text-theme-primary font-semibold break-all">{paymentPrefs.nagadNumber}</span>
                      </div>
                    )}
                    {paymentMethod === 'Manual' && paymentPrefs.customPaymentLink && (
                      <div className="text-theme-muted col-span-2">
                        <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">Payment Details / Link</span>
                        <span className="font-mono text-theme-primary font-semibold break-all truncate block max-w-md">{paymentPrefs.customPaymentLink}</span>
                      </div>
                    )}
                    
                    <div className="text-theme-muted">
                      <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">Due Amount</span>
                      <span className="font-extrabold text-sm text-theme-accent">
                        {formatCurrency(dueAmount, currencySymbol, regionalPrefs.numberFormat)}
                      </span>
                    </div>

                    <div className="text-theme-muted">
                      <span className="font-bold text-[9px] uppercase tracking-wider block text-theme-muted">Invoice Number</span>
                      <span className="font-semibold text-theme-primary">{invoice.invoiceNumber}</span>
                    </div>
                  </div>

                  {paymentPrefs.paymentNote && (
                    <div className="border-t border-white/10 pt-2.5 mt-1.5">
                      <p className="text-[10px] text-theme-muted italic">
                        Note: {paymentPrefs.paymentNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 4.6. BANK DETAILS */}
      {bankDetails && (bankDetails.name || bankDetails.account || bankDetails.ifsc) && (
        <div className="mt-8 p-5 bg-theme-surface/30 dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-2xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted dark:text-theme-muted flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-theme-info" /> Bank & Payment Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {bankDetails.name && (
              <div>
                <span className="block text-[10px] text-theme-muted uppercase tracking-wider font-bold mb-0.5">Bank Name</span>
                <span className="font-semibold text-theme-primary">{bankDetails.name}</span>
              </div>
            )}
            {bankDetails.account && (
              <div>
                <span className="block text-[10px] text-theme-muted uppercase tracking-wider font-bold mb-0.5">Account Number</span>
                <span className="font-mono font-bold text-theme-primary">{bankDetails.account}</span>
              </div>
            )}
            {bankDetails.ifsc && (
              <div>
                <span className="block text-[10px] text-theme-muted uppercase tracking-wider font-bold mb-0.5">IFSC / Routing</span>
                <span className="font-mono font-bold text-theme-primary">{bankDetails.ifsc}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4.7. PAYMENT PROOFS */}
      {invoice.paymentProofs && invoice.paymentProofs.length > 0 && (
        <div className="mt-8 border border-theme-border-soft rounded-2xl p-6 bg-theme-surface/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-theme-accent" /> Payment Proofs
          </h4>
          <div className="flex flex-wrap gap-4">
            {invoice.paymentProofs.map((proof, i) => (
              <a key={i} href={proof.url} target="_blank" rel="noreferrer" className="relative w-24 h-24 rounded-xl border border-theme-border-soft overflow-hidden group shadow-sm hover:shadow-md transition-shadow block">
                <img src={proof.url} alt={`Payment Proof ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-[10px] font-bold">View</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 5. BRAND FOOTER SIGNATURE */}
      {templateId === 'professional' && (
        <div className="mt-8 flex justify-end">
          <div className="text-center w-48">
            <div className="h-16 border-b-2 border-theme-primary dark:border-theme-primary opacity-30 mb-2"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary dark:text-theme-primary">Authorized Signatory</span>
          </div>
        </div>
      )}
      {templateId === 'retail' && (
        <div className="mt-8 text-center text-lg font-black text-theme-primary dark:text-theme-primary italic opacity-50">
          Thank you for shopping with us!
        </div>
      )}
      {templateId === 'doctor' && (
        <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded text-[9px] text-emerald-800 dark:text-emerald-300 font-medium italic">
          Disclaimer: This document is for billing purposes only and does not constitute medical advice or a formal prescription unless explicitly signed by a registered practitioner.
        </div>
      )}

      {/* Live Link Extra Section (Payment) */}
      {isLiveLink && (
        <div className="mt-12 p-6 rounded-2xl border-2 text-center bg-theme-surface/50 border-theme-accent/50 dark:bg-theme-surface dark:border-theme-accent/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 className="text-lg font-black mb-2 text-theme-accent dark:text-theme-accent relative z-10">Secure Payment Gateway</h3>
          <p className="text-sm mb-6 text-theme-muted relative z-10">Please complete your payment below to settle this invoice.</p>
          <button className="px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-transform hover:scale-105 bg-theme-accent hover:bg-theme-accent-dark relative z-10">
            Pay {formatCurrency((invoice.balanceDue !== undefined && invoice.balanceDue !== null && invoice.balanceDue !== 0) ? invoice.balanceDue : invoice.grandTotal, currencySymbol, regionalPrefs.numberFormat)} Now
          </button>
        </div>
      )}

      <div className={`flex justify-center items-center gap-1.5 border-t pt-8 mt-8 text-[10px] text-theme-muted dark:text-theme-muted font-bold uppercase tracking-wider ${templateId === 'minimal' ? 'border-black' : 'border-theme-border-soft dark:border-theme-border-soft/80'}`}>
        <ShieldCheck className="w-4 h-4 text-theme-accent dark:text-theme-accent" />
        <span>Generated Securely via BillQyro Invoicing SaaS</span>
      </div>
    </div>
  );
};

export default InvoicePreview;

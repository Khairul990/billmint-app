import React from 'react';
import { useInvoice } from '../../contexts/InvoiceContext';
import InvoicePreview from '../InvoicePreview';

const LiveInvoicePreview = () => {
  const { state, businessSettings, dispatch } = useInvoice();

  const previewInvoice = {
    invoiceNumber: state.invoiceNumber,
    date: state.date,
    dueDate: state.dueDate,
    customerName: state.customer?.name,
    customerPhone: state.customer?.phone,
    customerEmail: state.customer?.email,
    customerAddress: state.customer?.address,
    items: state.items || [],
    taxPercentage: state.totals?.taxPercentage,
    taxAmount: state.totals?.taxAmount,
    discountAmount: state.totals?.discountAmount,
    grandTotal: state.totals?.grandTotal,
    amountPaid: state.totals?.amountPaid,
    balanceDue: state.totals?.balanceDue,
    subtotal: state.totals?.subtotal,
    notes: state.settings?.notes,
    terms: state.settings?.terms,
    paymentStatus: state.settings?.paymentStatus,
    billType: state.billType,
    orderStatus: state.orderStatus,
    businessSnapshot: businessSettings
  };

  return (
    <div className="bg-theme-surface rounded-3xl border border-theme-border-soft shadow-inner overflow-hidden flex flex-col h-full sticky top-4">
      <div className="bg-theme-card px-4 py-3 border-b border-theme-border-soft flex justify-between items-center shrink-0">
        <span className="text-sm font-bold text-theme-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Preview
        </span>
        <div className="flex items-center gap-2">
          <select
            value={state.selectedTemplate || 'retail'}
            onChange={(e) => dispatch({ type: 'UPDATE_META', payload: { selectedTemplate: e.target.value } })}
            className="text-xs font-bold text-theme-accent bg-theme-accent/10 hover:bg-theme-accent/20 outline-none px-2 py-1.5 rounded-lg border border-theme-accent/20 cursor-pointer appearance-none transition-colors"
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="cartoon">Cartoon</option>
            <option value="professional">Professional</option>
            <option value="gold">Gold</option>
            <option value="doctor">Doctor</option>
            <option value="teacher">Teacher</option>
            <option value="embroidery">Embroidery</option>
            <option value="retail">Retail</option>
          </select>
          <span className="text-xs font-bold text-theme-muted px-2 py-1.5 bg-theme-app rounded-lg border border-theme-border-soft hidden sm:inline-block">A4 Size</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-theme-app dark:bg-theme-card flex justify-center custom-scrollbar">
        <div className="w-full max-w-[800px] origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-90 xl:scale-100 transition-transform">
          <InvoicePreview invoice={previewInvoice} isPreviewMode={true} businessSettings={businessSettings} />
        </div>
      </div>
    </div>
  );
};

export default LiveInvoicePreview;

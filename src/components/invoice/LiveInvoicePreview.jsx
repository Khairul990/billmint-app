import React from 'react';
import { useInvoice } from '../../contexts/InvoiceContext';
import InvoicePreview from '../InvoicePreview';

const LiveInvoicePreview = () => {
  const { state, businessSettings } = useInvoice();

  const previewProps = {
    invoiceNumber: state.invoiceNumber,
    date: state.date,
    dueDate: state.dueDate,
    customerName: state.customer.name,
    customerPhone: state.customer.phone,
    customerEmail: state.customer.email,
    customerAddress: state.customer.address,
    items: state.items,
    taxPercentage: state.totals.taxPercentage,
    taxAmount: state.totals.taxAmount,
    discountAmount: state.totals.discountAmount,
    grandTotal: state.totals.grandTotal,
    amountPaid: state.totals.amountPaid,
    balanceDue: state.totals.balanceDue,
    subtotal: state.totals.subtotal,
    notes: state.settings.notes,
    terms: state.settings.terms,
    paymentStatus: state.settings.paymentStatus,
    billType: state.billType,
    pdfVisibleFields: state.pdfVisibleFields,
    businessSettings: businessSettings
  };

  return (
    <div className="bg-theme-surface rounded-3xl border border-theme-border-soft shadow-inner overflow-hidden flex flex-col h-full sticky top-4">
      <div className="bg-theme-card px-4 py-3 border-b border-theme-border-soft flex justify-between items-center shrink-0">
        <span className="text-sm font-bold text-theme-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Preview
        </span>
        <span className="text-xs font-medium text-theme-muted px-2 py-1 bg-theme-surface rounded-lg border border-theme-border-soft">A4 Size</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-theme-app dark:bg-theme-card flex justify-center custom-scrollbar">
        <div className="w-full max-w-[800px] origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-90 xl:scale-100 transition-transform">
          <InvoicePreview {...previewProps} isPreviewMode={true} />
        </div>
      </div>
    </div>
  );
};

export default LiveInvoicePreview;

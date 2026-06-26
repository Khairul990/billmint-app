import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../../contexts/InvoiceContext';
import { Download, Send, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import InvoicePreview from '../../../InvoicePreview';
import useGeneratePDF from '../../../../hooks/useGeneratePDF';
import { generatePaymentLink } from '../../../../services/paymentLinkService';
import { formatCurrency } from '../../../../utils/invoiceUtils';
import { toast } from 'react-hot-toast';

const PreviewDownloadStep = ({ handleSave }) => {
  const { state, businessSettings, editingInvoice } = useInvoice();
  const { isGenerating, generatePDF } = useGeneratePDF();
  const [isCopying, setIsCopying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [wasGenerating, setWasGenerating] = useState(false);

  useEffect(() => {
    if (isGenerating) {
      setWasGenerating(true);
    } else if (wasGenerating && !isGenerating) {
      setShowSuccessModal(true);
      setWasGenerating(false);
    }
  }, [isGenerating, wasGenerating]);

  const handleDownloadClick = () => {
    // Generate PDF using the hook directly
    generatePDF({
      id: state.id,
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
      orderStatus: state.settings.orderStatus,
      billType: state.billType,
      pdfVisibleFields: state.pdfVisibleFields,
      businessSnapshot: businessSettings,
      paymentSettingsSnapshot: businessSettings,
      regionalSettingsSnapshot: businessSettings
    }, businessSettings);
  };

  const handleCopyLiveLink = async () => {
    const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
    if (!isLiveLinkEnabled) {
      toast.error('Live Link is disabled. Enable it from Settings.');
      return;
    }
    
    // Auto save the invoice as "Pending" before generating link
    handleSave('Pending', true);
    setIsCopying(true);
    
    try {
      const fullInvoiceObject = {
        id: state.id,
        publicToken: state.publicToken || editingInvoice?.publicToken,
        invoiceNumber: state.invoiceNumber,
        date: state.date,
        dueDate: state.dueDate,
        customer: state.customer,
        items: state.items,
        totals: state.totals,
        settings: state.settings,
        billType: state.billType,
        paymentStatus: state.settings.paymentStatus,
        businessSnapshot: businessSettings,
        paymentSettingsSnapshot: businessSettings,
        regionalSettingsSnapshot: businessSettings,
        customerLiveLinkSettings: businessSettings?.customerLiveLinkSettings
      };
      
      const liveLink = await generatePaymentLink(fullInvoiceObject);
      if (!liveLink) {
        toast.error('Could not create Student Portal link. Please try again.');
        setIsCopying(false);
        return;
      }
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(liveLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = liveLink;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Student Portal link copied!');
    } catch (err) {
      toast.error(err.message || 'Could not create Student Portal link.');
      console.error(err);
    } finally {
      setIsCopying(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!state.customer.phone) {
      toast.error('Please enter customer phone number in Step 1.');
      return;
    }
    const cleanPhone = state.customer.phone.replace(/[^0-9+]/g, '');
    const activeCurrency = businessSettings?.currency || '₹';
    const totalStr = formatCurrency(state.totals.grandTotal, activeCurrency, businessSettings?.numberFormat || 'Indian');
    const balanceStr = formatCurrency(state.totals.balanceDue, activeCurrency, businessSettings?.numberFormat || 'Indian');
    
    const msg = `Hello ${state.customer.name || 'Customer'},\n\nHere is your invoice *${state.invoiceNumber}* for ${totalStr}.\nAmount Paid: ${activeCurrency}${state.totals.amountPaid}\nBalance Due: *${balanceStr}*\n\nThank you for your business!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Build the props structure expected by InvoicePreview
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
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left: Actions */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-premium">
            <h2 className="text-xl font-extrabold text-theme-primary mb-1">Finalize & Share</h2>
            <p className="text-sm text-theme-muted font-medium mb-6">Preview your invoice and share it with your client.</p>

            <div className="space-y-3">
              <button
                onClick={handleDownloadClick}
                disabled={isGenerating}
                className="w-full px-4 py-3.5 bg-theme-surface hover:bg-theme-border-soft border border-theme-border-soft rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-theme-primary transition-all shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 text-theme-accent" />}
                {isGenerating ? 'Generating PDF...' : 'Download PDF Document'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="w-full px-4 py-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-[#128C7E] transition-all shadow-sm"
              >
                <Send className="w-5 h-5" />
                Share on WhatsApp
              </button>
              
              <button
                onClick={handleCopyLiveLink}
                disabled={isCopying}
                className="w-full px-4 py-3.5 bg-theme-surface hover:bg-theme-border-soft border border-theme-border-soft rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-theme-primary transition-all shadow-sm"
              >
                {isCopying ? <Loader2 className="w-5 h-5 animate-spin text-theme-muted" /> : <Copy className="w-5 h-5 text-theme-muted" />}
                {isCopying ? 'Generating...' : 'Generate Payment Link'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-theme-border-soft">
              <div className="flex items-center gap-3 mb-4 text-sm font-bold text-theme-primary">
                <CheckCircle2 className="w-5 h-5 text-theme-success" />
                Invoice Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Invoice No:</span>
                  <span className="font-bold text-theme-primary">{state.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Client:</span>
                  <span className="font-bold text-theme-primary truncate max-w-[150px]">{state.customer.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Total Amount:</span>
                  <span className="font-black text-theme-accent">{businessSettings?.currency || '₹'}{state.totals.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-full lg:w-2/3 bg-theme-surface rounded-3xl border border-theme-border-soft shadow-inner overflow-hidden flex flex-col h-[600px] lg:h-full">
          <div className="bg-theme-card px-4 py-3 border-b border-theme-border-soft flex justify-between items-center shrink-0">
            <span className="text-sm font-bold text-theme-primary">Live Preview</span>
            <span className="text-xs font-medium text-theme-muted px-2 py-1 bg-theme-surface rounded-lg">A4 Size</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-theme-app dark:bg-theme-card flex justify-center">
            <div className="w-full max-w-[800px] origin-top scale-[0.6] sm:scale-[0.8] md:scale-90 lg:scale-100 transition-transform">
              <InvoicePreview {...previewProps} isPreviewMode={true} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-theme-card p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-theme-border-soft"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>
              <h2 className="text-3xl font-black text-theme-primary mb-2">সফল!</h2>
              <p className="text-theme-muted text-center font-medium mb-8">আপনার ইনভয়েস সফলভাবে জেনারেট হয়েছে।</p>
              
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  if (handleSave) handleSave('Pending');
                }}
                className="w-full py-4 bg-theme-accent text-white font-black rounded-xl hover:bg-theme-accent/90 transition-all shadow-lg"
              >
                ইনভয়েস দেখুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PreviewDownloadStep;

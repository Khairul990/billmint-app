import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFInvoice } from '../components/PDFInvoice';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

let isDownloadingPDF = false;

/**
 * Generates and downloads a high-quality vector PDF of the invoice using @react-pdf/renderer
 * @param {Object} invoice - Invoice data object
 * @param {Object} businessSettings - Business details configuration
 * @param {boolean} isPremium - Whether premium plan is active
 * @returns {Promise<boolean>} Success indicator
 */
export const downloadInvoicePDF = async (invoice, businessSettings, isPremium) => {
  if (isDownloadingPDF) return false;
  if (!invoice) return false;
  isDownloadingPDF = true;
  try {
    let qrCodeDataUrl = null;
    const upiId = invoice?.businessSnapshot?.upiId || businessSettings?.upiId;
    const enableQr = invoice?.paymentSettingsSnapshot?.paymentQrEnabled ?? businessSettings?.paymentQrEnabled;
    const amountDue = invoice?.balanceDue || 0;
    
    if (enableQr && upiId && amountDue > 0) {
      const businessName = encodeURIComponent(invoice?.businessSnapshot?.businessName || businessSettings?.businessName || 'Business');
      const upiUrl = `upi://pay?pa=${upiId}&pn=${businessName}&am=${amountDue}&cu=INR`;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(upiUrl, { errorCorrectionLevel: 'H', margin: 1, width: 120 });
      } catch (err) {
        console.error('Failed to generate QR code for PDF:', err);
      }
    }

    const doc = React.createElement(PDFInvoice, { invoice, businessSettings, isPremium, qrCodeDataUrl });
    
    // Add a 15-second timeout to prevent silent hangs in case of font or network issues
    const pdfPromise = pdf(doc).toBlob();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("PDF generation timed out (network/font issue)")), 15000)
    );
    const blob = await Promise.race([pdfPromise, timeoutPromise]);
    
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const safeBusinessName = (businessSettings?.businessName || 'Business').replace(/[^a-zA-Z0-9]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    link.download = `Invoice_${invoice.invoiceNumber || '000'}_${safeBusinessName}_${today}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Vector PDF generation failed:', error);
    toast.error(`PDF Error: ${error?.message || error?.toString() || 'Unknown error'}`);
    return false;
  } finally {
    isDownloadingPDF = false;
  }
};


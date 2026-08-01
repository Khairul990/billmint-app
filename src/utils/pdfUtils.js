import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
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

    let safeLogoBase64 = null;
    if (businessSettings?.logoUrl) {
      try {
        // Attempt to fetch and convert the logo to base64 to avoid React-PDF 'Failed to fetch' crashes
        const response = await fetch(businessSettings.logoUrl);
        if (response.ok) {
          const blob = await response.blob();
          safeLogoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      } catch (err) {
        console.warn('Could not fetch logo for PDF (CORS/Network error). Rendering without logo.', err);
      }
    }

    const pageSize = businessSettings?.pdfPageSize || 'A4';
    const doc = React.createElement(PdfDocument, { 
      invoice, 
      businessSettings, 
      qrCodeBase64: qrCodeDataUrl,
      safeLogoBase64,
      pageSize
    });
    
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


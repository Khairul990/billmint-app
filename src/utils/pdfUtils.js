import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFInvoice } from '../components/PDFInvoice';

/**
 * Generates and downloads a high-quality vector PDF of the invoice using @react-pdf/renderer
 * @param {Object} invoice - Invoice data object
 * @param {Object} businessSettings - Business details configuration
 * @param {boolean} isPremium - Whether premium plan is active
 * @returns {Promise<boolean>} Success indicator
 */
export const downloadInvoicePDF = async (invoice, businessSettings, isPremium) => {
  try {
    const doc = React.createElement(PDFInvoice, { invoice, businessSettings, isPremium });
    const blob = await pdf(doc).toBlob();
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
    return false;
  }
};


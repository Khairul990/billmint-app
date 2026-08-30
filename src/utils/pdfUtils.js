import { toast } from 'react-hot-toast';
import {
  getOrGenerateInvoicePdfBlob,
  calculateInvoicePdfHash,
  validatePdfBlob,
  invalidateInvoicePdfCache
} from './pdfCacheEngine.js';
import { prepareInvoicePdf } from '../services/communication/attachmentEngine.js';

export { downloadInvoiceImage } from './invoiceImageExport.js';
export {
  getOrGenerateInvoicePdfBlob,
  getOrGenerateInvoicePdfBlob as generateInvoicePdfBlob,
  calculateInvoicePdfHash,
  validatePdfBlob,
  invalidateInvoicePdfCache,
  prepareInvoicePdf
};

let isDownloadingPdf = false;

const safeFilename = (value) => String(value ?? '000').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || '000';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
};

/**
 * Canonical Browser PDF Download Function.
 * Single entry point for PDF generation across all screens, modals, and portals.
 * Integrates with Immutable PDF Cache ("Generate Once & Reuse").
 */
export const downloadInvoicePDF = async (invoice, businessSettings = {}, isPremium = false) => {
  if (!invoice) return false;
  if (isDownloadingPdf) return false;

  isDownloadingPdf = true;
  const toastId = toast.loading('Preparing PDF...');

  try {
    const blob = await getOrGenerateInvoicePdfBlob(invoice, businessSettings);
    await validatePdfBlob(blob);

    const invNum = safeFilename(invoice?.invoiceNumber || invoice?.number || invoice?.id || '000');
    downloadBlob(blob, `BillQyro-Invoice-${invNum}.pdf`);

    toast.dismiss(toastId);
    toast.success('PDF downloaded');
    return true;
  } catch (error) {
    console.error('[PDF Download Engine] Generation failed:', {
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
      template: invoice?.selectedTemplate || businessSettings?.selectedPdfTemplate,
      error: error?.message
    });
    toast.dismiss(toastId);
    toast.error('PDF could not be generated. Please try again.');
    return false;
  } finally {
    isDownloadingPdf = false;
  }
};

export const downloadStableInvoicePDF = downloadInvoicePDF;
export default downloadInvoicePDF;

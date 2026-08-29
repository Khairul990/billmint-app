import { toast } from 'react-hot-toast';
import { generateInvoicePdfBlob, prepareInvoicePdf } from '../services/communication/attachmentEngine';
export { downloadInvoiceImage } from './invoiceImageExport';
export { generateInvoicePdfBlob, prepareInvoicePdf };

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
 * Validates that the generated blob is a non-empty, authentic PDF document.
 */
export const validatePdfBlob = async (blob) => {
  if (!(blob instanceof Blob) || blob.size < 100) {
    throw new Error('PDF generation produced an invalid or empty file.');
  }
  try {
    const header = await blob.slice(0, 5).text();
    if (header !== '%PDF-') {
      throw new Error('Generated file does not have a valid PDF header.');
    }
  } catch (err) {
    if (err.message.includes('PDF')) throw err;
  }
  return blob;
};

/**
 * Canonical Browser PDF Download Function.
 * Single entry point for PDF generation across all screens, modals, and portals.
 */
export const downloadInvoicePDF = async (invoice, businessSettings = {}, isPremium = false) => {
  if (!invoice) return false;
  if (isDownloadingPdf) return false;

  isDownloadingPdf = true;
  const toastId = toast.loading('Preparing PDF...');

  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings);
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


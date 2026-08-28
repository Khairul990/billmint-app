import { downloadInvoiceImage as downloadExactInvoiceImage } from './stableInvoicePdf';

/**
 * Image export uses the same exact rendered InvoicePreview as PDF export.
 * No second template, PDF round-trip, or separate image renderer is used.
 */
export const downloadInvoiceImage = async (invoice, businessSettings = {}, targetElement = null, format = 'image/png') => {
  return downloadExactInvoiceImage(invoice, businessSettings, targetElement, format);
};

export default downloadInvoiceImage;

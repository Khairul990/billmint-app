import { getTemplateLayoutFamily } from '../services/TemplateEngine';
import { getCategoryWording } from '../config/businessPresets';

/**
 * Normalizes invoice data and business settings into a single canonical render model.
 * This ensures that InvoicePreview (HTML) and PdfDocument (React-PDF) receive identically
 * structured data, preventing rendering mismatches.
 *
 * Fallback Priority:
 * 1. Invoice Snapshot (Immutable historical data)
 * 2. Business Settings (Live workspace data)
 * 3. Hardcoded Defaults
 */
export const buildCanonicalRenderModel = (invoice, businessSettings, previewOverrideTemplateId = null) => {
  if (!invoice) return null;

  // 1. Template Resolution
  // The studio preview might override the template. Otherwise, use the one saved in settings or invoice.
  const rawTemplateId = (previewOverrideTemplateId || businessSettings?.selectedPdfTemplate || invoice.pdfTemplate || 'classic').toLowerCase();
  const templateFamily = getTemplateLayoutFamily(rawTemplateId);
  const templateId = (rawTemplateId === 'repair' || rawTemplateId === 'teacher' || rawTemplateId === 'doctor') 
    ? rawTemplateId 
    : templateFamily;
  
  const isDarkTheme = templateId === 'modern' || templateId === 'gold' || templateId === 'corporate';

  // 2. Business Information Resolution
  const businessPrefs = invoice.businessSnapshot || {
    businessName: businessSettings?.businessName || 'BillQyro Store',
    logoUrl: businessSettings?.logoUrl || '',
    ownerName: businessSettings?.ownerName || 'Manager',
    phone: businessSettings?.phone || '',
    whatsapp: businessSettings?.whatsapp || '',
    email: businessSettings?.email || '',
    address: businessSettings?.address || '',
    gstNumber: businessSettings?.gstNumber || '',
    currency: businessSettings?.currency || '₹',
    taxLabel: businessSettings?.invoiceBuilderSettings?.taxLabel || businessSettings?.taxLabel || 'GST'
  };

  // 3. Regional Settings
  const regionalPrefs = invoice.regionalSettingsSnapshot || {
    country: businessSettings?.country || 'India',
    currency: businessSettings?.currency || '₹',
    currencyCode: businessSettings?.currencyCode || 'INR',
    language: businessSettings?.language || 'English',
    taxLabel: businessSettings?.invoiceBuilderSettings?.taxLabel || businessSettings?.taxLabel || 'GST',
    dateFormat: businessSettings?.dateFormat || 'DD/MM/YYYY',
    numberFormat: businessSettings?.numberFormat || 'Indian'
  };

  // 4. Payment & QR Code Resolution
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};

  const paymentPrefs = invoice.paymentSettingsSnapshot || {
    paymentQrEnabled: bankDetails?.showQr || businessSettings?.paymentQrEnabled || false,
    paymentMethod: (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || 'Manual',
    upiId: bankDetails?.upiId || businessSettings?.upiId || '',
    bkashNumber: businessSettings?.bkashNumber || '',
    nagadNumber: businessSettings?.nagadNumber || '',
    rocketNumber: businessSettings?.rocketNumber || '',
    payeeName: businessSettings?.payeeName || businessSettings?.businessName || '',
    paymentNote: businessSettings?.paymentNote || '',
    customPaymentLink: businessSettings?.customPaymentLink || '',
    showQrInPreview: businessSettings?.showQrInPreview !== undefined ? businessSettings?.showQrInPreview : true
  };

  const currencySymbol = regionalPrefs.currency || '₹';
  const billType = invoice.billType || 'default';
  const categoryWords = getCategoryWording(billType);

  return {
    rawTemplateId,
    templateId,
    templateFamily,
    isDarkTheme,
    businessPrefs,
    regionalPrefs,
    paymentPrefs,
    bankDetails,
    currencySymbol,
    categoryWords
  };
};

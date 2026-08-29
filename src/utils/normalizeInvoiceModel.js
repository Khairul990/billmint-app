import { getTemplateLayoutFamily } from '../services/TemplateEngine.js';
import { getCategoryWording } from '../config/businessPresets.js';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath.js';

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
  // Priority: 1. Preview override -> 2. Invoice's own selectedTemplate/pdfTemplate -> 3. Global businessSettings -> 4. Default 'classic'
  const rawTemplateId = String(
    previewOverrideTemplateId || 
    invoice.selectedTemplate || 
    invoice.pdfTemplate || 
    businessSettings?.selectedPdfTemplate || 
    businessSettings?.defaultBillingTemplate || 
    businessSettings?.pdfTemplate || 
    'classic'
  ).toLowerCase().trim();
  const templateFamily = getTemplateLayoutFamily(rawTemplateId);
  const templateId = (rawTemplateId === 'repair' || rawTemplateId === 'teacher' || rawTemplateId === 'doctor' || rawTemplateId === 'minimal' || rawTemplateId === 'retail') 
    ? rawTemplateId 
    : (templateFamily || rawTemplateId || 'classic');
  
  const isDarkTheme = templateId === 'modern' || templateId === 'gold' || templateId === 'corporate';

  // 2. Business Information Resolution
  // Prefer live businessSettings so user updates (logo, name) reflect immediately on all previews and PDFs.
  // Fallback to snapshot if live settings are missing.
  const snap = invoice.businessSnapshot || {};
  const businessPrefs = {
    businessName: businessSettings?.businessName || snap.businessName || 'BillQyro Store',
    logoUrl: businessSettings?.logoUrl !== undefined ? businessSettings.logoUrl : snap.logoUrl || '',
    ownerName: businessSettings?.ownerName || snap.ownerName || 'Manager',
    phone: businessSettings?.phone || snap.phone || '',
    whatsapp: businessSettings?.whatsapp || snap.whatsapp || '',
    email: businessSettings?.email || snap.email || '',
    address: businessSettings?.address || snap.address || '',
    gstNumber: businessSettings?.gstNumber || snap.gstNumber || '',
    currency: businessSettings?.currency || snap.currency || '₹',
    taxLabel: businessSettings?.invoiceBuilderSettings?.taxLabel || businessSettings?.taxLabel || snap.taxLabel || 'GST'
  };

  // 3. Regional Settings
  const regSnap = invoice.regionalSettingsSnapshot || {};
  const regionalPrefs = {
    country: businessSettings?.country || regSnap.country || 'India',
    currency: businessSettings?.currency || regSnap.currency || '₹',
    currencyCode: businessSettings?.currencyCode || regSnap.currencyCode || 'INR',
    language: businessSettings?.language || regSnap.language || 'English',
    taxLabel: businessSettings?.invoiceBuilderSettings?.taxLabel || businessSettings?.taxLabel || regSnap.taxLabel || 'GST',
    dateFormat: businessSettings?.dateFormat || regSnap.dateFormat || 'DD/MM/YYYY',
    numberFormat: businessSettings?.numberFormat || regSnap.numberFormat || 'Indian'
  };

  // 4. Payment & QR Code Resolution
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};

  const paySnap = invoice.paymentSettingsSnapshot || {};
  const paymentPrefs = {
    paymentQrEnabled: bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false,
    paymentMethod: (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual',
    upiId: bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '',
    bkashNumber: businessSettings?.bkashNumber || paySnap.bkashNumber || '',
    nagadNumber: businessSettings?.nagadNumber || paySnap.nagadNumber || '',
    rocketNumber: businessSettings?.rocketNumber || paySnap.rocketNumber || '',
    payeeName: businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '',
    paymentNote: businessSettings?.paymentNote || paySnap.paymentNote || '',
    customPaymentLink: businessSettings?.customPaymentLink || paySnap.customPaymentLink || '',
    showQrInPreview: businessSettings?.showQrInPreview !== undefined ? businessSettings.showQrInPreview : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true)
  };

  const currencySymbol = regionalPrefs.currency || '₹';
  const billType = invoice.billType || 'default';
  const categoryWords = getCategoryWording(billType);

  // 5. Canonical Financial Calculation
  const financials = calculateCanonicalInvoiceFinancials(invoice);

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
    categoryWords,
    financials
  };
};

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

let generating = false;
const PDF_TIMEOUT_MS = 45000;
const LOGO_TIMEOUT_MS = 2000;

const clean = (value, fallback = '') => {
  if (value == null) return fallback;
  return String(value).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim() || fallback;
};

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`PDF generation timed out after ${ms / 1000}s`)), ms))
]);

const fetchLogoSafely = async (logoUrl) => {
  if (!logoUrl || typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGO_TIMEOUT_MS);
  try {
    const response = await fetch(logoUrl, { signal: controller.signal });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const normalizeInvoiceForTemplate = (invoice, businessSettings = {}) => {
  const items = Array.isArray(invoice?.items) ? invoice.items.map((item, index) => ({
    ...item,
    name: item?.name || item?.description || item?.itemService || item?.title || `Item ${index + 1}`,
    qty: Number(item?.qty ?? item?.quantity ?? 1) || 0,
    rate: Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0,
    amount: Number(item?.amount ?? item?.total ?? ((Number(item?.qty ?? item?.quantity ?? 1) || 0) * (Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0))) || 0,
  })) : [];

  return {
    ...invoice,
    selectedTemplate: invoice?.selectedTemplate || invoice?.pdfTemplate || businessSettings?.selectedPdfTemplate || businessSettings?.defaultBillingTemplate || 'classic',
    invoiceColumns: invoice?.invoiceColumns || businessSettings?.invoiceColumns || [],
    customerName: invoice?.customerName || invoice?.customer?.name || invoice?.client?.name || 'Walk-in Customer',
    customerPhone: invoice?.customerPhone || invoice?.customer?.phone || invoice?.client?.phone || '',
    customerEmail: invoice?.customerEmail || invoice?.customer?.email || invoice?.client?.email || '',
    customerAddress: invoice?.customerAddress || invoice?.customer?.address || invoice?.client?.address || '',
    items,
  };
};

const buildPaymentQr = async (invoice, businessSettings) => {
  const builder = businessSettings?.invoiceBuilderSettings || {};
  const bank = builder?.bankDetails || {};
  const snapshot = invoice?.paymentSettingsSnapshot || {};
  const enabled = bank?.showQr ?? businessSettings?.paymentQrEnabled ?? snapshot?.paymentQrEnabled ?? false;
  const show = businessSettings?.showQrInPreview ?? snapshot?.showQrInPreview ?? true;
  const upiId = bank?.upiId || businessSettings?.upiId || snapshot?.upiId || '';
  const amount = Number(invoice?.balanceDue ?? invoice?.totals?.balanceDue ?? 0) || 0;
  if (!enabled || !show || !upiId || amount <= 0) return null;
  try {
    const currency = businessSettings?.currencyCode || 'INR';
    const payee = businessSettings?.payeeName || businessSettings?.businessName || '';
    const text = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(invoice?.invoiceNumber || '')}`;
    return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', margin: 1, width: 180 });
  } catch {
    return null;
  }
};

export const generateInvoicePdfBlob = async (invoice, businessSettings = {}) => {
  if (!invoice) throw new Error('Invoice data is missing.');

  const normalizedInvoice = normalizeInvoiceForTemplate(invoice, businessSettings);
  const [safeLogoBase64, qrCodeBase64] = await Promise.all([
    fetchLogoSafely(businessSettings?.logoUrl),
    buildPaymentQr(normalizedInvoice, businessSettings),
  ]);

  const doc = React.createElement(PdfDocument, {
    invoice: normalizedInvoice,
    businessSettings: {
      ...businessSettings,
      selectedPdfTemplate: normalizedInvoice.selectedTemplate,
    },
    qrCodeBase64,
    safeLogoBase64,
    pageSize: businessSettings?.pdfPageSize || 'A4',
  });

  return withTimeout(pdf(doc).toBlob(), PDF_TIMEOUT_MS);
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}) => {
  if (!invoice || generating) return false;
  generating = true;
  const toastId = toast.loading('Generating your template PDF...');
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings);
    const url = URL.createObjectURL(blob);
    const number = clean(invoice?.invoiceNumber || '000').replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.dismiss(toastId);
    toast.success('Template PDF downloaded successfully');
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('Template PDF generation failed:', error);
    toast.error(error?.message || 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    return false;
  } finally {
    generating = false;
  }
};

export default downloadStableInvoicePDF;

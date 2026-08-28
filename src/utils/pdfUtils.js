import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath';

// Prevent duplicate concurrent generation requests.
let isDownloadingPDF = false;
let isDownloadingImage = false;

const IMAGE_BASE_SCALE = 3;
const MAX_CANVAS_AREA = 25000000;
const MAX_CANVAS_SIDE = 16384;
const LOGO_FETCH_TIMEOUT_MS = 2500;
const PDF_GENERATION_TIMEOUT_MS = 30000;
const LARGE_INVOICE_ITEM_THRESHOLD = 10;

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

const sanitizePdfValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/₹/g, 'Rs. ').replace(/৳/g, 'Tk. ').replace(emojiRegex, '');
  }
  if (Array.isArray(value)) return value.map(sanitizePdfValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePdfValue(item)]));
  }
  return value;
};

const createPdfDocument = (invoice, businessSettings, qrCodeBase64, safeLogoBase64, pageSize, forceSafeLayout = false) => {
  const safeInvoice = sanitizePdfValue(invoice);
  const safeSettings = forceSafeLayout
    ? { ...businessSettings, selectedPdfTemplate: null }
    : businessSettings;

  // Large/custom invoices are rendered through the stable canonical layout.
  // This avoids React-PDF pagination deadlocks in some highly dynamic templates.
  if (forceSafeLayout) {
    safeInvoice.selectedTemplate = null;
    safeInvoice.templateId = null;
  }

  return React.createElement(PdfDocument, {
    invoice: safeInvoice,
    businessSettings: safeSettings,
    qrCodeBase64: qrCodeBase64,
    safeLogoBase64,
    pageSize
  });
};

const fetchLogoSafely = async (logoUrl) => {
  if (!logoUrl) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);
    const response = await fetch(logoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const blob = await response.blob();
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;

    return await new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch (error) {
    console.warn('Could not fetch logo for PDF; continuing without logo.', error);
    return null;
  }
};

const withTimeout = (promise, timeoutMs) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`PDF generation exceeded ${timeoutMs / 1000} seconds.`)), timeoutMs);
  })
]);

const buildInvoicePdfBlob = async (invoice, businessSettings) => {
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};
  const paySnap = invoice?.paymentSettingsSnapshot || {};

  const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
  const showQrInPreview = businessSettings?.showQrInPreview !== undefined
    ? businessSettings.showQrInPreview
    : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
  const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual';
  const upiId = bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '';
  const bkashNumber = businessSettings?.bkashNumber || paySnap.bkashNumber || '';
  const nagadNumber = businessSettings?.nagadNumber || paySnap.nagadNumber || '';
  const payeeName = businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '';
  const currencyCode = businessSettings?.currencyCode || invoice?.regionalSettingsSnapshot?.currencyCode || 'INR';

  let qrCodeDataUrl = null;
  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  const amountDue = canonical.balanceDue > 0 ? canonical.balanceDue : 0;
  const enableQr = paymentQrEnabled && showQrInPreview;

  if (enableQr && amountDue > 0) {
    let qrText;
    if (paymentMethod === 'UPI') {
      qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amountDue}&cu=${currencyCode}&tn=${invoice?.invoiceNumber || ''}`;
    } else if (paymentMethod === 'bKash') {
      qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${amountDue}\nInvoice: ${invoice?.invoiceNumber || ''}`;
    } else if (paymentMethod === 'Nagad') {
      qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${amountDue}\nInvoice: ${invoice?.invoiceNumber || ''}`;
    } else {
      qrText = `${window.location.origin}/invoice/${invoice?.publicToken || invoice?.id || ''}`;
    }

    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H', margin: 1, width: 150 });
    } catch (err) {
      console.warn('Failed to generate QR code for PDF:', err);
    }
  }

  const safeLogoBase64 = await fetchLogoSafely(businessSettings?.logoUrl);
  const pageSize = businessSettings?.pdfPageSize || 'A4';
  const itemCount = Array.isArray(invoice?.items) ? invoice.items.length : 0;
  const hasDynamicTemplate = Boolean(invoice?.selectedTemplate || businessSettings?.selectedPdfTemplate);
  const forceSafeLayout = itemCount > LARGE_INVOICE_ITEM_THRESHOLD && hasDynamicTemplate;

  const hasBuffer = typeof Buffer !== 'undefined'
    || (typeof window !== 'undefined' && window.Buffer)
    || (typeof globalThis !== 'undefined' && globalThis.Buffer);
  if (!hasBuffer) {
    throw new Error('Fatal: Node.js polyfills (Buffer) are missing. Please force-refresh the PWA after deployment.');
  }

  const doc = createPdfDocument(invoice, businessSettings, qrCodeDataUrl, safeLogoBase64, pageSize, forceSafeLayout);
  return withTimeout(pdf(doc).toBlob(), PDF_GENERATION_TIMEOUT_MS);
};

const renderPdfPagesToSinglePng = async (arrayBuffer) => {
  const pdfjs = await import('pdfjs-dist/build/pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  try {
    const numPages = pdfDoc.numPages;
    if (!numPages) throw new Error('PDF has no pages');

    const pageSizes = [];
    let maxWidth = 0;
    let totalHeight = 0;
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pageSizes.push({ page, width: viewport.width, height: viewport.height });
      maxWidth = Math.max(maxWidth, viewport.width);
      totalHeight += viewport.height;
    }

    let scale = IMAGE_BASE_SCALE;
    scale = Math.min(scale, Math.sqrt(MAX_CANVAS_AREA / (maxWidth * totalHeight)));
    scale = Math.min(scale, MAX_CANVAS_SIDE / totalHeight);
    scale = Math.min(scale, MAX_CANVAS_SIDE / maxWidth);

    const canvasWidth = Math.ceil(maxWidth * scale);
    const canvasHeight = Math.ceil(totalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let y = 0;
    for (const { page } of pageSizes) {
      const viewport = page.getViewport({ scale });
      const pageHeight = Math.floor(viewport.height);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = Math.floor(viewport.width);
      pageCanvas.height = pageHeight;
      await page.render({
        canvasContext: pageCanvas.getContext('2d', { alpha: false }),
        viewport,
      }).promise;
      ctx.drawImage(pageCanvas, 0, y);
      y += pageHeight;
      pageCanvas.width = 0;
      pageCanvas.height = 0;
    }

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png');
    });
  } finally {
    if (typeof loadingTask.destroy === 'function') {
      try { await loadingTask.destroy(); } catch (err) { console.warn('PDF task cleanup failed:', err); }
    }
  }
};

export const downloadInvoicePDF = async (invoice, businessSettings, isPremium) => {
  if (isDownloadingPDF || !invoice) return false;
  isDownloadingPDF = true;
  const toastId = toast.loading('Generating your PDF... please wait');
  try {
    const blob = await buildInvoicePdfBlob(invoice, businessSettings);
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
    toast.dismiss(toastId);
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('Vector PDF generation failed:', error);
    toast.error(`PDF Error: ${error?.message || error?.toString() || 'Unknown error'}`);
    return false;
  } finally {
    isDownloadingPDF = false;
  }
};

export const downloadInvoiceImage = async (invoice, businessSettings) => {
  if (isDownloadingImage || !invoice) return false;
  isDownloadingImage = true;
  try {
    const blob = await buildInvoicePdfBlob(invoice, businessSettings);
    const pngBlob = await renderPdfPagesToSinglePng(await blob.arrayBuffer());
    const url = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = url;
    const safeInvoiceNumber = (invoice.invoiceNumber || '000').replace(/[\\/:*?"<>|]+/g, '_');
    link.download = `BillQyro-Invoice-${safeInvoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Invoice image generation failed:', error);
    toast.error(`Image Error: ${error?.message || error?.toString() || 'Unknown error'}`);
    return false;
  } finally {
    isDownloadingImage = false;
  }
};

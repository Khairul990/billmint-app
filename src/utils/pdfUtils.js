import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath';

let isDownloadingPDF = false;
let isDownloadingImage = false;

const IMAGE_BASE_SCALE = 3;
const MAX_CANVAS_AREA = 25000000;
const MAX_CANVAS_SIDE = 16384;
const LOGO_FETCH_TIMEOUT_MS = 1500;
const PDF_GENERATION_TIMEOUT_MS = 20000;
const LARGE_INVOICE_ITEM_THRESHOLD = 10;

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

const sanitizePdfValue = (value) => {
  if (typeof value === 'string') return value.replace(/₹/g, 'Rs. ').replace(/৳/g, 'Tk. ').replace(emojiRegex, '');
  if (Array.isArray(value)) return value.map(sanitizePdfValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePdfValue(item)]));
  return value;
};

const withTimeout = (promise, timeoutMs) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`PDF generation exceeded ${timeoutMs / 1000} seconds.`)), timeoutMs)),
]);

const fetchLogoSafely = async (logoUrl) => {
  if (!logoUrl) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);
    const response = await fetch(logoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
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
  }
};

const safeText = (value, fallback = '-') => {
  const text = sanitizePdfValue(value == null ? fallback : String(value));
  return text || fallback;
};

const safeMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

// React-PDF can stall indefinitely on some data-heavy browser renders. For
// large invoices we use a tiny deterministic PDF writer instead. It has no
// fonts/images/plugins to resolve, so it cannot hang on template pagination.
const pdfEscape = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

const wrapPdfText = (value, maxChars = 92) => {
  const text = pdfEscape(value);
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + (line ? ' ' : '') + word).length <= maxChars) {
      line += (line ? ' ' : '') + word;
    } else {
      if (line) lines.push(line);
      line = word.slice(0, maxChars);
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

const buildRawPdf = (pages) => {
  const objects = [];
  const addObject = (body) => { objects.push(body); return objects.length; };
  const pageIds = [];
  const contentIds = [];
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pagesId = addObject('');

  pages.forEach((lines) => {
    const commands = ['BT', '/F1 9 Tf', '40 800 Td', '12 TL'];
    lines.forEach((line, index) => {
      if (index > 0) commands.push('T*');
      commands.push(`(${pdfEscape(line)}) Tj`);
    });
    commands.push('ET');
    const contentId = addObject(`<< /Length ${commands.join('\n').length} >>\nstream\n${commands.join('\n')}\nendstream`);
    contentIds.push(contentId);
    pageIds.push(addObject(''));
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  pageIds.forEach((id, index) => {
    objects[id - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let output = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets[index + 1] = output.length;
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([output], { type: 'application/pdf' });
};

const buildLargeInvoiceRawPdf = (invoice, businessSettings) => {
  const financials = calculateCanonicalInvoiceFinancials(invoice || {});
  const settings = businessSettings || {};
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const currency = safeText(settings?.currencySymbol || invoice?.currencySymbol || 'Rs. ');
  const businessName = safeText(settings?.businessName || 'BillQyro Business');
  const customer = invoice?.customer || invoice?.client || {};
  const customerName = safeText(customer?.name || invoice?.customerName || 'Customer');
  const number = safeText(invoice?.invoiceNumber || '000');
  const date = safeText(invoice?.date || invoice?.createdAt || '');
  const status = safeText(financials.status || invoice?.status || 'Pending');

  const allLines = [];
  allLines.push(`BillQyro - INVOICE #${number}`);
  allLines.push(businessName);
  if (settings?.address) allLines.push(safeText(settings.address));
  if (settings?.phone) allLines.push(`Phone: ${safeText(settings.phone)}`);
  allLines.push('');
  allLines.push(`Bill To: ${customerName}`);
  if (customer?.phone) allLines.push(`Phone: ${safeText(customer.phone)}`);
  allLines.push(`Date: ${date}    Status: ${status}`);
  allLines.push('');
  allLines.push('DESCRIPTION                         QTY        RATE        AMOUNT');
  allLines.push('--------------------------------------------------------------------------');

  items.forEach((item, index) => {
    const qty = Number(item?.quantity ?? item?.qty ?? 1) || 0;
    const rate = Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0;
    const amount = Number(item?.amount ?? item?.total ?? qty * rate) || 0;
    const description = safeText(item?.description || item?.name || `Item ${index + 1}`);
    const wrapped = wrapPdfText(description, 34);
    wrapped.forEach((line, lineIndex) => {
      if (lineIndex === 0) allLines.push(`${line.padEnd(34)} ${String(qty).padStart(8)} ${currency}${safeMoney(rate).padStart(10)} ${currency}${safeMoney(amount).padStart(11)}`);
      else allLines.push(`  ${line}`);
    });
  });

  allLines.push('');
  allLines.push(`Subtotal: ${currency}${safeMoney(financials.subtotal)}`);
  allLines.push(`Discount: -${currency}${safeMoney(financials.discount)}`);
  allLines.push(`Tax: ${currency}${safeMoney(financials.tax)}`);
  allLines.push(`GRAND TOTAL: ${currency}${safeMoney(financials.grandTotal)}`);
  allLines.push(`PAID: ${currency}${safeMoney(financials.totalPaid)}`);
  allLines.push(`BALANCE DUE: ${currency}${safeMoney(financials.balanceDue)}`);
  if (invoice?.paymentMethod) allLines.push(`Payment Method: ${safeText(invoice.paymentMethod)}`);
  if (invoice?.paymentNote) allLines.push(`Payment Note: ${safeText(invoice.paymentNote)}`);
  allLines.push('');
  allLines.push('Generated by BillQyro - Smart Billing. Premium Invoicing Platform');

  const pages = [];
  const linesPerPage = 58;
  for (let i = 0; i < allLines.length; i += linesPerPage) pages.push(allLines.slice(i, i + linesPerPage));
  return buildRawPdf(pages.length ? pages : [['BillQyro Invoice']]);
};

const buildInvoicePdfBlob = async (invoice, businessSettings) => {
  const itemCount = Array.isArray(invoice?.items) ? invoice.items.length : 0;

  // Critical fix: large invoices no longer enter React-PDF at all.
  // This removes the browser-side 30/45 second rendering stall entirely.
  if (itemCount > LARGE_INVOICE_ITEM_THRESHOLD) {
    return buildLargeInvoiceRawPdf(invoice, businessSettings);
  }

  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};
  const paySnap = invoice?.paymentSettingsSnapshot || {};
  const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
  const showQrInPreview = businessSettings?.showQrInPreview !== undefined ? businessSettings.showQrInPreview : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
  const upiId = bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '';
  const payeeName = businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '';
  const currencyCode = businessSettings?.currencyCode || invoice?.regionalSettingsSnapshot?.currencyCode || 'INR';
  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  const amountDue = canonical.balanceDue > 0 ? canonical.balanceDue : 0;
  let qrCodeDataUrl = null;

  if (paymentQrEnabled && showQrInPreview && amountDue > 0 && upiId) {
    try {
      const qrText = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountDue}&cu=${currencyCode}&tn=${encodeURIComponent(invoice?.invoiceNumber || '')}`;
      qrCodeDataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H', margin: 1, width: 150 });
    } catch { /* optional */ }
  }

  const safeLogoBase64 = await fetchLogoSafely(businessSettings?.logoUrl);
  const pageSize = businessSettings?.pdfPageSize || 'A4';
  const doc = React.createElement(PdfDocument, { invoice, businessSettings, qrCodeBase64: qrCodeDataUrl, safeLogoBase64, pageSize });
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
    for (let i = 1; i <= numPages; i += 1) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pageSizes.push({ page, width: viewport.width, height: viewport.height });
      maxWidth = Math.max(maxWidth, viewport.width);
      totalHeight += viewport.height;
    }
    const scale = Math.min(IMAGE_BASE_SCALE, Math.sqrt(MAX_CANVAS_AREA / (maxWidth * totalHeight)), MAX_CANVAS_SIDE / totalHeight, MAX_CANVAS_SIDE / maxWidth);
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
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = Math.floor(viewport.width);
      pageCanvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: pageCanvas.getContext('2d', { alpha: false }), viewport }).promise;
      ctx.drawImage(pageCanvas, 0, y);
      y += pageCanvas.height;
      pageCanvas.width = 0;
      pageCanvas.height = 0;
    }
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'));
  } finally {
    if (typeof loadingTask.destroy === 'function') {
      try { await loadingTask.destroy(); } catch { /* cleanup */ }
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.dismiss(toastId);
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('PDF generation failed:', error);
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error('Invoice image generation failed:', error);
    toast.error(`Image Error: ${error?.message || error?.toString() || 'Unknown error'}`);
    return false;
  } finally {
    isDownloadingImage = false;
  }
};
import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
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
const PDF_GENERATION_TIMEOUT_MS = 30000;
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

const safePdfStyles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937', lineHeight: 1.35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  business: { fontSize: 17, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#111827' },
  muted: { fontSize: 8, color: '#6b7280', marginBottom: 2 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: '#111827' },
  meta: { fontSize: 8, textAlign: 'right', color: '#6b7280', marginTop: 3 },
  customer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sectionLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  customerName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
  table: { width: '100%', marginBottom: 14 },
  row: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: '#e5e7eb', paddingVertical: 6 },
  head: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  desc: { width: '58%', paddingHorizontal: 4 },
  qty: { width: '12%', textAlign: 'right', paddingHorizontal: 4 },
  rate: { width: '15%', textAlign: 'right', paddingHorizontal: 4 },
  amount: { width: '15%', textAlign: 'right', paddingHorizontal: 4 },
  headText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#4b5563' },
  cell: { fontSize: 8.5 },
  totals: { width: '42%', marginLeft: '58%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 8, color: '#6b7280' },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  grand: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#111827', marginTop: 4, paddingTop: 7 },
  grandText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' },
  paid: { color: '#059669' },
  due: { color: '#dc2626' },
  payment: { marginTop: 18, padding: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb' },
  footer: { marginTop: 20, paddingTop: 8, borderTopWidth: 0.6, borderTopColor: '#e5e7eb', textAlign: 'center', fontSize: 7, color: '#9ca3af' },
});

// Deterministic renderer used for large invoices. It intentionally avoids all
// custom template components and images, which can make React-PDF pagination
// stall on data-heavy invoices. The financial values remain canonical.
const createLargeInvoiceSafeDocument = (invoice, businessSettings, pageSize) => {
  const safeInvoice = sanitizePdfValue(invoice || {});
  const settings = sanitizePdfValue(businessSettings || {});
  const items = Array.isArray(safeInvoice.items) ? safeInvoice.items : [];
  const financials = calculateCanonicalInvoiceFinancials(invoice || {});
  const currency = settings?.currencySymbol || safeInvoice?.currencySymbol || 'Rs. ';
  const businessName = settings?.businessName || 'BillQyro Business';
  const customer = safeInvoice?.customer || safeInvoice?.client || {};
  const customerName = customer?.name || safeInvoice?.customerName || 'Customer';
  const number = safeInvoice?.invoiceNumber || '000';
  const date = safeInvoice?.date || safeInvoice?.createdAt || '';

  return (
    <Document title={`Invoice ${number}`} author="BillQyro">
      <Page size={pageSize} style={safePdfStyles.page} wrap>
        <View style={safePdfStyles.header}>
          <View>
            <Text style={safePdfStyles.business}>{safeText(businessName)}</Text>
            {settings?.address ? <Text style={safePdfStyles.muted}>{safeText(settings.address)}</Text> : null}
            {settings?.phone ? <Text style={safePdfStyles.muted}>Ph: {safeText(settings.phone)}</Text> : null}
            {settings?.email ? <Text style={safePdfStyles.muted}>{safeText(settings.email)}</Text> : null}
          </View>
          <View>
            <Text style={safePdfStyles.title}>INVOICE</Text>
            <Text style={safePdfStyles.meta}>#{safeText(number)}</Text>
            <Text style={safePdfStyles.meta}>{safeText(date)}</Text>
          </View>
        </View>

        <View style={safePdfStyles.customer}>
          <View>
            <Text style={safePdfStyles.sectionLabel}>Bill To</Text>
            <Text style={safePdfStyles.customerName}>{safeText(customerName)}</Text>
            {customer?.phone ? <Text style={safePdfStyles.muted}>{safeText(customer.phone)}</Text> : null}
            {customer?.address ? <Text style={safePdfStyles.muted}>{safeText(customer.address)}</Text> : null}
          </View>
          <View>
            <Text style={safePdfStyles.sectionLabel}>Status</Text>
            <Text style={safePdfStyles.customerName}>{safeText(financials.status || safeInvoice.status || 'Pending')}</Text>
          </View>
        </View>

        <View style={safePdfStyles.table}>
          <View style={safePdfStyles.head} fixed>
            <Text style={[safePdfStyles.desc, safePdfStyles.headText]}>DESCRIPTION</Text>
            <Text style={[safePdfStyles.qty, safePdfStyles.headText]}>QTY</Text>
            <Text style={[safePdfStyles.rate, safePdfStyles.headText]}>RATE</Text>
            <Text style={[safePdfStyles.amount, safePdfStyles.headText]}>AMOUNT</Text>
          </View>
          {items.map((item, index) => {
            const qty = Number(item?.quantity ?? item?.qty ?? 1) || 0;
            const rate = Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0;
            const amount = Number(item?.amount ?? item?.total ?? qty * rate) || 0;
            return (
              <View style={safePdfStyles.row} key={item?.id || item?.itemId || `item-${index}`} wrap={false}>
                <Text style={[safePdfStyles.desc, safePdfStyles.cell]}>{safeText(item?.description || item?.name || `Item ${index + 1}`)}</Text>
                <Text style={[safePdfStyles.qty, safePdfStyles.cell]}>{safeMoney(qty)}</Text>
                <Text style={[safePdfStyles.rate, safePdfStyles.cell]}>{currency}{safeMoney(rate)}</Text>
                <Text style={[safePdfStyles.amount, safePdfStyles.cell]}>{currency}{safeMoney(amount)}</Text>
              </View>
            );
          })}
        </View>

        <View style={safePdfStyles.totals}>
          <View style={safePdfStyles.totalRow}><Text style={safePdfStyles.totalLabel}>Subtotal</Text><Text style={safePdfStyles.totalValue}>{currency}{safeMoney(financials.subtotal)}</Text></View>
          <View style={safePdfStyles.totalRow}><Text style={safePdfStyles.totalLabel}>Discount</Text><Text style={safePdfStyles.totalValue}>-{currency}{safeMoney(financials.discount)}</Text></View>
          <View style={safePdfStyles.totalRow}><Text style={safePdfStyles.totalLabel}>Tax</Text><Text style={safePdfStyles.totalValue}>{currency}{safeMoney(financials.tax)}</Text></View>
          <View style={safePdfStyles.grand}><Text style={safePdfStyles.grandText}>Grand Total</Text><Text style={safePdfStyles.grandText}>{currency}{safeMoney(financials.grandTotal)}</Text></View>
          <View style={safePdfStyles.totalRow}><Text style={safePdfStyles.totalLabel}>Paid</Text><Text style={[safePdfStyles.totalValue, safePdfStyles.paid]}>{currency}{safeMoney(financials.totalPaid)}</Text></View>
          <View style={safePdfStyles.grand}><Text style={[safePdfStyles.grandText, safePdfStyles.due]}>Balance Due</Text><Text style={[safePdfStyles.grandText, safePdfStyles.due]}>{currency}{safeMoney(financials.balanceDue)}</Text></View>
        </View>

        {(safeInvoice?.paymentMethod || safeInvoice?.paymentNote) ? (
          <View style={safePdfStyles.payment}>
            <Text style={safePdfStyles.sectionLabel}>Payment Information</Text>
            {safeInvoice.paymentMethod ? <Text>Method: {safeText(safeInvoice.paymentMethod)}</Text> : null}
            {safeInvoice.paymentNote ? <Text>Note: {safeText(safeInvoice.paymentNote)}</Text> : null}
          </View>
        ) : null}

        <Text style={safePdfStyles.footer} fixed>Generated by BillQyro • Smart Billing. Premium Invoicing Platform</Text>
      </Page>
    </Document>
  );
};

const createPdfDocument = (invoice, businessSettings, qrCodeBase64, safeLogoBase64, pageSize, forceSafeLayout) => {
  if (forceSafeLayout) return createLargeInvoiceSafeDocument(invoice, businessSettings, pageSize);
  return React.createElement(PdfDocument, { invoice, businessSettings, qrCodeBase64, safeLogoBase64, pageSize });
};

const buildInvoicePdfBlob = async (invoice, businessSettings) => {
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};
  const paySnap = invoice?.paymentSettingsSnapshot || {};
  const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
  const showQrInPreview = businessSettings?.showQrInPreview !== undefined ? businessSettings.showQrInPreview : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
  const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual';
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
    } catch { /* QR is optional; PDF must continue without it. */ }
  }

  const itemCount = Array.isArray(invoice?.items) ? invoice.items.length : 0;
  const forceSafeLayout = itemCount > LARGE_INVOICE_ITEM_THRESHOLD;
  // The large-invoice renderer deliberately skips logo/template/QR work. This
  // removes the known sources of React-PDF stalls while keeping all financial data.
  const safeLogoBase64 = forceSafeLayout ? null : await fetchLogoSafely(businessSettings?.logoUrl);
  const pageSize = businessSettings?.pdfPageSize || 'A4';
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
    for (let i = 1; i <= numPages; i += 1) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pageSizes.push({ page, width: viewport.width, height: viewport.height });
      maxWidth = Math.max(maxWidth, viewport.width);
      totalHeight += viewport.height;
    }
    let scale = Math.min(IMAGE_BASE_SCALE, Math.sqrt(MAX_CANVAS_AREA / (maxWidth * totalHeight)), MAX_CANVAS_SIDE / totalHeight, MAX_CANVAS_SIDE / maxWidth);
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
      try { await loadingTask.destroy(); } catch { /* cleanup best effort */ }
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
import React from 'react';
import { pdf, Font } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Register a working emoji CDN because the default maxcdn is dead and causes infinite hangs
// using jsdelivr as cdnjs sometimes causes CORS or rate limiting hangs
Font.registerEmojiSource({
  format: 'png',
  url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/',
});

let isDownloadingPDF = false;
let isDownloadingImage = false;

// Image export safety limits (keeps the combined canvas within browser limits)
const IMAGE_BASE_SCALE = 3;        // ~216 DPI for a crisp PNG
const MAX_CANVAS_AREA = 25000000;  // ~25 MP total pixel budget (safe on mobile + desktop)
const MAX_CANVAS_SIDE = 16384;     // below Safari/Chrome/Firefox max canvas side limits

/**
 * Builds the invoice's vector PDF as a Blob.
 * Shared by the PDF and Image download pipelines so both always render identical data.
 * @param {Object} invoice - Invoice data object
 * @param {Object} businessSettings - Business details configuration
 * @returns {Promise<Blob>} PDF blob
 */
const buildInvoicePdfBlob = async (invoice, businessSettings) => {
  let qrCodeDataUrl = null;
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};
  
  // Exact same logic as normalizeInvoiceModel but extracted manually to avoid circular dependencies
  const paySnap = invoice?.paymentSettingsSnapshot || {};
  const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
  const showQrInPreview = businessSettings?.showQrInPreview !== undefined ? businessSettings.showQrInPreview : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
  const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual';
  const upiId = bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '';
  const bkashNumber = businessSettings?.bkashNumber || paySnap.bkashNumber || '';
  const nagadNumber = businessSettings?.nagadNumber || paySnap.nagadNumber || '';
  const payeeName = businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '';
  const currencyCode = businessSettings?.currencyCode || invoice?.regionalSettingsSnapshot?.currencyCode || 'INR';

  const enableQr = paymentQrEnabled && showQrInPreview;
  const amountDue = invoice?.balanceDue !== undefined ? invoice.balanceDue : (invoice?.grandTotal || 0);
  
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
      console.error('Failed to generate QR code for PDF:', err);
    }
  }

  let safeLogoBase64 = null;
  if (businessSettings?.logoUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(businessSettings.logoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        
        if (dataUrl) {
          // Convert ANY image format (including WEBP) to PNG for react-pdf compatibility
          safeLogoBase64 = await new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(dataUrl); // Fallback to original if canvas fails
            img.src = dataUrl;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch logo for PDF (CORS/Network error). Rendering without logo.', err);
    }
  }

  // Deeply sanitize known unsupported characters that crash React-PDF without a font fallback
  const safeInvoice = JSON.parse(JSON.stringify(invoice).replace(/₹/g, 'Rs. ').replace(/৳/g, 'Tk. '));

  const pageSize = businessSettings?.pdfPageSize || 'A4';
  const doc = React.createElement(PdfDocument, { 
    invoice: safeInvoice, 
    businessSettings, 
    qrCodeBase64: qrCodeDataUrl,
    safeLogoBase64,
    pageSize
  });
  
  // Add a 45-second timeout to prevent silent hangs in case of font or network issues
  const pdfPromise = pdf(doc).toBlob();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("PDF generation timed out (network/font issue)")), 45000)
  );
  return Promise.race([pdfPromise, timeoutPromise]);
};

/**
 * Renders every PDF page onto a single tall canvas (pages stitched vertically)
 * and returns a PNG Blob. The render scale is auto-adjusted so the combined
 * canvas never exceeds safe browser limits even for very long invoices.
 * @param {ArrayBuffer} arrayBuffer - Raw PDF bytes
 * @returns {Promise<Blob>} PNG blob
 */
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

    // Choose the best scale that keeps the stitched canvas within safe limits
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
    for (let i = 0; i < pageSizes.length; i++) {
      const { page } = pageSizes[i];
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
      // Release the per-page canvas memory as soon as it is stitched
      pageCanvas.width = 0;
      pageCanvas.height = 0;
    }

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png');
    });
  } finally {
    if (typeof loadingTask.destroy === 'function') {
      try { loadingTask.destroy(); } catch (err) { console.warn('PDF task cleanup failed:', err); }
    }
  }
};

/**
 * Generates and downloads a high-quality vector PDF of the invoice using @react-pdf/renderer
 * @param {Object} invoice - Invoice data object
 * @param {Object} businessSettings - Business details configuration
 * @param {boolean} isPremium - Whether premium plan is active
 * @returns {Promise<boolean>} Success indicator
 */
export const downloadInvoicePDF = async (invoice, businessSettings, isPremium) => {
  if (isDownloadingPDF) return false;
  if (!invoice) return false;
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
    toast.error(`Stack: ${error?.stack?.substring(0, 100) || ''}`);
    return false;
  } finally {
    isDownloadingPDF = false;
  }
};

/**
 * Generates and downloads the invoice as a single PNG image.
 * The exact same PDF pipeline is reused, then every PDF page is rendered and
 * stitched vertically into one long image (1 page = 1 image, 2+ pages = one tall image).
 * @param {Object} invoice - Invoice data object
 * @param {Object} businessSettings - Business details configuration
 * @returns {Promise<boolean>} Success indicator
 */
export const downloadInvoiceImage = async (invoice, businessSettings) => {
  if (isDownloadingImage) return false;
  if (!invoice) return false;
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


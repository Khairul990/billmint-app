// src/services/communication/attachmentEngine.js

/**
 * Attachment Engine – prepares PDF and business image attachments for communications.
 * Uses the real vector PDF renderer (@react-pdf/renderer + PdfDocument) so the
 * generated PDF is a genuine, shareable blob (not a mock).
 */

import React from 'react';
import { pdf, Font } from '@react-pdf/renderer';
import PdfDocument from '../../components/PdfDocument';
import QRCode from 'qrcode';

/**
 * Build the payment QR code base64 (same logic as the main PDF downloader).
 */
const buildQrBase64 = async (invoice, businessSettings) => {
  if (!invoice) return null;
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};
  const paySnap = invoice.paymentSettingsSnapshot || {};

  const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
  const showQrInPreview = businessSettings?.showQrInPreview !== undefined
    ? businessSettings.showQrInPreview
    : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
  if (!(paymentQrEnabled && showQrInPreview)) return null;

  const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual';
  const upiId = bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '';
  const bkashNumber = businessSettings?.bkashNumber || paySnap.bkashNumber || '';
  const nagadNumber = businessSettings?.nagadNumber || paySnap.nagadNumber || '';
  const payeeName = businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '';
  const currencyCode = businessSettings?.currencyCode || invoice.regionalSettingsSnapshot?.currencyCode || 'INR';
  const dueAmount = invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal || 0);

  let qrText = '';
  if (paymentMethod === 'UPI') {
    qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${dueAmount}&cu=${currencyCode}&tn=${invoice.invoiceNumber || ''}`;
  } else if (paymentMethod === 'bKash') {
    qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber || ''}`;
  } else if (paymentMethod === 'Nagad') {
    qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber || ''}`;
  } else {
    qrText = `${window.location.origin}/invoice/${invoice.publicToken || invoice.id || ''}`;
  }

  try {
    return await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H', margin: 1, width: 150 });
  } catch (err) {
    console.error('[AttachmentEngine] Failed to generate QR code for PDF:', err);
    return null;
  }
};

/**
 * Convert the business logo to a safe base64 data URL (avoids React-PDF fetch crashes).
 */
const buildSafeLogoBase64 = async (businessSettings) => {
  const logoUrl = businessSettings?.logoUrl;
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[AttachmentEngine] Could not fetch logo for PDF (CORS/Network error). Rendering without logo.', err);
    return null;
  }
};

/**
 * Generate a real Invoice PDF Blob using @react-pdf/renderer.
 * @returns {Promise<Blob>}
 */
export async function generateInvoicePdfBlob(invoice, businessSettings) {
  if (!invoice) throw new Error('Invoice missing for PDF generation');

  const [qrCodeDataUrl, safeLogoBase64] = await Promise.all([
    buildQrBase64(invoice, businessSettings),
    buildSafeLogoBase64(businessSettings)
  ]);

  const pageSize = businessSettings?.pdfPageSize || 'A4';
  // Register a working emoji CDN because the default maxcdn is dead and causes infinite hangs
  Font.registerEmojiSource({
    format: 'png',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
  });

  const doc = React.createElement(PdfDocument, {
    invoice,
    businessSettings: businessSettings || {},
    qrCodeBase64: qrCodeDataUrl,
    safeLogoBase64,
    pageSize
  });

  // Add a timeout so we never hang the share flow on font/network issues.
  const pdfPromise = pdf(doc).toBlob();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('PDF generation timed out (network/font issue)')), 45000)
  );

  return await Promise.race([pdfPromise, timeoutPromise]);
}

/**
 * Generate an Invoice PDF attachment. Never throws – returns a `ready` flag instead.
 * @returns {Object} { type, name, mimeType, size, blobUrl, blob, ready, error }
 */
export async function prepareInvoicePdf(invoice, businessSettings) {
  if (!invoice) {
    return { type: 'pdf', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: 'Invoice missing' };
  }
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings);
    const url = URL.createObjectURL(blob);
    const safeBusinessName = (businessSettings?.businessName || 'Business').replace(/[^a-zA-Z0-9]/g, '-');
    const name = `BillQyro-Invoice-${invoice.invoiceNumber || 'unknown'}.pdf`;
    return {
      type: 'pdf',
      name,
      mimeType: blob.type || 'application/pdf',
      size: blob.size,
      blobUrl: url,
      blob,
      ready: true,
      error: null
    };
  } catch (e) {
    console.error('[AttachmentEngine] PDF generation failed:', e);
    return { type: 'pdf', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message };
  }
}

/**
 * Convert a URL (http or data:) into a Blob.
 */
const urlToBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Image fetch failed');
  return await response.blob();
};

/**
 * Prepare Business Image (logo) as a Blob. Never throws – returns `ready: false` on failure.
 */
export async function prepareBusinessImage(businessSettings) {
  const logoUrl = businessSettings?.logoUrl;
  if (!logoUrl) return null;
  try {
    const blob = await urlToBlob(logoUrl);
    const name = 'BillQyro-Business-Logo.png';
    const mimeType = blob.type || 'image/png';
    const blobUrl = URL.createObjectURL(blob);
    return { type: 'image', name, mimeType, size: blob.size, blobUrl, blob, ready: true, error: null };
  } catch (e) {
    console.error('[AttachmentEngine] Image fetch error:', e);
    return { type: 'image', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message };
  }
}

/**
 * Prepare all requested attachments based on options.
 * options: { includePdf, includeImage, invoice, business }
 */
export async function prepareAttachments({ includePdf = true, includeImage = true, invoice, business }) {
  const attachments = [];
  if (includePdf) {
    attachments.push(await prepareInvoicePdf(invoice, business));
  }
  if (includeImage) {
    try {
      const img = await prepareBusinessImage(business);
      if (img) attachments.push(img);
    } catch (e) {
      console.error('[AttachmentEngine] Image preparation failed:', e);
      attachments.push({ type: 'image', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message });
    }
  }
  return attachments;
}

export const attachmentEngine = {
  generateInvoicePdfBlob,
  prepareInvoicePdf,
  prepareBusinessImage,
  prepareAttachments
};

export default attachmentEngine;

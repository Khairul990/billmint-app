// src/services/communication/attachmentEngine.js

/**
 * Attachment Engine – prepares PDF and business image attachments for communications.
 * Reuses existing pdfEngine and business logo settings.
 */

import { pdfEngine } from '../../services/pdfEngine';
import { settingsEngine } from '../../services/settingsEngine';


/**
 * Generate an Invoice PDF Blob URL.
 * Returns { type: 'pdf', name: string, blobUrl: string }
 */
export async function prepareInvoicePdf(invoice, businessSettings) {
  if (!invoice) throw new Error('Invoice missing for PDF generation');
  // Use existing pdfEngine to generate PDF Blob
  const { blob } = await pdfEngine.generateInvoicePdf(invoice, businessSettings?.selectedPdfTemplate);
  const url = URL.createObjectURL(blob);
  const name = `Invoice_${invoice.invoiceNumber || 'unknown'}.pdf`;
  const mimeType = blob.type || 'application/pdf';
  const size = blob.size;
  return { type: 'pdf', name, mimeType, size, blobUrl: url, blob, ready: true, error: null };
}

/**
 * Prepare Business Image (logo) as a Blob.
 */
export async function prepareBusinessImage(businessSettings) {
  const logoUrl = businessSettings?.logoUrl;
  if (!logoUrl) return null;
  // Fetch image as Blob
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error('Image fetch failed');
    const blob = await response.blob();
    const name = logoUrl.split('/').pop() || 'business-logo.png';
    const mimeType = blob.type || 'image/png';
    const size = blob.size;
    const blobUrl = URL.createObjectURL(blob);
    return { type: 'image', name, mimeType, size, blobUrl, blob, ready: true, error: null };
  } catch (e) {
    console.error('[AttachmentEngine] Image fetch error', e);
    return { type: 'image', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message };
  }
}

/**
 * Prepare all requested attachments based on options.
 * options: { includePdf, includeImage, invoice, business }
 */
export async function prepareAttachments({ includePdf, includeImage, invoice, business }) {
  const attachments = [];
  if (includePdf) {
    try {
      const pdf = await prepareInvoicePdf(invoice, business);
      attachments.push(pdf);
    } catch (e) {
      console.error('[AttachmentEngine] PDF generation failed', e);
      attachments.push({ type: 'pdf', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message });
    }
  }
  if (includeImage) {
    try {
      const img = await prepareBusinessImage(business);
      if (img) attachments.push(img);
    } catch (e) {
      console.error('[AttachmentEngine] Image fetch failed', e);
      attachments.push({ type: 'image', name: null, mimeType: null, size: null, blobUrl: null, blob: null, ready: false, error: e.message });
    }
  }
  return attachments;
};

export const attachmentEngine = {
  prepareInvoicePdf,
  prepareBusinessImage,
  prepareAttachments
};

export default attachmentEngine;

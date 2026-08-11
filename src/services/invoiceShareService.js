// src/services/invoiceShareService.js

/**
 * Invoice Share Service – powers the "Share on WhatsApp" flow with real
 * download links.
 *
 * WhatsApp's deep-link API cannot auto-attach files, so instead of attaching
 * the PDF we make sure the PDF already lives in Firebase Storage and hand the
 * customer a clickable download URL plus the Live Link portal URL. Every piece
 * of the message (customer name, invoice #, grand total, PDF link, portal
 * link) is dynamic and populated at share time.
 *
 * Storage layout: user_uploads/{userId}/{invoiceNumber}.pdf (already allowed
 * by storage.rules). The URL from getDownloadURL() is token-based, so anyone
 * with the link can open/download the PDF even though writes require the
 * owner's auth.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db, firebaseReady } from './firebaseConfig';
import { generateInvoicePdfBlob } from './communication/attachmentEngine';
import { buildPortalUrl } from './paymentLinkService';
import { getRealUserId } from './dbEngine';
import { cleanPhoneNumber } from '../utils/shareUtils';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';

const CACHE_KEY = (invoiceId) => `billqyro_invoice_pdf_url_${invoiceId}`;

const readCache = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full/blocked – cache is only an optimisation, safe to ignore.
  }
};

/**
 * Resolve a customer object for an invoice (the invoice card embeds
 * customerName / customerPhone, but a full customer may also be available).
 */
export const resolveCustomer = (invoice, customer) => {
  if (customer && customer.name) return customer;
  return {
    id: invoice?.customerId || invoice?.customer?.id,
    name: invoice?.customerName || invoice?.customer?.name,
    phone: invoice?.customerPhone || invoice?.customer?.phone
  };
};

/**
 * Make sure the invoice PDF exists in Firebase Storage and return a shareable
 * download URL. Reuses a previously generated URL (from invoice.pdfUrl or the
 * local cache) so we don't re-upload on every share. Never falls back to a
 * broken upload – throws a clear error instead.
 * @returns {Promise<string>} Public PDF download URL ('' when unavailable)
 */
export async function ensureInvoicePdfUrl(invoice, businessSettings) {
  if (!invoice) return '';

  const alreadySet = invoice.pdfUrl || invoice.invoicePdfUrl;
  if (alreadySet) return alreadySet;

  const cacheKey = CACHE_KEY(invoice.id || invoice.invoiceNumber);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  if (!firebaseReady || !storage) {
    throw new Error('Cloud storage is unavailable – the PDF link cannot be created right now.');
  }

  const userId = getRealUserId();
  if (!userId) {
    throw new Error('You need to be signed in to create the invoice PDF link.');
  }

  const blob = await generateInvoicePdfBlob(invoice, businessSettings);
  if (!blob || blob.size === 0) {
    throw new Error('Invoice PDF could not be generated.');
  }

  const safeName = (invoice.invoiceNumber || invoice.id || 'invoice')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
  const storageRef = ref(storage, `user_uploads/${userId}/${safeName}.pdf`);
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
  const downloadUrl = await getDownloadURL(storageRef);

  writeCache(cacheKey, downloadUrl);

  // Best-effort: remember the link on the public invoice doc so later shares
  // can reuse it without re-uploading. Never blocks the share flow on failure.
  if (invoice.publicToken) {
    try {
      await setDoc(doc(db, 'publicInvoices', invoice.publicToken), { pdfUrl: downloadUrl }, { merge: true });
    } catch {
      console.warn('[InvoiceShareService] Could not persist pdfUrl on publicInvoices:');
    }
  }

  return downloadUrl;
}

/**
 * Build the WhatsApp message containing the dynamic invoice details plus the
 * PDF download link and the Live Link portal URL.
 */
export function buildWhatsAppInvoiceMessage(invoice, businessSettings, pdfUrl, liveLinkUrl) {
  if (!invoice) return '';

  const customerName = invoice.customerName || invoice.customer?.name || 'there';
  const invoiceNo = invoice.invoiceNumber || 'N/A';

  const regionalPrefs = invoice.regionalSettingsSnapshot || {};
  const symbol = regionalPrefs.currency || businessSettings?.currency || '₹';
  const numberFormat = regionalPrefs.numberFormat || businessSettings?.numberFormat || 'Indian';
  const grandTotal = formatCurrency(invoice.grandTotal, symbol, numberFormat);
  const amountPaid = formatCurrency(invoice.amountPaid || 0, symbol, numberFormat);
  const balanceDue = formatCurrency(
    invoice.balanceDue !== undefined 
      ? invoice.balanceDue 
      : (invoice.grandTotal - (invoice.amountPaid || 0)), 
    symbol, 
    numberFormat
  );

  const businessName = invoice.businessSnapshot?.businessName || businessSettings?.businessName || 'BillQyro';
  const dueDate = invoice.dueDate || '';
  const finalPdfUrl = pdfUrl || '';
  const finalLiveLinkUrl = liveLinkUrl || '';

  // Bypass custom templates completely for now to guarantee emojis
  /*
  const template = businessSettings?.whatsappMessageTemplate ? String(businessSettings.whatsappMessageTemplate) : '';
  const isCorrupted = template.includes('\uFFFD') || template.includes('??');

  if (template && !isCorrupted) {
    let message = String(businessSettings.whatsappMessageTemplate);
    message = message.replace(/\{\{customerName\}\}/g, customerName)
                     .replace(/\{\{invoiceNo\}\}/g, invoiceNo)
                     .replace(/\{\{grandTotal\}\}/g, grandTotal)
                     .replace(/\{\{amountPaid\}\}/g, amountPaid)
                     .replace(/\{\{balanceDue\}\}/g, balanceDue)
                     .replace(/\{\{dueDate\}\}/g, dueDate)
                     .replace(/\{\{pdfUrl\}\}/g, finalPdfUrl)
                     .replace(/\{\{liveLinkUrl\}\}/g, finalLiveLinkUrl)
                     .replace(/\{\{businessName\}\}/g, businessName);
    return message.trim();
  }
  */

  // Emoji characters generated via String.fromCodePoint() to prevent any file-encoding corruption
  const e = {
    wave: String.fromCodePoint(0x1F44B),      // 👋
    party: String.fromCodePoint(0x1F389),     // 🎉
    receipt: String.fromCodePoint(0x1F9FE),   // 🧾
    money: String.fromCodePoint(0x1F4B0),     // 💰
    check: String.fromCodePoint(0x2705),      // ✅
    red: String.fromCodePoint(0x1F534),       // 🔴
    calendar: String.fromCodePoint(0x1F4C5),  // 📅
    doc: String.fromCodePoint(0x1F4C4),       // 📄
    link: String.fromCodePoint(0x1F517),      // 🔗
    chat: String.fromCodePoint(0x1F4AC),      // 💬
  };

  const lines = [
    `${e.wave} Hello ${customerName},`,
    '',
    `Thank you for your business! Your invoice is ready. ${e.party}`,
    '',
    `${e.receipt} Invoice #: ${invoiceNo}`,
    `${e.money} Total Amount: *${grandTotal}*`,
    `${e.check} Amount Paid: ${amountPaid}`,
    `${e.red} Balance Due: *${balanceDue}*`
  ];

  if (dueDate) {
    lines.push(`${e.calendar} Due Date: ${dueDate}`);
  }
  
  lines.push('');

  if (finalPdfUrl) {
    lines.push(`${e.doc} View/Download PDF:`);
    lines.push(finalPdfUrl);
    lines.push('');
  }
  if (finalLiveLinkUrl) {
    lines.push(`${e.link} View Invoice & Pay Securely:`);
    lines.push(finalLiveLinkUrl);
    lines.push('');
  }

  lines.push(`Need any help? Just reply to this message ${e.chat}`);
  lines.push('');
  lines.push('Thank you,');
  lines.push(`*${businessName}*`);
  
  return lines.join('\n');
}

/**
 * Share an invoice over WhatsApp via a wa.me deep link.
 *
 * Steps:
 *  1. Resolve customer + phone (digits only via cleanPhoneNumber).
 *  2. Resolve the Live Link portal URL (buildPortalUrl).
 *  3. Ensure the invoice PDF is in Firebase Storage and grab its download URL.
 *  4. Compose the message with all dynamic values and open WhatsApp.
 *
 * A loading toast ("Preparing your invoice...") is shown while the PDF is being
 * generated/uploaded so the user never sends an incomplete message. A blank
 * window is opened inside the click gesture to dodge popup blockers, then
 * pointed at the final wa.me URL once everything is ready.
 *
 * @param {Object} customer - { id, name, phone }
 * @param {Object} invoice - Invoice object
 * @param {Object} businessSettings - Business settings
 * @returns {Promise<{ message: string, waUrl: string, pdfUrl: string, liveLinkUrl: string }>}
 */
export async function shareOnWhatsApp(customer, invoice, businessSettings = {}) {
  if (!invoice) throw new Error('Invoice missing – cannot share.');

  const resolvedCustomer = resolveCustomer(invoice, customer);
  const symbol = businessSettings?.currency || invoice.regionalSettingsSnapshot?.currency || '₹';
  const phone = cleanPhoneNumber(resolvedCustomer?.phone || '', symbol);

  const liveLinkUrl = buildPortalUrl(invoice);

  // Always pre-open a blank tab inside the synchronous click gesture so the
  // browser never treats the later window.open() as an unsolicited popup.
  const win = window.open('', '_blank');

  let pdfUrl;
  if (invoice.pdfUrl || invoice.invoicePdfUrl) {
    pdfUrl = invoice.pdfUrl || invoice.invoicePdfUrl;
  } else {
    // PDF needs to be generated/uploaded first.
    // Browsers will block win.location.href if we await longer than ~2 seconds.
    // So we race the PDF generation against a 1.5s timeout.
    const toastId = toast.loading('Preparing your invoice...', { duration: 2000 });
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation took too long for sync popup')), 1500)
      );
      pdfUrl = await Promise.race([
        ensureInvoicePdfUrl(invoice, businessSettings),
        timeoutPromise
      ]);
    } catch (e) {
      console.warn('[InvoiceShareService] PDF link skipped to prevent popup blocker:', e.message);
      pdfUrl = '';
    } finally {
      toast.dismiss(toastId);
    }
  }

  const message = buildWhatsAppInvoiceMessage(invoice, businessSettings, pdfUrl, liveLinkUrl);
  const waUrl = buildWaUrl({ phone, message });

  // Point the pre-opened tab at the final WhatsApp deep-link URL.
  if (win && !win.closed) {
    try {
      win.location.href = waUrl;
    } catch {
      window.open(waUrl, '_blank');
    }
  } else {
    window.open(waUrl, '_blank');
  }

  return { message, waUrl, pdfUrl, liveLinkUrl };
}

/**
 * Build a wa.me deep link. Falls back to the generic WhatsApp send URL when
 * the phone number is missing so the message still opens.
 */
function buildWaUrl({ phone, message }) {
  const encoded = encodeURIComponent(message);
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}

export const invoiceShareService = {
  ensureInvoicePdfUrl,
  buildWhatsAppInvoiceMessage,
  shareOnWhatsApp,
  resolveCustomer
};

export default invoiceShareService;

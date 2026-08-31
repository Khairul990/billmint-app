// src/services/invoiceShareService.js  [v3.0 - emoji via codePoint, encodeURIComponent URL]

/**
 * Key design decisions in v3.0:
 * 1. ALL emoji produced at runtime with String.fromCodePoint() - no literal
 *    emoji bytes, no Firestore/localStorage template read.
 * 2. wa.me URL built with encodeURIComponent() not URLSearchParams.
 *    URLSearchParams encodes spaces as "+" which some WhatsApp URL parsers
 *    treat as literal "+", garbling the text.
 * 3. balanceDue always computed live from grandTotal - amountPaid.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db, firebaseReady } from './firebaseConfig.js';
import { getOrGenerateInvoicePdfBlob as generateInvoicePdfBlob } from '../utils/pdfCacheEngine.js';
import { buildPortalUrl } from './paymentLinkService.js';
import { getRealUserId } from './dbEngine.js';
import { cleanPhoneNumber } from '../utils/shareUtils.js';
import { formatCurrency } from '../utils/invoiceUtils.js';
import { calculateCanonicalInvoiceFinancials } from '../utils/invoiceMath.js';
import { toast } from 'react-hot-toast';

const CACHE_KEY = (invoiceId) => `billqyro_invoice_pdf_url_${invoiceId}`;
const readCache  = (key) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const writeCache = (key, value) => { try { localStorage.setItem(key, value); } catch { /**/ } };

export const resolveCustomer = (invoice, customer) => {
  if (customer && customer.name) return customer;
  return {
    id:    invoice?.customerId   || invoice?.customer?.id,
    name:  invoice?.customerName || invoice?.customer?.name,
    phone: invoice?.customerPhone|| invoice?.customer?.phone,
  };
};

export async function ensureInvoicePdfUrl(invoice, businessSettings) {
  if (!invoice) return '';
  const alreadySet = invoice.pdfUrl || invoice.invoicePdfUrl;
  if (alreadySet) return alreadySet;
  const cacheKey = CACHE_KEY(invoice.id || invoice.invoiceNumber);
  const cached = readCache(cacheKey);
  if (cached) return cached;
  if (!firebaseReady || !storage) throw new Error('Cloud storage unavailable.');
  const userId = getRealUserId();
  if (!userId) throw new Error('Sign in required to create PDF link.');
  const blob = await generateInvoicePdfBlob(invoice, businessSettings);
  if (!blob || blob.size === 0) throw new Error('Invoice PDF could not be generated.');
  const safeName = (invoice.invoiceNumber || invoice.id || 'invoice')
    .replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const storageRef = ref(storage, `user_uploads/${userId}/${safeName}.pdf`);
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
  const downloadUrl = await getDownloadURL(storageRef);
  writeCache(cacheKey, downloadUrl);
  if (invoice.publicToken) {
    try {
      await setDoc(doc(db, 'publicInvoices', invoice.publicToken), { pdfUrl: downloadUrl }, { merge: true });
    } catch { console.warn('[InvoiceShareService] Could not persist pdfUrl.'); }
  }
  return downloadUrl;
}

export function buildWhatsAppInvoiceMessage(invoice, businessSettings, pdfUrl, liveLinkUrl) {
  if (!invoice) return '';

  const customerName  = invoice.customerName  || invoice.customer?.name || 'there';
  const invoiceNo     = invoice.invoiceNumber || 'N/A';
  const regionalPrefs = invoice.regionalSettingsSnapshot || {};
  const symbol        = regionalPrefs.currency     || businessSettings?.currency     || '\u20B9';
  const numberFormat  = regionalPrefs.numberFormat || businessSettings?.numberFormat || 'Indian';
  const fin           = calculateCanonicalInvoiceFinancials(invoice);
  const oldDueVal     = fin.previousDue;
  const baseTotal     = fin.currentInvoiceTotal;
  const finalTotal    = fin.totalReceivable;
  const amountPaidVal = fin.amountPaid;
  const balanceDueVal = fin.customerTotalDue ?? (fin.previousDue > 0 ? (fin.remainingOldDue + fin.currentBillDue) : fin.balanceDue);

  const baseTotalStr  = formatCurrency(baseTotal, symbol, numberFormat);
  const oldDueStr     = formatCurrency(oldDueVal, symbol, numberFormat);
  const finalTotalStr = formatCurrency(finalTotal, symbol, numberFormat);
  const amountPaidStr = formatCurrency(amountPaidVal, symbol, numberFormat);
  const balanceDueStr = formatCurrency(balanceDueVal, symbol, numberFormat);

  const businessName  = invoice.businessSnapshot?.businessName || businessSettings?.businessName || 'BillQyro';
  const dueDate       = invoice.dueDate || '';

  let message = `👋 Hello ${customerName},

Thank you for your business! Your invoice is ready. 🎉

🧾 Invoice #: ${invoiceNo}`;

  if (oldDueVal > 0) {
    message += `\n🛒 Subtotal: ${baseTotalStr}`;
    message += `\n⏳ Old Due: ${oldDueStr}`;
    message += `\n💰 Grand Total: *${finalTotalStr}*`;
  } else {
    message += `\n💰 Total Amount: *${baseTotalStr}*`;
  }

  message += `\n✅ Amount Paid: ${amountPaidStr}
🔴 Balance Due: *${balanceDueStr}*`;

  if (dueDate) {
    message += `\n📅 Due Date: ${dueDate}`;
  }

  if (pdfUrl) {
    message += `\n\n📄 View/Download PDF:\n${pdfUrl}`;
  }

  if (liveLinkUrl) {
    message += `\n\n🔗 View Invoice & Pay Securely:\n${liveLinkUrl}`;
  }

  message += `\n\nNeed any help? Just reply to this message 💬\n\nThank you,\n*${businessName}*`;

  return message;
}

export async function shareOnWhatsApp(customer, invoice, businessSettings = {}) {
  if (!invoice) throw new Error('Invoice missing.');

  const resolvedCustomer = resolveCustomer(invoice, customer);
  const phone = cleanPhoneNumber(resolvedCustomer?.phone || '');
  const liveLinkUrl = buildPortalUrl(invoice);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Popup blocker workaround is ONLY needed for Desktop. 
  // Opening a new window in Capacitor mobile routes through the InAppBrowser plugin,
  // which can mangle UTF-16 surrogate pairs (emojis) during intent URL parsing.
  let win = null;
  if (!isMobile) {
    win = window.open('', '_blank');
  }

  let pdfUrl = '';
  if (invoice.pdfUrl || invoice.invoicePdfUrl) {
    pdfUrl = invoice.pdfUrl || invoice.invoicePdfUrl;
  } else {
    const toastId = toast.loading('Preparing your invoice...', { duration: 2000 });
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500));
      pdfUrl = await Promise.race([ensureInvoicePdfUrl(invoice, businessSettings), timeout]);
    } catch (err) {
      console.warn('[InvoiceShareService] PDF skipped:', err.message);
      pdfUrl = '';
    } finally {
      toast.dismiss(toastId);
    }
  }

  const message = buildWhatsAppInvoiceMessage(invoice, businessSettings, pdfUrl, liveLinkUrl);
  const waUrl   = buildWaUrl({ phone, message });

  if (isMobile) {
    // Direct navigation on the main webview triggers native intent without string corruption
    window.location.href = waUrl;
  } else {
    if (win && !win.closed) {
      try { win.location.href = waUrl; }
      catch { window.open(waUrl, '_blank'); }
    } else {
      window.open(waUrl, '_blank');
    }
  }

  return { message, waUrl, pdfUrl, liveLinkUrl };
}

function buildWaUrl({ phone, message }) {
  const encoded = encodeURIComponent(message);
  
  // For Capacitor / Mobile WebViews, direct deep link is often safer 
  // to avoid intermediary wa.me browser intent decoding bugs.
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    return phone 
      ? 'whatsapp://send?phone=' + phone + '&text=' + encoded
      : 'whatsapp://send?text=' + encoded;
  }
  
  // Always use api.whatsapp.com directly to avoid wa.me URL redirect 
  // corruption on some browser/OS combinations for surrogate pairs (emojis)
  return phone
    ? 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + encoded
    : 'https://api.whatsapp.com/send?text=' + encoded;
}

export const invoiceShareService = {
  ensureInvoicePdfUrl,
  buildWhatsAppInvoiceMessage,
  shareOnWhatsApp,
  resolveCustomer,
};

export default invoiceShareService;

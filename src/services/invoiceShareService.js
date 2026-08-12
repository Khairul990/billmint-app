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
import { storage, db, firebaseReady } from './firebaseConfig';
import { generateInvoicePdfBlob } from './communication/attachmentEngine';
import { buildPortalUrl } from './paymentLinkService';
import { getRealUserId } from './dbEngine';
import { cleanPhoneNumber } from '../utils/shareUtils';
import { formatCurrency } from '../utils/invoiceUtils';
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
  const grandTotal    = formatCurrency(invoice.grandTotal, symbol, numberFormat);
  const amountPaid    = formatCurrency(invoice.amountPaid || 0, symbol, numberFormat);
  const balanceDue    = formatCurrency(
    Math.max(0, Number(invoice.grandTotal || 0) - Number(invoice.amountPaid || 0)),
    symbol, numberFormat
  );
  const businessName  = invoice.businessSnapshot?.businessName || businessSettings?.businessName || 'BillQyro';
  const dueDate       = invoice.dueDate || '';
  const finalPdfUrl   = pdfUrl       || '';
  const finalLiveLink = liveLinkUrl  || '';

  // Using literal raw emoji characters (UTF-8) as they are often more resilient 
  // than surrogate pairs constructed at runtime in some JS engine / native bridge handoffs
  const WAVE     = '👋';
  const PARTY    = '🎉';
  const RECEIPT  = '🧾';
  const MONEY    = '💰';
  const CHECK    = '✅';
  const RED_DOT  = '🔴';
  const CALENDAR = '📅';
  const DOC      = '📄';
  const LINK     = '🔗';
  const CHAT     = '💬';

  const lines = [
    WAVE + ' Hello ' + customerName + ',',
    '',
    'Thank you for your business! Your invoice is ready. ' + PARTY,
    '',
    RECEIPT + ' Invoice #: ' + invoiceNo,
    MONEY   + ' Total Amount: *' + grandTotal + '*',
    CHECK   + ' Amount Paid: ' + amountPaid,
    RED_DOT + ' Balance Due: *' + balanceDue + '*',
    CALENDAR+ ' Due Date: ' + (dueDate || 'N/A'),
    '',
  ];

  if (finalPdfUrl) {
    lines.push(DOC + ' View/Download PDF:');
    lines.push(finalPdfUrl);
    lines.push('');
  }

  if (finalLiveLink) {
    lines.push(LINK + ' View Invoice & Pay Securely:');
    lines.push(finalLiveLink);
    lines.push('');
  }

  lines.push('Need any help? Just reply to this message ' + CHAT);
  lines.push('');
  lines.push('Thank you,');
  lines.push('*' + businessName + '*');

  return lines.join('\n');
}

export async function shareOnWhatsApp(customer, invoice, businessSettings = {}) {
  if (!invoice) throw new Error('Invoice missing.');

  const resolvedCustomer = resolveCustomer(invoice, customer);
  const phone = cleanPhoneNumber(resolvedCustomer?.phone || '');
  const liveLinkUrl = buildPortalUrl(invoice);

  const win = window.open('', '_blank');

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

  if (win && !win.closed) {
    try { win.location.href = waUrl; }
    catch { window.open(waUrl, '_blank'); }
  } else {
    window.open(waUrl, '_blank');
  }

  return { message, waUrl, pdfUrl, liveLinkUrl };
}

function buildWaUrl({ phone, message }) {
  const encoded = encodeURIComponent(message);
  
  // For Capacitor / Mobile WebViews, direct deep link is often safer 
  // to avoid intermediary wa.me browser intent decoding bugs.
  // Using direct whatsapp:// protocol bypasses the browser intent parsing that might mangle surrogate pairs.
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    return phone 
      ? 'whatsapp://send?phone=' + phone + '&text=' + encoded
      : 'whatsapp://send?text=' + encoded;
  }
  
  return phone
    ? 'https://wa.me/' + phone + '?text=' + encoded
    : 'https://api.whatsapp.com/send?text=' + encoded;
}

export const invoiceShareService = {
  ensureInvoicePdfUrl,
  buildWhatsAppInvoiceMessage,
  shareOnWhatsApp,
  resolveCustomer,
};

export default invoiceShareService;

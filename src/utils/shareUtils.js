/**
 * Sharing Utilities for BillQyro Invoices
 */

import { formatCurrency } from './invoiceUtils';

/**
 * Cleans a phone number for the WhatsApp API deep links.
 * Strips non-numeric characters and adds appropriate country code prefixes if needed.
 * @param {string} phone 
 * @param {string} currencySymbol 
 * @returns {string} Cleaned digits (e.g. "8801700000000" or "919999999999")
 */
export function cleanPhoneNumber(phone, currencySymbol = '₹') {
  if (!phone) return '';
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  } else if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generates a clean, professional customer-facing text summary for an invoice.
 * @param {Object} invoice 
 * @param {string} currencySymbol 
 * @param {Object} businessSettings 
 * @returns {string} Formatted text
 */
export function generateInvoiceShareText(invoice, currencySymbol = '₹', businessSettings = {}) {
  if (!invoice) return '';

  const businessPrefs = invoice.businessSnapshot || businessSettings || {};
  const regionalPrefs = invoice.regionalSettingsSnapshot || {
    currency: currencySymbol,
    numberFormat: businessSettings?.numberFormat || 'Indian'
  };

  const activeSymbol = regionalPrefs.currency || currencySymbol;
  const activeNumberFormat = regionalPrefs.numberFormat || 'Indian';

  const businessName = businessPrefs?.businessName || 'Our Business';
  const invoiceNo = invoice.invoiceNumber || 'N/A';
  const grandTotal = formatCurrency(invoice.grandTotal, activeSymbol, activeNumberFormat);
  const amountPaid = formatCurrency(invoice.amountPaid || 0, activeSymbol, activeNumberFormat);
  const balanceDue = formatCurrency(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal - (invoice.amountPaid || 0)), activeSymbol, activeNumberFormat);
  const paymentStatus = invoice.paymentStatus || 'Pending';
  
  // Construct the secure live link automatically
  const liveLink = invoice.publicToken ? `${window.location.origin}/invoice/${invoice.publicToken}` : '';

  let message = `Your invoice is ready.
Invoice No: ${invoiceNo}
Total: ${grandTotal}
Paid: ${amountPaid}
Balance Due: ${balanceDue}
Status: ${paymentStatus}`;

  if (liveLink) {
    message += `\nView & Pay: ${liveLink}`;
  }

  message += `\n\nThank you for your business!\n*${businessName}*`;
  
  return message;
}

/**
 * Creates a WhatsApp web/app deep link for sending invoice details.
 * @param {Object} invoice 
 * @param {string} currencySymbol 
 * @param {Object} businessSettings 
 * @returns {string} WhatsApp link
 */
export function generateWhatsAppShareLink(invoice, currencySymbol = '₹', businessSettings = {}) {
  const regionalPrefs = invoice?.regionalSettingsSnapshot || {
    currency: currencySymbol
  };
  const activeSymbol = regionalPrefs.currency || currencySymbol;
  const phone = cleanPhoneNumber(invoice?.customerPhone || '', activeSymbol);
  const text = generateInvoiceShareText(invoice, activeSymbol, businessSettings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp reminder link with a polite tone.
 */
export function generateWhatsAppReminderLink(invoice, currencySymbol = '₹', businessSettings = {}) {
  const regionalPrefs = invoice?.regionalSettingsSnapshot || {
    currency: currencySymbol
  };
  const activeSymbol = regionalPrefs.currency || currencySymbol;
  const activeNumberFormat = regionalPrefs.numberFormat || 'Indian';
  const phone = cleanPhoneNumber(invoice?.customerPhone || '', activeSymbol);
  
  const businessName = invoice.businessSnapshot?.businessName || businessSettings?.businessName || 'Our Business';
  const balanceDue = formatCurrency(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal - (invoice.amountPaid || 0)), activeSymbol, activeNumberFormat);
  
  const liveLink = invoice.publicToken ? `${window.location.origin}/invoice/${invoice.publicToken}` : '';
  
  let text = `Hi ${invoice.customerName || 'there'},\n\nJust a gentle reminder from ${businessName} that Invoice #${invoice.invoiceNumber || 'N/A'} has a pending balance of *${balanceDue}*.\n\n`;
  if (liveLink) {
    text += `You can view the invoice and securely pay online here: ${liveLink}\n\n`;
  }
  text += `Please let us know if you have any questions.\nThank you!`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates a mailto link for emailing invoice details.
 * @param {Object} invoice 
 * @param {string} currencySymbol 
 * @param {Object} businessSettings 
 * @returns {Object} { mailto, subject, body }
 */
export function generateEmailShareLink(invoice, currencySymbol = '₹', businessSettings = {}) {
  const email = invoice?.customerEmail || '';
  const businessPrefs = invoice?.businessSnapshot || businessSettings || {};
  const regionalPrefs = invoice?.regionalSettingsSnapshot || {
    currency: currencySymbol
  };
  const activeSymbol = regionalPrefs.currency || currencySymbol;
  const businessName = businessPrefs?.businessName || 'Our Business';
  const invoiceNo = invoice?.invoiceNumber || 'N/A';
  
  const subject = `Invoice ${invoiceNo} from ${businessName}`;
  const text = generateInvoiceShareText(invoice, activeSymbol, businessSettings);
  
  // Format body for email (replace some markdown markup if desired, or keep it clean)
  // Email clients don't parse markdown stars so we clean them up slightly for body
  const emailBody = text
    .replace(/\*/g, '')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/━/g, '-');

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  
  return {
    mailto,
    subject,
    body: emailBody
  };
}

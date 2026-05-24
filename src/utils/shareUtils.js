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
  
  // Smart country prefix heuristics (Bangladesh & India defaults)
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    // Bangladesh local number: "01XXXXXXXXX" (11 digits) -> add country code "88"
    cleaned = '88' + cleaned;
  } else if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    // India local number: "9XXXXXXXXX" (10 digits) -> add country code "91"
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

  const businessName = businessSettings?.businessName || 'Our Business';
  const invoiceNo = invoice.invoiceNumber || 'N/A';
  const grandTotal = formatCurrency(invoice.grandTotal, currencySymbol);
  const amountPaid = formatCurrency(invoice.amountPaid || 0, currencySymbol);
  const balanceDue = formatCurrency(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal - (invoice.amountPaid || 0)), currencySymbol);
  const paymentStatus = invoice.paymentStatus || 'Pending';
  
  // Construct the secure live link automatically
  const liveLink = invoice.publicToken ? `${window.location.origin}/i/${invoice.publicToken}` : '';

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
  const phone = cleanPhoneNumber(invoice?.customerPhone || '', currencySymbol);
  const text = generateInvoiceShareText(invoice, currencySymbol, businessSettings);
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
  const businessName = businessSettings?.businessName || 'Our Business';
  const invoiceNo = invoice?.invoiceNumber || 'N/A';
  
  const subject = `Invoice ${invoiceNo} from ${businessName}`;
  const text = generateInvoiceShareText(invoice, currencySymbol, businessSettings);
  
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

import { PublicInvoiceRepository } from './publicInvoiceRepository.js';
import { calculateCanonicalInvoiceFinancials } from '../invoices/invoiceMath.js';

const PUBLIC_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,64}$/;

export class PublicInvoiceService {
  /**
   * Retrieves and formats an invoice for public consumption.
   * Strips all internal database identifiers, private user notes, and system metadata.
   */
  static async getPublicInvoice(token) {
    if (!token || typeof token !== 'string' || !PUBLIC_TOKEN_REGEX.test(token)) {
      const err = new Error('Invoice not found or invalid public link.');
      err.statusCode = 404;
      err.code = 'INVOICE_NOT_FOUND';
      throw err;
    }

    const rawInvoice = await PublicInvoiceRepository.findByPublicToken(token);
    if (!rawInvoice) {
      const err = new Error('Invoice not found or link has expired.');
      err.statusCode = 404;
      err.code = 'INVOICE_NOT_FOUND';
      throw err;
    }

    // 1. Verify Financial Invariants with Canonical Engine
    const { financials, items: calculatedItems } = calculateCanonicalInvoiceFinancials({
      items: rawInvoice.items.map(it => ({
        name: it.name,
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        taxPercent: it.tax_percent,
        discount: it.discount_amount
      })),
      shippingCharge: rawInvoice.shipping_charge,
      amountPaid: rawInvoice.amount_paid
    });

    // 2. Financial Integrity Check
    if (
      financials.grandTotal < 0 ||
      financials.balanceDue < 0 ||
      isNaN(financials.grandTotal) ||
      isNaN(financials.balanceDue)
    ) {
      console.error(`[PUBLIC INVOICE INTEGRITY ERROR] Invalid financial state for token ${token}`);
      const err = new Error('Invoice data integrity check failed.');
      err.statusCode = 500;
      err.code = 'INTEGRITY_ERROR';
      throw err;
    }

    // 3. Serialize Strict Public DTO (Zero Internal Leakage)
    return {
      invoice: {
        invoiceNumber: rawInvoice.invoice_number,
        billType: rawInvoice.bill_type,
        date: rawInvoice.date,
        dueDate: rawInvoice.due_date,
        status: financials.status,
        paymentStatus: financials.status,
        financials: {
          subtotal: financials.subtotal,
          taxTotal: financials.taxTotal,
          discountTotal: financials.discountTotal,
          shippingCharge: financials.shippingCharge,
          grandTotal: financials.grandTotal,
          amountPaid: financials.amountPaid,
          balanceDue: financials.balanceDue
        },
        items: calculatedItems.map(item => ({
          sequenceNumber: item.sequenceNumber,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          rate: item.rate,
          taxPercent: item.taxPercent,
          discountAmount: item.discountAmount,
          totalAmount: item.totalAmount
        })),
        terms: rawInvoice.terms || ''
      },
      business: {
        name: rawInvoice.workspace_name,
        currency: rawInvoice.currency || 'INR',
        currencySymbol: rawInvoice.currency_symbol || '₹',
        taxLabel: rawInvoice.tax_label || 'GSTIN'
      },
      customer: {
        name: rawInvoice.customer_name || 'Valued Customer',
        address: rawInvoice.customer_address || ''
      },
      presentation: {
        selectedTemplate: rawInvoice.selected_template || 'modern',
        publicToken: rawInvoice.public_token
      }
    };
  }
}

/**
 * Dual-Write Parity Checker
 * Compares canonical business domain fields between Firebase and PostgreSQL mirror records.
 * Compares business semantics only (zero internal DB UUID, timestamp, or audit field comparisons).
 */

export const normalizeMoney = (val) => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0.00';
  return (Math.round(num * 100) / 100).toFixed(2);
};

export const normalizeDate = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && val.includes('T')) {
    return val.split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val).trim();
};

export const normalizeText = (val) => {
  if (val === undefined || val === null) return '';
  return String(val).trim().toLowerCase();
};

export class DualWriteParity {
  /**
   * Helper to evaluate difference for a single field.
   */
  static compareField(field, fbVal, pgVal, diffs) {
    if (fbVal !== pgVal) {
      diffs.push({
        field,
        firebase: fbVal,
        postgres: pgVal
      });
    }
  }

  // ==========================================================================
  // CUSTOMER PARITY
  // ==========================================================================
  static checkCustomerParity(fbCust = {}, pgCust = {}) {
    const diffs = [];

    this.compareField('name', normalizeText(fbCust.name), normalizeText(pgCust.name), diffs);
    this.compareField('phone', normalizeText(fbCust.phone), normalizeText(pgCust.phone), diffs);
    this.compareField('email', normalizeText(fbCust.email), normalizeText(pgCust.email), diffs);
    this.compareField('billingAddress', normalizeText(fbCust.billingAddress || fbCust.address), normalizeText(pgCust.billingAddress || pgCust.billing_address || pgCust.address), diffs);
    this.compareField('gstin', normalizeText(fbCust.gstin), normalizeText(pgCust.gstin), diffs);
    this.compareField('openingBalance', normalizeMoney(fbCust.openingBalance || fbCust.openingDue || fbCust.opening_due), normalizeMoney(pgCust.openingBalance || pgCust.opening_balance || pgCust.opening_due), diffs);

    return {
      entity: 'customer',
      matched: diffs.length === 0,
      differences: diffs
    };
  }

  // ==========================================================================
  // PRODUCT PARITY
  // ==========================================================================
  static checkProductParity(fbProd = {}, pgProd = {}) {
    const diffs = [];

    this.compareField('name', normalizeText(fbProd.name), normalizeText(pgProd.name), diffs);
    this.compareField('sku', normalizeText(fbProd.sku), normalizeText(pgProd.sku), diffs);
    this.compareField('rate', normalizeMoney(fbProd.rate || fbProd.price), normalizeMoney(pgProd.rate), diffs);
    this.compareField('taxRate', normalizeMoney(fbProd.taxRate || fbProd.tax_rate), normalizeMoney(pgProd.taxRate || pgProd.tax_rate), diffs);
    this.compareField('stockQuantity', normalizeMoney(fbProd.stockQuantity || fbProd.stock_quantity), normalizeMoney(pgProd.stockQuantity || pgProd.stock_quantity), diffs);
    this.compareField('minStockAlert', normalizeMoney(fbProd.minStockAlert || fbProd.min_stock_alert), normalizeMoney(pgProd.minStockAlert || pgProd.min_stock_alert), diffs);

    return {
      entity: 'product',
      matched: diffs.length === 0,
      differences: diffs
    };
  }

  // ==========================================================================
  // INVOICE PARITY
  // ==========================================================================
  static checkInvoiceParity(fbInv = {}, pgInv = {}) {
    const diffs = [];

    // 1. Header attributes
    this.compareField('invoiceNumber', normalizeText(fbInv.invoiceNumber || fbInv.invoice_number), normalizeText(pgInv.invoiceNumber || pgInv.invoice_number), diffs);
    this.compareField('billType', normalizeText(fbInv.billType || fbInv.bill_type || 'Invoice'), normalizeText(pgInv.billType || pgInv.bill_type || 'Invoice'), diffs);
    this.compareField('date', normalizeDate(fbInv.date), normalizeDate(pgInv.date), diffs);
    this.compareField('dueDate', normalizeDate(fbInv.dueDate || fbInv.due_date), normalizeDate(pgInv.dueDate || pgInv.due_date), diffs);

    // 2. Line Items parity
    const fbItems = Array.isArray(fbInv.items) ? fbInv.items : [];
    const pgItems = Array.isArray(pgInv.items) ? pgInv.items : [];

    this.compareField('itemCount', String(fbItems.length), String(pgItems.length), diffs);

    // If item count matches, verify item details
    if (fbItems.length === pgItems.length) {
      for (let i = 0; i < fbItems.length; i++) {
        const fi = fbItems[i] || {};
        const pi = pgItems[i] || {};
        this.compareField(`items[${i}].name`, normalizeText(fi.name || fi.description), normalizeText(pi.name || pi.description), diffs);
        this.compareField(`items[${i}].quantity`, normalizeMoney(fi.quantity ?? fi.qty), normalizeMoney(pi.quantity ?? pi.qty), diffs);
        this.compareField(`items[${i}].rate`, normalizeMoney(fi.rate ?? fi.price), normalizeMoney(pi.rate ?? pi.price), diffs);
        this.compareField(`items[${i}].taxRate`, normalizeMoney(fi.taxRate || fi.tax_percent || 0), normalizeMoney(pi.taxRate || pi.tax_percent || 0), diffs);
        this.compareField(`items[${i}].discountAmount`, normalizeMoney(fi.discountAmount || fi.discount_amount || 0), normalizeMoney(pi.discountAmount || pi.discount_amount || 0), diffs);
      }
    }

    // 3. Financial calculations & authority
    this.compareField('subtotal', normalizeMoney(fbInv.subtotal), normalizeMoney(pgInv.subtotal), diffs);
    this.compareField('taxTotal', normalizeMoney(fbInv.taxTotal || fbInv.tax_total || fbInv.tax), normalizeMoney(pgInv.taxTotal || pgInv.tax_total || pgInv.tax), diffs);
    this.compareField('discountTotal', normalizeMoney(fbInv.discountTotal || fbInv.discount_total || fbInv.discount), normalizeMoney(pgInv.discountTotal || pgInv.discount_total || pgInv.discount), diffs);
    this.compareField('shippingCharge', normalizeMoney(fbInv.shippingCharge || fbInv.shipping_charge || 0), normalizeMoney(pgInv.shippingCharge || pgInv.shipping_charge || 0), diffs);
    this.compareField('grandTotal', normalizeMoney(fbInv.grandTotal || fbInv.grand_total || fbInv.total), normalizeMoney(pgInv.grandTotal || pgInv.grand_total || pgInv.total), diffs);
    this.compareField('amountPaid', normalizeMoney(fbInv.amountPaid || fbInv.amount_paid || fbInv.paidAmount || 0), normalizeMoney(pgInv.amountPaid || pgInv.amount_paid || 0), diffs);
    this.compareField('balanceDue', normalizeMoney(fbInv.balanceDue || fbInv.balance_due || fbInv.due || 0), normalizeMoney(pgInv.balanceDue || pgInv.balance_due || 0), diffs);
    this.compareField('status', normalizeText(fbInv.status || fbInv.paymentStatus || 'Unpaid'), normalizeText(pgInv.status || 'Unpaid'), diffs);

    return {
      entity: 'invoice',
      matched: diffs.length === 0,
      differences: diffs
    };
  }

  // ==========================================================================
  // PAYMENT PARITY
  // ==========================================================================
  static checkPaymentParity(fbPay = {}, pgPay = {}) {
    const diffs = [];

    this.compareField('amount', normalizeMoney(fbPay.amount), normalizeMoney(pgPay.amount), diffs);
    this.compareField('paymentMethod', normalizeText(fbPay.paymentMethod || fbPay.payment_method || 'Cash'), normalizeText(pgPay.paymentMethod || pgPay.payment_method || 'Cash'), diffs);
    this.compareField('paymentDate', normalizeDate(fbPay.paymentDate || fbPay.payment_date || fbPay.date), normalizeDate(pgPay.paymentDate || pgPay.payment_date || pgPay.date), diffs);
    this.compareField('transactionReference', normalizeText(fbPay.transactionReference || fbPay.transaction_reference || fbPay.referenceNote), normalizeText(pgPay.transactionReference || pgPay.transaction_reference || pgPay.reference_note), diffs);

    return {
      entity: 'payment',
      matched: diffs.length === 0,
      differences: diffs
    };
  }

  // ==========================================================================
  // EXPENSE PARITY
  // ==========================================================================
  static checkExpenseParity(fbExp = {}, pgExp = {}) {
    const diffs = [];

    this.compareField('amount', normalizeMoney(fbExp.amount), normalizeMoney(pgExp.amount), diffs);
    this.compareField('category', normalizeText(fbExp.category || 'General'), normalizeText(pgExp.category || 'General'), diffs);
    this.compareField('description', normalizeText(fbExp.description), normalizeText(pgExp.description), diffs);
    this.compareField('date', normalizeDate(fbExp.date), normalizeDate(pgExp.date), diffs);

    return {
      entity: 'expense',
      matched: diffs.length === 0,
      differences: diffs
    };
  }

  // ==========================================================================
  // BANK LEDGER PARITY
  // ==========================================================================
  static checkBankLedgerParity(fbEntry = {}, pgEntry = {}) {
    const diffs = [];

    this.compareField('type', normalizeText(fbEntry.type || 'CREDIT'), normalizeText(pgEntry.type || 'CREDIT'), diffs);
    this.compareField('amount', normalizeMoney(fbEntry.amount), normalizeMoney(pgEntry.amount), diffs);
    this.compareField('description', normalizeText(fbEntry.description), normalizeText(pgEntry.description), diffs);
    this.compareField('date', normalizeDate(fbEntry.date), normalizeDate(pgEntry.date), diffs);

    return {
      entity: 'bankLedger',
      matched: diffs.length === 0,
      differences: diffs
    };
  }
}

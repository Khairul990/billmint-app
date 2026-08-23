/**
 * Centralized Utility for Invoice Mathematics
 * Avoids floating-point math errors and ensures consistent tax/discount calculation
 * across the entire application.
 */

// Rounding helper to 2 decimal places
const roundTo2 = (num) => Math.round(num * 100) / 100;

export const calculateItemTotal = (qty, rate, discount = 0) => {
  const quantity = parseFloat(qty) || 0;
  const price = parseFloat(rate) || 0;
  const disc = parseFloat(discount) || 0;
  
  return Math.max(0, roundTo2((quantity * price) - disc));
};

export const calculateInvoiceTotals = (items, taxPercentage, globalDiscount = 0) => {
  if (!Array.isArray(items)) {
    return { subtotal: 0, taxAmount: 0, discountAmount: globalDiscount, grandTotal: 0 };
  }

  // 1. Calculate subtotal from items
  let subtotal = 0;
  items.forEach(item => {
    subtotal += calculateItemTotal(item.qty, item.rate || item.price || item.unitPrice, item.discount || 0);
  });

  // 2. Apply global discount
  const discAmt = parseFloat(globalDiscount) || 0;
  const taxableAmount = Math.max(0, subtotal - discAmt);

  // 3. Calculate tax
  const taxPct = parseFloat(taxPercentage) || 0;
  const taxAmount = roundTo2(taxableAmount * (taxPct / 100));

  // 4. Grand Total
  const grandTotal = roundTo2(taxableAmount + taxAmount);

  return {
    subtotal: roundTo2(subtotal),
    discountAmount: discAmt,
    taxAmount,
    grandTotal
  };
};

/**
 * Calculates payment statuses for an invoice based on amountPaid vs grandTotal.
 * @returns {string} 'Paid', 'Partially Paid', 'Pending Verification', or 'Unpaid'
 */
export const determinePaymentStatus = (amountPaid, grandTotal, currentStatus) => {
  // If explicitly overridden to verification or cancelled, preserve it
  if (currentStatus === 'Pending Verification' || currentStatus === 'Cancelled' || currentStatus === 'Void') {
    return currentStatus;
  }

  const paid = parseFloat(amountPaid) || 0;
  const total = parseFloat(grandTotal) || 0;

  if (paid >= total && total > 0) return 'Paid';
  if (paid > 0 && paid < total) return 'Partially Paid';
  return 'Unpaid';
};

/**
 * CANONICAL PAYMENT AMOUNT RESOLVER
 */
export const getInvoicePaidTotal = (inv) => {
  if (!inv) return 0;
  if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
    const sum = inv.paymentHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    if (sum > 0) return roundTo2(sum);
  }
  const val = parseFloat(inv.amountPaid ?? inv.paidAmount);
  if (!isNaN(val) && val >= 0) return roundTo2(val);
  if (inv.paymentStatus === 'Paid') {
    return roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  }
  return 0;
};

/**
 * CANONICAL BALANCE DUE RESOLVER
 */
export const getInvoiceBalanceDue = (inv) => {
  if (!inv) return 0;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  return Math.max(0, roundTo2(grandTotal - paidTotal));
};

/**
 * CANONICAL PAYMENT STATUS RESOLVER
 */
export const getInvoicePaymentStatus = (inv) => {
  if (!inv) return 'Unpaid';
  if (inv.status === 'Cancelled' || inv.status === 'Void') return inv.status;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  if (paidTotal >= grandTotal && grandTotal > 0) return 'Paid';
  if (paidTotal > 0 && paidTotal < grandTotal) return 'Partially Paid';
  if (inv.paymentStatus === 'Pending Verification' || (Array.isArray(inv.paymentProofs) && inv.paymentProofs.some(p => p.status === 'Pending Verification' || p.status === 'pending'))) {
    return 'Pending Verification';
  }
  return 'Unpaid';
};

/**
 * NORMALIZE INVOICE FINANCIALS
 */
export const normalizeInvoiceFinancials = (inv) => {
  if (!inv) return inv;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  const balanceDue = Math.max(0, roundTo2(grandTotal - paidTotal));
  const paymentStatus = getInvoicePaymentStatus({ ...inv, grandTotal, amountPaid: paidTotal, paidAmount: paidTotal });

  return {
    ...inv,
    grandTotal,
    amountPaid: paidTotal,
    paidAmount: paidTotal,
    balanceDue,
    paymentStatus
  };
};

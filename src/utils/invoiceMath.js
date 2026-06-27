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

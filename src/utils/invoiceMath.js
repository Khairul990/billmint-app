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
 * CANONICAL PAYMENT ALLOCATION ENGINE
 */
export const allocatePayment = (paymentAmount = 0, oldDue = 0, currentInvoiceTotal = 0) => {
  const payVal = roundTo2(parseFloat(paymentAmount) || 0);
  const previousDueVal = roundTo2(parseFloat(oldDue) || 0);
  const currentTotalVal = roundTo2(parseFloat(currentInvoiceTotal) || 0);

  // 1. Priority: Settle Old / Previous Due
  const allocatedToOldDue = roundTo2(Math.min(payVal, previousDueVal));
  const remainingOldDue = roundTo2(Math.max(0, previousDueVal - allocatedToOldDue));

  // 2. Priority: Settle Current Invoice with remainder
  const unallocatedPayment = roundTo2(Math.max(0, payVal - allocatedToOldDue));
  const allocatedToCurrentInvoice = roundTo2(Math.min(unallocatedPayment, currentTotalVal));
  const remainingCurrentInvoiceDue = roundTo2(Math.max(0, currentTotalVal - allocatedToCurrentInvoice));

  // 3. Overall Customer Balance Due
  const totalReceivable = roundTo2(previousDueVal + currentTotalVal);
  const customerTotalDue = roundTo2(remainingOldDue + remainingCurrentInvoiceDue);

  let currentInvoicePaymentStatus = 'Unpaid';
  if (allocatedToCurrentInvoice >= currentTotalVal && currentTotalVal > 0) {
    currentInvoicePaymentStatus = 'Paid';
  } else if (allocatedToCurrentInvoice > 0) {
    currentInvoicePaymentStatus = 'Partial';
  }

  return {
    paymentAmount: payVal,
    previousDue: previousDueVal,
    currentInvoiceTotal: currentTotalVal,
    totalReceivable,
    allocatedToOldDue,
    remainingOldDue,
    allocatedToCurrentInvoice,
    remainingCurrentInvoiceDue,
    customerTotalDue,
    currentInvoicePaymentStatus,
    isCurrentInvoicePaid: currentInvoicePaymentStatus === 'Paid',
    isSettled: customerTotalDue === 0
  };
};

export const allocateMultiplePayments = (payments = [], oldDue = 0, currentInvoiceTotal = 0) => {
  const totalPaid = Array.isArray(payments)
    ? payments.reduce((sum, p) => sum + (typeof p === 'number' ? p : (parseFloat(p?.amount) || 0)), 0)
    : (parseFloat(payments) || 0);

  const allocation = allocatePayment(totalPaid, oldDue, currentInvoiceTotal);

  let runningOldDueToCover = roundTo2(parseFloat(oldDue) || 0);
  let runningCurrentTotalToCover = roundTo2(parseFloat(currentInvoiceTotal) || 0);

  const paymentBreakdown = (Array.isArray(payments) ? payments : []).map(p => {
    const amt = roundTo2(typeof p === 'number' ? p : (parseFloat(p?.amount) || 0));
    const toOldDue = roundTo2(Math.min(amt, runningOldDueToCover));
    runningOldDueToCover = roundTo2(Math.max(0, runningOldDueToCover - toOldDue));

    const rem = roundTo2(Math.max(0, amt - toOldDue));
    const toCurrent = roundTo2(Math.min(rem, runningCurrentTotalToCover));
    runningCurrentTotalToCover = roundTo2(Math.max(0, runningCurrentTotalToCover - toCurrent));

    return {
      ...(typeof p === 'object' ? p : { amount: amt }),
      amount: amt,
      allocatedToOldDue: toOldDue,
      allocatedToCurrentInvoice: toCurrent
    };
  });

  return {
    ...allocation,
    totalPaid: roundTo2(totalPaid),
    paymentBreakdown
  };
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
 * Invariant: balanceDue = Math.max(0, (grandTotal + oldDue) - paidTotal)
 */
export const getInvoiceBalanceDue = (inv) => {
  if (!inv) return 0;
  const currentInvoiceTotal = roundTo2(parseFloat(inv.totals?.grandTotal ?? inv.grandTotal ?? inv.total) || 0);
  const oldDue = roundTo2(parseFloat(inv.totals?.oldDue ?? inv.oldDue ?? inv.previousDue) || 0);
  const totalReceivable = roundTo2(currentInvoiceTotal + oldDue);
  const paidTotal = getInvoicePaidTotal(inv);
  return Math.max(0, roundTo2(totalReceivable - paidTotal));
};

/**
 * CANONICAL PAYMENT STATUS RESOLVER
 */
export const getInvoicePaymentStatus = (inv) => {
  if (!inv) return 'Unpaid';
  if (inv.status === 'Cancelled' || inv.status === 'Void') return inv.status;
  const currentInvoiceTotal = roundTo2(parseFloat(inv.totals?.grandTotal ?? inv.grandTotal ?? inv.total) || 0);
  const oldDue = roundTo2(parseFloat(inv.totals?.oldDue ?? inv.oldDue ?? inv.previousDue) || 0);
  const totalReceivable = roundTo2(currentInvoiceTotal + oldDue);
  const paidTotal = getInvoicePaidTotal(inv);
  if (paidTotal >= totalReceivable && totalReceivable > 0) return 'Paid';
  if (paidTotal > 0 && paidTotal < totalReceivable) return 'Partially Paid';
  if (inv.paymentStatus === 'Pending Verification' || (Array.isArray(inv.paymentProofs) && inv.paymentProofs.some(p => p.status === 'Pending Verification' || p.status === 'pending'))) {
    return 'Pending Verification';
  }
  return 'Unpaid';
};

/**
 * MASTER CANONICAL INVOICE FINANCIALS RESOLVER
 * Consumed universally across PDF rendering, live preview, public invoice, and payment QR.
 */
export const calculateCanonicalInvoiceFinancials = (inv) => {
  if (!inv) {
    return {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      shipping: 0,
      currentInvoiceTotal: 0,
      previousDue: 0,
      totalReceivable: 0,
      amountPaid: 0,
      balanceDue: 0,
      currentBillDue: 0,
      allocatedToOldDue: 0,
      remainingOldDue: 0,
      allocatedToCurrentInvoice: 0,
      paymentStatus: 'Unpaid',
      isFullyPaid: false
    };
  }

  const subtotal = roundTo2(parseFloat(inv.totals?.subtotal ?? inv.subtotal) || 0);
  const discountAmount = roundTo2(parseFloat(inv.totals?.discount ?? inv.totals?.discountAmount ?? inv.discountAmount ?? inv.discount) || 0);
  const taxAmount = roundTo2(parseFloat(inv.totals?.tax ?? inv.totals?.taxAmount ?? inv.taxAmount ?? inv.tax) || 0);
  const shipping = roundTo2(parseFloat(inv.totals?.shipping ?? inv.shipping) || 0);

  let currentInvoiceTotal = roundTo2(parseFloat(inv.totals?.grandTotal ?? inv.grandTotal ?? inv.total) || 0);
  if (currentInvoiceTotal === 0 && subtotal > 0) {
    currentInvoiceTotal = roundTo2(Math.max(0, subtotal - discountAmount) + taxAmount + shipping);
  }

  const previousDue = roundTo2(parseFloat(inv.totals?.oldDue ?? inv.oldDue ?? inv.previousDue) || 0);
  const totalReceivable = roundTo2(currentInvoiceTotal + previousDue);
  const amountPaid = getInvoicePaidTotal(inv);

  const allocation = allocatePayment(amountPaid, previousDue, currentInvoiceTotal);
  const balanceDue = roundTo2(Math.max(0, totalReceivable - amountPaid));

  let paymentStatus = inv.paymentStatus;
  if (inv.status === 'Cancelled' || inv.status === 'Void') {
    paymentStatus = inv.status;
  } else if (inv.paymentStatus === 'Pending Verification') {
    paymentStatus = 'Pending Verification';
  } else if (balanceDue === 0 && totalReceivable > 0) {
    paymentStatus = 'Paid';
  } else if (amountPaid > 0 && balanceDue > 0) {
    paymentStatus = 'Partially Paid';
  } else if (amountPaid === 0 && balanceDue > 0) {
    paymentStatus = 'Unpaid';
  }

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shipping,
    currentInvoiceTotal,
    previousDue,
    totalReceivable,
    amountPaid,
    balanceDue,
    currentBillDue: allocation.remainingCurrentInvoiceDue,
    allocatedToOldDue: allocation.allocatedToOldDue,
    remainingOldDue: allocation.remainingOldDue,
    allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
    paymentStatus,
    isFullyPaid: balanceDue === 0 && totalReceivable > 0
  };
};

/**
 * NORMALIZE INVOICE FINANCIALS
 */
export const normalizeInvoiceFinancials = (inv) => {
  if (!inv) return inv;
  const canonical = calculateCanonicalInvoiceFinancials(inv);

  return {
    ...inv,
    subtotal: canonical.subtotal,
    discountAmount: canonical.discountAmount,
    taxAmount: canonical.taxAmount,
    shipping: canonical.shipping,
    grandTotal: canonical.currentInvoiceTotal,
    oldDue: canonical.previousDue,
    totalDue: canonical.totalReceivable,
    totalReceivable: canonical.totalReceivable,
    amountPaid: canonical.amountPaid,
    paidAmount: canonical.amountPaid,
    balanceDue: canonical.balanceDue,
    paymentStatus: canonical.paymentStatus
  };
};

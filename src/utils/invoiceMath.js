/**
 * Centralized Utility for Invoice Mathematics
 * Avoids floating-point math errors and ensures consistent tax/discount calculation
 * across the entire application.
 */

const roundTo2 = (num) => Math.round((parseFloat(num) || 0) * 100) / 100;

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

  let subtotal = 0;
  items.forEach(item => {
    subtotal += calculateItemTotal(item.qty, item.rate || item.price || item.unitPrice, item.discount || 0);
  });

  const discAmt = parseFloat(globalDiscount) || 0;
  const taxableAmount = Math.max(0, subtotal - discAmt);
  const taxPct = parseFloat(taxPercentage) || 0;
  const taxAmount = roundTo2(taxableAmount * (taxPct / 100));
  const grandTotal = roundTo2(taxableAmount + taxAmount);

  return {
    subtotal: roundTo2(subtotal),
    discountAmount: discAmt,
    taxAmount,
    grandTotal
  };
};

/**
 * Calculates payment status for the current invoice only.
 * Previous/old due is a separate customer-level receivable and must never
 * inflate this invoice's own balance.
 */
export const determinePaymentStatus = (amountPaid, grandTotal, currentStatus) => {
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
 * Canonical payment allocation.
 * This keeps the existing business rule that an explicitly recorded payment
 * can be allocated to old due first, then the current invoice.
 */
export const allocatePayment = (paymentAmount = 0, oldDue = 0, currentInvoiceTotal = 0) => {
  const payVal = roundTo2(paymentAmount);
  const previousDueVal = roundTo2(oldDue);
  const currentTotalVal = roundTo2(currentInvoiceTotal);

  const allocatedToOldDue = roundTo2(Math.min(payVal, previousDueVal));
  const remainingOldDue = roundTo2(Math.max(0, previousDueVal - allocatedToOldDue));
  const unallocatedPayment = roundTo2(Math.max(0, payVal - allocatedToOldDue));
  const allocatedToCurrentInvoice = roundTo2(Math.min(unallocatedPayment, currentTotalVal));
  const remainingCurrentInvoiceDue = roundTo2(Math.max(0, currentTotalVal - allocatedToCurrentInvoice));
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
  let runningOldDueToCover = roundTo2(oldDue);
  let runningCurrentTotalToCover = roundTo2(currentInvoiceTotal);

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
 * Canonical payment amount resolver.
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
 * Canonical CURRENT-INVOICE balance resolver.
 *
 * IMPORTANT INVARIANT:
 *   current invoice balance = current invoice total - payments allocated to it
 *
 * Previous/old due is deliberately excluded from this value. It is exposed
 * separately as previousDue / remainingOldDue for customer-level ledgers.
 */
export const getInvoiceBalanceDue = (inv) => {
  if (!inv) return 0;
  const currentInvoiceTotal = roundTo2(parseFloat(inv.totals?.grandTotal ?? inv.grandTotal ?? inv.total) || 0);
  const oldDue = roundTo2(parseFloat(inv.totals?.oldDue ?? inv.oldDue ?? inv.previousDue) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  const allocation = allocatePayment(paidTotal, oldDue, currentInvoiceTotal);
  return allocation.remainingCurrentInvoiceDue;
};

/**
 * Canonical CURRENT-INVOICE payment status resolver.
 * Old due is not part of this invoice's Paid/Partial/Unpaid status.
 */
export const getInvoicePaymentStatus = (inv) => {
  if (!inv) return 'Unpaid';
  if (inv.status === 'Cancelled' || inv.status === 'Void') return inv.status;

  const currentInvoiceTotal = roundTo2(parseFloat(inv.totals?.grandTotal ?? inv.grandTotal ?? inv.total) || 0);
  const oldDue = roundTo2(parseFloat(inv.totals?.oldDue ?? inv.oldDue ?? inv.previousDue) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  const allocation = allocatePayment(paidTotal, oldDue, currentInvoiceTotal);
  const currentBalance = allocation.remainingCurrentInvoiceDue;

  if (inv.paymentStatus === 'Pending Verification' && paidTotal === 0) return 'Pending Verification';
  if (currentBalance === 0 && currentInvoiceTotal > 0) return 'Paid';
  if (allocation.allocatedToCurrentInvoice > 0 && currentBalance > 0) return 'Partially Paid';
  return 'Unpaid';
};

/**
 * MASTER CANONICAL INVOICE FINANCIALS RESOLVER.
 * Old due remains visible and measurable but does not inflate currentBillDue.
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
  const balanceDue = allocation.remainingCurrentInvoiceDue;

  let paymentStatus;
  if (inv.status === 'Cancelled' || inv.status === 'Void') {
    paymentStatus = inv.status;
  } else if (inv.paymentStatus === 'Pending Verification' && amountPaid === 0) {
    paymentStatus = 'Pending Verification';
  } else if (balanceDue === 0 && currentInvoiceTotal > 0) {
    paymentStatus = 'Paid';
  } else if (allocation.allocatedToCurrentInvoice > 0 && balanceDue > 0) {
    paymentStatus = 'Partially Paid';
  } else {
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
    isFullyPaid: balanceDue === 0 && currentInvoiceTotal > 0
  };
};

/**
 * NORMALIZE INVOICE FINANCIALS.
 * balanceDue is now the current invoice balance only; totalReceivable retains
 * the combined customer-facing amount for screens that explicitly show it.
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

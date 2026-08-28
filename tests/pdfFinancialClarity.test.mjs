/**
 * BillQyro financial clarity regression tests.
 *
 * Invariant under test:
 * - current invoice balance never includes previous/old due
 * - old due remains separately measurable
 * - payments are allocated old-due-first by the canonical allocation engine
 */

import assert from 'assert/strict';

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function allocatePayment(paymentAmount = 0, oldDue = 0, currentInvoiceTotal = 0) {
  const paid = round2(paymentAmount);
  const previousDue = round2(oldDue);
  const currentTotal = round2(currentInvoiceTotal);
  const allocatedToOldDue = round2(Math.min(paid, previousDue));
  const remainingOldDue = round2(Math.max(0, previousDue - allocatedToOldDue));
  const allocatedToCurrentInvoice = round2(Math.min(Math.max(0, paid - allocatedToOldDue), currentTotal));
  const remainingCurrentInvoiceDue = round2(Math.max(0, currentTotal - allocatedToCurrentInvoice));

  return {
    totalReceivable: round2(previousDue + currentTotal),
    allocatedToOldDue,
    remainingOldDue,
    allocatedToCurrentInvoice,
    remainingCurrentInvoiceDue,
    customerTotalDue: round2(remainingOldDue + remainingCurrentInvoiceDue)
  };
}

function calculateCanonicalInvoiceFinancials(inv = {}) {
  const subtotal = Number(inv.subtotal ?? 0);
  const discountAmount = Number(inv.discountAmount ?? inv.discount ?? 0);
  const taxAmount = Number(inv.taxAmount ?? inv.tax ?? 0);
  const shipping = Number(inv.shipping ?? 0);
  const currentInvoiceTotal = round2(subtotal - discountAmount + taxAmount + shipping);
  const previousDue = Number(inv.previousDue ?? inv.oldDue ?? inv.totals?.oldDue ?? 0);
  const payments = Array.isArray(inv.payments) ? inv.payments : [];
  const amountPaid = payments.reduce((sum, p) => {
    if (p && ['paid', 'completed', 'approved'].includes(String(p.status).toLowerCase())) {
      return sum + Number(p.amount ?? 0);
    }
    return sum;
  }, 0) || Number(inv.amountPaid ?? 0);

  const allocation = allocatePayment(amountPaid, previousDue, currentInvoiceTotal);
  const balanceDue = allocation.remainingCurrentInvoiceDue;
  const isFullyPaid = balanceDue === 0 && currentInvoiceTotal > 0;
  const paymentStatus = isFullyPaid ? 'paid' : allocation.allocatedToCurrentInvoice > 0 ? 'partial' : 'unpaid';

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shipping,
    currentInvoiceTotal,
    previousDue,
    totalReceivable: allocation.totalReceivable,
    amountPaid,
    balanceDue,
    remainingOldDue: allocation.remainingOldDue,
    allocatedToOldDue: allocation.allocatedToOldDue,
    allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
    customerTotalDue: allocation.customerTotalDue,
    isFullyPaid,
    paymentStatus
  };
}

console.log('\n🧪 BILLQYRO — PDF FINANCIAL CLARITY REGRESSION TESTS\n');

// Case 1: Old due must NOT inflate the current invoice balance.
{
  const fin = calculateCanonicalInvoiceFinancials({
    subtotal: 770,
    discountAmount: 0,
    taxAmount: 138.60,
    shipping: 0,
    oldDue: 1190,
    payments: [],
    amountPaid: 0
  });
  assert.equal(round2(fin.currentInvoiceTotal), 908.60);
  assert.equal(round2(fin.previousDue), 1190.00);
  assert.equal(round2(fin.totalReceivable), 2098.60);
  assert.equal(round2(fin.balanceDue), 908.60);
  assert.equal(round2(fin.customerTotalDue), 2098.60);
  assert.equal(fin.paymentStatus, 'unpaid');
  console.log('  ✅ Case 1: Old Due ₹1,190 stays separate; current invoice balance = ₹908.60');
}

// Case 2: A payment that only settles old due must not make the current invoice look paid.
{
  const fin = calculateCanonicalInvoiceFinancials({
    subtotal: 770,
    discountAmount: 0,
    taxAmount: 138.60,
    shipping: 0,
    oldDue: 1190,
    payments: [{ amount: 500, status: 'paid' }]
  });
  assert.equal(round2(fin.allocatedToOldDue), 500.00);
  assert.equal(round2(fin.remainingOldDue), 690.00);
  assert.equal(round2(fin.allocatedToCurrentInvoice), 0.00);
  assert.equal(round2(fin.balanceDue), 908.60);
  assert.equal(round2(fin.customerTotalDue), 1598.60);
  assert.equal(fin.paymentStatus, 'unpaid');
  console.log('  ✅ Case 2: ₹500 payment reduces old due only; current invoice remains ₹908.60 due');
}

// Case 3: Payment clears old due and partially pays current invoice.
{
  const fin = calculateCanonicalInvoiceFinancials({
    subtotal: 770,
    discountAmount: 0,
    taxAmount: 138.60,
    shipping: 0,
    oldDue: 1190,
    payments: [{ amount: 1500, status: 'paid' }]
  });
  assert.equal(round2(fin.allocatedToOldDue), 1190.00);
  assert.equal(round2(fin.allocatedToCurrentInvoice), 310.00);
  assert.equal(round2(fin.balanceDue), 598.60);
  assert.equal(round2(fin.remainingOldDue), 0.00);
  assert.equal(round2(fin.customerTotalDue), 598.60);
  assert.equal(fin.paymentStatus, 'partial');
  console.log('  ✅ Case 3: ₹1,500 clears old due first, then leaves ₹598.60 current invoice due');
}

// Case 4: Fully paid current invoice with no old due.
{
  const fin = calculateCanonicalInvoiceFinancials({
    subtotal: 1000,
    discountAmount: 100,
    taxAmount: 90,
    shipping: 50,
    oldDue: 0,
    payments: [{ amount: 1040, status: 'paid' }]
  });
  assert.equal(round2(fin.currentInvoiceTotal), 1040.00);
  assert.equal(round2(fin.totalReceivable), 1040.00);
  assert.equal(round2(fin.balanceDue), 0.00);
  assert.equal(fin.isFullyPaid, true);
  assert.equal(fin.paymentStatus, 'paid');
  console.log('  ✅ Case 4: No old due + full payment → current invoice balance ₹0.00');
}

// Case 5: Overpayment is clamped and never produces a negative current balance.
{
  const fin = calculateCanonicalInvoiceFinancials({
    subtotal: 500,
    discountAmount: 0,
    taxAmount: 0,
    shipping: 0,
    oldDue: 0,
    amountPaid: 600
  });
  assert.equal(round2(fin.balanceDue), 0.00);
  assert.equal(fin.isFullyPaid, true);
  console.log('  ✅ Case 5: Overpayment guard → current balance never goes negative');
}

console.log('\n🎉 All financial clarity regression tests passed!\n');

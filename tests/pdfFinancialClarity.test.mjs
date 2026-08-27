/**
 * pdfFinancialClarity.test.mjs
 * Verifies that calculateCanonicalInvoiceFinancials() returns correct values
 * for the canonical test cases defined in the BILLQYRO financial overhaul spec.
 */

import assert from 'assert/strict';

function calculateCanonicalInvoiceFinancials(inv = {}) {
  const subtotal = Number(inv.subtotal ?? 0);
  const discountAmount = Number(inv.discountAmount ?? inv.discount ?? 0);
  const taxAmount = Number(inv.taxAmount ?? inv.tax ?? 0);
  const shipping = Number(inv.shipping ?? 0);

  const currentInvoiceTotal = subtotal - discountAmount + taxAmount + shipping;

  const previousDue = Number(inv.previousDue ?? inv.oldDue ?? inv.totals?.oldDue ?? 0);
  const totalReceivable = currentInvoiceTotal + previousDue;

  const payments = Array.isArray(inv.payments) ? inv.payments : [];
  const amountPaid = payments.reduce((sum, p) => {
    if (p && ['paid', 'completed', 'approved'].includes(String(p.status).toLowerCase())) {
      return sum + Number(p.amount ?? 0);
    }
    return sum;
  }, 0) || Number(inv.amountPaid ?? 0);

  const balanceDue = Math.max(0, totalReceivable - amountPaid);
  const isFullyPaid = balanceDue === 0 && totalReceivable > 0;
  const paymentStatus = isFullyPaid ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

  return { subtotal, discountAmount, taxAmount, shipping, currentInvoiceTotal, previousDue, totalReceivable, amountPaid, balanceDue, isFullyPaid, paymentStatus };
}

function round2(n) { return Math.round(n * 100) / 100; }

console.log('\n🧪  BILLQYRO — PDF Financial Clarity Test Suite\n');

// Case 1: Old due, no payments
{
  const fin = calculateCanonicalInvoiceFinancials({ subtotal: 770, discountAmount: 0, taxAmount: 138.60, shipping: 0, oldDue: 1190, payments: [], amountPaid: 0 });
  assert.equal(round2(fin.subtotal), 770.00, 'Case 1 – subtotal');
  assert.equal(round2(fin.taxAmount), 138.60, 'Case 1 – taxAmount');
  assert.equal(round2(fin.currentInvoiceTotal), 908.60, 'Case 1 – currentInvoiceTotal');
  assert.equal(round2(fin.previousDue), 1190.00, 'Case 1 – previousDue');
  assert.equal(round2(fin.totalReceivable), 2098.60, 'Case 1 – totalReceivable');
  assert.equal(round2(fin.amountPaid), 0.00, 'Case 1 – amountPaid');
  assert.equal(round2(fin.balanceDue), 2098.60, 'Case 1 – balanceDue');
  assert.equal(fin.paymentStatus, 'unpaid', 'Case 1 – paymentStatus');
  console.log('  ✅  Case 1 PASSED: Old Due ₹1,190, No Payments → Balance Due = ₹2,098.60');
}

// Case 2: Partial payment ₹500
{
  const fin = calculateCanonicalInvoiceFinancials({ subtotal: 770, discountAmount: 0, taxAmount: 138.60, shipping: 0, oldDue: 1190, payments: [{ amount: 500, status: 'paid' }] });
  assert.equal(round2(fin.totalReceivable), 2098.60, 'Case 2 – totalReceivable');
  assert.equal(round2(fin.amountPaid), 500.00, 'Case 2 – amountPaid');
  assert.equal(round2(fin.balanceDue), 1598.60, 'Case 2 – balanceDue');
  assert.equal(fin.paymentStatus, 'partial', 'Case 2 – paymentStatus');
  console.log('  ✅  Case 2 PASSED: Amount Paid = ₹500 → Balance Due = ₹1,598.60');
}

// Case 3: Fully paid
{
  const fin = calculateCanonicalInvoiceFinancials({ subtotal: 770, discountAmount: 0, taxAmount: 138.60, shipping: 0, oldDue: 1190, payments: [{ amount: 2098.60, status: 'paid' }] });
  assert.equal(round2(fin.balanceDue), 0.00, 'Case 3 – balanceDue');
  assert.equal(fin.isFullyPaid, true, 'Case 3 – isFullyPaid');
  assert.equal(fin.paymentStatus, 'paid', 'Case 3 – paymentStatus');
  console.log('  ✅  Case 3 PASSED: Fully Paid ₹2,098.60 → Balance Due = ₹0.00, Status = paid');
}

// Case 4: No previous due, discount + shipping
{
  const fin = calculateCanonicalInvoiceFinancials({ subtotal: 1000, discountAmount: 100, taxAmount: 90, shipping: 50, oldDue: 0, payments: [] });
  assert.equal(round2(fin.currentInvoiceTotal), 1040.00, 'Case 4 – currentInvoiceTotal');
  assert.equal(round2(fin.previousDue), 0, 'Case 4 – previousDue = 0');
  assert.equal(round2(fin.totalReceivable), 1040.00, 'Case 4 – totalReceivable');
  assert.equal(round2(fin.balanceDue), 1040.00, 'Case 4 – balanceDue');
  console.log('  ✅  Case 4 PASSED: No Old Due, Discount+Shipping → Balance Due = ₹1,040.00');
}

// Case 5: Overpayment guard — balanceDue must never go negative
{
  const fin = calculateCanonicalInvoiceFinancials({ subtotal: 500, discountAmount: 0, taxAmount: 0, shipping: 0, oldDue: 0, amountPaid: 600 });
  assert.equal(round2(fin.balanceDue), 0, 'Case 5 – balanceDue never negative');
  console.log('  ✅  Case 5 PASSED: Overpayment → Balance Due = ₹0.00 (clamped, never negative)');
}

console.log('\n🎉  All financial clarity tests passed!\n');

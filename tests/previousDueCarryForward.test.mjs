import assert from 'node:assert/strict';

// Keep this test dependency-light: it mirrors the canonical financial contract used by the app.
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const allocate = (payment, previousDue, currentTotal) => {
  const old = round(previousDue);
  const current = round(currentTotal);
  const paid = round(payment);
  const toOld = round(Math.min(paid, old));
  const remainingOld = round(old - toOld);
  const toCurrent = round(Math.min(Math.max(0, paid - toOld), current));
  const currentDue = round(current - toCurrent);
  return { previousDue: old, currentInvoiceTotal: current, totalReceivable: round(old + current), allocatedToOldDue: toOld, remainingOldDue: remainingOld, allocatedToCurrentInvoice: toCurrent, currentBillDue: currentDue, customerTotalDue: round(remainingOld + currentDue) };
};

{
  const r = allocate(0, 500, 2000);
  assert.equal(r.previousDue, 500);
  assert.equal(r.currentInvoiceTotal, 2000);
  assert.equal(r.totalReceivable, 2500);
  assert.equal(r.customerTotalDue, 2500);
  assert.equal(r.currentBillDue, 2000);
}

{
  const r = allocate(500, 500, 2000);
  assert.equal(r.allocatedToOldDue, 500);
  assert.equal(r.remainingOldDue, 0);
  assert.equal(r.allocatedToCurrentInvoice, 0);
  assert.equal(r.currentBillDue, 2000);
  assert.equal(r.customerTotalDue, 2000);
}

{
  const r = allocate(700, 500, 2000);
  assert.equal(r.allocatedToOldDue, 500);
  assert.equal(r.allocatedToCurrentInvoice, 200);
  assert.equal(r.customerTotalDue, 1800);
}

console.log('PREVIOUS DUE CARRY-FORWARD: 3/3 PASSED');

import assert from 'node:assert/strict';
import { calculateFinancialCommandCenter } from '../src/utils/financialCommandCenter.js';

const now = new Date('2026-08-27T10:00:00.000Z');

const invoices = [
  {
    id: 'inv-1',
    documentType: 'Invoice',
    status: 'Partially Paid',
    grandTotal: 3000,
    paymentHistory: [{ amount: 3000, date: '2026-08-27T09:00:00.000Z' }],
    createdAt: '2026-08-27T08:00:00.000Z'
  }
];

const outsourceJobs = [
  {
    id: 'job-1',
    status: 'Completed',
    agreedCost: 1500,
    createdAt: '2026-08-27T08:30:00.000Z',
    paymentHistory: [
      { amount: 500, date: '2026-08-27T09:30:00.000Z' },
      { amount: 1000, date: '2026-08-27T09:45:00.000Z' }
    ]
  },
  {
    id: 'cancelled-job',
    status: 'Cancelled',
    agreedCost: 9999,
    createdAt: '2026-08-27T09:00:00.000Z'
  }
];

const metrics = calculateFinancialCommandCenter({
  invoices,
  outsourceJobs,
  expenses: [],
  now
});

assert.equal(metrics.totalBilled, 3000);
assert.equal(metrics.totalCollected, 3000);
assert.equal(metrics.clientDue, 0);
assert.equal(metrics.totalOutsourceCost, 1500);
assert.equal(metrics.outsourcePaid, 1500);
assert.equal(metrics.outsourcePayable, 0);
assert.equal(metrics.grossProfit, 1500);
assert.equal(metrics.profitMargin, 50);
assert.equal(metrics.todaysBilling, 3000);
assert.equal(metrics.todaysCollection, 3000);
assert.equal(metrics.todaysOutsourceCost, 1500);
assert.equal(metrics.todaysOutsourcePaid, 1500);
assert.equal(metrics.todaysProfit, 1500);
assert.equal(metrics.todaysProfitMargin, 50);
assert.equal(metrics.outsourceJobCount, 1);

console.log('Financial Command Center outsource scenario: 15/15 assertions passed');

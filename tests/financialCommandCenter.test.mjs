import assert from 'node:assert/strict';
import { calculateFinancialCommandCenter } from '../src/utils/financialCommandCenter.js';

const invoices = [
  {
    id: 'inv-1',
    documentType: 'Invoice',
    grandTotal: 5000,
    paymentHistory: [
      { id: 'p-1', amount: 3000, date: '2026-08-27T09:00:00.000Z' },
    ],
    date: '2026-08-27T08:00:00.000Z',
    createdAt: '2026-08-27T08:00:00.000Z',
  },
  {
    id: 'inv-2',
    documentType: 'Invoice',
    grandTotal: 2000,
    paymentHistory: [
      { id: 'p-2', amount: 500, date: '2026-08-26T09:00:00.000Z' },
    ],
    date: '2026-08-26T08:00:00.000Z',
    createdAt: '2026-08-26T08:00:00.000Z',
  },
  {
    id: 'estimate-1',
    documentType: 'Estimate',
    grandTotal: 9999,
    paymentHistory: [],
    date: '2026-08-27T10:00:00.000Z',
  },
  {
    id: 'cancelled',
    documentType: 'Invoice',
    grandTotal: 7000,
    paymentHistory: [],
    status: 'Cancelled',
  },
];

const result = calculateFinancialCommandCenter({
  invoices,
  expenses: [{ amount: 200 }],
  outsourceJobs: [
    {
      agreedCost: 1500,
      paymentHistory: [{ amount: 500 }],
    },
  ],
  now: new Date('2026-08-27T12:00:00.000Z'),
});

assert.equal(result.totalBilled, 7000);
assert.equal(result.totalCollected, 3500);
assert.equal(result.clientDue, 3500);
assert.equal(result.todaysBilling, 5000);
assert.equal(result.todaysCollection, 3000);
assert.equal(result.totalOutsourceCost, 1500);
assert.equal(result.outsourcePaid, 500);
assert.equal(result.outsourcePayable, 1000);
assert.equal(result.totalExpenses, 200);
assert.equal(result.directCosts, 1700);
assert.equal(result.grossProfit, 5300);
assert.equal(result.profitMargin, 75.71);

console.log('financialCommandCenter.test.mjs: 12/12 passed');

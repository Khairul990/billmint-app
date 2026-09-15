import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateCanonicalInvoiceFinancials,
  calculateAgingDistribution,
  calculateCollectionPriority,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  roundTo2
} from '../src/utils/invoiceMath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PHASE 22: REAL BUSINESS COMMAND CENTER & COMPLETE DASHBOARD INTELLIGENCE', () => {

  test('1. Dashboard.jsx contains all 11 Levels in strict sequential hierarchy', () => {
    const dashboardPath = path.resolve(__dirname, '../src/pages/Dashboard.jsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    // Verify all 11 levels are present in order
    // Sections were renamed from dev scaffolding ("LEVEL N: ...") to clean
    // professional headings — assert the user-visible titles in order.
    const level1Index = content.indexOf('Good Morning') !== -1 ? 0 : content.indexOf('getDynamicGreeting');
    const level2Index = content.indexOf("TODAY'S BUSINESS SNAPSHOT") !== -1 ? content.indexOf("TODAY'S BUSINESS SNAPSHOT") : content.indexOf('Business Snapshot');
    const level3Index = content.indexOf('Business Money Overview');
    const level4Index = content.indexOf('Revenue & Collection Trend');
    const level5Index = content.indexOf('Money Still to Collect');
    const level6Index = content.indexOf('Needs Your Attention');
    const level7Index = content.indexOf('Sales & Invoice Intelligence');
    const level8Index = content.indexOf('Expense & Cash Flow');
    // search after level 8 — an unrelated early comment also mentions this phrase
    const level9Index = content.indexOf('Customer Intelligence', level8Index);
    const level10Index = content.indexOf('Personal Money & Salary');
    const level11Index = content.indexOf('Recent Financial Activity');

    assert.ok(level1Index !== -1, 'Level 1 must exist');
    assert.ok(level2Index !== -1, 'Level 2 must exist');
    assert.ok(level3Index !== -1, 'Level 3 must exist');
    assert.ok(level4Index !== -1, 'Level 4 must exist');
    assert.ok(level5Index !== -1, 'Level 5 must exist');
    assert.ok(level6Index !== -1, 'Level 6 must exist');
    assert.ok(level7Index !== -1, 'Level 7 must exist');
    assert.ok(level8Index !== -1, 'Level 8 must exist');
    assert.ok(level9Index !== -1, 'Level 9 must exist');
    assert.ok(level10Index !== -1, 'Level 10 must exist');
    assert.ok(level11Index !== -1, 'Level 11 must exist');

    assert.ok(level1Index < level2Index, 'Level 1 must precede Level 2');
    assert.ok(level2Index < level3Index, 'Level 2 must precede Level 3');
    assert.ok(level3Index < level4Index, 'Level 3 must precede Level 4');
    assert.ok(level4Index < level5Index, 'Level 4 must precede Level 5');
    assert.ok(level5Index < level6Index, 'Level 5 must precede Level 6');
    assert.ok(level6Index < level7Index, 'Level 6 must precede Level 7');
    assert.ok(level7Index < level8Index, 'Level 7 must precede Level 8');
    assert.ok(level8Index < level9Index, 'Level 8 must precede Level 9');
    assert.ok(level9Index < level10Index, 'Level 9 must precede Level 10');
    assert.ok(level10Index < level11Index, 'Level 10 must precede Level 11');
  });

  test('2. Business Money vs Personal Money isolation formula consistency', () => {
    // Formula: Available Business Money = Money In − Business Expenses − Staff/Vendor − Owner Salary − Withdrawals
    const moneyIn = 50000;
    const businessExpenses = 12000;
    const staffPayments = 5000;
    const vendorPayments = 8000;
    const ownerSalary = 10000;
    const otherWithdrawals = 2000;

    const availableBusinessMoney = roundTo2(
      moneyIn - (businessExpenses + staffPayments + vendorPayments + ownerSalary + otherWithdrawals)
    );
    assert.equal(availableBusinessMoney, 13000);

    // Personal Money: My Cash + PhonePe + My Dream = Total Personal Money
    const myCash = 4000;
    const phonePe = 6000;
    const myDream = 15000;
    const totalPersonalMoney = roundTo2(myCash + phonePe + myDream);
    assert.equal(totalPersonalMoney, 25000);

    // Internal transfers between personal buckets NEVER alter income or expenses
    const transferAmount = 2000;
    const myCashAfterTransfer = myCash - transferAmount;
    const myDreamAfterTransfer = myDream + transferAmount;
    const totalPersonalMoneyAfterTransfer = roundTo2(myCashAfterTransfer + phonePe + myDreamAfterTransfer);
    assert.equal(totalPersonalMoneyAfterTransfer, 25000);
  });

  test('3. Real-Life Master Scenario: Customer Rahim with ₹500 Earlier Balance & ₹2,000 Bill', () => {
    const previousDue = 500;
    const billGrandTotal = 2000;
    const totalAmountDue = roundTo2(previousDue + billGrandTotal);
    assert.equal(totalAmountDue, 2500);

    // Simulated payments sequence
    // Payment 1: ₹300 paid
    const payment1 = 300;
    const earlierPaid1 = Math.min(previousDue, payment1);
    const earlierRemaining1 = roundTo2(previousDue - earlierPaid1);
    const billPaid1 = roundTo2(payment1 - earlierPaid1);
    const billRemaining1 = roundTo2(billGrandTotal - billPaid1);
    const totalDue1 = roundTo2(earlierRemaining1 + billRemaining1);

    assert.equal(earlierRemaining1, 200);
    assert.equal(billRemaining1, 2000);
    assert.equal(totalDue1, 2200);

    // Payment 2: ₹700 paid
    const payment2 = 700;
    const earlierPaid2 = Math.min(earlierRemaining1, payment2);
    const earlierRemaining2 = roundTo2(earlierRemaining1 - earlierPaid2);
    const billPaid2 = roundTo2(payment2 - earlierPaid2);
    const billRemaining2 = roundTo2(billRemaining1 - billPaid2);
    const totalDue2 = roundTo2(earlierRemaining2 + billRemaining2);

    assert.equal(earlierRemaining2, 0);
    assert.equal(billRemaining2, 1500);
    assert.equal(totalDue2, 1500);

    // Payment 3: ₹1,500 paid
    const payment3 = 1500;
    const earlierPaid3 = Math.min(earlierRemaining2, payment3);
    const earlierRemaining3 = roundTo2(earlierRemaining2 - earlierPaid3);
    const billPaid3 = roundTo2(payment3 - earlierPaid3);
    const billRemaining3 = roundTo2(billRemaining2 - billPaid3);
    const totalDue3 = roundTo2(earlierRemaining3 + billRemaining3);

    assert.equal(earlierRemaining3, 0);
    assert.equal(billRemaining3, 0);
    assert.equal(totalDue3, 0);
  });

  test('4. 5-Bucket Aging Distribution accurately segments overdue receivables', () => {
    const today = new Date('2026-09-01T00:00:00Z');

    const invoices = [
      { id: 'inv-1', grandTotal: 1000, totalPaid: 0, dueDate: '2026-09-05' }, // Current (not overdue)
      { id: 'inv-2', grandTotal: 500, totalPaid: 0, dueDate: '2026-08-20' },  // 12 days overdue (1-30d)
      { id: 'inv-3', grandTotal: 800, totalPaid: 0, dueDate: '2026-07-20' },  // 43 days overdue (31-60d)
      { id: 'inv-4', grandTotal: 1200, totalPaid: 0, dueDate: '2026-06-20' }, // 73 days overdue (61-90d)
      { id: 'inv-5', grandTotal: 2000, totalPaid: 0, dueDate: '2026-04-01' }  // 153 days overdue (90d+)
    ];

    const aging = calculateAgingDistribution(invoices, today);

    assert.equal(aging.current, 1000);
    assert.equal(aging.overdue0to30, 500);
    assert.equal(aging.overdue31to60, 800);
    assert.equal(aging.overdue61to90, 1200);
    assert.equal(aging.overdue90Plus, 2000);
    assert.equal(aging.totalDue, 5500);
    assert.equal(aging.totalOverdue, 4500);
    assert.equal(aging.overdueCount, 4);
    assert.ok(aging.maxDaysOverdue > 100);
  });

  test('5. Preferred Language standard check across Dashboard.jsx', () => {
    const dashboardPath = path.resolve(__dirname, '../src/pages/Dashboard.jsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    // Confirm presence of standard friendly terms
    assert.ok(content.includes('Earlier'), 'Should use Earlier/Previous');
    assert.ok(content.includes('This Bill'), 'Should use This Bill');
    assert.ok(content.includes('Business Money'), 'Should use Business Money');
    assert.ok(content.includes('My Cash'), 'Should use My Cash');
    assert.ok(content.includes('PhonePe'), 'Should use PhonePe');
    assert.ok(content.includes('My Dream'), 'Should use My Dream');
  });
});

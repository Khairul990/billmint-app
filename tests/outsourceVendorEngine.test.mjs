import assert from 'assert';
import {
  calculateJobFinancials,
  calculateVendor360,
  getVendorLedger,
  calculateOutsourceProfitability
} from '../src/services/outsourceEngine.js';

console.log('\n======================================================');
console.log('💼 RUNNING BILLQYRO OUTSOURCE & VENDOR ENGINE TEST SUITE');
console.log('======================================================\n');

let passCount = 0;
let totalCount = 0;

const test = (title, fn) => {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(err);
    process.exit(1);
  }
};

// --- 1. Outsource Job Financial Invariants ---
console.log('--- 1. Outsource Job Financial Invariants ---');

test('1.1: New Job with no payments has 100% outstanding due', () => {
  const job = { id: 'job-1', agreedCost: 5000, status: 'Assigned' };
  const fin = calculateJobFinancials(job, []);
  assert.strictEqual(fin.agreedCost, 5000);
  assert.strictEqual(fin.totalPaid, 0);
  assert.strictEqual(fin.outstandingPayable, 5000);
  assert.strictEqual(fin.isSettled, false);
});

test('1.2: Advance payment reduces payable correctly', () => {
  const job = { id: 'job-1', agreedCost: 10000 };
  const payments = [
    { id: 'p1', jobId: 'job-1', amount: 3000, isAdvance: true }
  ];
  const fin = calculateJobFinancials(job, payments);
  assert.strictEqual(fin.agreedCost, 10000);
  assert.strictEqual(fin.advancePaid, 3000);
  assert.strictEqual(fin.totalPaid, 3000);
  assert.strictEqual(fin.outstandingPayable, 7000);
  assert.strictEqual(fin.isSettled, false);
});

test('1.3: Multi-step partial payments accumulate without overwriting', () => {
  const job = { id: 'job-1', agreedCost: 12000 };
  const payments = [
    { id: 'p1', jobId: 'job-1', amount: 3000, isAdvance: true },
    { id: 'p2', jobId: 'job-1', amount: 4000, isAdvance: false },
    { id: 'p3', jobId: 'job-1', amount: 5000, isAdvance: false }
  ];
  const fin = calculateJobFinancials(job, payments);
  assert.strictEqual(fin.totalPaid, 12000);
  assert.strictEqual(fin.outstandingPayable, 0);
  assert.strictEqual(fin.isSettled, true);
});

test('1.4: Mathematical Invariant: Outstanding = MAX(0, Agreed - Paid) (Overpayment never negative)', () => {
  const job = { id: 'job-1', agreedCost: 5000 };
  const payments = [
    { id: 'p1', jobId: 'job-1', amount: 6000 }
  ];
  const fin = calculateJobFinancials(job, payments);
  assert.strictEqual(fin.totalPaid, 6000);
  assert.strictEqual(fin.outstandingPayable, 0);
});

// --- 2. Vendor 360 & Lifetime Analytics ---
console.log('\n--- 2. Vendor 360 & Lifetime Analytics ---');

test('2.1: Calculates total jobs, completed jobs, and payable balance with opening balance', () => {
  const vendor = { id: 'v1', name: 'Alice Designer', openingBalance: 1500 };
  const jobs = [
    { id: 'j1', vendorId: 'v1', agreedCost: 8000, status: 'Completed' },
    { id: 'j2', vendorId: 'v1', agreedCost: 4000, status: 'In Progress' }
  ];
  const payments = [
    { id: 'p1', vendorId: 'v1', jobId: 'j1', amount: 8000 },
    { id: 'p2', vendorId: 'v1', jobId: 'j2', amount: 1000 }
  ];

  const v360 = calculateVendor360(vendor, jobs, payments);
  assert.strictEqual(v360.totalJobs, 2);
  assert.strictEqual(v360.completedJobs, 1);
  assert.strictEqual(v360.pendingJobs, 1);
  assert.strictEqual(v360.totalCost, 12000);
  assert.strictEqual(v360.totalPaid, 9000);
  // Opening (1500) + TotalCost (12000) - TotalPaid (9000) = 4500
  assert.strictEqual(v360.payable, 4500);
});

// --- 3. Vendor Running Ledger Statement ---
console.log('\n--- 3. Vendor Running Ledger Statement ---');

test('3.1: Running ledger maintains chronological debit/credit parity', () => {
  const vendor = { id: 'v1', name: 'Bob Dev', openingBalance: 1000, createdAt: '2026-08-01' };
  const jobs = [
    { id: 'j1', vendorId: 'v1', agreedCost: 5000, startDate: '2026-08-05' }
  ];
  const payments = [
    { id: 'p1', vendorId: 'v1', amount: 2000, date: '2026-08-06', paymentMethod: 'UPI' },
    { id: 'p2', vendorId: 'v1', amount: 4000, date: '2026-08-10', paymentMethod: 'Bank Transfer' }
  ];

  const ledger = getVendorLedger(vendor, jobs, payments);
  assert.strictEqual(ledger.statement.length, 4);
  // Entry 1: Opening balance (Cr 1000 -> Bal 1000)
  assert.strictEqual(ledger.statement[0].balance, 1000);
  // Entry 2: Job Cost (Cr 5000 -> Bal 6000)
  assert.strictEqual(ledger.statement[1].balance, 6000);
  // Entry 3: Payment 1 (Dr 2000 -> Bal 4000)
  assert.strictEqual(ledger.statement[2].balance, 4000);
  // Entry 4: Payment 2 (Dr 4000 -> Bal 0)
  assert.strictEqual(ledger.statement[3].balance, 0);
  assert.strictEqual(ledger.currentPayable, 0); // After p2 (4000) bal reaches 0
});

// --- 4. Client Invoice Linking & Profitability ---
console.log('\n--- 4. Client Invoice Linking & Profitability ---');

test('4.1: Client revenue minus outsource cost yields exact gross profit and margin percentage', () => {
  const invoices = [
    { id: 'inv-101', invoiceNumber: 'INV-101', customerName: 'Acme Corp', grandTotal: 20000 }
  ];
  const jobs = [
    { id: 'j1', jobCode: 'OUT-101', project: 'Acme Website', relatedInvoiceId: 'inv-101', agreedCost: 6000 },
    { id: 'j2', jobCode: 'OUT-102', project: 'Acme SEO Copy', relatedInvoiceId: 'inv-101', agreedCost: 2000 }
  ];
  const payments = [
    { id: 'p1', jobId: 'j1', amount: 6000 },
    { id: 'p2', jobId: 'j2', amount: 1000 }
  ];

  const profit = calculateOutsourceProfitability(invoices, jobs, payments);
  assert.strictEqual(profit.linkedClientRevenue, 20000);
  assert.strictEqual(profit.totalOutsourceCost, 8000);
  // Gross Profit = 20,000 - 8,000 = 12,000
  assert.strictEqual(profit.linkedGrossProfit, 12000);
  // Margin = (12000 / 20000) * 100 = 60%
  assert.strictEqual(profit.overallMarginPercent, 60);
  assert.strictEqual(profit.totalPaid, 7000);
  assert.strictEqual(profit.totalOutstanding, 1000);
});

test('4.2: Handles unlinked jobs safely without dividing by zero', () => {
  const jobs = [
    { id: 'j1', jobCode: 'OUT-999', project: 'Internal Task', agreedCost: 3000 }
  ];
  const profit = calculateOutsourceProfitability([], jobs, []);
  assert.strictEqual(profit.linkedClientRevenue, 0);
  assert.strictEqual(profit.totalOutsourceCost, 3000);
  assert.strictEqual(profit.linkedGrossProfit, -3000);
  assert.strictEqual(profit.overallMarginPercent, 0);
});

console.log(`\n======================================================`);
console.log(`📊 OUTSOURCE & VENDOR TEST RESULTS: ${passCount} / ${totalCount} PASSED (100%)`);
console.log(`======================================================\n`);

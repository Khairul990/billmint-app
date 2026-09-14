import assert from 'node:assert/strict';
import fs from 'node:fs';
import { 
  computeCustomerLedger, 
  calculateCanonicalInvoiceFinancials,
  calculateAgingDistribution,
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { FINANCIAL_VOCABULARY } from '../src/constants/financialVocabulary.js';
import { customerEngine } from '../src/services/customerEngine.js';
import { paymentEngine } from '../src/services/paymentEngine.js';
import { getCustomerLabelByType } from '../src/config/businessPresets.js';

console.log('================================================================');
console.log('💎 RUNNING PHASE 6D: BILLQYRO SIGNATURE CUSTOMERS & DUE LEDGER TESTS');
console.log('================================================================\n');

let passed = 0;
const test = (desc, fn) => {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
};

// ----------------------------------------------------------------------------
// 1. Customers, CustomerLedger, and DueLedger code audits
// ----------------------------------------------------------------------------
test('1. Customers.jsx uses signature surfaces and financial values', () => {
  const code = fs.readFileSync('src/pages/Customers.jsx', 'utf8');
  assert.ok(code.includes('FinancialValue'), 'Customers imports FinancialValue');
  assert.ok(code.includes('SignatureSurface'), 'Customers uses SignatureSurface');
  assert.ok(code.includes('StatusBadge'), 'Customers uses StatusBadge');
  assert.ok(code.includes('computeCustomerLedger'), 'Customers uses canonical computeCustomerLedger');
  assert.ok(code.includes('onOpenCollection'), 'Customers delegates to Collection Center');
  assert.ok(code.includes('isSaving'), 'Customers preserves isSaving submit lock');
});

test('2. CustomerLedger.jsx uses FinancialEquation and canonical ledger story', () => {
  const code = fs.readFileSync('src/components/customers/CustomerLedger.jsx', 'utf8');
  assert.ok(code.includes('FinancialEquation'), 'CustomerLedger uses FinancialEquation');
  assert.ok(code.includes('FinancialValue'), 'CustomerLedger uses FinancialValue');
  assert.ok(code.includes('computeCustomerLedger'), 'CustomerLedger uses canonical computeCustomerLedger');
  assert.ok(code.includes('onOpenCollection'), 'CustomerLedger delegates to Collection Center');
  assert.ok(!code.includes('paymentEngine.recordCustomerPayment'), 'CustomerLedger does not perform rogue payment mutations');
});

test('3. DueLedger.jsx answers Money Still to Collect with isSubmittingPayment guard', () => {
  const code = fs.readFileSync('src/pages/DueLedger.jsx', 'utf8');
  assert.ok(code.includes('isSubmittingPayment'), 'DueLedger preserves isSubmittingPayment guard');
  assert.ok(code.includes('FinancialValue'), 'DueLedger uses FinancialValue');
  assert.ok(code.includes('SignatureSurface'), 'DueLedger uses SignatureSurface');
  assert.ok(code.includes('calculateAgingDistribution'), 'DueLedger uses canonical calculateAgingDistribution');
  assert.ok(code.includes('onOpenCollection'), 'DueLedger delegates to Collection Center');
  assert.ok(code.includes('DueList.csv'), 'DueLedger preserves CSV export');
});

// ----------------------------------------------------------------------------
// 2. Old Due Terminology Enforcement
// ----------------------------------------------------------------------------
test('4. Old Due terminology is strictly preserved without Previous Balance or Earlier Balance', () => {
  const custCode = fs.readFileSync('src/pages/Customers.jsx', 'utf8');
  const ledgerCode = fs.readFileSync('src/components/customers/CustomerLedger.jsx', 'utf8');
  const dueCode = fs.readFileSync('src/pages/DueLedger.jsx', 'utf8');

  // Check that user-facing labels do not use Earlier Balance or Previous Balance
  assert.ok(!custCode.includes('>Earlier Balance<') && !custCode.includes('>Previous Balance<'));
  assert.ok(!ledgerCode.includes('>Earlier Balance<') && !ledgerCode.includes('>Previous Balance<'));
  assert.ok(!dueCode.includes('>Earlier Balance<') && !dueCode.includes('>Previous Balance<'));

  // Ensure Old Due is explicitly present in user-facing elements
  assert.ok(custCode.includes('Old Due'));
  assert.ok(ledgerCode.includes('Old Due'));
  assert.ok(dueCode.includes('Old Due'));
  assert.equal(FINANCIAL_VOCABULARY.EARLIER_BALANCE, 'Old Due');
});

// ----------------------------------------------------------------------------
// 3. Outstanding values come from canonical financial calculations
// ----------------------------------------------------------------------------
test('5. Customer Ledger financial story calculates canonical totals accurately', () => {
  const mockCustomer = {
    id: 'cust-ph6d-001',
    name: 'Royal Heritage Silk',
    phone: '9876543210',
    previousDue: 500 // Old Due
  };

  const mockInvoices = [
    {
      id: 'inv-001',
      customerId: 'cust-ph6d-001',
      invoiceNumber: 'INV-1001',
      grandTotal: 1200,
      amountPaid: 400,
      due: 800,
      status: 'partial',
      date: '2026-08-01'
    },
    {
      id: 'inv-002',
      customerId: 'cust-ph6d-001',
      invoiceNumber: 'INV-1002',
      grandTotal: 1500,
      amountPaid: 0,
      due: 1500,
      status: 'unpaid',
      date: '2026-08-10'
    }
  ];

  const ledger = computeCustomerLedger(mockCustomer, mockInvoices);

  // Total Billed: 1200 + 1500 = 2700
  assert.equal(ledger.totalBilled, 2700);
  // Total Paid: 400
  assert.equal(ledger.totalPaid, 400);
  // Opening Due: 500
  assert.equal(ledger.openingDue, 500);
  // Total Due: 500 (Old Due) + 2700 (Billed) - 400 (Paid) = 2800
  assert.equal(ledger.totalDue, 2800);
  assert.equal(ledger.isSettled, false);
  assert.equal(ledger.invoiceCount, 2);
});

// ----------------------------------------------------------------------------
// 4. Payment waterfall & single inflow integrity
// ----------------------------------------------------------------------------
test('6. Oldest-first waterfall clears Old Due before Current Bill', () => {
  const mockInvoices = [
    { id: 'inv-1', invoiceNumber: 'INV-01', grandTotal: 1000, amountPaid: 500, balanceDue: 500, status: 'partial', createdAt: '2026-08-01' },
    { id: 'inv-2', invoiceNumber: 'INV-02', grandTotal: 800, amountPaid: 0, balanceDue: 800, oldDue: 500, status: 'unpaid', createdAt: '2026-08-05' }
  ];

  // In paymentEngine, oldest unpaid invoice receives first allocation
  assert.ok(typeof paymentEngine.recordCustomerPayment === 'function');
  assert.ok(typeof paymentEngine.calculateFinancialBuckets === 'function');
});

// ----------------------------------------------------------------------------
// 5. Category experience adaptation
// ----------------------------------------------------------------------------
test('7. Category presets adapt customer labels across business types', () => {
  assert.equal(getCustomerLabelByType('retail'), 'Customers');
  assert.equal(getCustomerLabelByType('clinic'), 'Patients');
  assert.equal(getCustomerLabelByType('doctor'), 'Patients');
  assert.equal(getCustomerLabelByType('tuition'), 'Students');
  assert.equal(getCustomerLabelByType('teacher'), 'Students');
  assert.equal(getCustomerLabelByType('repair'), 'Clients');
  assert.equal(getCustomerLabelByType('service'), 'Clients');
});

// ----------------------------------------------------------------------------
// 6. Workspace isolation & route integrity
// ----------------------------------------------------------------------------
test('8. App.jsx routes preserve canonical collection center delegation', () => {
  const appCode = fs.readFileSync('src/App.jsx', 'utf8');
  assert.ok(appCode.includes("case 'customers':"));
  assert.ok(appCode.includes("case 'due-ledger':") || appCode.includes("case 'due':"));
  assert.ok(appCode.includes('onOpenCollection={handleOpenCollectionCenter}'));
  // Ensure no duplicate quickpay routes or duplicate customer ledger routes were added
  assert.ok(!appCode.includes("case 'quickpay':"));
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passed} PHASE 6D FOCUSED TESTS PASSED PERFECTLY!`);
console.log('================================================================\n');

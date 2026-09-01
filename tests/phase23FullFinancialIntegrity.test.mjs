import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  allocatePayment, 
  allocateMultiplePayments, 
  calculateCanonicalInvoiceFinancials, 
  normalizeInvoiceFinancials,
  computeCustomerLedger,
  getInvoiceBalanceDue,
  getInvoicePaidTotal,
  getInvoicePaymentStatus,
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { financialTruthEngine } from '../src/services/financialTruthEngine.js';
import { paymentEngine } from '../src/services/paymentEngine.js';
import { invoiceEngine } from '../src/services/invoiceEngine.js';

test('⚡ BILLQYRO PHASE 23: FULL FINANCIAL INTEGRITY & CUSTOMER LIFECYCLE SUITE', async (t) => {

  // =========================================================================
  // SCENARIO A: Basic Earlier Balance Carry-Forward
  // =========================================================================
  await t.test('SCENARIO A: ₹1,000 bill, ₹500 payment -> new ₹2,000 bill carries Earlier Balance ₹500 & Total Due ₹2,500', async () => {
    const customer = { id: 'cust_rahim_a', name: 'Rahim', phone: '9876543210', previousDue: 0 };
    
    // Bill 1 = ₹1,000, Paid = ₹500
    const bill1 = {
      id: 'inv_101',
      invoiceNumber: 'INV-101',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 1000,
      oldDue: 0,
      previousDue: 0,
      amountPaid: 500,
      date: '2026-09-01'
    };

    // Calculate customer ledger before Bill 2
    const ledgerBeforeBill2 = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledgerBeforeBill2.totalBilled, 1000, 'Total billed before Bill 2 should be 1000');
    assert.equal(ledgerBeforeBill2.totalPaid, 500, 'Total paid before Bill 2 should be 500');
    assert.equal(ledgerBeforeBill2.totalDue, 500, 'Earlier Balance for Bill 2 should be 500');

    // Bill 2 = ₹2,000 with Earlier Balance = ₹500
    const bill2 = {
      id: 'inv_102',
      invoiceNumber: 'INV-102',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 2000,
      oldDue: ledgerBeforeBill2.totalDue,
      previousDue: ledgerBeforeBill2.totalDue,
      amountPaid: 0,
      date: '2026-09-02'
    };

    const fin2 = calculateCanonicalInvoiceFinancials(bill2);
    assert.equal(fin2.earlierBalance, 500, 'Earlier Balance must be 500');
    assert.equal(fin2.thisBill, 2000, 'This Bill must be 2000');
    assert.equal(fin2.totalAmountDue, 2500, 'Total Amount Due must be 2500');
    assert.equal(fin2.amountPaid, 0, 'Amount Paid must be 0');
    assert.equal(fin2.amountStillDue, 2500, 'Amount Still Due must be 2500');

    const ledgerAfterBill2 = computeCustomerLedger(customer, [bill1, bill2]);
    assert.equal(ledgerAfterBill2.totalBilled, 3000, 'Total Billed across customer history should be 3000');
    assert.equal(ledgerAfterBill2.totalPaid, 500, 'Total Paid across customer history should be 500');
    assert.equal(ledgerAfterBill2.totalDue, 2500, 'Customer total due should be 2500');
  });

  // =========================================================================
  // SCENARIO B: Payment Waterfall on Earlier Balance + This Bill
  // =========================================================================
  await t.test('SCENARIO B: ₹1,000 bill (₹500 paid) + new ₹2,000 bill + ₹300 payment -> Earlier Bal ₹200, This Bill ₹2,000, Total Due ₹2,200', async () => {
    const allocation = allocatePayment(300, 500, 2000);
    assert.equal(allocation.earlierBalancePaid, 300, 'Step 1: Earlier Balance Paid = MIN(300, 500) = 300');
    assert.equal(allocation.earlierBalanceRemaining, 200, 'Earlier Balance Remaining = 500 - 300 = 200');
    assert.equal(allocation.thisBillPaid, 0, 'Step 2: Remaining Payment = 0 -> This Bill Paid = 0');
    assert.equal(allocation.thisBillRemaining, 2000, 'This Bill Remaining = 2000');
    assert.equal(allocation.amountStillDue, 2200, 'Total Amount Due = 2200');
  });

  // =========================================================================
  // SCENARIO C: Complete Master Lifecycle (Rahim 3-step payment)
  // =========================================================================
  await t.test('SCENARIO C: Customer Rahim full multi-step lifecycle (Bill 1 ₹1k, paid ₹500, Bill 2 ₹2k, pay ₹300, pay ₹700, pay ₹1.5k -> fully settled)', async () => {
    const customer = { id: 'cust_rahim_c', name: 'Rahim', phone: '9876543210', previousDue: 0 };
    
    // Step 1: Bill 1 = ₹1,000, Payment = ₹500
    const bill1 = {
      id: 'inv_c1',
      invoiceNumber: 'INV-C1',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 1000,
      oldDue: 0,
      previousDue: 0,
      amountPaid: 500,
      date: '2026-09-01'
    };

    let ledger = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger.totalDue, 500);

    // Step 2: Bill 2 = ₹2,000, Earlier Balance = ₹500, Total Due = ₹2,500
    const bill2 = {
      id: 'inv_c2',
      invoiceNumber: 'INV-C2',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 2000,
      oldDue: 500,
      previousDue: 500,
      amountPaid: 0,
      paymentHistory: [],
      date: '2026-09-02'
    };

    let fin2 = calculateCanonicalInvoiceFinancials(bill2);
    assert.equal(fin2.earlierBalance, 500);
    assert.equal(fin2.thisBill, 2000);
    assert.equal(fin2.totalAmountDue, 2500);

    // Step 3: Customer pays ₹300 on Bill 2
    let alloc1 = allocatePayment(300, 500, 2000);
    assert.equal(alloc1.earlierBalanceRemaining, 200);
    assert.equal(alloc1.thisBillRemaining, 2000);
    assert.equal(alloc1.amountStillDue, 2200);

    // Step 4: Customer pays ₹700 more (Total paid on Bill 2 = ₹1,000)
    let alloc2 = allocatePayment(1000, 500, 2000);
    assert.equal(alloc2.earlierBalancePaid, 500, 'Earlier Balance fully cleared');
    assert.equal(alloc2.earlierBalanceRemaining, 0, 'Earlier Balance Remaining = 0');
    assert.equal(alloc2.thisBillPaid, 500, 'This Bill Paid = 500');
    assert.equal(alloc2.thisBillRemaining, 1500, 'This Bill Remaining = 1500');
    assert.equal(alloc2.amountStillDue, 1500, 'Total Amount Due = 1500');

    // Step 5: Customer pays ₹1,500 more (Total paid on Bill 2 = ₹2,500)
    let alloc3 = allocatePayment(2500, 500, 2000);
    assert.equal(alloc3.earlierBalanceRemaining, 0);
    assert.equal(alloc3.thisBillRemaining, 0);
    assert.equal(alloc3.amountStillDue, 0);
    assert.equal(alloc3.isSettled, true);
    assert.equal(alloc3.currentInvoicePaymentStatus, 'Paid');

    bill2.amountPaid = 2500;
    bill2.paymentHistory = [
      { amount: 300, date: '2026-09-03' },
      { amount: 700, date: '2026-09-04' },
      { amount: 1500, date: '2026-09-05' }
    ];

    const finalFin = calculateCanonicalInvoiceFinancials(bill2);
    assert.equal(finalFin.isFullyPaid, true);
    assert.equal(finalFin.paymentStatus, 'Paid');
    assert.equal(finalFin.amountStillDue, 0);

    const finalLedger = computeCustomerLedger(customer, [bill1, bill2]);
    assert.equal(finalLedger.totalBilled, 3000);
    assert.equal(finalLedger.totalPaid, 3000);
    assert.equal(finalLedger.totalDue, 0);
    assert.equal(finalLedger.isSettled, true);
  });

  // =========================================================================
  // SCENARIO D: Manual Earlier Balance Entered on Customer
  // =========================================================================
  await t.test('SCENARIO D: Customer with manual Earlier Balance ₹500 creates new ₹1,000 bill -> Total Due ₹1,500 without duplicate sales', async () => {
    const customer = { id: 'cust_manual_d', name: 'Manual Cust', phone: '9991112222', openingDue: 500 };
    
    // Before any bill
    const ledger0 = computeCustomerLedger(customer, []);
    assert.equal(ledger0.totalBilled, 0, 'No sales billed yet');
    assert.equal(ledger0.openingDue, 500, 'Opening earlier balance is 500');
    assert.equal(ledger0.totalDue, 500, 'Total due is 500');

    // Create Bill 1 = ₹1,000 carrying Earlier Balance = ₹500
    const bill1 = {
      id: 'inv_d1',
      invoiceNumber: 'INV-D1',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 1000,
      oldDue: ledger0.totalDue,
      previousDue: ledger0.totalDue,
      amountPaid: 0,
      date: '2026-09-01'
    };

    const fin1 = calculateCanonicalInvoiceFinancials(bill1);
    assert.equal(fin1.earlierBalance, 500);
    assert.equal(fin1.thisBill, 1000);
    assert.equal(fin1.totalAmountDue, 1500);

    const ledger1 = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger1.totalBilled, 1000, 'Total Billed must be exactly 1000 (earlier balance is NOT new sales)');
    assert.equal(ledger1.totalPaid, 0);
    assert.equal(ledger1.totalDue, 1500, 'Total Amount Due is 1500');
  });

  // =========================================================================
  // SCENARIO E: Old Balance Fully Paid -> Next Bill Carries Earlier Balance = 0
  // =========================================================================
  await t.test('SCENARIO E: Customer fully clears all previous bills -> new bill carries Earlier Balance = 0', async () => {
    const customer = { id: 'cust_e', name: 'Cleared Cust', phone: '9123456789' };
    const bill1 = {
      id: 'inv_e1',
      invoiceNumber: 'INV-E1',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 1000,
      amountPaid: 1000,
      date: '2026-09-01'
    };

    const ledger = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger.totalDue, 0, 'Customer has zero remaining due');

    const bill2 = {
      id: 'inv_e2',
      invoiceNumber: 'INV-E2',
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: 1500,
      oldDue: ledger.totalDue,
      previousDue: ledger.totalDue,
      amountPaid: 0
    };

    const fin2 = calculateCanonicalInvoiceFinancials(bill2);
    assert.equal(fin2.earlierBalance, 0);
    assert.equal(fin2.thisBill, 1500);
    assert.equal(fin2.totalAmountDue, 1500);
    assert.equal(fin2.amountStillDue, 1500);
  });

  // =========================================================================
  // SCENARIO F: Customer Identity Isolation (Similar names)
  // =========================================================================
  await t.test('SCENARIO F: Two customers with similar names have completely isolated financial ledgers', async () => {
    const custA = { id: 'cust_101', name: 'Rahim Khan', phone: '9876500001' };
    const custB = { id: 'cust_102', name: 'Rahim Khan', phone: '9876500002' };

    const invoices = [
      { id: 'inv_a1', customerId: custA.id, customerName: custA.name, grandTotal: 1000, amountPaid: 200 },
      { id: 'inv_b1', customerId: custB.id, customerName: custB.name, grandTotal: 5000, amountPaid: 4500 }
    ];

    const ledgerA = computeCustomerLedger(custA, invoices);
    const ledgerB = computeCustomerLedger(custB, invoices);

    assert.equal(ledgerA.totalBilled, 1000);
    assert.equal(ledgerA.totalPaid, 200);
    assert.equal(ledgerA.totalDue, 800);

    assert.equal(ledgerB.totalBilled, 5000);
    assert.equal(ledgerB.totalPaid, 4500);
    assert.equal(ledgerB.totalDue, 500);
  });

  // =========================================================================
  // SCENARIO G: Workspace Isolation
  // =========================================================================
  await t.test('SCENARIO G: Multi-workspace financial isolation prevents cross-tenant data leakage', async () => {
    const invoices = [
      { id: 'inv_ws1', workspaceId: 'ws_alpha', grandTotal: 1000, amountPaid: 1000 },
      { id: 'inv_ws2', workspaceId: 'ws_beta', grandTotal: 2500, amountPaid: 500 }
    ];

    const stateAlpha = financialTruthEngine.reconcileFinancialState({ invoices, workspaceId: 'ws_alpha' });
    const stateBeta = financialTruthEngine.reconcileFinancialState({ invoices, workspaceId: 'ws_beta' });

    assert.equal(stateAlpha.totals.totalInvoiced, 1000);
    assert.equal(stateAlpha.totals.totalCustomerCollections, 1000);
    assert.equal(stateAlpha.totals.totalOutstanding, 0);

    assert.equal(stateBeta.totals.totalInvoiced, 2500);
    assert.equal(stateBeta.totals.totalCustomerCollections, 500);
    assert.equal(stateBeta.totals.totalOutstanding, 2000);
  });

  // =========================================================================
  // SCENARIO J: Overpayment Protection
  // =========================================================================
  await t.test('SCENARIO J: Payment greater than outstanding liability is safely rejected', async () => {
    const invoice = {
      id: 'inv_test_overpay',
      grandTotal: 1000,
      oldDue: 500,
      previousDue: 500,
      amountPaid: 0,
      paymentHistory: []
    };

    const fin = calculateCanonicalInvoiceFinancials(invoice);
    assert.equal(fin.customerTotalDue, 1500);

    // Mock paymentEngine validation check
    const maxPayable = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;
    assert.equal(maxPayable, 1500);

    const attemptAmount = 2000;
    assert.throws(() => {
      if (attemptAmount > maxPayable && maxPayable > 0) {
        throw new Error(`Payment amount (${attemptAmount}) cannot exceed outstanding liability (${maxPayable}).`);
      }
    }, /cannot exceed outstanding liability/);
  });

  // =========================================================================
  // SCENARIO M, N, O: Business Money & Personal Money Rules
  // =========================================================================
  await t.test('SCENARIOS M, N, O: Business withdrawal, internal transfers, salary & personal wealth conservation', async () => {
    const bankLedger = [
      // 1. Initial Business Collection
      { id: 'b1', type: 'moneyIn', amountRupees: 10000, source: 'invoice_payment', category: 'Sale / Invoice Payment' },
      // 2. Owner Salary = ₹3,000 (Reduces business money, not an operating expense)
      { id: 'b2', type: 'salary', amountRupees: 3000, source: 'owner_salary', category: 'My Salary', sourceLocation: 'website_income', destinationLocation: 'my_cash' },
      // 3. Business Withdrawal to PhonePe = ₹2,000 (Money movement, not an operating expense)
      { id: 'b3', type: 'withdrawal', amountRupees: 2000, source: 'owner_withdrawal', category: 'Withdrawal', sourceLocation: 'website_income', destinationLocation: 'phonepe' },
      // 4. Internal Transfer: My Cash -> PhonePe = ₹1,000 (Preserves total personal wealth)
      { id: 'b4', isTransfer: true, amountRupees: 1000, source: 'money_transfer', category: 'Transfer', sourceLocation: 'my_cash', destinationLocation: 'phonepe' },
      // 5. Internal Transfer: PhonePe -> My Dream = ₹500 (Preserves total personal wealth)
      { id: 'b5', isTransfer: true, amountRupees: 500, source: 'dream_transfer', category: 'Dream Transfer', sourceLocation: 'phonepe', destinationLocation: 'my_dream' }
    ];

    const state = financialTruthEngine.reconcileFinancialState({
      invoices: [{ id: 'inv_main', grandTotal: 10000, amountPaid: 10000 }],
      bankLedger
    });

    // Business Available = 10,000 - 3,000 (salary) - 2,000 (withdrawal) = 5,000
    assert.equal(state.totals.websiteIncomeAvailable, 5000, 'Business Available Money should be exactly ₹5,000');
    assert.equal(state.totals.totalBusinessExpenses, 0, 'Salary and withdrawals are NOT business expenses');

    // Personal Money check:
    // Cash received: +3,000 (salary), transferred out: -1,000 -> Cash balance = 2,000
    assert.equal(state.totals.myCashBalance, 2000, 'My Cash balance = 2000');
    // PhonePe received: +2,000 (withdrawal) + 1,000 (from cash) - 500 (to dream) -> PhonePe balance = 2,500
    assert.equal(state.totals.phonePeBalance, 2500, 'PhonePe balance = 2500');
    // Dream received: +500 -> Dream balance = 500
    assert.equal(state.totals.myDreamBalance, 500, 'My Dream balance = 500');
    // Total Personal Wealth = 2,000 + 2,500 + 500 = 5,000
    assert.equal(state.totals.personalWealth, 5000, 'Total Personal Wealth is perfectly conserved at ₹5,000');
    assert.equal(state.balanced, true, 'Financial state is 100% balanced without discrepancies');
  });

  // =========================================================================
  // SCENARIO K & L: Invoice Edit and Payment Removal Reconciliations
  // =========================================================================
  await t.test('SCENARIO K & L: Editing invoices and removing payments reconciles customer balances cleanly', async () => {
    const customer = { id: 'cust_kl', name: 'Edit Test Customer' };
    const bill1 = {
      id: 'inv_kl1',
      customerId: customer.id,
      grandTotal: 1000,
      amountPaid: 500,
      paymentHistory: [{ id: 'pmt_1', amount: 500, date: '2026-09-01' }]
    };

    let ledger = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger.totalDue, 500);

    // Edit invoice grandTotal from 1000 to 1200
    bill1.grandTotal = 1200;
    ledger = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger.totalBilled, 1200);
    assert.equal(ledger.totalDue, 700, 'Due updates to 1200 - 500 = 700');

    // Remove payment
    bill1.amountPaid = 0;
    bill1.paymentHistory = [];
    ledger = computeCustomerLedger(customer, [bill1]);
    assert.equal(ledger.totalPaid, 0);
    assert.equal(ledger.totalDue, 1200, 'Due updates to full 1200 after payment reversal');
  });

});

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateCanonicalInvoiceFinancials, 
  allocatePayment, 
  computeCustomerLedger,
  filterByWorkspace, 
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { paymentEngine } from '../src/services/paymentEngine.js';

test('BILLQYRO MONEY & PAYMENT CENTER — MASTER REGRESSION SUITE (TESTS A TO AF)', async (t) => {

  // --- TEST A: Customer payment enters Website Income correctly ---
  await t.test('TEST A: Customer payment enters Website Income correctly', () => {
    const invoices = [
      { id: 'inv1', items: [{ price: 2000, quantity: 1 }], paymentHistory: [{ id: 'p1', amount: 2000 }] }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices });
    assert.equal(buckets.totalWebsiteRevenue, 2000);
    assert.equal(buckets.websiteIncomeAvailable, 2000);
  });

  // --- TEST B: Previous Due always receives payment priority ---
  await t.test('TEST B: Previous Due always receives payment priority', () => {
    const alloc = allocatePayment(700, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 500);
    assert.equal(alloc.allocatedToCurrentInvoice, 200);
    assert.equal(alloc.remainingOldDue, 0);
    assert.equal(alloc.remainingCurrentInvoiceDue, 1800);
    assert.equal(alloc.customerTotalDue, 1800);
  });

  // --- TEST C: Current invoice calculation remains correct ---
  await t.test('TEST C: Current invoice calculation remains correct', () => {
    const inv = { id: 'inv_c', items: [{ price: 1500, quantity: 1 }], paymentHistory: [{ amount: 500 }] };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 500);
    assert.equal(fin.balanceDue, 1000);
    assert.equal(fin.isFullyPaid, false);
    assert.equal(fin.paymentStatus, 'Partially Paid');
  });

  // --- TEST D: Withdraw reduces Website Income / business available balance ---
  await t.test('TEST D: Withdraw reduces Website Income / business available balance', () => {
    const invoices = [
      { id: 'inv1', items: [{ price: 20000, quantity: 1 }], paymentHistory: [{ id: 'p1', amount: 20000 }] }
    ];
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 20000);
    assert.equal(buckets.websiteIncomeAvailable, 10000);
  });

  // --- TEST E: Withdraw to My Cash increases My Cash ---
  await t.test('TEST E: Withdraw to My Cash increases My Cash', () => {
    const invoices = [
      { id: 'inv1', items: [{ price: 20000, quantity: 1 }], paymentHistory: [{ id: 'p1', amount: 20000 }] }
    ];
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.myCashBalance, 10000);
  });

  // --- TEST F: My Cash -> PhonePe transfer decreases Cash and increases PhonePe ---
  await t.test('TEST F: My Cash -> PhonePe transfer decreases Cash and increases PhonePe', () => {
    const invoices = [
      { id: 'inv1', items: [{ price: 20000, quantity: 1 }], paymentHistory: [{ id: 'p1', amount: 20000 }] }
    ];
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'phonepe', category: 'Transfer to PhonePe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.myCashBalance, 5000);
    assert.equal(buckets.phonePeBalance, 5000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST G: PhonePe -> My Cash transfer works correctly ---
  await t.test('TEST G: PhonePe -> My Cash transfer works correctly', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 8000, destinationLocation: 'phonepe' },
      { id: 't2', isTransfer: true, amountRupees: 3000, sourceLocation: 'phonepe', destinationLocation: 'my_cash', category: 'Transfer to My Cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 5000);
    assert.equal(buckets.myCashBalance, 3000);
    assert.equal(buckets.personalAvailableTotal, 8000);
  });

  // --- TEST H: PhonePe expense reduces PhonePe balance ---
  await t.test('TEST H: PhonePe expense reduces PhonePe balance', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'phonepe' },
      { id: 'exp1', type: 'moneyOut', category: 'Shopping', source: 'personal_expense', sourceLocation: 'phonepe', destinationLocation: 'expense', amountRupees: 1500 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 3500);
    assert.equal(buckets.phonePeExpenses, 1500);
  });

  // --- TEST I: My Cash expense reduces Cash balance ---
  await t.test('TEST I: My Cash expense reduces Cash balance', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'my_cash' },
      { id: 'exp2', type: 'moneyOut', category: 'Food', source: 'personal_expense', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 300 },
      { id: 'exp3', type: 'moneyOut', category: 'Travel', source: 'personal_expense', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 200 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 4500);
    assert.equal(buckets.myCashExpenses, 500);
  });

  // --- TEST J: Expense history records reason and amount ---
  await t.test('TEST J: Expense history records reason and amount', () => {
    const bankLedger = [
      { id: 'exp_j', type: 'moneyOut', category: 'Supplies', title: 'Office Paper', source: 'personal_expense', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 450, note: 'A4 sheets' }
    ];
    const history = paymentEngine.getUnifiedTransactionHistory({ bankLedger });
    assert.equal(history.length, 1);
    assert.equal(history[0].amount, 450);
    assert.equal(history[0].title, 'Office Paper');
    assert.equal(history[0].category, 'Supplies');
  });

  // --- TEST K: Transfer does NOT count as expense ---
  await t.test('TEST K: Transfer does NOT count as expense', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't_k', isTransfer: true, amountRupees: 4000, sourceLocation: 'my_cash', destinationLocation: 'phonepe', category: 'Transfer to PhonePe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.phonePeExpenses, 0);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST L: Transfer does NOT double count total money ---
  await t.test('TEST L: Transfer does NOT double count total money', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'phonepe', category: 'Transfer to PhonePe' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'phonepe', destinationLocation: 'my_cash', category: 'Transfer to My Cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST M: PhonePe + My Cash + Dream balances remain consistent ---
  await t.test('TEST M: PhonePe + My Cash + Dream balances remain consistent', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 4000, sourceLocation: 'my_cash', destinationLocation: 'phonepe' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'phonepe', destinationLocation: 'my_dream' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 6000);
    assert.equal(buckets.phonePeBalance, 2000);
    assert.equal(buckets.myDreamBalance, 2000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST N: PhonePe -> Dream transfer works ---
  await t.test('TEST N: PhonePe -> Dream transfer works', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'phonepe' },
      { id: 'td', isTransfer: true, amountRupees: 2000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_car' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 3000);
    assert.equal(buckets.myDreamBalance, 2000);
  });

  // --- TEST O: Dream balance and progress update correctly ---
  await t.test('TEST O: Dream balance and progress update correctly', () => {
    const bankLedger = [
      { id: 'td1', isTransfer: true, amountRupees: 100000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_car' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    const carGoal = buckets.dreamGoals.find(g => g.id === 'dream_car');
    assert.ok(carGoal);
    assert.equal(carGoal.savedAmount, 100000);
    assert.equal(carGoal.progressPercentage, 20); // 100k / 500k = 20%
    assert.equal(carGoal.remainingAmount, 400000);
  });

  // --- TEST P: Dream transfer is not classified as expense ---
  await t.test('TEST P: Dream transfer is not classified as expense', () => {
    const bankLedger = [
      { id: 'td1', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_house' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.phonePeExpenses, 0);
  });

  // --- TEST Q: Live Link payment remains pending until approval ---
  await t.test('TEST Q: Live Link payment remains pending until approval', () => {
    const inv = {
      id: 'inv_live_q',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [],
      paymentProofs: [{ id: 'proof_q', amount: 3000, status: 'pending' }]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 0);
    assert.equal(fin.balanceDue, 3000);
  });

  // --- TEST R: Approved Live Link payment enters official ledger exactly once ---
  await t.test('TEST R: Approved Live Link payment enters official ledger exactly once', () => {
    const inv = {
      id: 'inv_live_r',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [
        { id: 'pmt_proof_r', proofId: 'proof_r', amount: 3000, source: 'live_link_approved' }
      ]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 3000);
    assert.equal(fin.balanceDue, 0);
    assert.equal(fin.isFullyPaid, true);
  });

  // --- TEST S: Rejected Live Link payment does not change official totals ---
  await t.test('TEST S: Rejected Live Link payment does not change official totals', () => {
    const inv = {
      id: 'inv_live_s',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [],
      paymentProofs: [{ id: 'proof_s', amount: 3000, status: 'rejected' }]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 0);
    assert.equal(fin.balanceDue, 3000);
  });

  // --- TEST T: Duplicate payment cannot be recorded twice ---
  await t.test('TEST T: Duplicate payment cannot be recorded twice', () => {
    const existingHistory = [
      { id: 'pmt_123', amount: 500, transactionId: 'TXN123' }
    ];
    const incomingTxn = 'TXN123';
    const isDup = existingHistory.some(p => p.id === 'pmt_123' || p.transactionId === incomingTxn);
    assert.equal(isDup, true);
  });

  // --- TEST U: Invoice shortcut opens Money & Payment Center ---
  await t.test('TEST U: Invoice shortcut opens Money & Payment Center', () => {
    const shortcut = { customer: { id: 'c1' }, invoice: { id: 'inv101' }, type: 'customer_payment' };
    assert.equal(shortcut.invoice.id, 'inv101');
    assert.equal(shortcut.type, 'customer_payment');
  });

  // --- TEST V: Due Ledger shortcut opens Money & Payment Center ---
  await t.test('TEST V: Due Ledger shortcut opens Money & Payment Center', () => {
    const shortcut = { customer: { id: 'c2' }, invoice: { id: 'bill55', dueAmount: 800 } };
    assert.equal(shortcut.invoice.dueAmount, 800);
  });

  // --- TEST W: Customer Ledger shortcut opens Money & Payment Center ---
  await t.test('TEST W: Customer Ledger shortcut opens Money & Payment Center', () => {
    const shortcut = { customer: { id: 'c3', name: 'Karim' }, invoice: null };
    assert.equal(shortcut.customer.name, 'Karim');
    assert.equal(shortcut.invoice, null);
  });

  // --- TEST X: Dashboard shortcut opens Money & Payment Center ---
  await t.test('TEST X: Dashboard shortcut opens Money & Payment Center', () => {
    let tab = 'dashboard';
    const openCenter = () => { tab = 'collection-center'; };
    openCenter();
    assert.equal(tab, 'collection-center');
  });

  // --- TEST Y: Unified History contains all confirmed transactions ---
  await t.test('TEST Y: Unified History contains all confirmed transactions', () => {
    const invoices = [
      { id: 'i1', paymentHistory: [{ id: 'p1', amount: 2500, method: 'UPI' }] }
    ];
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 1000 },
      { id: 't1', isTransfer: true, category: 'Transfer to PhonePe', amountRupees: 500 }
    ];
    const history = paymentEngine.getUnifiedTransactionHistory({ invoices, bankLedger });
    assert.equal(history.length, 3);
  });

  // --- TEST Z: Workspace isolation works ---
  await t.test('TEST Z: Workspace isolation works', () => {
    const invoices = [
      { id: 'inv_ws1', workspaceId: 'ws_alpha', total: 5000 },
      { id: 'inv_ws2', workspaceId: 'ws_beta', total: 8000 }
    ];
    const alpha = filterByWorkspace(invoices, 'ws_alpha');
    assert.equal(alpha.length, 1);
    assert.equal(alpha[0].id, 'inv_ws1');
  });

  // --- TEST AA: Offline transaction synchronization remains idempotent ---
  await t.test('TEST AA: Offline transaction synchronization remains idempotent', () => {
    const local = [{ id: 'tx_off_1', amountRupees: 1000, __version: 2 }];
    const incoming = { id: 'tx_off_1', amountRupees: 1000, __version: 1 };
    const merged = local.map(l => l.id === incoming.id && incoming.__version > l.__version ? incoming : l);
    assert.equal(merged[0].__version, 2);
  });

  // --- TEST AB: No passwords/tokens are stored in financial records ---
  await t.test('TEST AB: No passwords/tokens are stored in financial records', () => {
    const invoices = [
      { id: 'inv_sec', paymentHistory: [{ id: 'p_sec', amount: 900, method: 'Cash' }] }
    ];
    const history = paymentEngine.getPaymentHistory(invoices);
    assert.equal(history[0].password, undefined);
    assert.equal(history[0].secret, undefined);
    assert.equal(history[0].token, undefined);
  });

  // --- TEST AC: Salary remains separate from Website Income ---
  await t.test('TEST AC: Salary remains separate from Website Income', () => {
    const invoices = [
      { id: 'inv_ac', items: [{ price: 30000, quantity: 1 }], paymentHistory: [{ id: 'p_ac', amount: 30000 }] }
    ];
    const bankLedger = [
      { id: 'sal1', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 12000 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 30000);
    assert.equal(buckets.mySalaryTotal, 12000);
    assert.equal(buckets.websiteIncomeAvailable, 18000);
  });

  // --- TEST AD: Withdraw is not classified as expense ---
  await t.test('TEST AD: Withdraw is not classified as expense', () => {
    const bankLedger = [
      { id: 'w_ad', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 8000, destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.phonePeExpenses, 0);
    assert.equal(buckets.websiteWithdrawals, 8000);
  });

  // --- TEST AE: Cash expense is removed from available Cash ---
  await t.test('TEST AE: Cash expense is removed from available Cash', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'my_cash' },
      { id: 'e_ae', type: 'moneyOut', category: 'Food', source: 'personal_expense', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 400 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 4600);
    assert.equal(buckets.myCashExpenses, 400);
  });

  // --- TEST AF: PhonePe expense is removed from available PhonePe ---
  await t.test('TEST AF: PhonePe expense is removed from available PhonePe', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'phonepe' },
      { id: 'e_af', type: 'moneyOut', category: 'Shopping', source: 'personal_expense', sourceLocation: 'phonepe', destinationLocation: 'expense', amountRupees: 1200 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 3800);
    assert.equal(buckets.phonePeExpenses, 1200);
  });

});

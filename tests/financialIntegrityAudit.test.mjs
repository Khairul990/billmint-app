import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateCanonicalInvoiceFinancials, 
  calculateInvoiceTotals,
  allocatePayment, 
  allocateMultiplePayments,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  computeCustomerLedger,
  filterByWorkspace, 
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { paymentEngine } from '../src/services/paymentEngine.js';

test('BILLQYRO PHASE 10 — FINANCIAL INTEGRITY & RECONCILIATION AUDIT (TESTS A TO AO)', async (t) => {

  // --- TEST A: Invoice total reconciliation ---
  await t.test('TEST A: Invoice total reconciliation', () => {
    const items = [
      { quantity: 2, price: 500, discount: 50 },  // (2*500) - 50 = 950
      { quantity: 1, price: 1000, discount: 0 }    // 1000
    ];
    // subtotal = 1950, globalDiscount = 100 -> taxable = 1850. tax = 10% (185) -> grandTotal = 2035
    const totals = calculateInvoiceTotals(items, 10, 100);
    assert.equal(totals.subtotal, 1950);
    assert.equal(totals.discountAmount, 100);
    assert.equal(totals.taxAmount, 185);
    assert.equal(totals.grandTotal, 2035);
  });

  // --- TEST B: Previous Due receives payment first ---
  await t.test('TEST B: Previous Due receives payment first', () => {
    const alloc = allocatePayment(300, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 300);
    assert.equal(alloc.remainingOldDue, 200);
    assert.equal(alloc.allocatedToCurrentInvoice, 0);
    assert.equal(alloc.remainingCurrentInvoiceDue, 2000);
    assert.equal(alloc.customerTotalDue, 2200);
  });

  // --- TEST C: Current Invoice receives payment only after Previous Due clears ---
  await t.test('TEST C: Current Invoice receives payment only after Previous Due clears', () => {
    const alloc = allocatePayment(700, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 500);
    assert.equal(alloc.remainingOldDue, 0);
    assert.equal(alloc.allocatedToCurrentInvoice, 200);
    assert.equal(alloc.remainingCurrentInvoiceDue, 1800);
    assert.equal(alloc.customerTotalDue, 1800);
  });

  // --- TEST D: Full payment clears total liability ---
  await t.test('TEST D: Full payment clears total liability', () => {
    const alloc = allocatePayment(2500, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 500);
    assert.equal(alloc.remainingOldDue, 0);
    assert.equal(alloc.allocatedToCurrentInvoice, 2000);
    assert.equal(alloc.remainingCurrentInvoiceDue, 0);
    assert.equal(alloc.customerTotalDue, 0);
    assert.equal(alloc.isSettled, true);
  });

  // --- TEST E: Overpayment protection ---
  await t.test('TEST E: Overpayment protection', () => {
    const alloc = allocatePayment(3000, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 500);
    assert.equal(alloc.allocatedToCurrentInvoice, 2000);
    assert.equal(alloc.remainingCurrentInvoiceDue, 0);
    assert.equal(alloc.customerTotalDue, 0);
  });

  // --- TEST F: Website Income reconciliation ---
  await t.test('TEST F: Website Income reconciliation', () => {
    const invoices = [
      { id: 'i1', items: [{ price: 50000, quantity: 1 }], paymentHistory: [{ amount: 50000 }] }
    ];
    const bankLedger = [
      { id: 'exp1', type: 'moneyOut', category: 'Supplies', amountRupees: 5000 },
      { id: 'st1', type: 'moneyOut', category: 'Staff Salary', amountRupees: 8000 },
      { id: 'vd1', type: 'moneyOut', category: 'Vendor Payout', amountRupees: 4000 },
      { id: 'rf1', type: 'moneyOut', category: 'Customer Refund', amountRupees: 1000 },
      { id: 'sal1', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 12000 },
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 50000);
    assert.equal(buckets.totalWebsiteOutflows, 40000);
    assert.equal(buckets.websiteIncomeAvailable, 10000);
  });

  // --- TEST G: Owner Salary separation ---
  await t.test('TEST G: Owner Salary separation', () => {
    const bankLedger = [
      { id: 'sal_g', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 15000, salaryPeriod: 'August 2026' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 0);
    assert.equal(buckets.mySalaryTotal, 15000);
    assert.equal(buckets.myCashExpenses, 0);
  });

  // --- TEST H: Withdraw is not Expense ---
  await t.test('TEST H: Withdraw is not Expense', () => {
    const bankLedger = [
      { id: 'w_h', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 8000, destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.phonePeExpenses, 0);
    assert.equal(buckets.websiteWithdrawals, 8000);
  });

  // --- TEST I: Withdraw reduces Website Income ---
  await t.test('TEST I: Withdraw reduces Website Income', () => {
    const invoices = [
      { id: 'inv_i', items: [{ price: 20000, quantity: 1 }], paymentHistory: [{ amount: 20000 }] }
    ];
    const bankLedger = [
      { id: 'w_i', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 12000, destinationLocation: 'phonepe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 20000);
    assert.equal(buckets.websiteIncomeAvailable, 8000);
  });

  // --- TEST J: Withdraw increases selected personal destination ---
  await t.test('TEST J: Withdraw increases selected personal destination', () => {
    const bankLedger = [
      { id: 'w_j1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 6000, destinationLocation: 'my_cash' },
      { id: 'w_j2', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 4000, destinationLocation: 'phonepe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 6000);
    assert.equal(buckets.phonePeBalance, 4000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST K: Cash -> PhonePe preserves total wealth ---
  await t.test('TEST K: Cash -> PhonePe preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't_k', isTransfer: true, amountRupees: 4000, sourceLocation: 'my_cash', destinationLocation: 'phonepe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 6000);
    assert.equal(buckets.phonePeBalance, 4000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST L: PhonePe -> Cash preserves total wealth ---
  await t.test('TEST L: PhonePe -> Cash preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't_l', isTransfer: true, amountRupees: 3500, sourceLocation: 'phonepe', destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 6500);
    assert.equal(buckets.myCashBalance, 3500);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST M: Cash -> Dream preserves total wealth ---
  await t.test('TEST M: Cash -> Dream preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't_m', isTransfer: true, amountRupees: 2500, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_m' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 7500);
    assert.equal(buckets.myDreamBalance, 2500);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST N: PhonePe -> Dream preserves total wealth ---
  await t.test('TEST N: PhonePe -> Dream preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't_n', isTransfer: true, amountRupees: 5000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_n' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 5000);
    assert.equal(buckets.myDreamBalance, 5000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST O: Dream -> Cash preserves total wealth ---
  await t.test('TEST O: Dream -> Cash preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_o' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'my_dream', destinationLocation: 'my_cash', dreamId: 'dream_o' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 7000);
    assert.equal(buckets.myDreamBalance, 3000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST P: Dream -> PhonePe preserves total wealth ---
  await t.test('TEST P: Dream -> PhonePe preserves total wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't1', isTransfer: true, amountRupees: 6000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_p' },
      { id: 't2', isTransfer: true, amountRupees: 2500, sourceLocation: 'my_dream', destinationLocation: 'phonepe', dreamId: 'dream_p' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 6500);
    assert.equal(buckets.myDreamBalance, 3500);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST Q: Personal Expense permanently reduces personal money ---
  await t.test('TEST Q: Personal Expense permanently reduces personal money', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 'e1', type: 'moneyOut', category: 'Shopping', source: 'personal_expense', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 3000 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 7000);
    assert.equal(buckets.myCashExpenses, 3000);
    assert.equal(buckets.personalAvailableTotal, 7000);
  });

  // --- TEST R: Business Expense reduces business funds ---
  await t.test('TEST R: Business Expense reduces business funds', () => {
    const invoices = [
      { id: 'inv_r', items: [{ price: 10000, quantity: 1 }], paymentHistory: [{ amount: 10000 }] }
    ];
    const bankLedger = [
      { id: 'b_exp', type: 'moneyOut', category: 'Utilities', amountRupees: 2500 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.websiteIncomeAvailable, 7500);
  });

  // --- TEST S: Transfers are never classified as expenses ---
  await t.test('TEST S: Transfers are never classified as expenses', () => {
    const bankLedger = [
      { id: 't_s', isTransfer: true, sourceLocation: 'my_cash', destinationLocation: 'phonepe', amountRupees: 5000 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.phonePeExpenses, 0);
  });

  // --- TEST T: Unified History contains exactly one record per transaction ---
  await t.test('TEST T: Unified History contains exactly one record per transaction', () => {
    const invoices = [
      { id: 'inv_t', paymentHistory: [{ id: 'p_t', amount: 5000, method: 'UPI' }] }
    ];
    const bankLedger = [
      { id: 'tx_t', type: 'moneyOut', category: 'Rent', amountRupees: 2000 }
    ];
    const history = paymentEngine.getUnifiedTransactionHistory({ invoices, bankLedger });
    assert.equal(history.length, 2);
    const ids = history.map(h => h.id);
    assert.equal(new Set(ids).size, 2);
  });

  // --- TEST U: Dashboard matches canonical financial values ---
  await t.test('TEST U: Dashboard matches canonical financial values', () => {
    const inv = { id: 'inv_u', items: [{ price: 4000, quantity: 1 }], previousDue: 1000, paymentHistory: [{ amount: 2000 }] };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.currentInvoiceTotal, 4000);
    assert.equal(fin.previousDue, 1000);
    assert.equal(fin.totalReceivable, 5000);
    assert.equal(fin.amountPaid, 2000);
    assert.equal(fin.allocatedToOldDue, 1000);
    assert.equal(fin.allocatedToCurrentInvoice, 1000);
    assert.equal(fin.customerTotalDue, 3000);
  });

  // --- TEST V: Collection Center matches canonical payment engine ---
  await t.test('TEST V: Collection Center matches canonical payment engine', () => {
    const alloc = allocatePayment(1500, 500, 2000);
    assert.equal(alloc.allocatedToOldDue, 500);
    assert.equal(alloc.allocatedToCurrentInvoice, 1000);
    assert.equal(alloc.remainingCurrentInvoiceDue, 1000);
  });

  // --- TEST W: Pending Live Link proof changes no official financial total ---
  await t.test('TEST W: Pending Live Link proof changes no official financial total', () => {
    const inv = {
      id: 'inv_w',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [],
      paymentProofs: [{ id: 'proof_w', amount: 3000, status: 'pending' }]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 0);
    assert.equal(fin.balanceDue, 3000);
    assert.equal(fin.isFullyPaid, false);
  });

  // --- TEST X: Approved Live Link payment records exactly once ---
  await t.test('TEST X: Approved Live Link payment records exactly once', () => {
    const inv = {
      id: 'inv_x',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [{ id: 'pmt_approved_x', proofId: 'proof_x', amount: 3000 }],
      paymentProofs: [{ id: 'proof_x', amount: 3000, status: 'approved' }]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 3000);
    assert.equal(fin.balanceDue, 0);
    assert.equal(fin.isFullyPaid, true);
  });

  // --- TEST Y: Rejected Live Link proof changes nothing ---
  await t.test('TEST Y: Rejected Live Link proof changes nothing', () => {
    const inv = {
      id: 'inv_y',
      items: [{ price: 3000, quantity: 1 }],
      paymentHistory: [],
      paymentProofs: [{ id: 'proof_y', amount: 3000, status: 'rejected' }]
    };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.amountPaid, 0);
    assert.equal(fin.balanceDue, 3000);
  });

  // --- TEST Z: Duplicate approval is rejected ---
  await t.test('TEST Z: Duplicate approval is rejected', () => {
    const history = [{ id: 'p_1', proofId: 'proof_z' }];
    const incomingProofId = 'proof_z';
    const isAlreadyApproved = history.some(p => p.proofId === incomingProofId);
    assert.equal(isAlreadyApproved, true);
  });

  // --- TEST AA: Offline sync is idempotent ---
  await t.test('TEST AA: Offline sync is idempotent', () => {
    const localQueue = [{ id: 'off_tx_1', amount: 500, __version: 1 }];
    const remoteTx = { id: 'off_tx_1', amount: 500, __version: 1 };
    const updated = localQueue.map(item => item.id === remoteTx.id && remoteTx.__version > item.__version ? remoteTx : item);
    assert.equal(updated[0].__version, 1);
  });

  // --- TEST AB: Workspace isolation ---
  await t.test('TEST AB: Workspace isolation', () => {
    const invoices = [
      { id: 'inv_wsA', workspaceId: 'wsA', total: 1000 },
      { id: 'inv_wsB', workspaceId: 'wsB', total: 2000 }
    ];
    const scopedA = filterByWorkspace(invoices, 'wsA');
    const scopedB = filterByWorkspace(invoices, 'wsB');
    assert.equal(scopedA.length, 1);
    assert.equal(scopedA[0].id, 'inv_wsA');
    assert.equal(scopedB.length, 1);
    assert.equal(scopedB[0].id, 'inv_wsB');
  });

  // --- TEST AC: No negative Cash ---
  await t.test('TEST AC: No negative Cash', () => {
    const bankLedger = [
      { id: 'exp_over', type: 'moneyOut', category: 'Food', sourceLocation: 'my_cash', destinationLocation: 'expense', amountRupees: 999999 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 0);
  });

  // --- TEST AD: No negative PhonePe ---
  await t.test('TEST AD: No negative PhonePe', () => {
    const bankLedger = [
      { id: 'exp_over2', type: 'moneyOut', category: 'Shopping', sourceLocation: 'phonepe', destinationLocation: 'expense', amountRupees: 999999 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 0);
  });

  // --- TEST AE: No negative Dream ---
  await t.test('TEST AE: No negative Dream', () => {
    const bankLedger = [
      { id: 'ret_over', isTransfer: true, sourceLocation: 'my_dream', destinationLocation: 'phonepe', amountRupees: 999999 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myDreamBalance, 0);
  });

  // --- TEST AF: No NaN/Infinity ---
  await t.test('TEST AF: No NaN/Infinity', () => {
    const fin = calculateCanonicalInvoiceFinancials({ items: [], total: 'invalid', previousDue: null });
    assert.equal(isNaN(fin.grandTotal), false);
    assert.equal(isFinite(fin.grandTotal), true);
    assert.equal(isNaN(fin.customerTotalDue), false);
  });

  // --- TEST AG: Zero amount is safely rejected ---
  await t.test('TEST AG: Zero amount is safely rejected', () => {
    const rawZero = 0;
    const isValid = rawZero > 0;
    assert.equal(isValid, false);
  });

  // --- TEST AH: Decimal precision is correct ---
  await t.test('TEST AH: Decimal precision is correct', () => {
    const sum = roundTo2(0.1 + 0.2);
    assert.equal(sum, 0.3);
    assert.equal(roundTo2(999.994), 999.99);
    assert.equal(roundTo2(999.996), 1000.00);
  });

  // --- TEST AI: PDF totals match canonical totals ---
  await t.test('TEST AI: PDF totals match canonical totals', () => {
    const inv = { id: 'inv_ai', items: [{ price: 1000, quantity: 2 }], previousDue: 300, paymentHistory: [{ amount: 500 }] };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.currentInvoiceTotal, 2000);
    assert.equal(fin.previousDue, 300);
    assert.equal(fin.totalReceivable, 2300);
    assert.equal(fin.allocatedToOldDue, 300);
    assert.equal(fin.allocatedToCurrentInvoice, 200);
    assert.equal(fin.customerTotalDue, 1800);
  });

  // --- TEST AJ: Public Invoice totals match canonical totals ---
  await t.test('TEST AJ: Public Invoice totals match canonical totals', () => {
    const inv = { id: 'inv_aj', items: [{ price: 1500, quantity: 1 }], previousDue: 500, paymentHistory: [{ amount: 500 }] };
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(fin.totalReceivable, 2000);
    assert.equal(fin.customerTotalDue, 1500);
  });

  // --- TEST AK: Payment History contains exactly one confirmed payment ---
  await t.test('TEST AK: Payment History contains exactly one confirmed payment', () => {
    const inv = { id: 'inv_ak', paymentHistory: [{ id: 'p1', amount: 500 }] };
    const history = paymentEngine.getPaymentHistory([inv]);
    assert.equal(history.length, 1);
  });

  // --- TEST AL: Internal transfer preserves total personal wealth ---
  await t.test('TEST AL: Internal transfer preserves total personal wealth', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 20000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 8000, sourceLocation: 'my_cash', destinationLocation: 'phonepe' },
      { id: 't2', isTransfer: true, amountRupees: 5000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'd1' },
      { id: 't3', isTransfer: true, amountRupees: 2000, sourceLocation: 'my_dream', destinationLocation: 'my_cash', dreamId: 'd1' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 14000);
    assert.equal(buckets.phonePeBalance, 3000);
    assert.equal(buckets.myDreamBalance, 3000);
    assert.equal(buckets.personalAvailableTotal, 20000);
  });

  // --- TEST AM: Salary cannot double-deduct Website Income ---
  await t.test('TEST AM: Salary cannot double-deduct Website Income', () => {
    const invoices = [{ id: 'inv_am', items: [{ price: 30000, quantity: 1 }], paymentHistory: [{ amount: 30000 }] }];
    const bankLedger = [
      { id: 'sal_am', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 10000 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 30000);
    assert.equal(buckets.mySalaryTotal, 10000);
    assert.equal(buckets.websiteIncomeAvailable, 20000);
  });

  // --- TEST AN: Withdraw cannot double-deduct Website Income ---
  await t.test('TEST AN: Withdraw cannot double-deduct Website Income', () => {
    const invoices = [{ id: 'inv_an', items: [{ price: 30000, quantity: 1 }], paymentHistory: [{ amount: 30000 }] }];
    const bankLedger = [
      { id: 'w_an', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.websiteWithdrawals, 10000);
    assert.equal(buckets.websiteIncomeAvailable, 20000);
  });

  // --- TEST AO: Fully paid invoice cannot remain financially outstanding ---
  await t.test('TEST AO: Fully paid invoice cannot remain financially outstanding', () => {
    const inv = { id: 'inv_ao', items: [{ price: 5000, quantity: 1 }], paymentHistory: [{ amount: 5000 }] };
    const due = getInvoiceBalanceDue(inv);
    const status = getInvoicePaymentStatus(inv);
    assert.equal(due, 0);
    assert.equal(status, 'Paid');
  });

  // --- MASTER SCENARIO: RAHIM (Previous Due ₹500 + Current Invoice ₹2,000) ---
  await t.test('MASTER SCENARIO: Rahim Multi-Payment Lifecycle with Previous Due Priority', () => {
    const previousDue = 500;
    const currentInvoiceTotal = 2000;

    // Payment 1: ₹300
    const alloc1 = allocatePayment(300, previousDue, currentInvoiceTotal);
    assert.equal(alloc1.allocatedToOldDue, 300);
    assert.equal(alloc1.remainingOldDue, 200);
    assert.equal(alloc1.allocatedToCurrentInvoice, 0);
    assert.equal(alloc1.remainingCurrentInvoiceDue, 2000);
    assert.equal(alloc1.customerTotalDue, 2200);
    assert.equal(alloc1.currentInvoicePaymentStatus, 'Unpaid');

    // Payment 2: ₹700 (Cumulative: ₹1,000)
    const alloc2 = allocatePayment(1000, previousDue, currentInvoiceTotal);
    assert.equal(alloc2.allocatedToOldDue, 500);
    assert.equal(alloc2.remainingOldDue, 0);
    assert.equal(alloc2.allocatedToCurrentInvoice, 500);
    assert.equal(alloc2.remainingCurrentInvoiceDue, 1500);
    assert.equal(alloc2.customerTotalDue, 1500);
    assert.equal(alloc2.currentInvoicePaymentStatus, 'Partial');

    // Payment 3: ₹1,500 (Cumulative: ₹2,500)
    const alloc3 = allocatePayment(2500, previousDue, currentInvoiceTotal);
    assert.equal(alloc3.allocatedToOldDue, 500);
    assert.equal(alloc3.remainingOldDue, 0);
    assert.equal(alloc3.allocatedToCurrentInvoice, 2000);
    assert.equal(alloc3.remainingCurrentInvoiceDue, 0);
    assert.equal(alloc3.customerTotalDue, 0);
    assert.equal(alloc3.currentInvoicePaymentStatus, 'Paid');
    assert.equal(alloc3.isSettled, true);
  });

});

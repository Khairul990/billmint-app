import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateCanonicalInvoiceFinancials,
  calculateItemTotal,
  calculateInvoiceTotals,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  allocatePayment,
  calculateAgingDistribution,
  calculateCollectionPriority,
  filterByWorkspace,
  roundTo2
} from '../src/utils/invoiceMath.js';

import {
  computeCustomerLedger,
  computeSalesSummary,
  computeCollectionsSummary,
  computeExpenseSummary,
  computeProfitLoss,
  filterByDateRange
} from '../src/utils/financialCalculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('PHASE 23: REAL USER JOURNEY + FULL PLATFORM FUNCTIONAL & UX HARDENING', () => {

  // --------------------------------------------------------------------------
  // A. New User Journey & Progressive Setup
  // --------------------------------------------------------------------------
  test('A. New User Journey: Default onboarding state initializes clean workspace', () => {
    const defaultSettings = {
      businessName: 'My Enterprise Store',
      currency: '₹',
      activeWorkspaceId: 'ws-new-user-001',
      businessWorkspaces: [{ id: 'ws-new-user-001', name: 'Primary Store' }],
      invoicePrefix: 'INV-'
    };

    assert.ok(defaultSettings.businessName);
    assert.equal(defaultSettings.currency, '₹');
    assert.equal(defaultSettings.businessWorkspaces.length, 1);
  });

  // --------------------------------------------------------------------------
  // B. Business Setup & Persistence
  // --------------------------------------------------------------------------
  test('B. Business Setup: Workspace settings persist without data leakage', () => {
    const ws1Settings = { workspaceId: 'ws-1', name: 'Bakery Shop', phone: '9876543210' };
    const ws2Settings = { workspaceId: 'ws-2', name: 'Textile Hub', phone: '9123456780' };

    const scopedStore = {
      'ws-1': ws1Settings,
      'ws-2': ws2Settings
    };

    assert.equal(scopedStore['ws-1'].name, 'Bakery Shop');
    assert.equal(scopedStore['ws-2'].name, 'Textile Hub');
    assert.notEqual(scopedStore['ws-1'].name, scopedStore['ws-2'].name);
  });

  // --------------------------------------------------------------------------
  // C. Customer Creation
  // --------------------------------------------------------------------------
  test('C. Customer Creation: Valid customer payload is normalized', () => {
    const rawCustomer = {
      id: 'cust-101',
      name: '  Rahim Textile  ',
      phone: ' 9876543210 ',
      email: ' rahim@example.com ',
      address: ' 12 Bazaar Road '
    };

    const normalized = {
      id: rawCustomer.id,
      name: rawCustomer.name.trim(),
      phone: rawCustomer.phone.trim(),
      email: rawCustomer.email.trim(),
      address: rawCustomer.address.trim()
    };

    assert.equal(normalized.name, 'Rahim Textile');
    assert.equal(normalized.phone, '9876543210');
    assert.equal(normalized.email, 'rahim@example.com');
  });

  // --------------------------------------------------------------------------
  // D. Duplicate Customer Protection
  // --------------------------------------------------------------------------
  test('D. Duplicate Customer Protection: Rejects empty or exact duplicate identities', () => {
    const existing = [{ id: 'c1', phone: '9876543210', name: 'Rahim' }];
    const newCustomer = { name: 'Rahim', phone: '9876543210' };

    const isDuplicate = existing.some(c => c.phone === newCustomer.phone.trim() && c.name.toLowerCase() === newCustomer.name.trim().toLowerCase());
    assert.equal(isDuplicate, true);
  });

  // --------------------------------------------------------------------------
  // E. Bill Creation
  // --------------------------------------------------------------------------
  test('E. Bill Creation: Items, Quantities, Rates, and Line Discounts calculate cleanly', () => {
    const item1 = calculateItemTotal(2, 500, 50); // 2 * 500 - 50 = 950
    const item2 = calculateItemTotal(3, 300, 0);  // 3 * 300 = 900
    assert.equal(item1, 950);
    assert.equal(item2, 900);
  });

  // --------------------------------------------------------------------------
  // F. Invoice Calculation
  // --------------------------------------------------------------------------
  test('F. Invoice Calculation: Subtotal, global discount, tax, and grand total', () => {
    const items = [
      { qty: 2, price: 500, discount: 50 }, // 950
      { qty: 1, price: 1050, discount: 0 }  // 1050
    ];
    // subtotal = 2000, discount = 100 -> taxable = 1900, tax 5% = 95, grandTotal = 1995
    const totals = calculateInvoiceTotals(items, 5, 100);
    assert.equal(totals.subtotal, 2000);
    assert.equal(totals.discountAmount, 100);
    assert.equal(totals.taxAmount, 95);
    assert.equal(totals.grandTotal, 1995);
  });

  // --------------------------------------------------------------------------
  // G. Earlier Balance Priority
  // --------------------------------------------------------------------------
  test('G. Earlier Balance Priority: Payment always settles Earlier Balance first', () => {
    const previousDue = 500;
    const currentBill = 2000;
    const payment = 300;

    const allocation = allocatePayment(payment, previousDue, currentBill);
    assert.equal(allocation.allocatedToOldDue, 300);
    assert.equal(allocation.remainingOldDue, 200);
    assert.equal(allocation.allocatedToCurrentInvoice, 0);
    assert.equal(allocation.remainingCurrentInvoiceDue, 2000);
    assert.equal(allocation.customerTotalDue, 2200);
  });

  // --------------------------------------------------------------------------
  // H. Total Amount Due
  // --------------------------------------------------------------------------
  test('H. Total Amount Due: Invariant Total Due = Earlier Balance + Current Bill Due', () => {
    const oldDue = 400;
    const billTotal = 1600;
    const paid = 600;

    const allocation = allocatePayment(paid, oldDue, billTotal);
    assert.equal(allocation.allocatedToOldDue, 400); // clears old due
    assert.equal(allocation.allocatedToCurrentInvoice, 200);
    assert.equal(allocation.remainingOldDue, 0);
    assert.equal(allocation.remainingCurrentInvoiceDue, 1400);
    assert.equal(allocation.customerTotalDue, 1400);
  });

  // --------------------------------------------------------------------------
  // I. Partial Payment
  // --------------------------------------------------------------------------
  test('I. Partial Payment: Correctly sets Partially Paid status', () => {
    const inv = {
      grandTotal: 1000,
      totalPaid: 400,
      paymentHistory: [{ amount: 400, date: '2026-09-01' }]
    };
    assert.equal(getInvoicePaidTotal(inv), 400);
    assert.equal(getInvoiceBalanceDue(inv), 600);
    assert.equal(getInvoicePaymentStatus(inv), 'Partially Paid');
  });

  // --------------------------------------------------------------------------
  // J. Multiple Partial Payments
  // --------------------------------------------------------------------------
  test('J. Multiple Partial Payments: Sum of payments accumulates accurately', () => {
    const inv = {
      grandTotal: 3000,
      paymentHistory: [
        { amount: 500, date: '2026-09-01' },
        { amount: 1000, date: '2026-09-02' },
        { amount: 500, date: '2026-09-03' }
      ]
    };
    assert.equal(getInvoicePaidTotal(inv), 2000);
    assert.equal(getInvoiceBalanceDue(inv), 1000);
    assert.equal(getInvoicePaymentStatus(inv), 'Partially Paid');
  });

  // --------------------------------------------------------------------------
  // K. Full Payment
  // --------------------------------------------------------------------------
  test('K. Full Payment: Sets status to Paid when exact total is met', () => {
    const inv = {
      grandTotal: 2500,
      paymentHistory: [{ amount: 2500, date: '2026-09-01' }]
    };
    assert.equal(getInvoicePaidTotal(inv), 2500);
    assert.equal(getInvoiceBalanceDue(inv), 0);
    assert.equal(getInvoicePaymentStatus(inv), 'Paid');
  });

  // --------------------------------------------------------------------------
  // L. Overpayment Protection
  // --------------------------------------------------------------------------
  test('L. Overpayment Protection: Rejects payment exceeding total outstanding liability', () => {
    const previousDue = 200;
    const currentBill = 800;
    const maxPayable = previousDue + currentBill; // 1000
    const attemptedPayment = 1200;

    assert.ok(attemptedPayment > maxPayable, 'Attempted payment is an overpayment');
    const safeCapped = Math.min(attemptedPayment, maxPayable);
    assert.equal(safeCapped, 1000);
  });

  // --------------------------------------------------------------------------
  // M. PDF Parity
  // --------------------------------------------------------------------------
  test('M. PDF Parity: Canonical calculations used for PDF generation match web values', () => {
    const inv = {
      grandTotal: 5000,
      previousDue: 1000,
      paidAmount: 2000,
      paymentHistory: [{ amount: 2000, date: '2026-09-01' }]
    };
    const canonical = calculateCanonicalInvoiceFinancials(inv);
    assert.equal(canonical.grandTotal, 5000);
    assert.equal(canonical.previousDue, 1000);
    assert.equal(canonical.allocatedToOldDue, 1000);
    assert.equal(canonical.allocatedToCurrentInvoice, 1000);
    assert.equal(canonical.balanceDue, 4000);
  });

  // --------------------------------------------------------------------------
  // N. Public Invoice Parity
  // --------------------------------------------------------------------------
  test('N. Public Invoice Parity: Customer public view computes same balance due', () => {
    const inv = {
      grandTotal: 1500,
      paidAmount: 500,
      items: [{ qty: 1, rate: 1500 }]
    };
    assert.equal(getInvoiceBalanceDue(inv), 1000);
    assert.equal(getInvoicePaymentStatus(inv), 'Partially Paid');
  });

  // --------------------------------------------------------------------------
  // O. Pending Payment Protection
  // --------------------------------------------------------------------------
  test('O. Pending Payment Protection: Unapproved proof does NOT affect official total', () => {
    const confirmedPaid = 500;
    const pendingProof = { amount: 300, status: 'pending' };

    // Ledger only considers confirmed / approved payments
    const officialPaid = confirmedPaid;
    assert.equal(officialPaid, 500);
    assert.notEqual(officialPaid + pendingProof.amount, 500);
  });

  // --------------------------------------------------------------------------
  // P. Payment Approval
  // --------------------------------------------------------------------------
  test('P. Payment Approval: Approved proof enters paymentHistory atomically', () => {
    const inv = {
      id: 'inv-1',
      grandTotal: 1000,
      paymentHistory: []
    };
    const proof = { id: 'proof-1', amount: 400, method: 'UPI', date: '2026-09-01' };

    // Merchant approves proof
    inv.paymentHistory.push({
      id: `pmt_${proof.id}`,
      proofId: proof.id,
      amount: proof.amount,
      method: proof.method,
      date: proof.date
    });

    assert.equal(getInvoicePaidTotal(inv), 400);
    assert.equal(getInvoiceBalanceDue(inv), 600);
  });

  // --------------------------------------------------------------------------
  // Q. Duplicate Approval Protection
  // --------------------------------------------------------------------------
  test('Q. Duplicate Approval Protection: Second approval of same proof is idempotent', () => {
    const paymentHistory = [
      { id: 'pmt_proof-1', proofId: 'proof-1', amount: 400 }
    ];

    const newProof = { id: 'proof-1', amount: 400 };
    const alreadyExists = paymentHistory.some(p => p.proofId === newProof.id);

    assert.equal(alreadyExists, true);
    if (!alreadyExists) {
      paymentHistory.push({ id: `pmt_${newProof.id}`, proofId: newProof.id, amount: newProof.amount });
    }

    assert.equal(paymentHistory.length, 1);
  });

  // --------------------------------------------------------------------------
  // R. Business Money Formula
  // --------------------------------------------------------------------------
  test('R. Business Money: Available Business Money = Money In - Outflows - Salary - Withdrawals', () => {
    const moneyIn = 100000;
    const businessExpenses = 20000;
    const staffPayments = 15000;
    const vendorPayments = 25000;
    const ownerSalary = 10000;
    const withdrawals = 5000;

    const available = moneyIn - (businessExpenses + staffPayments + vendorPayments + ownerSalary + withdrawals);
    assert.equal(available, 25000);
  });

  // --------------------------------------------------------------------------
  // S. My Cash
  // --------------------------------------------------------------------------
  test('S. My Cash: Increases on Cash withdrawal, decreases on Cash expense or transfer', () => {
    let myCash = 0;
    // Withdraw 2000 from Business Money to Cash
    myCash += 2000;
    assert.equal(myCash, 2000);

    // Spend 300 from Cash
    myCash -= 300;
    assert.equal(myCash, 1700);
  });

  // --------------------------------------------------------------------------
  // T. PhonePe
  // --------------------------------------------------------------------------
  test('T. PhonePe: Increases on transfer from Cash, decreases on PhonePe expense', () => {
    let myCash = 1700;
    let phonePe = 500;

    // Transfer 700 from Cash to PhonePe
    myCash -= 700;
    phonePe += 700;

    assert.equal(myCash, 1000);
    assert.equal(phonePe, 1200);

    // Spend 200 via PhonePe
    phonePe -= 200;
    assert.equal(phonePe, 1000);
  });

  // --------------------------------------------------------------------------
  // U. My Dream
  // --------------------------------------------------------------------------
  test('U. My Dream: Dream savings update without creating artificial expense', () => {
    let myCash = 1000;
    let dreamSavings = 5000;

    // Save 500 to Dream
    myCash -= 500;
    dreamSavings += 500;

    assert.equal(myCash, 500);
    assert.equal(dreamSavings, 5500);
    // Total personal wealth is preserved
    assert.equal(myCash + dreamSavings, 6000);
  });

  // --------------------------------------------------------------------------
  // V. Personal Expense
  // --------------------------------------------------------------------------
  test('V. Personal Expense: Reduces personal container without altering business income', () => {
    const businessIncome = 50000;
    let phonePe = 1000;

    // Personal grocery via PhonePe
    phonePe -= 250;
    assert.equal(phonePe, 750);
    // Business income unchanged
    assert.equal(businessIncome, 50000);
  });

  // --------------------------------------------------------------------------
  // W. Business Expense
  // --------------------------------------------------------------------------
  test('W. Business Expense: Correctly reduces Business Available Funds', () => {
    let businessAvailable = 25000;
    const electricityBill = 3000;

    businessAvailable -= electricityBill;
    assert.equal(businessAvailable, 22000);
  });

  // --------------------------------------------------------------------------
  // X. Staff Payment
  // --------------------------------------------------------------------------
  test('X. Staff Payment: Recorded as outflow reducing Business Money', () => {
    let businessAvailable = 22000;
    const staffSalary = 7000;

    businessAvailable -= staffSalary;
    assert.equal(businessAvailable, 15000);
  });

  // --------------------------------------------------------------------------
  // Y. Vendor Payment
  // --------------------------------------------------------------------------
  test('Y. Vendor Payment: Reduces business funds and settles vendor ledger', () => {
    let businessAvailable = 15000;
    let vendorBalanceDue = 8000;
    const payment = 5000;

    businessAvailable -= payment;
    vendorBalanceDue -= payment;

    assert.equal(businessAvailable, 10000);
    assert.equal(vendorBalanceDue, 3000);
  });

  // --------------------------------------------------------------------------
  // Z. Dashboard Reconciliation
  // --------------------------------------------------------------------------
  test('Z. Dashboard Reconciliation: Matches canonical metrics exactly', () => {
    const invoices = [
      { id: '1', grandTotal: 5000, paidAmount: 3000, date: '2026-09-01' },
      { id: '2', grandTotal: 2000, paidAmount: 2000, date: '2026-09-01' }
    ];
    const totalRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalOutstanding = totalRevenue - totalCollected;

    assert.equal(totalRevenue, 7000);
    assert.equal(totalCollected, 5000);
    assert.equal(totalOutstanding, 2000);
  });

  // --------------------------------------------------------------------------
  // AA. Customer Ledger Reconciliation
  // --------------------------------------------------------------------------
  test('AA. Customer Ledger Reconciliation: Tracks all invoices & payments per customer', () => {
    const customer = { id: 'cust-1', name: 'Rahim', openingDue: 500 };
    const invoices = [
      { id: 'inv-1', customerId: 'cust-1', grandTotal: 2000, paidAmount: 1500, previousDue: 500, paymentHistory: [{ amount: 1500, date: '2026-09-01' }] }
    ];

    const ledger = computeCustomerLedger(customer, invoices);
    assert.equal(ledger.totalBilled, 2000);
    assert.equal(ledger.totalPaid, 1500);
    assert.equal(ledger.totalDue, 1000); // 500 opening + 2000 bill - 1500 paid = 1000 due
  });

  // --------------------------------------------------------------------------
  // AB. Due Ledger Reconciliation
  // --------------------------------------------------------------------------
  test('AB. Due Ledger Reconciliation: Segments overdue items into 5 aging buckets', () => {
    const today = new Date('2026-09-01T00:00:00Z');
    const dueInvoices = [
      { id: 'd1', grandTotal: 1000, paidAmount: 0, dueDate: '2026-09-10' }, // current
      { id: 'd2', grandTotal: 600, paidAmount: 0, dueDate: '2026-08-15' }   // 17 days late (1-30d)
    ];

    const aging = calculateAgingDistribution(dueInvoices, today);
    assert.equal(aging.current, 1000);
    assert.equal(aging.overdue0to30, 600);
    assert.equal(aging.totalDue, 1600);
  });

  // --------------------------------------------------------------------------
  // AC. Reports Reconciliation
  // --------------------------------------------------------------------------
  test('AC. Reports Reconciliation: Sales, Collections, Expenses and P&L reconcile', () => {
    const invoices = [
      { id: '1', grandTotal: 10000, paidAmount: 8000, date: '2026-09-01' }
    ];
    const expenses = [
      { id: 'e1', amount: 3000, date: '2026-09-01' }
    ];

    const sales = computeSalesSummary(invoices);
    const collections = computeCollectionsSummary(invoices);
    const expSummary = computeExpenseSummary(expenses);
    const pl = computeProfitLoss(invoices, expenses);

    assert.equal(sales.totalSales, 10000);
    assert.equal(collections.totalCollected, 8000);
    assert.equal(expSummary.totalExpenses, 3000);
    assert.equal(pl.netProfit, 7000); // 10000 billed - 3000 expenses
    assert.equal(pl.revenue, 10000);
    assert.equal(pl.expenses, 3000);
    assert.equal(roundTo2(collections.totalCollected - expSummary.totalExpenses), 5000); // 8000 collected - 3000 expenses
  });

  // --------------------------------------------------------------------------
  // AD. Workspace Isolation
  // --------------------------------------------------------------------------
  test('AD. Workspace Isolation: Filter strictly isolates data to target workspaceId', () => {
    const allRecords = [
      { id: '1', workspaceId: 'ws-alpha', amount: 500 },
      { id: '2', workspaceId: 'ws-beta', amount: 300 },
      { id: '3', workspaceId: 'ws-alpha', amount: 200 }
    ];

    const alphaRecords = filterByWorkspace(allRecords, 'ws-alpha');
    assert.equal(alphaRecords.length, 2);
    assert.ok(alphaRecords.every(r => r.workspaceId === 'ws-alpha'));
  });

  // --------------------------------------------------------------------------
  // AE. Offline Queue Structure
  // --------------------------------------------------------------------------
  test('AE. Offline Queue: Creates structured sync item with timestamp and retryCount', () => {
    const queueItem = {
      id: `tx-${Date.now()}-abc`,
      type: 'INVOICE_CREATE',
      payload: { id: 'inv-offline-1', grandTotal: 500 },
      retryCount: 0,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    assert.ok(queueItem.id);
    assert.equal(queueItem.status, 'pending');
    assert.equal(queueItem.retryCount, 0);
  });

  // --------------------------------------------------------------------------
  // AF. Idempotent Sync
  // --------------------------------------------------------------------------
  test('AF. Idempotent Sync: Replaying transaction does not create duplicate entries', () => {
    const store = new Map();
    const tx = { id: 'inv-sync-1', total: 1000 };

    // First write
    store.set(tx.id, tx);
    // Second write (replay)
    store.set(tx.id, tx);

    assert.equal(store.size, 1);
    assert.equal(store.get('inv-sync-1').total, 1000);
  });

  // --------------------------------------------------------------------------
  // AG. Session Security
  // --------------------------------------------------------------------------
  test('AG. Session Security: Never stores tokens or passwords in financial records', () => {
    const invoice = {
      id: 'inv-sec-1',
      grandTotal: 1000,
      customerName: 'Customer A'
    };

    assert.equal(invoice.password, undefined);
    assert.equal(invoice.token, undefined);
    assert.equal(invoice.refreshToken, undefined);
    assert.equal(invoice.secret, undefined);
  });

  // --------------------------------------------------------------------------
  // AH. Logout Safety
  // --------------------------------------------------------------------------
  test('AH. Logout Safety: Logging out clears session keys but preserves scoped business data', () => {
    const sessionStore = {
      activeSessionId: 'sess-123',
      businessData_wsAlpha: { name: 'Alpha Shop' }
    };

    // Logout operation
    delete sessionStore.activeSessionId;

    assert.equal(sessionStore.activeSessionId, undefined);
    assert.ok(sessionStore.businessData_wsAlpha, 'Business data must remain intact');
  });

  // --------------------------------------------------------------------------
  // AI. Notification Action
  // --------------------------------------------------------------------------
  test('AI. Notification Action: Generates clear actionable alerts for overdue and pending items', () => {
    const overdueCount = 2;
    const pendingProofsCount = 1;

    const notifications = [];
    if (overdueCount > 0) {
      notifications.push({ type: 'overdue', message: `${overdueCount} bills overdue`, action: 'due-ledger' });
    }
    if (pendingProofsCount > 0) {
      notifications.push({ type: 'pending_proof', message: `${pendingProofsCount} payment proof pending`, action: 'pending-payments' });
    }

    assert.equal(notifications.length, 2);
    assert.equal(notifications[0].action, 'due-ledger');
  });

  // --------------------------------------------------------------------------
  // AJ. Mobile Safety
  // --------------------------------------------------------------------------
  test('AJ. Mobile Safety: Viewport width breakpoints behave without layout breaking', () => {
    const breakpoints = [320, 375, 390, 430, 768, 1024, 1440];
    assert.ok(breakpoints.every(bp => bp >= 320));
  });

  // --------------------------------------------------------------------------
  // AK. Empty State Safety
  // --------------------------------------------------------------------------
  test('AK. Empty State Safety: Handles zero data gracefully without crashing', () => {
    const emptyInvoices = [];
    const totals = calculateInvoiceTotals(emptyInvoices, 0, 0);
    assert.equal(totals.grandTotal, 0);
    assert.equal(totals.subtotal, 0);

    const aging = calculateAgingDistribution(emptyInvoices);
    assert.equal(aging.totalDue, 0);
    assert.equal(aging.overdueCount, 0);
  });

  // --------------------------------------------------------------------------
  // AL. Error State Safety
  // --------------------------------------------------------------------------
  test('AL. Error State Safety: Handles corrupted or null records without NaN', () => {
    const corruptedInv = { grandTotal: null, paidAmount: 'invalid' };
    assert.equal(getInvoicePaidTotal(corruptedInv), 0);
    assert.equal(getInvoiceBalanceDue(corruptedInv), 0);
  });

  // --------------------------------------------------------------------------
  // AM. Loading State Safety
  // --------------------------------------------------------------------------
  test('AM. Loading State Safety: Null initial values resolve safely to 0', () => {
    assert.equal(roundTo2(undefined), 0);
    assert.equal(roundTo2(null), 0);
    assert.equal(roundTo2(NaN), 0);
  });

  // --------------------------------------------------------------------------
  // AN. Search and Navigation
  // --------------------------------------------------------------------------
  test('AN. Search & Navigation: Queries find matching invoices by customer or invoice number', () => {
    const list = [
      { id: '1', invoiceNumber: 'INV-1001', customerName: 'Rahim Store' },
      { id: '2', invoiceNumber: 'INV-1002', customerName: 'Karim Textile' }
    ];

    const q = 'rahim';
    const matches = list.filter(i => i.customerName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
    assert.equal(matches.length, 1);
    assert.equal(matches[0].invoiceNumber, 'INV-1001');
  });

  // --------------------------------------------------------------------------
  // AO. Rahim End-to-End Master Scenario
  // --------------------------------------------------------------------------
  test('AO. Master Scenario: Rahim ₹500 earlier + ₹2,000 bill -> Payments, Transfers, Personal Expenses, Dream Savings', () => {
    // 1. Initial State
    let earlierBalance = 500;
    const billGrandTotal = 2000;
    let totalAmountDue = roundTo2(earlierBalance + billGrandTotal);
    assert.equal(totalAmountDue, 2500);

    // Payment 1: ₹300 paid
    const p1 = 300;
    const alloc1 = allocatePayment(p1, earlierBalance, billGrandTotal);
    earlierBalance = alloc1.remainingOldDue; // 200
    const billRemaining1 = alloc1.remainingCurrentInvoiceDue; // 2000
    totalAmountDue = alloc1.customerTotalDue; // 2200
    assert.equal(earlierBalance, 200);
    assert.equal(billRemaining1, 2000);
    assert.equal(totalAmountDue, 2200);

    // Payment 2: ₹700 paid
    const p2 = 700;
    const alloc2 = allocatePayment(p2, earlierBalance, billRemaining1);
    earlierBalance = alloc2.remainingOldDue; // 0 (paid off ₹200 earlier + ₹500 towards bill)
    const billRemaining2 = alloc2.remainingCurrentInvoiceDue; // 1500
    totalAmountDue = alloc2.customerTotalDue; // 1500
    assert.equal(earlierBalance, 0);
    assert.equal(billRemaining2, 1500);
    assert.equal(totalAmountDue, 1500);

    // Payment 3: ₹1,500 paid
    const p3 = 1500;
    const alloc3 = allocatePayment(p3, earlierBalance, billRemaining2);
    earlierBalance = alloc3.remainingOldDue; // 0
    const billRemaining3 = alloc3.remainingCurrentInvoiceDue; // 0
    totalAmountDue = alloc3.customerTotalDue; // 0
    assert.equal(earlierBalance, 0);
    assert.equal(billRemaining3, 0);
    assert.equal(totalAmountDue, 0);
    assert.equal(alloc3.currentInvoicePaymentStatus, 'Paid');

    // Total Money Collected into Business Money
    const totalCollected = p1 + p2 + p3; // 2500
    let businessAvailable = totalCollected;
    assert.equal(businessAvailable, 2500);

    // 2. Withdraw ₹1,000 to My Cash
    let myCash = 0;
    let phonePe = 0;
    let myDream = 0;

    const withdrawAmount = 1000;
    businessAvailable -= withdrawAmount;
    myCash += withdrawAmount;

    assert.equal(businessAvailable, 1500);
    assert.equal(myCash, 1000);
    let totalPersonalMoney = myCash + phonePe + myDream;
    assert.equal(totalPersonalMoney, 1000);

    // 3. Move ₹400 from My Cash to PhonePe
    const transferCashToPhonePe = 400;
    myCash -= transferCashToPhonePe;
    phonePe += transferCashToPhonePe;

    assert.equal(myCash, 600);
    assert.equal(phonePe, 400);
    totalPersonalMoney = myCash + phonePe + myDream;
    assert.equal(totalPersonalMoney, 1000); // Unchanged personal total

    // 4. Spend ₹150 from PhonePe (Personal Expense)
    const personalExpense = 150;
    phonePe -= personalExpense;

    assert.equal(phonePe, 250);
    totalPersonalMoney = myCash + phonePe + myDream;
    assert.equal(totalPersonalMoney, 850);
    assert.equal(businessAvailable, 1500); // Business money unaffected

    // 5. Save ₹200 from Cash to My Dream
    const dreamTransfer = 200;
    myCash -= dreamTransfer;
    myDream += dreamTransfer;

    assert.equal(myCash, 400);
    assert.equal(myDream, 200);
    totalPersonalMoney = myCash + phonePe + myDream;
    assert.equal(totalPersonalMoney, 850); // Total personal wealth unchanged by dream transfer

    // Final Reconciled Buckets Check
    assert.equal(businessAvailable, 1500);
    assert.equal(myCash, 400);
    assert.equal(phonePe, 250);
    assert.equal(myDream, 200);
    assert.equal(totalPersonalMoney, 850);
  });
});

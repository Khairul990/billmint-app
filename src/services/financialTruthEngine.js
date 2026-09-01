/**
 * BILLQYRO FINANCIAL TRUTH & RECONCILIATION ENGINE
 * 
 * The authoritative platform-wide truth layer providing mathematical correctness,
 * traceable previous-due allocation, clean business vs. personal separation,
 * and universal ledger reconciliation.
 */

import { 
  roundTo2, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  filterByWorkspace 
} from '../utils/invoiceMath.js';

/**
 * DETERMINISTIC PAYMENT ALLOCATION
 * Rule: Previous Due ALWAYS receives first payment priority.
 * 
 * @param {number} paymentAmount - Total payment made
 * @param {number} previousDue - Opening previous due
 * @param {number} currentInvoiceTotal - Current bill grand total
 * @returns {Object} { allocatedToOldDue, remainingOldDue, allocatedToCurrentInvoice, remainingCurrentDue, totalCollected, remainingTotalDue }
 */
export const allocateCustomerPayment = (paymentAmount = 0, previousDue = 0, currentInvoiceTotal = 0) => {
  const pAmt = roundTo2(Math.max(0, parseFloat(paymentAmount) || 0));
  const oldDue = roundTo2(Math.max(0, parseFloat(previousDue) || 0));
  const currentTotal = roundTo2(Math.max(0, parseFloat(currentInvoiceTotal) || 0));

  // Previous Due always has payment priority
  const allocatedToOldDue = roundTo2(Math.min(pAmt, oldDue));
  const remainingOldDue = roundTo2(Math.max(0, oldDue - allocatedToOldDue));

  // Remainder pays current invoice
  const remainderForCurrent = roundTo2(Math.max(0, pAmt - allocatedToOldDue));
  const allocatedToCurrentInvoice = roundTo2(Math.min(remainderForCurrent, currentTotal));
  const remainingCurrentDue = roundTo2(Math.max(0, currentTotal - allocatedToCurrentInvoice));

  const totalCollected = roundTo2(allocatedToOldDue + allocatedToCurrentInvoice);
  const remainingTotalDue = roundTo2(remainingOldDue + remainingCurrentDue);

  return {
    allocatedToOldDue,
    remainingOldDue,
    allocatedToCurrentInvoice,
    remainingCurrentDue,
    totalCollected,
    remainingTotalDue,
    // Canonical user-preferred semantic aliases
    earlierBalancePaid: allocatedToOldDue,
    earlierBalanceRemaining: remainingOldDue,
    thisBillPaid: allocatedToCurrentInvoice,
    thisBillRemaining: remainingCurrentDue,
    amountPaid: totalCollected,
    amountStillDue: remainingTotalDue
  };
};

/**
 * CANONICAL RECONCILIATION ENGINE
 * Reconciles the full financial state across Invoices, Collections, Bank Ledger, and Expenses.
 * 
 * @param {Object} params
 * @param {Array} params.invoices - Workspace invoices
 * @param {Array} params.bankLedger - Workspace bank/cash ledger entries
 * @param {Array} [params.expenses] - Expense records
 * @param {string} [params.workspaceId] - Active workspace ID
 * @returns {Object} { balanced: boolean, discrepancies: Array, totals: Object }
 */
export const reconcileFinancialState = ({
  invoices = [],
  bankLedger = [],
  expenses = [],
  workspaceId = null
} = {}) => {
  const scopedInvoices = (workspaceId && workspaceId !== 'default'
    ? filterByWorkspace(invoices, workspaceId)
    : invoices
  ).filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');

  const scopedBankLedger = (Array.isArray(bankLedger) ? bankLedger : []).filter(b => {
    if (b.reversed) return false;
    if (workspaceId && b.workspaceId && b.workspaceId !== workspaceId) return false;
    return true;
  });

  const scopedExpenses = (workspaceId && workspaceId !== 'default'
    ? filterByWorkspace(expenses, workspaceId)
    : expenses
  ).filter(exp => !exp.isDeleted);

  let totalInvoiced = 0;
  let totalPreviousDueOpening = 0;
  let totalPreviousDueRecovered = 0;
  let totalCurrentInvoiceCollections = 0;
  let remainingPreviousDue = 0;
  let remainingCurrentInvoiceDue = 0;

  const seenInvoicePaymentTxIds = new Set();

  // 1. Invoices & Customer Collections Pass
  scopedInvoices.forEach(inv => {
    const invTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const prevDue = roundTo2(parseFloat(inv.previousDue || inv.prevDue) || 0);
    const paid = getInvoicePaidTotal(inv);

    totalInvoiced = roundTo2(totalInvoiced + invTotal);
    totalPreviousDueOpening = roundTo2(totalPreviousDueOpening + prevDue);

    const alloc = allocateCustomerPayment(paid, prevDue, invTotal);
    totalPreviousDueRecovered = roundTo2(totalPreviousDueRecovered + alloc.allocatedToOldDue);
    totalCurrentInvoiceCollections = roundTo2(totalCurrentInvoiceCollections + alloc.allocatedToCurrentInvoice);
    remainingPreviousDue = roundTo2(remainingPreviousDue + alloc.remainingOldDue);
    remainingCurrentInvoiceDue = roundTo2(remainingCurrentInvoiceDue + alloc.remainingCurrentDue);

    if (Array.isArray(inv.paymentHistory)) {
      inv.paymentHistory.forEach(p => {
        if (p.id) seenInvoicePaymentTxIds.add(p.id);
        if (p.proofId) seenInvoicePaymentTxIds.add(p.proofId);
      });
    }
  });

  const totalCustomerCollections = roundTo2(totalPreviousDueRecovered + totalCurrentInvoiceCollections);
  const totalReceivable = roundTo2(totalInvoiced + totalPreviousDueOpening);
  const totalOutstanding = roundTo2(remainingPreviousDue + remainingCurrentInvoiceDue);

  // 2. Bank Ledger & Money Flow Pass
  let otherBusinessIncome = 0;
  let ledgerBusinessExpenses = 0;
  let staffPayouts = 0;
  let vendorPayouts = 0;
  let customerRefunds = 0;
  let ownerSalary = 0;
  let websiteWithdrawals = 0;

  let myCashInflow = 0;
  let myCashOutflow = 0;
  let myCashExpenses = 0;

  let phonePeInflow = 0;
  let phonePeOutflow = 0;
  let phonePeExpenses = 0;

  let dreamInflow = 0;
  let dreamOutflow = 0;

  scopedBankLedger.forEach(b => {
    // Avoid double counting invoice payments logged in bank ledger
    if (b.source === 'invoice_payment' || b.invoiceId || (seenInvoicePaymentTxIds.has(b.sourceRefId) || seenInvoicePaymentTxIds.has(b.id))) {
      return;
    }

    const amt = roundTo2(b.amountRupees !== undefined ? b.amountRupees : (b.amountPaise ? b.amountPaise / 100 : (b.amount !== undefined ? b.amount : 0)));
    if (amt <= 0) return;

    const catLower = (b.category || '').toLowerCase();
    const srcLower = (b.source || '').toLowerCase();
    const srcLoc = (b.sourceLocation || '').toLowerCase();
    const destLoc = (b.destinationLocation || '').toLowerCase();

    // Internal Transfers & Withdrawals
    if (b.isTransfer || catLower.includes('transfer') || srcLower === 'money_transfer' || srcLower === 'dream_transfer') {
      if (srcLoc === 'website_income') {
        websiteWithdrawals = roundTo2(websiteWithdrawals + amt);
      } else if (srcLoc === 'my_cash') {
        myCashOutflow = roundTo2(myCashOutflow + amt);
      } else if (srcLoc === 'phonepe') {
        phonePeOutflow = roundTo2(phonePeOutflow + amt);
      } else if (srcLoc === 'my_dream') {
        dreamOutflow = roundTo2(dreamOutflow + amt);
      }

      if (destLoc === 'my_cash') {
        myCashInflow = roundTo2(myCashInflow + amt);
      } else if (destLoc === 'phonepe') {
        phonePeInflow = roundTo2(phonePeInflow + amt);
      } else if (destLoc === 'my_dream') {
        dreamInflow = roundTo2(dreamInflow + amt);
      }
      return;
    }

    // Direct Withdrawals
    if (catLower === 'withdrawal' || srcLower === 'owner_withdrawal' || b.type === 'withdrawal') {
      websiteWithdrawals = roundTo2(websiteWithdrawals + amt);
      if (destLoc === 'phonepe') {
        phonePeInflow = roundTo2(phonePeInflow + amt);
      } else {
        myCashInflow = roundTo2(myCashInflow + amt);
      }
      return;
    }

    // Owner Salary
    if (catLower === 'my salary' || srcLower === 'owner_salary' || (b.type === 'salary' && !catLower.includes('staff'))) {
      ownerSalary = roundTo2(ownerSalary + amt);
      if (destLoc === 'phonepe') {
        phonePeInflow = roundTo2(phonePeInflow + amt);
      } else if (destLoc === 'my_cash') {
        myCashInflow = roundTo2(myCashInflow + amt);
      }
      return;
    }

    // Personal Expenses from Cash / PhonePe
    if (srcLoc === 'my_cash' && (destLoc === 'expense' || srcLower === 'personal_expense')) {
      myCashExpenses = roundTo2(myCashExpenses + amt);
      return;
    }
    if (srcLoc === 'phonepe' && (destLoc === 'expense' || srcLower === 'personal_expense')) {
      phonePeExpenses = roundTo2(phonePeExpenses + amt);
      return;
    }

    // Business Outflows & Income
    if (catLower.includes('salary') || catLower.includes('wages') || srcLower === 'staff_payout' || catLower.includes('staff advance')) {
      staffPayouts = roundTo2(staffPayouts + amt);
    } else if (catLower.includes('vendor') || catLower.includes('outsource') || srcLower === 'outsource_payout') {
      vendorPayouts = roundTo2(vendorPayouts + amt);
    } else if (catLower.includes('refund') || srcLower === 'customer_refund') {
      customerRefunds = roundTo2(customerRefunds + amt);
    } else if (catLower.includes('expense') || srcLower === 'expense_entry' || catLower.includes('supplies') || catLower.includes('utilities') || catLower.includes('rent')) {
      ledgerBusinessExpenses = roundTo2(ledgerBusinessExpenses + amt);
    } else if (b.type === 'moneyIn') {
      otherBusinessIncome = roundTo2(otherBusinessIncome + amt);
    } else {
      ledgerBusinessExpenses = roundTo2(ledgerBusinessExpenses + amt);
    }
  });

  // Operating Expenses integration
  let operatingExpenses = 0;
  scopedExpenses.forEach(exp => {
    const amt = roundTo2(parseFloat(exp.amount || exp.total) || 0);
    if (amt > 0) operatingExpenses = roundTo2(operatingExpenses + amt);
  });

  const totalBusinessExpenses = roundTo2(Math.max(operatingExpenses, ledgerBusinessExpenses));
  const totalBusinessIncome = roundTo2(totalCustomerCollections + otherBusinessIncome);
  const totalBusinessOutflows = roundTo2(totalBusinessExpenses + staffPayouts + vendorPayouts + customerRefunds + ownerSalary + websiteWithdrawals);
  const websiteIncomeAvailable = roundTo2(totalBusinessIncome - totalBusinessOutflows);

  // Personal Balances
  const myCashBalance = roundTo2(Math.max(0, myCashInflow - myCashOutflow - myCashExpenses));
  const phonePeBalance = roundTo2(Math.max(0, phonePeInflow - phonePeOutflow - phonePeExpenses));
  const myDreamBalance = roundTo2(Math.max(0, dreamInflow - dreamOutflow));
  const personalWealth = roundTo2(myCashBalance + phonePeBalance + myDreamBalance);

  // Rates
  const overallCollectionRate = totalReceivable > 0 ? roundTo2((totalCustomerCollections / totalReceivable) * 100) : 0;
  const currentInvoiceRealizationRate = totalInvoiced > 0 ? roundTo2((totalCurrentInvoiceCollections / totalInvoiced) * 100) : 0;
  const previousDueRecoveryRate = totalPreviousDueOpening > 0 ? roundTo2((totalPreviousDueRecovered / totalPreviousDueOpening) * 100) : 100;

  // Discrepancy Integrity Checker
  const discrepancies = [];

  // Invariant 1: Total Receivable - Total Collected === Total Outstanding
  const expectedOutstanding = roundTo2(totalReceivable - totalCustomerCollections);
  if (Math.abs(expectedOutstanding - totalOutstanding) > 0.01) {
    discrepancies.push({
      field: 'totalOutstanding',
      expected: expectedOutstanding,
      actual: totalOutstanding,
      difference: roundTo2(totalOutstanding - expectedOutstanding),
      description: 'Receivable minus Collected does not equal Outstanding balance'
    });
  }

  // Invariant 2: Total Collected === Previous Due Recovered + Current Invoice Collections
  const sumCollected = roundTo2(totalPreviousDueRecovered + totalCurrentInvoiceCollections);
  if (Math.abs(sumCollected - totalCustomerCollections) > 0.01) {
    discrepancies.push({
      field: 'totalCollected',
      expected: sumCollected,
      actual: totalCustomerCollections,
      difference: roundTo2(totalCustomerCollections - sumCollected),
      description: 'Sum of Previous Due and Current Invoice collections does not match Total Collections'
    });
  }

  // Invariant 3: Personal Wealth matches sum of its liquid buckets
  const sumPersonal = roundTo2(myCashBalance + phonePeBalance + myDreamBalance);
  if (Math.abs(sumPersonal - personalWealth) > 0.01) {
    discrepancies.push({
      field: 'personalWealth',
      expected: sumPersonal,
      actual: personalWealth,
      difference: roundTo2(personalWealth - sumPersonal),
      description: 'Personal wealth does not equal My Cash + PhonePe + My Dream'
    });
  }

  const balanced = discrepancies.length === 0;

  const totals = {
    totalInvoiced,
    totalPreviousDueOpening,
    totalReceivable,
    totalPreviousDueRecovered,
    totalCurrentInvoiceCollections,
    totalCustomerCollections,
    remainingPreviousDue,
    remainingCurrentInvoiceDue,
    totalOutstanding,
    otherBusinessIncome,
    totalBusinessIncome,
    totalBusinessExpenses,
    staffPayouts,
    vendorPayouts,
    customerRefunds,
    ownerSalary,
    websiteWithdrawals,
    totalBusinessOutflows,
    websiteIncomeAvailable,
    myCashBalance,
    myCashExpenses,
    phonePeBalance,
    phonePeExpenses,
    myDreamBalance,
    personalWealth,
    overallCollectionRate,
    currentInvoiceRealizationRate,
    previousDueRecoveryRate
  };

  return {
    balanced,
    discrepancies,
    totals
  };
};

export const financialTruthEngine = {
  allocateCustomerPayment,
  reconcileFinancialState
};

export default financialTruthEngine;

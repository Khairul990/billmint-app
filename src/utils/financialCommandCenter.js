/**
 * BillQyro Financial Command Center
 *
 * Pure read-only aggregation over already persisted business records.
 * This module intentionally performs NO writes and does not mutate invoices,
 * payments, expenses, or vendor records.
 */

import {
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  roundTo2,
} from './financialCalculations.js';

const isActiveInvoice = (invoice) => (
  invoice &&
  !invoice.isDeleted &&
  invoice.status !== 'Cancelled' &&
  invoice.status !== 'Void' &&
  (invoice.documentType || (invoice.billType === 'Estimate' ? 'Estimate' : 'Invoice')) === 'Invoice'
);

const isActiveOutsourceJob = (job) => (
  job && !job.isDeleted && job.status !== 'Cancelled'
);

const amount = (value) => roundTo2(parseFloat(value) || 0);

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return !Number.isNaN(da.getTime()) && !Number.isNaN(db.getTime()) && da.toDateString() === db.toDateString();
};

const dateOf = (item) => item?.date || item?.createdAt || item?.updatedAt || null;

/**
 * Calculate dashboard-level financial metrics without changing source records.
 * Client revenue remains the full invoice amount; outsource work is tracked as
 * a separate direct cost and therefore never reduces the client invoice.
 *
 * `outsourceJobs` is optional so the dashboard remains compatible while the
 * Vendor/Outsource persistence model is rolled out.
 */
export const calculateFinancialCommandCenter = ({
  invoices = [],
  expenses = [],
  outsourceJobs = [],
  now = new Date(),
} = {}) => {
  const activeInvoices = Array.isArray(invoices) ? invoices.filter(isActiveInvoice) : [];
  const validExpenses = Array.isArray(expenses) ? expenses.filter(Boolean) : [];
  const validOutsourceJobs = Array.isArray(outsourceJobs)
    ? outsourceJobs.filter(isActiveOutsourceJob)
    : [];

  const totalBilled = amount(activeInvoices.reduce(
    (sum, invoice) => sum + amount(invoice.grandTotal ?? invoice.total ?? invoice.totals?.grandTotal),
    0,
  ));

  const totalCollected = amount(activeInvoices.reduce(
    (sum, invoice) => sum + getInvoicePaidTotal(invoice),
    0,
  ));

  const clientDue = amount(activeInvoices.reduce(
    (sum, invoice) => sum + getInvoiceBalanceDue(invoice),
    0,
  ));

  const todaysBilling = amount(activeInvoices
    .filter((invoice) => sameDay(dateOf(invoice), now))
    .reduce((sum, invoice) => sum + amount(invoice.grandTotal ?? invoice.total), 0));

  const todaysCollection = amount(activeInvoices.reduce((sum, invoice) => {
    if (Array.isArray(invoice.paymentHistory) && invoice.paymentHistory.length) {
      return sum + invoice.paymentHistory
        .filter((payment) => sameDay(payment.date || payment.createdAt, now))
        .reduce((inner, payment) => inner + amount(payment.amount), 0);
    }
    return sum + (sameDay(dateOf(invoice), now) ? getInvoicePaidTotal(invoice) : 0);
  }, 0));

  const totalOutsourceCost = amount(validOutsourceJobs.reduce(
    (sum, job) => sum + amount(job.agreedCost ?? job.totalCost ?? job.cost),
    0,
  ));

  const outsourcePaid = amount(validOutsourceJobs.reduce((sum, job) => {
    if (Array.isArray(job.paymentHistory)) {
      return sum + job.paymentHistory.reduce((inner, payment) => inner + amount(payment.amount), 0);
    }
    return sum + amount(job.amountPaid ?? job.paidAmount);
  }, 0));

  const outsourcePayable = amount(Math.max(0, totalOutsourceCost - outsourcePaid));

  const totalExpenses = amount(validExpenses.reduce(
    (sum, expense) => sum + amount(expense.amount ?? expense.total),
    0,
  ));

  const todaysOutsourceCost = amount(validOutsourceJobs
    .filter((job) => sameDay(dateOf(job), now))
    .reduce((sum, job) => sum + amount(job.agreedCost ?? job.totalCost ?? job.cost), 0));

  const todaysOutsourcePaid = amount(validOutsourceJobs.reduce((sum, job) => {
    if (!Array.isArray(job.paymentHistory)) return sum;
    return sum + job.paymentHistory
      .filter((payment) => sameDay(payment.date || payment.createdAt, now))
      .reduce((inner, payment) => inner + amount(payment.amount), 0);
  }, 0));

  const todaysExpenses = amount(validExpenses
    .filter((expense) => sameDay(dateOf(expense), now))
    .reduce((sum, expense) => sum + amount(expense.amount ?? expense.total), 0));

  const directCosts = amount(totalOutsourceCost + totalExpenses);
  const grossProfit = amount(totalBilled - directCosts);
  const profitMargin = totalBilled > 0 ? amount((grossProfit / totalBilled) * 100) : 0;

  const todaysDirectCosts = amount(todaysOutsourceCost + todaysExpenses);
  const todaysProfit = amount(todaysBilling - todaysDirectCosts);
  const todaysProfitMargin = todaysBilling > 0 ? amount((todaysProfit / todaysBilling) * 100) : 0;

  return {
    totalBilled,
    totalCollected,
    clientDue,
    totalOutsourceCost,
    outsourcePaid,
    outsourcePayable,
    totalExpenses,
    directCosts,
    grossProfit,
    profitMargin,
    todaysBilling,
    todaysCollection,
    todaysOutsourceCost,
    todaysOutsourcePaid,
    todaysExpenses,
    todaysDirectCosts,
    todaysProfit,
    todaysProfitMargin,
    invoiceCount: activeInvoices.length,
    outsourceJobCount: validOutsourceJobs.length,
  };
};

export default calculateFinancialCommandCenter;

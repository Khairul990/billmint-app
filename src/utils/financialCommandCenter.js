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
} from './financialCalculations';

const isActiveInvoice = (invoice) => (
  invoice &&
  !invoice.isDeleted &&
  invoice.status !== 'Cancelled' &&
  invoice.status !== 'Void' &&
  (invoice.documentType || (invoice.billType === 'Estimate' ? 'Estimate' : 'Invoice')) === 'Invoice'
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
 *
 * Revenue/billed is based on valid invoice grand totals.
 * Cash collected is based on payment history when available, otherwise the
 * canonical invoice paid resolver.
 * Client due uses the canonical invoice balance resolver.
 *
 * `outsourceJobs` is intentionally optional so the dashboard can safely adopt
 * this utility before the full Vendor/Outsource persistence model is enabled.
 */
export const calculateFinancialCommandCenter = ({
  invoices = [],
  expenses = [],
  outsourceJobs = [],
  now = new Date(),
} = {}) => {
  const activeInvoices = Array.isArray(invoices) ? invoices.filter(isActiveInvoice) : [];
  const validExpenses = Array.isArray(expenses) ? expenses.filter(Boolean) : [];
  const validOutsourceJobs = Array.isArray(outsourceJobs) ? outsourceJobs.filter(Boolean) : [];

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

  const directCosts = amount(totalOutsourceCost + totalExpenses);
  const grossProfit = amount(totalBilled - directCosts);
  const profitMargin = totalBilled > 0 ? amount((grossProfit / totalBilled) * 100) : 0;

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
    invoiceCount: activeInvoices.length,
    outsourceJobCount: validOutsourceJobs.length,
  };
};

export default calculateFinancialCommandCenter;

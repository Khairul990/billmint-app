import { invoiceEngine } from './invoiceEngine.js';
import { customerEngine } from './customerEngine.js';
import { expenseEngine } from './expenseEngine.js';
import { productEngine } from './productEngine.js';
import {
  computeSalesSummary,
  computeCollectionsSummary,
  computeExpenseSummary,
  computeProfitLoss,
  computeCustomerReport,
  computeInventoryReport,
  filterByDateRange,
  filterByWorkspace,
  getInvoicePaidTotal,
  getInvoiceBalanceDue
} from '../utils/financialCalculations.js';

class ReportEngine {
  async generateComprehensiveReport(workspaceId, dateRange = 'This Month', customStart = null, customEnd = null) {
    const rawInvoices = await invoiceEngine.getInvoices() || [];
    const rawCustomers = await customerEngine.getCustomers() || [];
    const rawExpenses = await expenseEngine.getExpenses() || [];
    const rawProducts = await productEngine.getProducts() || [];

    // Apply Workspace Isolation
    const wsInvoices = filterByWorkspace(rawInvoices, workspaceId);
    const wsCustomers = filterByWorkspace(rawCustomers, workspaceId);
    const wsExpenses = filterByWorkspace(rawExpenses, workspaceId);
    const wsProducts = filterByWorkspace(rawProducts, workspaceId);

    // Apply Date Range
    const dateFilteredInvoices = filterByDateRange(wsInvoices, 'date', dateRange, customStart, customEnd);
    const dateFilteredExpenses = filterByDateRange(wsExpenses, 'date', dateRange, customStart, customEnd);

    // Compute Metrics
    const salesSummary = computeSalesSummary(dateFilteredInvoices);
    const collectionsSummary = computeCollectionsSummary(dateFilteredInvoices);
    const expenseSummary = computeExpenseSummary(dateFilteredExpenses);
    const profitLoss = computeProfitLoss(dateFilteredInvoices, dateFilteredExpenses);
    const customerReport = computeCustomerReport(dateFilteredInvoices, wsCustomers);
    const inventoryReport = computeInventoryReport(wsProducts, dateFilteredInvoices);

    return {
      workspaceId,
      dateRange,
      salesSummary,
      collectionsSummary,
      expenseSummary,
      profitLoss,
      customerReport,
      inventoryReport,
      filteredInvoices: dateFilteredInvoices,
      filteredExpenses: dateFilteredExpenses
    };
  }

  exportToCSV(filename, dataArray, customHeaders = null) {
    if (!dataArray || dataArray.length === 0) return false;
    
    const headers = customHeaders || Object.keys(dataArray[0]);
    const csvRows = [];
    
    // Header
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    
    // Rows
    for (const row of dataArray) {
      const values = headers.map(header => {
        let val = row[header] !== null && row[header] !== undefined ? row[header] : '';
        const escaped = ('' + val).replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const BOM = '\uFEFF';
    const csvString = BOM + csvRows.join('\n');
    
    if (typeof window !== 'undefined' && window.Blob && window.URL) {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    }
    return csvString;
  }

  async exportInvoices(workspaceId, dateRange = 'All Time', customStart = null, customEnd = null) {
    const rawInvoices = await invoiceEngine.getInvoices() || [];
    const wsInvoices = filterByWorkspace(rawInvoices, workspaceId);
    const filtered = filterByDateRange(wsInvoices, 'date', dateRange, customStart, customEnd);

    const formatted = filtered.map(inv => {
      const grandTotal = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const paid = getInvoicePaidTotal(inv);
      const due = getInvoiceBalanceDue(inv);

      return {
        'Date': inv.date || inv.createdAt || '',
        'Invoice Number': inv.invoiceNumber || inv.id || '',
        'Type': inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice'),
        'Customer': inv.customer?.name || inv.customerName || 'Unknown',
        'Total Amount': grandTotal.toFixed(2),
        'Amount Paid': paid.toFixed(2),
        'Due Amount': due.toFixed(2),
        'Status': inv.paymentStatus || 'Unpaid',
        'Payment Method': inv.paymentMethod || 'Cash'
      };
    });
    
    return this.exportToCSV(`BillQyro_Invoices_${new Date().toISOString().split('T')[0]}`, formatted);
  }

  async exportExpenses(workspaceId, dateRange = 'All Time', customStart = null, customEnd = null) {
    const rawExpenses = await expenseEngine.getExpenses() || [];
    const wsExpenses = filterByWorkspace(rawExpenses, workspaceId);
    const filtered = filterByDateRange(wsExpenses, 'date', dateRange, customStart, customEnd);

    const formatted = filtered.map(exp => ({
      'Date': exp.date || exp.createdAt || '',
      'Title': exp.title || exp.description || 'Expense',
      'Category': exp.category || 'General',
      'Amount': (parseFloat(exp.amount) || 0).toFixed(2),
      'Payment Method': exp.paymentMethod || 'Cash',
      'Note': exp.notes || ''
    }));

    return this.exportToCSV(`BillQyro_Expenses_${new Date().toISOString().split('T')[0]}`, formatted);
  }

  async exportCustomers(workspaceId) {
    const rawCustomers = await customerEngine.getCustomers() || [];
    const customers = filterByWorkspace(rawCustomers, workspaceId);

    const formatted = customers.map(c => ({
      'Customer ID': c.customerId || c.id || '',
      'Name': c.customerName || c.name || '',
      'Phone': c.customerPhone || c.phone || '',
      'Email': c.customerEmail || c.email || '',
      'Address': c.customerAddress || c.address || '',
      'Notes': c.notes || ''
    }));
    
    return this.exportToCSV(`BillQyro_Customers_${new Date().toISOString().split('T')[0]}`, formatted);
  }
}

export const reportEngine = new ReportEngine();

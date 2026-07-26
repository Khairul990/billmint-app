import { invoiceEngine } from './invoiceEngine';
import { customerEngine } from './customerEngine';

class ReportEngine {
  async generateRevenueReport(workspaceId, startDate, endDate) {
    const invoices = await invoiceEngine.getInvoices();
    let filteredInvoices = invoices;
    
    if (startDate && endDate) {
      filteredInvoices = invoices.filter(inv => {
        const d = new Date(inv.date || inv.createdAt);
        return d >= new Date(startDate) && d <= new Date(endDate);
      });
    }
    
    let totalRevenue = 0;
    filteredInvoices.forEach(inv => {
      totalRevenue += (Number(inv.amountPaid) || 0);
    });

    return {
      period: { startDate, endDate },
      totalRevenue,
      invoiceCount: filteredInvoices.length,
      invoices: filteredInvoices
    };
  }

  exportToCSV(filename, dataArray) {
    if (!dataArray || dataArray.length === 0) return;
    
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    
    // Header
    csvRows.push(headers.join(','));
    
    // Rows
    for (const row of dataArray) {
      const values = headers.map(header => {
        let val = row[header] !== null && row[header] !== undefined ? row[header] : '';
        const escaped = ('' + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async exportInvoices(workspaceId) {
    const invoices = await invoiceEngine.getInvoices();
    const formatted = invoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Date': inv.date,
      'Customer': inv.customer?.name || inv.customerName || '',
      'Total Amount': inv.total || 0,
      'Amount Paid': inv.amountPaid || 0,
      'Status': inv.status || 'Pending'
    }));
    
    this.exportToCSV(`invoices_${new Date().toISOString().split('T')[0]}`, formatted);
  }

  async exportCustomers(workspaceId) {
    const customers = await customerEngine.getCustomers();
    const formatted = customers.map(c => ({
      'Customer ID': c.customerId || c.id,
      'Name': c.customerName || c.name || '',
      'Email': c.customerEmail || c.email || '',
      'Phone': c.customerPhone || c.phone || '',
      'Address': c.customerAddress || c.address || ''
    }));
    
    this.exportToCSV(`customers_${new Date().toISOString().split('T')[0]}`, formatted);
  }
}

export const reportEngine = new ReportEngine();

import { getCustomers, saveCustomer, deleteCustomer } from './dbEngine';

class CustomerEngine {
  async getCustomers(includeDeleted = false) {
    return await getCustomers(includeDeleted);
  }

  async getCustomerById(customerId) {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === customerId);
  }

  async saveCustomer(customerData) {
    // Inject any customer-specific business logic here before saving
    // e.g. updating timestamp, initializing ledger
    if (!customerData.createdAt) {
      customerData.createdAt = new Date().toISOString();
    }
    customerData.updatedAt = new Date().toISOString();
    
    return await saveCustomer(customerData);
  }

  async deleteCustomer(customerId) {
    return await deleteCustomer(customerId);
  }

  async restoreCustomer(customerId) {
    return await restoreCustomer(customerId);
  }

  // Calculate Due Ledger for a single customer
  // This could involve cross-referencing with invoiceEngine, but for now we aggregate local data if present
  calculateDueLedger(customer, invoices = []) {
    const customerInvoices = invoices.filter(inv => inv.customer?.id === customer.id || inv.customerId === customer.id);
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalDue = 0;

    customerInvoices.forEach(inv => {
      totalInvoiced += (inv.total || 0);
      const paid = inv.amountPaid || 0;
      totalPaid += paid;
      totalDue += ((inv.total || 0) - paid);
    });

    return { totalInvoiced, totalPaid, totalDue };
  }

  // Track Payment History
  getPaymentHistory(customer, invoices = []) {
    const customerInvoices = invoices.filter(inv => inv.customer?.id === customer.id || inv.customerId === customer.id);
    const payments = [];
    
    customerInvoices.forEach(inv => {
      if (inv.payments && Array.isArray(inv.payments)) {
        inv.payments.forEach(p => {
          payments.push({
            ...p,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber
          });
        });
      }
    });

    // Sort by date descending
    return payments.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

export const customerEngine = new CustomerEngine();

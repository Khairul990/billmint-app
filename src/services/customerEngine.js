import { getCustomers, saveCustomer, deleteCustomer, restoreCustomer } from './dbEngine';
import { computeCustomerLedger } from '../utils/financialCalculations';

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
  calculateDueLedger(customer, invoices = [], excludeInvoiceId = null) {
    const result = computeCustomerLedger(customer, invoices, excludeInvoiceId);
    return {
      totalInvoiced: result.totalBilled,
      totalBilled: result.totalBilled,
      totalPaid: result.totalPaid,
      totalDue: result.totalDue,
      invoiceCount: result.invoiceCount,
      isSettled: result.isSettled,
      invoices: result.invoices
    };
  }

  // Track Payment History
  getPaymentHistory(customer, invoices = []) {
    const result = computeCustomerLedger(customer, invoices);
    return result.paymentHistory;
  }
}

export const customerEngine = new CustomerEngine();


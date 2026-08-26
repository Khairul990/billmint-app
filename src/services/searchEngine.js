import { invoiceEngine } from './invoiceEngine.js';
import { customerEngine } from './customerEngine.js';
import * as dbEngine from './dbEngine.js';

class SearchEngine {
  async globalSearch(workspaceId, query) {
    if (!query || query.trim().length < 2) {
      return { invoices: [], customers: [], products: [] };
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // Fetch all domain data concurrently
    const [invoices, customers, products] = await Promise.all([
      invoiceEngine.getInvoices(),
      customerEngine.getCustomers(),
      dbEngine.getProducts ? dbEngine.getProducts() : Promise.resolve([]) 
      // Assuming dbEngine has getProducts, or productEngine could be created later
    ]);

    // Search invoices (by number, customer name)
    const matchingInvoices = invoices.filter(inv => {
      const num = (inv.invoiceNumber || '').toLowerCase();
      const cName = (inv.customerName || inv.customer?.name || '').toLowerCase();
      return num.includes(lowerQuery) || cName.includes(lowerQuery);
    });

    // Search customers (by name, email, phone)
    const matchingCustomers = customers.filter(c => {
      const name = (c.customerName || c.name || '').toLowerCase();
      const email = (c.customerEmail || c.email || '').toLowerCase();
      const phone = (c.customerPhone || c.phone || '').toLowerCase();
      return name.includes(lowerQuery) || email.includes(lowerQuery) || phone.includes(lowerQuery);
    });

    // Search products (by name, description, category)
    const matchingProducts = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(lowerQuery) || desc.includes(lowerQuery) || cat.includes(lowerQuery);
    });

    return {
      invoices: matchingInvoices,
      customers: matchingCustomers,
      products: matchingProducts
    };
  }
}

export const searchEngine = new SearchEngine();

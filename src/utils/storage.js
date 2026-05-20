// LocalStorage Keys
const KEYS = {
  AUTH: 'billmint_auth',
  SETTINGS: 'billmint_settings',
  CUSTOMERS: 'billmint_customers',
  PRODUCTS: 'billmint_products',
  INVOICES: 'billmint_invoices',
};

// Default Settings
const DEFAULT_SETTINGS = {
  businessName: 'BillMint Technologies',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
  ownerName: 'Admin Owner',
  phone: '+91 98765 00000',
  email: 'billing@billmint.com',
  address: '102, Silicon Heights, Tech Park Phase-II, Bangalore, Karnataka - 560103',
  gstNumber: '29AAAAA0000A1Z5',
  currency: '₹',
  defaultTax: 18,
};

// Seed Data
const SEED_CUSTOMERS = [
  {
    id: 'c-1',
    name: 'Acme Corporation',
    phone: '+91 98765 43210',
    email: 'accounts@acme.com',
    address: 'Plot No. 12, Industrial Area Phase 1, Bangalore, Karnataka - 560001',
  },
  {
    id: 'c-2',
    name: 'Supersonic Labs',
    phone: '+91 99999 88888',
    email: 'billing@supersonic.io',
    address: '45, Science & Technology Park, University Road, Pune, Maharashtra - 411007',
  },
  {
    id: 'c-3',
    name: 'Hindustan Retail Ltd',
    phone: '+91 91234 56789',
    email: 'ramesh@hindustanretail.in',
    address: 'Sector 4, Dwarka, New Delhi - 110075',
  },
];

const SEED_PRODUCTS = [
  {
    id: 'p-1',
    name: 'Premium SaaS Subscription',
    price: 15000,
    description: 'Monthly license fee for enterprise cloud dashboard and analytics API access.',
  },
  {
    id: 'p-2',
    name: 'Enterprise Setup Consultation',
    price: 45000,
    description: 'One-time developer onboarding, integration engineering, and architectural review.',
  },
  {
    id: 'p-3',
    name: 'Dedicated Cloud Hosting',
    price: 8500,
    description: 'Managed high-availability virtual private server with 99.99% uptime guarantee.',
  },
];

const SEED_INVOICES = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-1001',
    date: '2026-05-01',
    dueDate: '2026-05-15',
    customerId: 'c-1',
    customerName: 'Acme Corporation',
    customerPhone: '+91 98765 43210',
    customerEmail: 'accounts@acme.com',
    customerAddress: 'Plot No. 12, Industrial Area Phase 1, Bangalore, Karnataka - 560001',
    items: [
      { name: 'Premium SaaS Subscription', quantity: 1, price: 15000, total: 15000 },
      { name: 'Dedicated Cloud Hosting', quantity: 2, price: 8500, total: 17000 },
    ],
    taxPercentage: 18,
    discountAmount: 2000,
    notes: 'Thank you for your business. Payment received via bank transfer.',
    paymentStatus: 'Paid',
    subtotal: 32000,
    taxAmount: 5760,
    grandTotal: 35760,
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-1002',
    date: '2026-05-10',
    dueDate: '2026-05-24',
    customerId: 'c-2',
    customerName: 'Supersonic Labs',
    customerPhone: '+91 99999 88888',
    customerEmail: 'billing@supersonic.io',
    customerAddress: '45, Science & Technology Park, University Road, Pune, Maharashtra - 411007',
    items: [
      { name: 'Enterprise Setup Consultation', quantity: 1, price: 45000, total: 45000 },
    ],
    taxPercentage: 18,
    discountAmount: 5000,
    notes: 'Please complete payment on or before the due date.',
    paymentStatus: 'Pending',
    subtotal: 45000,
    taxAmount: 8100,
    grandTotal: 48100,
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-1003',
    date: '2026-05-18',
    dueDate: '2026-06-01',
    customerId: 'c-3',
    customerName: 'Hindustan Retail Ltd',
    customerPhone: '+91 91234 56789',
    customerEmail: 'ramesh@hindustanretail.in',
    customerAddress: 'Sector 4, Dwarka, New Delhi - 110075',
    items: [
      { name: 'Dedicated Cloud Hosting', quantity: 5, price: 8500, total: 42500 },
      { name: 'Premium SaaS Subscription', quantity: 2, price: 15000, total: 30000 },
    ],
    taxPercentage: 12,
    discountAmount: 0,
    notes: 'Payment net 14 days.',
    paymentStatus: 'Unpaid',
    subtotal: 72500,
    taxAmount: 8700,
    grandTotal: 81200,
  },
];

// Initialize Storage with Demo Data if Empty
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  }
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  }
  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
  }
};

// Reset System
export const resetToDemoData = () => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
  return {
    settings: DEFAULT_SETTINGS,
    customers: SEED_CUSTOMERS,
    products: SEED_PRODUCTS,
    invoices: SEED_INVOICES
  };
};

// --- AUTHENTICATION ---
export const getAuthSession = () => {
  const session = localStorage.getItem(KEYS.AUTH);
  if (!session) return null;
  try {
    const data = JSON.parse(session);
    // Expire session after 24 hours
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      logout();
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

export const login = (passcode) => {
  if (passcode === '1118') {
    const session = { timestamp: Date.now(), token: 'billmint-secure-session' };
    localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem(KEYS.AUTH);
};

// --- SETTINGS ---
export const getSettings = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS));
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  return settings;
};

// --- CUSTOMERS ---
export const getCustomers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};

export const saveCustomer = (customer) => {
  const customers = getCustomers();
  if (customer.id) {
    // Edit
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
    }
  } else {
    // Create new
    customer.id = 'c-' + Date.now();
    customers.push(customer);
  }
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  return customers;
};

export const deleteCustomer = (id) => {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));
  return filtered;
};

// --- PRODUCTS ---
export const getProducts = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
};

export const saveProduct = (product) => {
  const products = getProducts();
  if (product.id) {
    // Edit
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
    }
  } else {
    // Create new
    product.id = 'p-' + Date.now();
    products.push(product);
  }
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  return products;
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
  return filtered;
};

// --- INVOICES ---
export const getInvoices = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
};

export const saveInvoice = (invoice) => {
  const invoices = getInvoices();
  if (invoice.id) {
    // Edit
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    if (index !== -1) {
      invoices[index] = invoice;
    }
  } else {
    // Create new
    invoices.push(invoice);
  }
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  return invoices;
};

export const deleteInvoice = (id) => {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(filtered));
  return filtered;
};

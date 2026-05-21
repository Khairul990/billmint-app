import { db, isFirebaseEnabled } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

// LocalStorage Keys
const KEYS = {
  AUTH: 'billqyro_auth',
  SETTINGS: 'billqyro_settings',
  CUSTOMERS: 'billqyro_customers',
  PRODUCTS: 'billqyro_products',
  INVOICES: 'billqyro_invoices',
  EXPENSES: 'billqyro_expenses',
  SUBSCRIPTION: 'billqyro_subscription',
};

// Default Settings (initialized empty as required to avoid fake business details)
const DEFAULT_SETTINGS = {
  businessName: '',
  logoUrl: '',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  gstNumber: '',
  currency: '₹',
  defaultTax: 18,
  adminPasscode: '1118', // Customizable administrative passcode
  defaultBillingTemplate: '',
  pdfVisibleFields: {
    embroidery: ['designNo', 'workType', 'description', 'size', 'quantity', 'rate', 'amount'],
    grocery: ['productName', 'unit', 'quantity', 'unitPrice', 'amount'],
    repair: ['serviceName', 'problemDetails', 'partsCost', 'labourCharge', 'quantity', 'amount'],
    retail: ['productName', 'category', 'sizeVariant', 'quantity', 'price', 'discount', 'amount'],
    custom: ['itemService', 'description', 'quantity', 'rate', 'amount']
  }
};

// Seed Data for Demo Mode (Quick Demo Start Only)
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
    name: 'Logo Embroidery Work',
    price: 120,
    description: 'Custom logo thread stitching on corporate uniform shirts.',
  },
  {
    id: 'p-2',
    name: 'Jacket Punching Service',
    price: 500,
    description: 'Digitizing design files into readable embroidery machine formats.',
  },
  {
    id: 'p-3',
    name: 'Garment Repair & Hemming',
    price: 80,
    description: 'Standard repair stitching and quality hemming for fabrics.',
  },
];

const SEED_INVOICES = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-0001',
    date: '2026-05-01',
    dueDate: '2026-05-15',
    customerId: 'c-1',
    customerName: 'Acme Corporation',
    customerPhone: '+91 98765 43210',
    customerEmail: 'accounts@acme.com',
    customerAddress: 'Plot No. 12, Industrial Area Phase 1, Bangalore, Karnataka - 560001',
    items: [
      { sn: 1, designNo: 'SO-5', workType: 'Embroidery', description: 'Logo Embroidery Work', size: '3x3"', qty: 10, rate: 120, amount: 1200 },
      { sn: 2, designNo: 'SO-6', workType: 'Punching', description: 'Jacket Punching Service', size: 'N/A', qty: 1, rate: 500, amount: 500 },
    ],
    taxPercentage: 18,
    discountAmount: 200,
    notes: 'Thank you for your business. Payment received via bank transfer.',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered', // Seeded order tracking status
    subtotal: 1700,
    taxAmount: 270,
    grandTotal: 1770,
    amountPaid: 1770,
    balanceDue: 0,
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-0002',
    date: '2026-05-10',
    dueDate: '2026-05-24',
    customerId: 'c-2',
    customerName: 'Supersonic Labs',
    customerPhone: '+91 99999 88888',
    customerEmail: 'billing@supersonic.io',
    customerAddress: '45, Science & Technology Park, University Road, Pune, Maharashtra - 411007',
    items: [
      { sn: 1, designNo: 'SO-7', workType: 'Embroidery', description: 'Jacket Digitized Embroidery', size: '10x12"', qty: 50, rate: 300, amount: 15000 },
    ],
    taxPercentage: 18,
    discountAmount: 1000,
    notes: 'Please complete payment on or before the due date.',
    paymentStatus: 'Pending',
    orderStatus: 'In Progress', // Seeded order tracking status
    subtotal: 15000,
    taxAmount: 2520,
    grandTotal: 16520,
    amountPaid: 10000,
    balanceDue: 6520,
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2026-0003',
    date: '2026-05-18',
    dueDate: '2026-06-01',
    customerId: 'c-3',
    customerName: 'Hindustan Retail Ltd',
    customerPhone: '+91 91234 56789',
    customerEmail: 'ramesh@hindustanretail.in',
    customerAddress: 'Sector 4, Dwarka, New Delhi - 110075',
    items: [
      { sn: 1, designNo: 'SO-8', workType: 'Repair', description: 'Garment Repair & Hemming', size: 'Standard', qty: 100, rate: 80, amount: 8000 },
    ],
    taxPercentage: 12,
    discountAmount: 0,
    notes: 'Payment net 14 days.',
    paymentStatus: 'Unpaid',
    orderStatus: 'Pending', // Seeded order tracking status
    subtotal: 8000,
    taxAmount: 960,
    grandTotal: 8960,
    amountPaid: 0,
    balanceDue: 8960,
  },
];

const SEED_EXPENSES = [
  { id: 'exp-1', title: 'Embroidery Thread Reels', category: 'Supplies', amount: 1500, date: '2026-05-02' },
  { id: 'exp-2', title: 'Shop Electricity Bill', category: 'Utilities', amount: 3200, date: '2026-05-05' },
  { id: 'exp-3', title: 'Industrial Sewing Needles', category: 'Supplies', amount: 800, date: '2026-05-12' },
];

const DEFAULT_SUBSCRIPTION = {
  status: 'free', // 'free' or 'premium'
  activatedAt: null,
};

// Safe Firebase User ID generator based on auth session email
export const getFirebaseUserId = () => {
  return 'workspace_admin';
};

// Background Firestore Save Helper
const firestoreSave = async (collectionName, docId, data) => {
  if (!isFirebaseEnabled) return { status: 'disabled' };
  try {
    const userId = getFirebaseUserId();
    let docRef;
    if (collectionName === 'settings' || collectionName === 'businessProfiles' || collectionName === 'subscription' || collectionName === 'users') {
      docRef = doc(db, collectionName, userId);
    } else {
      docRef = doc(db, collectionName, userId, 'items', docId);
    }
    await setDoc(docRef, data);
    console.log(`Firestore successfully saved to ${collectionName} for user: ${userId}`);
    return { status: 'success' };
  } catch (error) {
    console.error(`Firestore save failed for ${collectionName}:`, error);
    return { status: 'failed', error };
  }
};

// Background Firestore Delete Helper
const firestoreDelete = async (collectionName, docId) => {
  if (!isFirebaseEnabled) return;
  try {
    const userId = getFirebaseUserId();
    let docRef;
    if (collectionName === 'settings' || collectionName === 'businessProfiles' || collectionName === 'subscription' || collectionName === 'users') {
      docRef = doc(db, collectionName, userId);
    } else {
      docRef = doc(db, collectionName, userId, 'items', docId);
    }
    await deleteDoc(docRef);
    console.log(`Firestore successfully deleted from ${collectionName} for user: ${userId}`);
  } catch (error) {
    console.error(`Firestore delete failed for ${collectionName}:`, error);
  }
};

// Initialize Storage as Empty (No Fake Seeds by Default)
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.EXPENSES)) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SUBSCRIPTION)) {
    localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));
  }
};

// Reset System & Load Demo Data (Used for evaluations/demo starts)
export const resetToDemoData = () => {
  const demoSettings = {
    businessName: 'BillQyro Embroidery & Services',
    logoUrl: '',
    ownerName: 'Admin Owner',
    phone: '+91 98765 00000',
    email: 'billing@billqyro.com',
    address: '102, Design Market, Tech Park Phase-II, Bangalore, Karnataka - 560103',
    gstNumber: '29AAAAA0000A1Z5',
    currency: '₹',
    defaultTax: 18,
    adminPasscode: '1118',
  };

  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(demoSettings));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));

  // If Firebase is enabled, also populate Firestore in the background for demo
  if (isFirebaseEnabled) {
    const userId = getFirebaseUserId();
    firestoreSave('settings', userId, demoSettings);
    firestoreSave('businessProfiles', userId, demoSettings);
    SEED_CUSTOMERS.forEach(c => firestoreSave('customers', c.id, c));
    SEED_PRODUCTS.forEach(p => firestoreSave('products', p.id, p));
    SEED_INVOICES.forEach(i => {
      firestoreSave('invoices', i.id, i);
      firestoreSave('orders', i.id, i);
    });
    SEED_EXPENSES.forEach(e => firestoreSave('expenses', e.id, e));
  }

  return {
    settings: demoSettings,
    customers: SEED_CUSTOMERS,
    products: SEED_PRODUCTS,
    invoices: SEED_INVOICES,
    expenses: SEED_EXPENSES,
    subscription: DEFAULT_SUBSCRIPTION,
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
  const activeSettings = getSettings() || DEFAULT_SETTINGS;
  const targetPasscode = activeSettings.adminPasscode || '1118';
  if (passcode === targetPasscode) {
    const session = { timestamp: Date.now(), token: 'billqyro-secure-session', userEmail: 'admin@billqyro.com' };
    localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    
    // Save login event to users/{userId}
    if (isFirebaseEnabled) {
      const userId = getFirebaseUserId();
      firestoreSave('users', userId, {
        userId,
        email: 'admin@billqyro.com',
        lastLogin: new Date().toISOString(),
        role: 'administrator'
      });
    }
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem(KEYS.AUTH);
};

// --- SUBSCRIPTION ---
export const getSubscriptionStatus = () => {
  initializeStorage();
  try {
    return JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTION)) || DEFAULT_SUBSCRIPTION;
  } catch (e) {
    return DEFAULT_SUBSCRIPTION;
  }
};

export const saveSubscriptionStatus = (status) => {
  const sub = {
    status, // 'free' or 'premium'
    activatedAt: status === 'premium' ? Date.now() : null,
  };
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(sub));
  firestoreSave('subscription', 'status', sub);
  return sub;
};

// --- SETTINGS ---
export const getSettings = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS));
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  firestoreSave('settings', 'business', settings);
  firestoreSave('businessProfiles', 'profile', settings);
  return settings;
};

// --- EXPENSES ---
export const getExpenses = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
};

export const saveExpense = (expense) => {
  const expenses = getExpenses();
  if (expense.id) {
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index !== -1) {
      expenses[index] = expense;
    } else {
      expenses.push(expense);
    }
  } else {
    expense.id = 'exp-' + Date.now();
    expenses.push(expense);
  }
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  firestoreSave('expenses', expense.id, expense);
  return expenses;
};

export const deleteExpense = (id) => {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));
  firestoreDelete('expenses', id);
  return filtered;
};

// --- CUSTOMERS ---
export const getCustomers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};

export const saveCustomer = (customer) => {
  const customers = getCustomers();
  if (customer.id) {
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
  } else {
    customer.id = 'c-' + Date.now();
    customers.push(customer);
  }
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  firestoreSave('customers', customer.id, customer);
  return customers;
};

export const deleteCustomer = (id) => {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));
  firestoreDelete('customers', id);
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
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
  } else {
    product.id = 'p-' + Date.now();
    products.push(product);
  }
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  firestoreSave('products', product.id, product);
  return products;
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
  firestoreDelete('products', id);
  return filtered;
};

// --- INVOICES ---
export const getInvoices = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
};

export const saveInvoice = async (invoice) => {
  const invoices = getInvoices();
  // Ensure createdAt / updatedAt are set
  const timestamp = new Date().toISOString();
  if (invoice.id && invoice.id.startsWith('inv-')) {
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    if (index !== -1) {
      invoice.updatedAt = timestamp;
      invoices[index] = invoice;
    } else {
      invoice.createdAt = timestamp;
      invoice.updatedAt = timestamp;
      invoices.push(invoice);
    }
  } else {
    // Also if it's a temp ID like Date.now().toString(), override it
    invoice.id = 'inv-' + Date.now();
    invoice.createdAt = timestamp;
    invoice.updatedAt = timestamp;
    invoices.push(invoice);
  }

  // Double-save corresponding Customer to DB as well
  if (invoice.customerId) {
    const savedCustomers = getCustomers();
    const existing = savedCustomers.find(c => c.id === invoice.customerId);
    const customerPayload = {
      id: invoice.customerId,
      name: invoice.customerName,
      phone: invoice.customerPhone,
      email: invoice.customerEmail,
      address: invoice.customerAddress,
    };
    if (!existing) {
      savedCustomers.push(customerPayload);
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(savedCustomers));
      await firestoreSave('customers', customerPayload.id, customerPayload);
    } else {
      const index = savedCustomers.findIndex(c => c.id === invoice.customerId);
      savedCustomers[index] = customerPayload;
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(savedCustomers));
      await firestoreSave('customers', customerPayload.id, customerPayload);
    }
  }

  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  
  // Asynchronously save to Firebase invoices collection and orders collection
  const res1 = await firestoreSave('invoices', invoice.id, invoice);
  const res2 = await firestoreSave('orders', invoice.id, invoice);

  return { 
    updatedInvoices: invoices, 
    firebaseStatus: (res1.status === 'failed' || res2.status === 'failed') ? 'failed' : res1.status 
  };
};

export const deleteInvoice = (id) => {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(filtered));
  
  firestoreDelete('invoices', id);
  firestoreDelete('orders', id);
  
  return filtered;
};

// --- BACKUP & RESTORE DATABASE ---
export const exportBackup = () => {
  return {
    settings: getSettings(),
    customers: getCustomers(),
    products: getProducts(),
    invoices: getInvoices(),
    expenses: getExpenses(),
    subscription: getSubscriptionStatus(),
  };
};

export const importRestore = (backupData) => {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup file structure.');
  }

  const requiredKeys = ['settings', 'customers', 'products', 'invoices', 'expenses', 'subscription'];
  for (const k of requiredKeys) {
    if (!backupData.hasOwnProperty(k)) {
      throw new Error(`Missing database key: ${k}`);
    }
  }

  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(backupData.settings));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(backupData.customers));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(backupData.products));
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(backupData.invoices));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(backupData.expenses));
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(backupData.subscription));

  // If Firebase is enabled, batch update Firestore as well
  if (isFirebaseEnabled) {
    const userId = getFirebaseUserId();
    firestoreSave('settings', userId, backupData.settings);
    firestoreSave('businessProfiles', userId, backupData.settings);
    backupData.customers.forEach(c => firestoreSave('customers', c.id, c));
    backupData.products.forEach(p => firestoreSave('products', p.id, p));
    backupData.invoices.forEach(i => {
      firestoreSave('invoices', i.id, i);
      firestoreSave('orders', i.id, i);
    });
    backupData.expenses.forEach(e => firestoreSave('expenses', e.id, e));
    firestoreSave('subscription', userId, backupData.subscription);
  }

  return backupData;
};

// --- REAL TIME SYNC LISTENER ---
let unsubscribes = [];

export const enableRealTimeSync = () => {
  if (!isFirebaseEnabled) return;

  const userId = getFirebaseUserId();
  console.log('Enabling Real-Time Sync for workspace:', userId);

  // Clear any existing listeners
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  const syncCollection = (collectionName, storageKey) => {
    const colRef = collection(db, collectionName, userId, 'items');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push(doc.data()));
      localStorage.setItem(storageKey, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
    });
    unsubscribes.push(unsub);
  };

  const syncDoc = (collectionName, storageKey) => {
    const dRef = doc(db, collectionName, userId);
    const unsub = onSnapshot(dRef, (snapshot) => {
      if (snapshot.exists()) {
        localStorage.setItem(storageKey, JSON.stringify(snapshot.data()));
        window.dispatchEvent(new CustomEvent('billqyro_sync'));
      }
    });
    unsubscribes.push(unsub);
  };

  syncCollection('invoices', KEYS.INVOICES);
  syncCollection('customers', KEYS.CUSTOMERS);
  syncCollection('products', KEYS.PRODUCTS);
  syncCollection('expenses', KEYS.EXPENSES);
  syncDoc('settings', KEYS.SETTINGS);
  syncDoc('subscription', KEYS.SUBSCRIPTION);
};

// One-time Syncing on Authentication or Startup
export const syncFromFirestore = async () => {
  if (!isFirebaseEnabled) {
    console.log("Firebase not enabled, skipping Firestore sync.");
    return null;
  }
  try {
    const userId = getFirebaseUserId();
    console.log(`Syncing data from Firestore for user: ${userId}`);

    // Sync settings
    const settingsDoc = await getDoc(doc(db, 'settings', userId));
    if (settingsDoc.exists()) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsDoc.data()));
    }

    // Sync customers
    const customersSnap = await getDocs(collection(db, 'customers', userId, 'items'));
    const customers = [];
    customersSnap.forEach(docSnap => {
      customers.push(docSnap.data());
    });
    if (customers.length > 0) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    // Sync invoices
    const invoicesSnap = await getDocs(collection(db, 'invoices', userId, 'items'));
    const invoices = [];
    invoicesSnap.forEach(docSnap => {
      invoices.push(docSnap.data());
    });
    if (invoices.length > 0) {
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    }

    // Sync products
    const productsSnap = await getDocs(collection(db, 'products', userId, 'items'));
    const products = [];
    productsSnap.forEach(docSnap => {
      products.push(docSnap.data());
    });
    if (products.length > 0) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }

    // Sync expenses
    const expensesSnap = await getDocs(collection(db, 'expenses', userId, 'items'));
    const expenses = [];
    expensesSnap.forEach(docSnap => {
      expenses.push(docSnap.data());
    });
    if (expenses.length > 0) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
    }

    // Sync subscription
    const subDoc = await getDoc(doc(db, 'subscription', userId));
    if (subDoc.exists()) {
      localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(subDoc.data()));
    }

    return {
      settings: JSON.parse(localStorage.getItem(KEYS.SETTINGS)),
      customers: JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [],
      products: JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [],
      invoices: JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [],
      expenses: JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [],
      subscription: JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTION))
    };
  } catch (error) {
    console.error("Error syncing from Firestore:", error);
    throw error;
  }
};

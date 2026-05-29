import { db, firebaseReady, auth } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getAdminEmail } from './adminAccess';
import { BillQyroDB } from './indexedDb';

// --- OFFLINE SYNC QUEUE ENGINE & MIGRATOR ---
export const migrateLocalStorageToIndexedDB = async () => {
  try {
    const isMigrated = localStorage.getItem('billqyro_indexeddb_migrated') === 'true';
    if (isMigrated) return;

    console.log('[MIGRATION] Starting LocalStorage to IndexedDB migration...');

    // Invoices
    const localInvoices = JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
    for (const inv of localInvoices) {
      await BillQyroDB.put('invoices', inv);
    }

    // Customers
    const localCustomers = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
    for (const c of localCustomers) {
      await BillQyroDB.put('customers', c);
    }

    // Products
    const localProducts = JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
    for (const p of localProducts) {
      await BillQyroDB.put('products', p);
    }

    // Expenses
    const localExpenses = JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
    for (const e of localExpenses) {
      await BillQyroDB.put('expenses', e);
    }

    localStorage.setItem('billqyro_indexeddb_migrated', 'true');
    console.log('[MIGRATION] LocalStorage to IndexedDB migration completed successfully!');
  } catch (error) {
    console.error('[MIGRATION] LocalStorage to IndexedDB migration failed:', error);
  }
};

export const queueSyncTransaction = async (action, storeName, docId, data) => {
  const userId = getFirebaseUserId();
  const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const tx = {
    id: transactionId,
    userId,
    action, // 'save' or 'delete'
    storeName, // 'invoices', 'customers', 'products', 'expenses'
    docId,
    data,
    createdAt: Date.now()
  };
  await BillQyroDB.put('syncQueue', tx);
  console.log('[SYNC QUEUE] Queued transaction offline:', tx);
};

export const syncOfflineTransactions = async () => {
  if (!firebaseReady || !navigator.onLine) return;

  try {
    const userId = getFirebaseUserId();
    const queue = await BillQyroDB.getAll('syncQueue');
    const userQueue = queue.filter(tx => tx.userId === userId || !tx.userId);
    
    if (userQueue.length === 0) return;

    console.log(`[SYNC QUEUE] Syncing ${userQueue.length} offline transactions...`);

    // Sort by createdAt so we sync in order
    const sortedQueue = userQueue.sort((a, b) => a.createdAt - b.createdAt);

    for (const tx of sortedQueue) {
      try {
        let syncSuccess = false;
        if (tx.action === 'save') {
          const r1 = await firestoreSave(tx.storeName, tx.docId, tx.data);
          syncSuccess = r1?.status === 'success';

          if (tx.storeName === 'invoices') {
            // Also save to publicInvoices
            const r2 = await firestoreSave('publicInvoices', tx.data.publicToken, tx.data);
            syncSuccess = syncSuccess && r2?.status === 'success';
          }

          // Update local syncStatus to 'synced' on success
          if (syncSuccess && tx.data && tx.data.id) {
            let key = null;
            if (tx.storeName === 'invoices') key = KEYS.INVOICES;
            else if (tx.storeName === 'customers') key = KEYS.CUSTOMERS;
            else if (tx.storeName === 'products') key = KEYS.PRODUCTS;
            else if (tx.storeName === 'expenses') key = KEYS.EXPENSES;

            if (key) {
              const items = JSON.parse(localStorage.getItem(key) || '[]');
              const localIdx = items.findIndex(item => item.id === tx.data.id);
              if (localIdx !== -1) {
                items[localIdx].syncStatus = 'synced';
                if (tx.storeName === 'invoices') items[localIdx].updatedAt = new Date().toISOString();
                updateLocalCache(key, items);
                await BillQyroDB.put(tx.storeName, items[localIdx]);
              }
            }
          }
        } else if (tx.action === 'delete') {
          await firestoreDelete(tx.storeName, tx.docId);
          syncSuccess = true;
        }

        // Remove from queue after successful sync
        if (syncSuccess) {
          await BillQyroDB.delete('syncQueue', tx.id);
          console.log('[SYNC QUEUE] Successfully synced transaction:', tx.id);
        }
      } catch (err) {
        console.error('[SYNC QUEUE] Failed to sync transaction:', tx.id, err);
      }
    }

    // Dispatch a sync event so that the app updates state
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  } catch (error) {
    console.error('[SYNC QUEUE] Error in syncOfflineTransactions:', error);
  }
};

// Listen for network reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[NETWORK] Connection restored. Flushing sync queue...');
    syncOfflineTransactions();
  });
}

// LocalStorage Global Keys
export const GLOBAL_KEYS = {
  AUTH: 'billqyro_auth',
  SETTINGS: 'billqyro_settings',
  CUSTOMERS: 'billqyro_customers',
  PRODUCTS: 'billqyro_products',
  INVOICES: 'billqyro_invoices',
  EXPENSES: 'billqyro_expenses',
  SUBSCRIPTION: 'billqyro_subscription',
};

export const getScopedKey = (baseKey) => {
  if (baseKey === GLOBAL_KEYS.AUTH) return baseKey;
  const uid = getFirebaseUserId();
  // Ensure we don't scope if there's no valid uid
  return uid ? `${baseKey}_${uid}` : baseKey;
};

// Dynamic KEYS that automatically scope to the current user
export const KEYS = {
  get AUTH() { return GLOBAL_KEYS.AUTH; },
  get SETTINGS() { return getScopedKey(GLOBAL_KEYS.SETTINGS); },
  get CUSTOMERS() { return getScopedKey(GLOBAL_KEYS.CUSTOMERS); },
  get PRODUCTS() { return getScopedKey(GLOBAL_KEYS.PRODUCTS); },
  get INVOICES() { return getScopedKey(GLOBAL_KEYS.INVOICES); },
  get EXPENSES() { return getScopedKey(GLOBAL_KEYS.EXPENSES); },
  get SUBSCRIPTION() { return getScopedKey(GLOBAL_KEYS.SUBSCRIPTION); },
};

export const migrateGlobalToScopedStorage = async () => {
  const uid = getFirebaseUserId();
  if (!uid || uid === 'demo-user') return;

  const migrationKey = `billqyro_storage_migrated_${uid}`;
  if (localStorage.getItem(migrationKey) === 'true') return;

  console.log('[MIGRATION] Starting safe global to scoped storage migration for:', uid);

  const collections = ['invoices', 'customers', 'products', 'expenses', 'settings', 'subscription'];
  let migratedCount = 0;

  for (const col of collections) {
    const globalKey = GLOBAL_KEYS[col.toUpperCase()];
    const scopedKey = KEYS[col.toUpperCase()];
    
    if (globalKey === scopedKey) continue;

    const globalDataStr = localStorage.getItem(globalKey);
    if (globalDataStr) {
      try {
        const globalData = JSON.parse(globalDataStr);
        const existingScopedStr = localStorage.getItem(scopedKey);
        
        if (!existingScopedStr) {
          localStorage.setItem(scopedKey, globalDataStr);
          migratedCount++;
        } else {
          if (Array.isArray(globalData)) {
            const scopedData = JSON.parse(existingScopedStr);
            const merged = [...scopedData];
            let added = false;
            for (const item of globalData) {
              if (!merged.find(x => x.id === item.id)) {
                merged.push(item);
                added = true;
              }
            }
            if (added) {
              localStorage.setItem(scopedKey, JSON.stringify(merged));
              migratedCount++;
            }
          }
        }
        
        // Backup the old global key instead of deleting it permanently
        localStorage.setItem(`${globalKey}_backup`, globalDataStr);
        localStorage.removeItem(globalKey);
      } catch (e) {
        console.error(`[MIGRATION] Error migrating ${col}:`, e);
      }
    }
  }

  localStorage.setItem(migrationKey, 'true');
  console.log(`[MIGRATION] Completed. Migrated collections safely.`);
};

const updateLocalCache = (key, items) => {
  const cacheLimit = 20;
  const sorted = [...items].sort((a,b) => {
    const da = a.createdAt ? new Date(a.createdAt) : 0;
    const db = b.createdAt ? new Date(b.createdAt) : 0;
    return db - da;
  });
  localStorage.setItem(key, JSON.stringify(sorted.slice(0, cacheLimit)));
};

const DEFAULT_SETTINGS = {
  themePreset: 'light',
  themeColor: 'light',
  darkMode: false,
  country: 'India',
  countryCode: '',
  language: 'English',
  currencyCode: 'INR',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'Indian',
  taxLabel: 'GSTIN',
  rocketNumber: '',
  vatTax: '',
  customerLiveLinkSettings: {
    enableLiveInvoiceLink: true,
    showPaymentQr: true,
    allowCustomerPdfDownload: true,
    allowPaymentProofSubmit: true,
    showPaidDueAmount: true,
    showContactButton: true,
    requireTransactionId: true,
    requirePaymentScreenshot: false
  },
  freeInvoiceLimit: 15,
  feature_liveInvoiceLink: 'Premium',
  feature_paymentProof: 'Premium',
  feature_customLogo: 'Premium',
  feature_premiumPdfThemes: 'Premium',
  feature_whatsappShare: 'Premium',
  feature_cloudSync: 'Premium',
  feature_reports: 'Premium',
  feature_customerDatabase: 'Premium',
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
  adminEmail: getAdminEmail(), // Admin Email for auto-unlock
  defaultBillingTemplate: '',
  pdfVisibleFields: {
    embroidery: ['designNo', 'workType', 'description', 'size', 'quantity', 'rate', 'amount'],
    grocery: ['productName', 'unit', 'quantity', 'unitPrice', 'amount'],
    repair: ['serviceName', 'problemDetails', 'partsCost', 'labourCharge', 'quantity', 'amount'],
    retail: ['productName', 'category', 'sizeVariant', 'quantity', 'price', 'discount', 'amount'],
    custom: ['itemService', 'description', 'quantity', 'rate', 'amount']
  },
  paymentQrEnabled: false,
  paymentMethod: 'UPI',
  upiId: '',
  bkashNumber: '',
  nagadNumber: '',
  payeeName: '',
  paymentNote: '',
  showQrInPdf: true,
  showQrInPreview: true,
  customPaymentLink: ''
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
    publicToken: 'a8X92LmQ_1001',
    paymentHistory: [],
    paymentProofs: []
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
    publicToken: 'a8X92LmQ_1002',
    paymentHistory: [],
    paymentProofs: []
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
    publicToken: 'a8X92LmQ_1003',
    paymentHistory: [],
    paymentProofs: []
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
  if (firebaseReady && auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  const session = localStorage.getItem(KEYS.AUTH);
  if (session) {
    try {
      const data = JSON.parse(session);
      if (data && data.uid) {
        return data.uid;
      }
      if (data && data.userEmail) {
        if (data.userEmail === 'demo@billqyro.com') return 'demo-user';
        return data.userEmail.replace(/[^a-zA-Z0-9]/g, '_');
      }
    } catch (e) { /* ignore */ }
  }
  return 'demo-user';
};

import { toast } from 'react-hot-toast';

// Background Firestore Save Helper
const firestoreSave = async (collectionName, docId, data) => {
  if (!firebaseReady) return { status: 'disabled' };
  try {
    const userId = getFirebaseUserId();
    let docRef;
    let pathStr = '';
    
    if (collectionName === 'settings' || collectionName === 'subscription' || collectionName === 'users') {
      pathStr = `${collectionName}/${userId}`;
      docRef = doc(db, collectionName, userId);
    } else if (collectionName === 'publicInvoices') {
      pathStr = `publicInvoices/${docId}`;
      docRef = doc(db, 'publicInvoices', docId);
    } else {
      pathStr = `${collectionName}/${userId}/items/${docId}`;
      docRef = doc(db, collectionName, userId, 'items', docId);
    }
    
    await setDoc(docRef, data);
    console.log(`Firestore successfully saved to ${pathStr} for user: ${userId}`);
    return { status: 'success' };
  } catch (error) {
    const userId = getFirebaseUserId();
    let pathStr = '';
    
    if (collectionName === 'settings' || collectionName === 'subscription' || collectionName === 'users') {
      pathStr = `${collectionName}/${userId}`;
    } else if (collectionName === 'publicInvoices') {
      pathStr = `publicInvoices/${docId}`;
    } else {
      pathStr = `${collectionName}/${userId}/items/${docId}`;
    }
    
    console.error(`Firestore save failed for ${pathStr}:`, error);
    toast.error(`Sync Blocked! Path: ${pathStr} | User: ${userId} | Code: ${error.code || 'UNKNOWN'} | Reason: ${error.message || 'Permission Denied'}`, { duration: 6000 });
    return { status: 'failed', error };
  }
};

// Background Firestore Delete Helper
const firestoreDelete = async (collectionName, docId) => {
  if (!firebaseReady) return;
  try {
    const userId = getFirebaseUserId();
    let docRef;
    if (collectionName === 'settings' || collectionName === 'subscription' || collectionName === 'users') {
      docRef = doc(db, collectionName, userId);
    } else if (collectionName === 'publicInvoices') {
      docRef = doc(db, 'publicInvoices', docId);
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
  
  if (!localStorage.getItem(KEYS.AUTH)) {
    // Session is handled by App.jsx now
  }
  
  let currentInvoices = [];
  try {
    const stored = localStorage.getItem(KEYS.INVOICES);
    if (stored) currentInvoices = JSON.parse(stored);
  } catch(e) { /* ignore */ }
  
  if (!Array.isArray(currentInvoices)) {
    currentInvoices = [];
  }

  // Migrate from old local storage keys
  ['invoice', 'invoices'].forEach(oldKey => {
    try {
      const oldData = JSON.parse(localStorage.getItem(oldKey));
      if (Array.isArray(oldData) && oldData.length > 0) {
        let added = false;
        oldData.forEach(inv => {
          if (!currentInvoices.some(existing => existing.id === inv.id)) {
            currentInvoices.push(inv);
            added = true;
          }
        });
        if (added) {
          localStorage.setItem(KEYS.INVOICES, JSON.stringify(currentInvoices));
        }
        localStorage.removeItem(oldKey);
      }
    } catch (e) { /* ignore */ }
  });

  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.EXPENSES)) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SUBSCRIPTION)) {
    localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));
  }

  // Trigger IndexedDB offline-first synchronization and migrations asynchronously
  migrateLocalStorageToIndexedDB();
  syncOfflineTransactions();
};

// Reset System & Load Demo Data (Used for evaluations/demo starts)
export const resetToDemoData = () => {
  const demoSettings = {
    businessName: 'BillQyro Embroidery & Services',
    logoUrl: '',
    ownerName: 'Admin Owner',
    phone: '+91 98765 00000',
    email: '',
    address: '102, Design Market, Tech Park Phase-II, Bangalore, Karnataka - 560103',
    gstNumber: '29AAAAA0000A1Z5',
    country: 'India',
    currency: '₹',
    currencyCode: 'INR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian',
    language: 'English',
    defaultTax: 18,
    adminPasscode: '1118',
    adminEmail: getAdminEmail(),
    paymentQrEnabled: true,
    paymentMethod: 'UPI',
    upiId: 'khairul2052007@okaxis',
    bkashNumber: '01700000000',
    nagadNumber: '01900000000',
    payeeName: 'BillQyro Store',
    paymentNote: 'Please scan using any UPI App to pay securely.',
    showQrInPdf: true,
    showQrInPreview: true,
    customPaymentLink: 'https://pay.billqyro.com/direct-transfer',
    setupCompleted: true
  };

  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(demoSettings));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));

  // If Firebase is enabled, also populate Firestore in the background for demo
  if (firebaseReady) {
    const userId = getFirebaseUserId();
    firestoreSave('settings', userId, demoSettings);
    SEED_CUSTOMERS.forEach(c => firestoreSave('customers', c.id, c));
    SEED_PRODUCTS.forEach(p => firestoreSave('products', p.id, p));
    SEED_INVOICES.forEach(i => {
      firestoreSave('invoices', i.id, i);
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

export const login = (email, password) => {
  const activeSettings = getSettings() || DEFAULT_SETTINGS;
  const targetPasscode = activeSettings.adminPasscode || '1118';
  const targetEmail = activeSettings.adminEmail || getAdminEmail();

  const inputEmail = String(email).toLowerCase().trim();
  const inputPass = String(password).trim();

  const isEmailMatch = inputEmail === targetEmail.toLowerCase();
  const isPasscodeMatch = inputPass === targetPasscode;

  if (isEmailMatch && isPasscodeMatch) {
    const sessionEmail = inputEmail; // email is already validated
    const session = { timestamp: Date.now(), token: 'billqyro-secure-session', userEmail: sessionEmail };
    localStorage.setItem(KEYS.AUTH, JSON.stringify(session));

    // Save login event to users/{userId}
    if (firebaseReady) {
      const userId = getFirebaseUserId();
      firestoreSave('users', userId, {
        userId,
        email: sessionEmail,
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
  localStorage.removeItem(KEYS.SETTINGS);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.EXPENSES);
  localStorage.removeItem(KEYS.SUBSCRIPTION);
  localStorage.removeItem('billqyro_last_route');
  sessionStorage.clear();
  try {
    BillQyroDB.deleteDB('billqyro-offline-db');
  } catch (e) {
    console.error('Failed to clear IndexedDB on logout', e);
  }
};

export const clearAllLocalData = async () => {
  localStorage.clear();
  sessionStorage.clear();
  try {
    await BillQyroDB.deleteDB('billqyro-offline-db');
    const caches = await window.caches.keys();
    for (const name of caches) {
      await window.caches.delete(name);
    }
    console.log('All local data cleared successfully.');
  } catch (err) {
    console.error('Error clearing storage', err);
  }
};

// --- SUBSCRIPTION ---
export const getSubscriptionStatus = () => {
  initializeStorage();
  try {
    const sub = JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTION)) || DEFAULT_SUBSCRIPTION;
    if (sub.status === 'premium' && sub.expiresAt && Date.now() > sub.expiresAt) {
      // Plan has expired, update storage silently
      const expiredSub = {
        ...sub,
        status: 'free',
        expired: true
      };
      localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(expiredSub));

      // Silently update Firestore to free/expired as well
      if (firebaseReady) {
        const userId = getFirebaseUserId();
        setDoc(doc(db, 'subscription', userId), expiredSub, { merge: true });
        setDoc(doc(db, 'usersList', userId), { planStatus: 'free' }, { merge: true });
        setDoc(doc(db, 'settings', userId), { planStatus: 'free' }, { merge: true });
      }
      return expiredSub;
    }
    return sub;
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

// --- USER REGISTRY & PREMIUM PIPELINE ---
export const registerOrUpdateUserList = async (activeSettings) => {
  if (!firebaseReady) return;
  const userId = getFirebaseUserId();
  if (!userId) return;

  const authSession = getAuthSession();
  const email = authSession?.email || '';

  const subscription = getSubscriptionStatus();

  const userRecord = {
    userId,
    email,
    businessName: activeSettings?.businessName || '',
    country: activeSettings?.country || 'India',
    planStatus: subscription?.status || 'free',
    blocked: activeSettings?.blocked || false,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'usersList', userId), userRecord);
    console.log('[DEBUG] Successfully registered/updated userList for:', email);
  } catch (e) {
    console.error('[ERROR] Failed to update usersList:', e);
  }
};

export const submitPremiumRequest = async (plan, paidAmount, paymentMethod, transactionId, screenshotBase64 = '') => {
  if (!firebaseReady) {
    throw new Error('You must be connected to the internet to submit a premium activation request.');
  }
  const userId = getFirebaseUserId();
  if (!userId) throw new Error('User session not found.');

  const authSession = getAuthSession();
  const userEmail = authSession?.email || '';

  const requestId = 'req-' + Date.now();
  const payload = {
    requestId,
    userId,
    userEmail,
    plan,
    paidAmount,
    paymentMethod,
    transactionId,
    screenshotBase64,
    status: 'Pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'premiumRequests', requestId), payload);
  return payload;
};

// Admin Helpers for SaaS Operations
export const getGlobalAdminSettings = async () => {
  if (!firebaseReady) return null;
  try {
    const docSnap = await getDoc(doc(db, 'adminSettings', 'global'));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch (e) {
    console.warn("Error fetching global admin settings", e);
    return null;
  }
};

export const updateGlobalAdminSettings = async (payload) => {
  if (!firebaseReady) return false;
  try {
    await setDoc(doc(db, 'adminSettings', 'global'), payload, { merge: true });
    return true;
  } catch (e) {
    console.error("Error updating global admin settings", e);
    return false;
  }
};

export const getAdminUsersList = async () => {
  if (!firebaseReady) return [];
  try {
    const snap = await getDocs(collection(db, 'usersList'));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  } catch (e) {
    console.error('Failed to getAdminUsersList:', e);
    return [];
  }
};

export const getAdminPremiumRequests = async () => {
  if (!firebaseReady) return [];
  try {
    const snap = await getDocs(collection(db, 'premiumRequests'));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  } catch (e) {
    console.error('Failed to getAdminPremiumRequests:', e);
    return [];
  }
};

export const updatePremiumRequestStatus = async (requestId, status, targetUserId, plan, rejectionReason = '') => {
  if (!firebaseReady) return false;
  try {
    const reqRef = doc(db, 'premiumRequests', requestId);
    await setDoc(reqRef, {
      status,
      rejectionReason,
      approvedAt: status === 'Approved' ? Date.now() : null,
      updatedAt: Date.now()
    }, { merge: true });

    if (status === 'Approved') {
      const activatedAt = Date.now();
      const durationMs = plan === 'Yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const expiresAt = activatedAt + durationMs;

      const sub = {
        status: 'premium',
        activatedAt,
        expiresAt,
        plan
      };

      await setDoc(doc(db, 'subscription', targetUserId), sub);
      await setDoc(doc(db, 'usersList', targetUserId), { planStatus: 'premium' }, { merge: true });
      await setDoc(doc(db, 'settings', targetUserId), { planStatus: 'premium' }, { merge: true });
    } else if (status === 'Rejected') {
      const sub = {
        status: 'free',
        activatedAt: null,
        expiresAt: null
      };
      await setDoc(doc(db, 'subscription', targetUserId), sub);
      await setDoc(doc(db, 'usersList', targetUserId), { planStatus: 'free' }, { merge: true });
      await setDoc(doc(db, 'settings', targetUserId), { planStatus: 'free' }, { merge: true });
    }
    return true;
  } catch (e) {
    console.error('Failed to updatePremiumRequestStatus:', e);
    return false;
  }
};

export const updateUserBlockStatus = async (targetUserId, blocked) => {
  if (!firebaseReady) return false;
  try {
    await setDoc(doc(db, 'usersList', targetUserId), { blocked }, { merge: true });
    await setDoc(doc(db, 'settings', targetUserId), { blocked }, { merge: true });
    return true;
  } catch (e) {
    console.error('Failed to updateUserBlockStatus:', e);
    return false;
  }
};

// --- SETTINGS ---
export const getSettings = () => {
  initializeStorage();
  const settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS));
  if (settings && (!settings.email || settings.email === 'billing@firm.com' || settings.email.includes('firm email demo'))) {
    const authSession = localStorage.getItem(GLOBAL_KEYS.AUTH);
    if (authSession) {
      try {
         const sessionObj = JSON.parse(authSession);
         if (sessionObj.userEmail && sessionObj.userEmail !== 'demo@billqyro.com') {
           settings.email = sessionObj.userEmail;
         } else {
           settings.email = '';
         }
      } catch (e) {}
    } else {
      settings.email = '';
    }
  }
  return settings;
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  firestoreSave('settings', 'business', settings);
  registerOrUpdateUserList(settings);
  return settings;
};

// --- EXPENSES ---
export const getExpenses = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('expenses');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
};

export const saveExpense = async (expense) => {
  const expenses = await getExpenses();
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
  updateLocalCache(KEYS.EXPENSES, expenses);

  // Save to IndexedDB
  await BillQyroDB.put('expenses', expense);

  // Sync / queue + syncStatus tracking (Non-blocking)
  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      expense.syncStatus = 'pending';
      updateLocalCache(KEYS.EXPENSES, expenses);
      await BillQyroDB.put('expenses', expense);

      firestoreSave('expenses', expense.id, expense).then(async (res) => {
        const currentExpenses = JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
        const updateIdx = currentExpenses.findIndex(e => e.id === expense.id);
        if (updateIdx !== -1) {
          currentExpenses[updateIdx].syncStatus = res?.status === 'success' ? 'synced' : 'failed';
          localStorage.setItem(KEYS.EXPENSES, JSON.stringify(currentExpenses));
          await BillQyroDB.put('expenses', currentExpenses[updateIdx]);
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      }).catch(err => console.error(err));
    } else {
      expense.syncStatus = 'pending';
      queueSyncTransaction('save', 'expenses', expense.id, expense).catch(e => console.error(e));
      firebaseStatus = 'failed';
      updateLocalCache(KEYS.EXPENSES, expenses);
      await BillQyroDB.put('expenses', expense);
    }
  } else {
    expense.syncStatus = 'offline';
    updateLocalCache(KEYS.EXPENSES, expenses);
    await BillQyroDB.put('expenses', expense);
  }
  return { updatedExpenses: expenses, firebaseStatus };
};

export const deleteExpense = async (id) => {
  const expenses = await getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  updateLocalCache(KEYS.EXPENSES, filtered);

  // Delete from IndexedDB
  await BillQyroDB.delete('expenses', id);

  // Sync / queue (Non-blocking)
  let firebaseStatus = 'success';
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('expenses', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'expenses', id).catch(e => console.error(e));
      firebaseStatus = 'failed';
    }
  }
  return { updatedExpenses: filtered, firebaseStatus };
};

// --- CUSTOMERS ---
export const getCustomers = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('customers');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};

export const saveCustomer = async (customer) => {
  const customers = await getCustomers();
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
  updateLocalCache(KEYS.CUSTOMERS, customers);

  // Save to IndexedDB
  await BillQyroDB.put('customers', customer);

  // Sync / queue + syncStatus tracking (Non-blocking)
  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      customer.syncStatus = 'pending';
      updateLocalCache(KEYS.CUSTOMERS, customers);
      await BillQyroDB.put('customers', customer);

      firestoreSave('customers', customer.id, customer).then(async (res) => {
        const currentCustomers = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
        const updateIdx = currentCustomers.findIndex(c => c.id === customer.id);
        if (updateIdx !== -1) {
          currentCustomers[updateIdx].syncStatus = res?.status === 'success' ? 'synced' : 'failed';
          localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(currentCustomers));
          await BillQyroDB.put('customers', currentCustomers[updateIdx]);
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      }).catch(err => console.error(err));
    } else {
      customer.syncStatus = 'pending';
      queueSyncTransaction('save', 'customers', customer.id, customer).catch(e => console.error(e));
      firebaseStatus = 'failed';
      updateLocalCache(KEYS.CUSTOMERS, customers);
      await BillQyroDB.put('customers', customer);
    }
  } else {
    customer.syncStatus = 'offline';
    updateLocalCache(KEYS.CUSTOMERS, customers);
    await BillQyroDB.put('customers', customer);
  }
  return { updatedCustomers: customers, firebaseStatus };
};

export const deleteCustomer = async (id) => {
  const customers = await getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  updateLocalCache(KEYS.CUSTOMERS, filtered);

  // Delete from IndexedDB
  await BillQyroDB.delete('customers', id);

  // Sync / queue (Non-blocking)
  let firebaseStatus = 'success';
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('customers', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'customers', id).catch(e => console.error(e));
      firebaseStatus = 'failed';
    }
  }
  return { updatedCustomers: filtered, firebaseStatus };
};

// --- PRODUCTS ---
export const getProducts = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('products');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
};

export const saveProduct = async (product) => {
  const products = await getProducts();
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
  updateLocalCache(KEYS.PRODUCTS, products);

  // Save to IndexedDB
  await BillQyroDB.put('products', product);

  // Sync / queue + syncStatus tracking (Non-blocking)
  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      product.syncStatus = 'pending';
      updateLocalCache(KEYS.PRODUCTS, products);
      await BillQyroDB.put('products', product);

      firestoreSave('products', product.id, product).then(async (res) => {
        const currentProducts = JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
        const updateIdx = currentProducts.findIndex(p => p.id === product.id);
        if (updateIdx !== -1) {
          currentProducts[updateIdx].syncStatus = res?.status === 'success' ? 'synced' : 'failed';
          localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(currentProducts));
          await BillQyroDB.put('products', currentProducts[updateIdx]);
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      }).catch(err => console.error(err));
    } else {
      product.syncStatus = 'pending';
      queueSyncTransaction('save', 'products', product.id, product).catch(e => console.error(e));
      firebaseStatus = 'failed';
      updateLocalCache(KEYS.PRODUCTS, products);
      await BillQyroDB.put('products', product);
    }
  } else {
    product.syncStatus = 'offline';
    updateLocalCache(KEYS.PRODUCTS, products);
    await BillQyroDB.put('products', product);
  }
  return { updatedProducts: products, firebaseStatus };
};

export const deleteProduct = async (id) => {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  updateLocalCache(KEYS.PRODUCTS, filtered);

  // Delete from IndexedDB
  await BillQyroDB.delete('products', id);

  // Sync / queue (Non-blocking)
  let firebaseStatus = 'success';
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('products', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'products', id).catch(e => console.error(e));
      firebaseStatus = 'failed';
    }
  }
  return { updatedProducts: filtered, firebaseStatus };
};

// --- INVOICES ---
export const getInvoices = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('invoices');
    if (data && data.length > 0) {
      return data.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
};

const generateSecureToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const saveInvoice = async (invoice) => {
  const invoices = await getInvoices();

  // 1. Ensure secure publicToken is generated
  if (!invoice.publicToken || invoice.publicToken === 'undefined' || invoice.publicToken === 'null' || invoice.publicToken === '') {
    invoice.publicToken = generateSecureToken();
  }

  // 2. Ensure snapshots are taken
  const activeSettings = getSettings() || DEFAULT_SETTINGS;
  if (!invoice.businessSnapshot) {
    invoice.businessSnapshot = {
      businessName: activeSettings.businessName || '',
      logoUrl: activeSettings.logoUrl || '',
      ownerName: activeSettings.ownerName || '',
      phone: activeSettings.phone || '',
      whatsapp: activeSettings.whatsapp || '',
      email: activeSettings.email || '',
      address: activeSettings.address || '',
      gstNumber: activeSettings.gstNumber || '',
      currency: activeSettings.currency || '₹',
      taxLabel: activeSettings.taxLabel || 'Tax',
      country: activeSettings.country || 'India'
    };
  }
  if (!invoice.paymentSettingsSnapshot) {
    invoice.paymentSettingsSnapshot = {
      paymentQrEnabled: activeSettings.paymentQrEnabled || false,
      paymentMethod: activeSettings.paymentMethod || 'Manual',
      upiId: activeSettings.upiId || '',
      bkashNumber: activeSettings.bkashNumber || '',
      nagadNumber: activeSettings.nagadNumber || '',
      rocketNumber: activeSettings.rocketNumber || '',
      payeeName: activeSettings.payeeName || '',
      paymentNote: activeSettings.paymentNote || '',
      customPaymentLink: activeSettings.customPaymentLink || '',
      customerLiveLinkSettings: activeSettings.customerLiveLinkSettings || {
        enableLiveInvoiceLink: true,
        showPaymentQr: true,
        allowCustomerPdfDownload: true,
        allowPaymentProofSubmit: true,
        showPaidDueAmount: true,
        showContactButton: true,
        requireTransactionId: true,
        requirePaymentScreenshot: false
      }
    };
  }
  if (!invoice.regionalSettingsSnapshot) {
    invoice.regionalSettingsSnapshot = {
      country: activeSettings.country || 'India',
      currency: activeSettings.currency || '₹',
      currencyCode: activeSettings.currencyCode || (activeSettings.country === 'Bangladesh' ? 'BDT' : activeSettings.country === 'Other' ? 'USD' : 'INR'),
      language: activeSettings.language || 'English',
      taxLabel: activeSettings.taxLabel || (activeSettings.country === 'Bangladesh' ? 'VAT' : activeSettings.country === 'Other' ? 'Tax' : 'GST'),
      dateFormat: activeSettings.dateFormat || 'DD/MM/YYYY',
      numberFormat: activeSettings.numberFormat || 'Indian'
    };
  }

  // 3. Ensure arrays exist
  if (!invoice.paymentHistory) invoice.paymentHistory = [];
  if (!invoice.paymentProofs) invoice.paymentProofs = [];

  invoice.userId = getFirebaseUserId();

  const timestamp = new Date().toISOString();
  const sessionStr = localStorage.getItem(GLOBAL_KEYS.AUTH);
  const session = sessionStr ? JSON.parse(sessionStr) : null;
  const userEmail = session?.userEmail || session?.email || 'demo-user';
  const settings = getSettings();
  
  invoice.createdByUid = getFirebaseUserId();
  invoice.createdByEmail = userEmail;
  invoice.businessContactEmail = settings?.email || userEmail;

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
    const customerPayload = {
      id: invoice.customerId,
      name: invoice.customerName,
      phone: invoice.customerPhone || '',
      email: invoice.customerEmail || '',
      address: invoice.customerAddress || '',
    };
    await saveCustomer(customerPayload);
  }

  updateLocalCache(KEYS.INVOICES, invoices);

  // Save to IndexedDB
  await BillQyroDB.put('invoices', invoice);

  // Sync / queue + syncStatus tracking (Non-blocking)
  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      invoice.syncStatus = 'pending';
      const idx = invoices.findIndex(inv => inv.id === invoice.id);
      if (idx !== -1) invoices[idx] = invoice;
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoice);

      // Fire and forget
      Promise.all([
        firestoreSave('invoices', invoice.id, invoice),
        firestoreSave('publicInvoices', invoice.publicToken, invoice)
      ]).then(async ([r1, r2]) => {
        const currentInvoices = JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
        const updateIdx = currentInvoices.findIndex(inv => inv.id === invoice.id);
        if (updateIdx !== -1) {
          currentInvoices[updateIdx].syncStatus = (r1?.status === 'success' && r2?.status === 'success') ? 'synced' : 'failed';
          localStorage.setItem(KEYS.INVOICES, JSON.stringify(currentInvoices));
          await BillQyroDB.put('invoices', currentInvoices[updateIdx]);
          window.dispatchEvent(new CustomEvent('billqyro_sync'));
        }
      }).catch(err => console.error('Firestore async save error:', err));
    } else {
      invoice.syncStatus = 'pending';
      queueSyncTransaction('save', 'invoices', invoice.id, invoice).catch(e => console.error(e));
      firebaseStatus = 'failed';
      // Persist syncStatus back to localStorage + IndexedDB
      const idx = invoices.findIndex(inv => inv.id === invoice.id);
      if (idx !== -1) invoices[idx] = invoice;
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoice);
    }
  } else {
    invoice.syncStatus = 'offline';
    // Persist syncStatus back to localStorage + IndexedDB
    const idx = invoices.findIndex(inv => inv.id === invoice.id);
    if (idx !== -1) invoices[idx] = invoice;
    updateLocalCache(KEYS.INVOICES, invoices);
    await BillQyroDB.put('invoices', invoice);
  }

  return {
    updatedInvoices: invoices,
    firebaseStatus
  };
};

export const retrySyncInvoice = async (invoiceId) => {
  const invoices = await getInvoices();
  const idx = invoices.findIndex(inv => inv.id === invoiceId);
  if (idx === -1) return { status: 'not_found' };

  const invoice = invoices[idx];
  invoice.syncStatus = 'pending';
  delete invoice.syncError;
  invoices[idx] = invoice;
  
  updateLocalCache(KEYS.INVOICES, invoices);
  await BillQyroDB.put('invoices', invoice);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  if (!firebaseReady || !navigator.onLine) {
    toast.error('Cannot retry sync while offline.');
    return { status: 'offline' };
  }

  try {
    const [r1, r2] = await Promise.all([
      firestoreSave('invoices', invoice.id, invoice),
      firestoreSave('publicInvoices', invoice.publicToken, invoice)
    ]);
    
    if (r1.status === 'success' && r2.status === 'success') {
      invoice.syncStatus = 'synced';
      invoices[idx] = invoice;
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoice);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
      toast.success('Invoice synced successfully.');
      return { status: 'success' };
    } else {
      invoice.syncStatus = 'failed';
      invoice.syncError = r1.error?.message || r2.error?.message || 'Unknown error';
      invoices[idx] = invoice;
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoice);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
      return { status: 'failed', error1: r1.error, error2: r2.error };
    }
  } catch (err) {
    invoice.syncStatus = 'failed';
    invoice.syncError = err.message;
    invoices[idx] = invoice;
    updateLocalCache(KEYS.INVOICES, invoices);
    await BillQyroDB.put('invoices', invoice);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    toast.error(`Retry sync failed: ${err.message}`);
    return { status: 'failed', error: err };
  }
};

const syncLocalInvoice = async (cloudData) => {
  const invoices = await getInvoices();
  const localIdx = invoices.findIndex(inv => inv.id === cloudData.id);
  if (localIdx !== -1) {
    invoices[localIdx] = cloudData;
    updateLocalCache(KEYS.INVOICES, invoices);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }
};

export const getInvoiceByPublicToken = async (token) => {
  console.log('[DEBUG] getInvoiceByPublicToken - Requested publicToken:', token);
  console.log('[DEBUG] getInvoiceByPublicToken - Firestore path checked: publicInvoices/' + token);

  // Reset last error
  window.billqyro_lastError = null;

  if (firebaseReady) {
    try {
      // 1. Try publicInvoices first
      let docRef = doc(db, 'publicInvoices', token);
      let snap = await getDoc(docRef);

      console.log('[DEBUG] getInvoiceByPublicToken - Checked publicInvoices/' + token + ' - Document exists:', snap.exists());

      if (snap.exists()) {
        const cloudData = snap.data();
        await syncLocalInvoice(cloudData);
        return cloudData;
      }

      // 2. Try legacy public_invoices for compatibility with older links
      console.log('[DEBUG] getInvoiceByPublicToken - Firestore path checked: public_invoices/' + token);
      docRef = doc(db, 'public_invoices', token);
      snap = await getDoc(docRef);

      console.log('[DEBUG] getInvoiceByPublicToken - Checked legacy public_invoices/' + token + ' - Document exists:', snap.exists());

      if (snap.exists()) {
        const cloudData = snap.data();
        await syncLocalInvoice(cloudData);
        return cloudData;
      }

      // Document does not exist in either collection
      window.billqyro_lastError = `Document '${token}' does not exist in collections 'publicInvoices' or 'public_invoices'.`;
    } catch (e) {
      console.error('[ERROR] getInvoiceByPublicToken - Firestore permission denied or query failed:', e);
      window.billqyro_lastError = `Firestore Error [${e.code || 'UNKNOWN_CODE'}]: ${e.message || e.toString()}`;
      if (e.code) console.error('[ERROR] getInvoiceByPublicToken - Code:', e.code);
      if (e.message) console.error('[ERROR] getInvoiceByPublicToken - Message:', e.message);
      if (e.stack) console.error('[ERROR] getInvoiceByPublicToken - Stack:', e.stack);
    }
  } else {
    console.warn('[WARN] getInvoiceByPublicToken - firebaseReady is false');
    window.billqyro_lastError = 'Firebase is not initialized (credentials missing or connection failed).';
  }

  // Local storage fallback
  console.log('[DEBUG] getInvoiceByPublicToken - Document not found in Firestore. Trying local localStorage fallback...');
  const invoices = await getInvoices();
  const localMatch = invoices.find(inv => inv.publicToken === token);
  console.log('[DEBUG] getInvoiceByPublicToken - Local localStorage match found:', !!localMatch);
  return localMatch || null;
};

export const ensureInvoicePublicToken = async (invoice) => {
  if (!invoice) return null;

  // 1. Generate secure token if missing
  if (!invoice.publicToken || invoice.publicToken === 'undefined' || invoice.publicToken === 'null' || invoice.publicToken === '') {
    invoice.publicToken = generateSecureToken();
  }
  const token = invoice.publicToken;

  // 2. Save back to local storage invoices list
  const invoices = await getInvoices();
  const idx = invoices.findIndex(inv => inv.id === invoice.id);
  if (idx !== -1) {
    invoices[idx] = invoice;
    updateLocalCache(KEYS.INVOICES, invoices);
  }

  // 3. Force save/create public-safe copy and private copy in Firestore
  if (firebaseReady) {
    try {
      console.log('[DEBUG] ensureInvoicePublicToken - Force writing public copy to publicInvoices/' + token);
      await firestoreSave('publicInvoices', token, invoice);

      const userId = getFirebaseUserId();
      if (userId && invoice.id) {
        console.log('[DEBUG] ensureInvoicePublicToken - Force writing private copy to invoices/' + userId + '/items/' + invoice.id);
        await setDoc(doc(db, 'invoices', userId, 'items', invoice.id), invoice);
      }
    } catch (e) {
      console.error('[ERROR] Failed to sync publicToken to Firestore in ensureInvoicePublicToken:', e);
    }
  }

  // Dispatch sync event
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  return token;
};

export const saveInvoicePublicly = async (invoice) => {
  const invoices = await getInvoices();
  const index = invoices.findIndex(inv => inv.id === invoice.id || inv.publicToken === invoice.publicToken);
  if (index !== -1) {
    invoices[index] = invoice;
    updateLocalCache(KEYS.INVOICES, invoices);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }

  if (firebaseReady) {
    try {
      // Unauthenticated customer ONLY writes to publicInvoices to avoid private write permission failure!
      await setDoc(doc(db, 'publicInvoices', invoice.publicToken), invoice);
      return { status: 'success' };
    } catch (e) {
      console.error('Failed to save invoice publicly to Firestore:', e);
      return { status: 'failed', error: e };
    }
  }
  return { status: 'success' };
};

export const restoreInvoice = async (id) => {
  const invoices = await getInvoices();
  const idx = invoices.findIndex(inv => inv.id === id);
  if (idx !== -1) {
    invoices[idx].isDeleted = false;
    invoices[idx].deletedAt = null;
    invoices[idx].updatedAt = new Date().toISOString();
    invoices[idx].syncStatus = 'pending';
    
    updateLocalCache(KEYS.INVOICES, invoices);
    await BillQyroDB.put('invoices', invoices[idx]);

    let firebaseStatus = 'pending';
    if (firebaseReady) {
      if (navigator.onLine) {
        try {
          await firestoreSave('invoices', id, invoices[idx]);
          await firestoreSave('publicInvoices', invoices[idx].publicToken, invoices[idx]);
          firebaseStatus = 'success';
          invoices[idx].syncStatus = 'synced';
          updateLocalCache(KEYS.INVOICES, invoices);
          await BillQyroDB.put('invoices', invoices[idx]);
        } catch (e) {
          firebaseStatus = 'failed';
        }
      } else {
        queueSyncTransaction('save', 'invoices', id, invoices[idx]).catch(e => console.error(e));
        firebaseStatus = 'failed';
      }
    }
    
    return {
      updatedInvoices: invoices,
      firebaseStatus
    };
  }
  return { updatedInvoices: invoices, firebaseStatus: 'failed' };
};

export const deleteInvoice = async (id, permanent = false) => {
  const invoices = await getInvoices();
  
  if (!permanent) {
    const idx = invoices.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      invoices[idx].isDeleted = true;
      invoices[idx].deletedAt = new Date().toISOString();
      invoices[idx].updatedAt = new Date().toISOString();
      invoices[idx].syncStatus = 'pending';
      
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoices[idx]);

      let firebaseStatus = 'pending';
      if (firebaseReady) {
        if (navigator.onLine) {
          try {
            await firestoreSave('invoices', id, invoices[idx]);
            await firestoreSave('publicInvoices', invoices[idx].publicToken, invoices[idx]);
            firebaseStatus = 'success';
            invoices[idx].syncStatus = 'synced';
            updateLocalCache(KEYS.INVOICES, invoices);
            await BillQyroDB.put('invoices', invoices[idx]);
          } catch (e) {
            firebaseStatus = 'failed';
          }
        } else {
          queueSyncTransaction('save', 'invoices', id, invoices[idx]).catch(e => console.error(e));
          firebaseStatus = 'failed';
        }
      }
      return { updatedInvoices: invoices, firebaseStatus };
    }
  }

  // Permanent Delete
  const filtered = invoices.filter(inv => inv.id !== id);
  updateLocalCache(KEYS.INVOICES, filtered);

  // Delete from IndexedDB
  await BillQyroDB.delete('invoices', id);

  // Sync / queue (Non-blocking)
  let firebaseStatus = 'success';
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('invoices', id).catch(e => console.error(e));
      firestoreDelete('publicInvoices', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'invoices', id).catch(e => console.error(e));
      firebaseStatus = 'failed';
    }
  }

  return {
    updatedInvoices: filtered,
    firebaseStatus
  };
};

// --- BACKUP & RESTORE DATABASE ---
export const exportBackup = async () => {
  const invoices = await getInvoices();
  const customers = await getCustomers();
  const products = await getProducts();
  const expenses = await getExpenses();
  const settings = getSettings();

  return {
    appName: "BillQyro",
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    dataSource: "localStorage/firebase-current",
    recordCounts: {
      invoices: invoices.length,
      customers: customers.length,
      products: products.length,
      expenses: expenses.length
    },
    settings,
    customers,
    products,
    invoices,
    expenses,
    subscription: getSubscriptionStatus(),
  };
};

export const importRestore = async (backupData) => {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup file structure.');
  }

  const requiredKeys = ['settings', 'customers', 'products', 'invoices', 'expenses', 'subscription'];
  for (const k of requiredKeys) {
    if (!Object.prototype.hasOwnProperty.call(backupData, k)) {
      throw new Error(`Missing database key: ${k}`);
    }
  }

  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(backupData.settings));
  updateLocalCache(KEYS.CUSTOMERS, backupData.customers);
  for (const c of backupData.customers) await BillQyroDB.put('customers', c);
  updateLocalCache(KEYS.PRODUCTS, backupData.products);
  for (const p of backupData.products) await BillQyroDB.put('products', p);
  updateLocalCache(KEYS.INVOICES, backupData.invoices);
  for (const i of backupData.invoices) await BillQyroDB.put('invoices', i);
  updateLocalCache(KEYS.EXPENSES, backupData.expenses);
  for (const e of backupData.expenses) await BillQyroDB.put('expenses', e);
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(backupData.subscription));

  // If Firebase is enabled, batch update Firestore as well
  if (firebaseReady) {
    const userId = getFirebaseUserId();
    firestoreSave('settings', userId, backupData.settings);
    backupData.customers.forEach(c => firestoreSave('customers', c.id, c));
    backupData.products.forEach(p => firestoreSave('products', p.id, p));
    backupData.invoices.forEach(i => {
      firestoreSave('invoices', i.id, i);
    });
    backupData.expenses.forEach(e => firestoreSave('expenses', e.id, e));
    firestoreSave('subscription', userId, backupData.subscription);
  }

  return backupData;
};

export const clearInvoices = async () => { localStorage.setItem(KEYS.INVOICES, JSON.stringify([])); await BillQyroDB.clear('invoices'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };

export const emptyTrash = async () => {
  const invoices = await getInvoices();
  const trashInvoices = invoices.filter(inv => inv.isDeleted === true);
  const activeInvoices = invoices.filter(inv => inv.isDeleted !== true);
  
  updateLocalCache(KEYS.INVOICES, activeInvoices);
  
  for (const inv of trashInvoices) {
    await BillQyroDB.delete('invoices', inv.id);
    if (firebaseReady && navigator.onLine) {
      firestoreDelete('invoices', inv.id).catch(e => console.error(e));
      firestoreDelete('publicInvoices', inv.publicToken || inv.id).catch(e => console.error(e));
    } else if (firebaseReady && !navigator.onLine) {
      queueSyncTransaction('delete', 'invoices', inv.id).catch(e => console.error(e));
    }
  }
  
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success', count: trashInvoices.length };
};

export const clearCustomers = async () => { localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([])); await BillQyroDB.clear('customers'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };

export const clearProducts = async () => { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([])); await BillQyroDB.clear('products'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };

export const clearExpenses = async () => { localStorage.setItem(KEYS.EXPENSES, JSON.stringify([])); await BillQyroDB.clear('expenses'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };

export const getStorageUsage = () => {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('billqyro_')) {
      const value = localStorage.getItem(key);
      totalBytes += key.length + value.length;
    }
  }
  // Convert bytes to KB
  const kb = totalBytes / 1024;
  // Browser limit is typically 5000KB (5MB)
  const limitKb = 5000;
  const percentage = Math.min((kb / limitKb) * 100, 100);

  return {
    kb: kb.toFixed(2),
    limitKb,
    percentage: percentage.toFixed(2)
  };
};

// --- REAL TIME SYNC LISTENER ---
let unsubscribes = [];

export const enableRealTimeSync = () => {
  if (!firebaseReady) return;

  const userId = getFirebaseUserId();
  console.log('Enabling Real-Time Sync for workspace:', userId);

  // Clear any existing listeners
  unsubscribes.forEach(unsub => unsub());
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
  if (!firebaseReady) {
    console.log("Firebase not enabled, skipping Firestore sync.");
    return null;
  }
  try {
    await migrateGlobalToScopedStorage();
    const userId = getFirebaseUserId();
    console.log("Syncing data from Firestore for user: " + userId);

    // 1. Flush offline transactions first to avoid overwriting them
    if (navigator.onLine) {
      await syncOfflineTransactions();
    }

    const settingsDoc = await getDoc(doc(db, 'settings', userId));
    if (settingsDoc.exists()) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsDoc.data()));
    }

    const customersSnap = await getDocs(collection(db, 'customers', userId, 'items'));
    const customers = [];
    customersSnap.forEach(docSnap => {
      const data = docSnap.data();
      data.syncStatus = 'synced';
      customers.push(data);
    });
    if (customers.length > 0) {
      for(const c of customers) await BillQyroDB.put('customers', c);
      updateLocalCache(KEYS.CUSTOMERS, customers);
    }

    const invoicesMap = new Map();
    try {
      const snap1 = await getDocs(collection(db, 'invoices', userId, 'items'));
      snap1.forEach(docSnap => {
        const data = docSnap.data();
        data.syncStatus = 'synced';
        invoicesMap.set(docSnap.id, data);
      });
    } catch(e) {}
    
    const invoices = Array.from(invoicesMap.values());
    if (invoices.length > 0) {
      for(const i of invoices) await BillQyroDB.put('invoices', i);
      updateLocalCache(KEYS.INVOICES, invoices);
    }

    const productsSnap = await getDocs(collection(db, 'products', userId, 'items'));
    const products = [];
    productsSnap.forEach(docSnap => {
      const data = docSnap.data();
      data.syncStatus = 'synced';
      products.push(data);
    });
    if (products.length > 0) {
      for(const p of products) await BillQyroDB.put('products', p);
      updateLocalCache(KEYS.PRODUCTS, products);
    }

    const expensesSnap = await getDocs(collection(db, 'expenses', userId, 'items'));
    const expenses = [];
    expensesSnap.forEach(docSnap => {
      const data = docSnap.data();
      data.syncStatus = 'synced';
      expenses.push(data);
    });
    if (expenses.length > 0) {
      for(const e of expenses) await BillQyroDB.put('expenses', e);
      updateLocalCache(KEYS.EXPENSES, expenses);
    }

    const subDoc = await getDoc(doc(db, 'subscription', userId));
    if (subDoc.exists()) {
      localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(subDoc.data()));
    }

    window.dispatchEvent(new CustomEvent('billqyro_sync'));

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




export const cleanDuplicateDrafts = async () => {
  const invoices = await getInvoices();
  const valid = invoices.filter(inv => inv.grandTotal > 0 || inv.paymentStatus === 'Paid' || inv.paymentStatus === 'Draft');
  const removed = invoices.length - valid.length;
  
  if (removed > 0) {
    await BillQyroDB.clear('invoices');
    for (const inv of valid) await BillQyroDB.put('invoices', inv);
    updateLocalCache(KEYS.INVOICES, valid);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }
  return removed;
};

export const cleanTemporaryData = async () => {
  let count = 0;
  try {
    const queue = await BillQyroDB.getAll('syncQueue');
    const oldTxs = queue.filter(tx => Date.now() - (tx.createdAt||0) > 7 * 24 * 60 * 60 * 1000);
    for (const tx of oldTxs) {
      await BillQyroDB.delete('syncQueue', tx.id);
      count++;
    }
  } catch(e){}
  return count;
};

export const clearCacheOnly = () => {
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.EXPENSES);
  return {status: 'success'};
};

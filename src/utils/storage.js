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
  const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const tx = {
    id: transactionId,
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
    const queue = await BillQyroDB.getAll('syncQueue');
    if (queue.length === 0) return;

    console.log(`[SYNC QUEUE] Syncing ${queue.length} offline transactions...`);

    // Sort by createdAt so we sync in order
    const sortedQueue = queue.sort((a, b) => a.createdAt - b.createdAt);

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

          // Update local invoice syncStatus to 'synced' on success
          if (syncSuccess && tx.data && tx.data.id) {
            const invoices = JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]');
            const localIdx = invoices.findIndex(inv => inv.id === tx.data.id);
            if (localIdx !== -1) {
              invoices[localIdx].syncStatus = 'synced';
              invoices[localIdx].updatedAt = new Date().toISOString();
              localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
              await BillQyroDB.put('invoices', invoices[localIdx]);
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

// Background Firestore Save Helper
const firestoreSave = async (collectionName, docId, data) => {
  if (!firebaseReady) return { status: 'disabled' };
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
    email: 'billing@billqyro.com',
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

export const login = (passcodeOrEmail) => {
  const activeSettings = getSettings() || DEFAULT_SETTINGS;
  const targetPasscode = activeSettings.adminPasscode || '1118';
  const targetEmail = activeSettings.adminEmail || getAdminEmail();

  const inputStr = String(passcodeOrEmail).toLowerCase().trim();
  const isEmailMatch = inputStr === targetEmail.toLowerCase();
  const isPasscodeMatch = String(passcodeOrEmail) === targetPasscode;
  const isMasterAdmin = isEmailMatch; // admin email check handled by ADMIN_EMAIL

  if (isPasscodeMatch || isEmailMatch || isMasterAdmin) {
    const sessionEmail = inputStr; // email is already validated
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
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS));
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  firestoreSave('settings', 'business', settings);
  registerOrUpdateUserList(settings);
  return settings;
};

// --- EXPENSES ---
export const getExpenses = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
};

export const saveExpense = async (expense) => {
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

  // Save to IndexedDB
  await BillQyroDB.put('expenses', expense);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreSave('expenses', expense.id, expense).catch(e => console.error(e));
    } else {
      queueSyncTransaction('save', 'expenses', expense.id, expense).catch(e => console.error(e));
    }
  }
  return expenses;
};

export const deleteExpense = async (id) => {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));

  // Delete from IndexedDB
  await BillQyroDB.delete('expenses', id);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('expenses', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'expenses', id).catch(e => console.error(e));
    }
  }
  return filtered;
};

// --- CUSTOMERS ---
export const getCustomers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};

export const saveCustomer = async (customer) => {
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

  // Save to IndexedDB
  await BillQyroDB.put('customers', customer);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreSave('customers', customer.id, customer).catch(e => console.error(e));
    } else {
      queueSyncTransaction('save', 'customers', customer.id, customer).catch(e => console.error(e));
    }
  }
  return customers;
};

export const deleteCustomer = async (id) => {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));

  // Delete from IndexedDB
  await BillQyroDB.delete('customers', id);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('customers', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'customers', id).catch(e => console.error(e));
    }
  }
  return filtered;
};

// --- PRODUCTS ---
export const getProducts = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
};

export const saveProduct = async (product) => {
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

  // Save to IndexedDB
  await BillQyroDB.put('products', product);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreSave('products', product.id, product).catch(e => console.error(e));
    } else {
      queueSyncTransaction('save', 'products', product.id, product).catch(e => console.error(e));
    }
  }
  return products;
};

export const deleteProduct = async (id) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));

  // Delete from IndexedDB
  await BillQyroDB.delete('products', id);

  // Sync / queue (Non-blocking)
  if (firebaseReady) {
    if (navigator.onLine) {
      firestoreDelete('products', id).catch(e => console.error(e));
    } else {
      queueSyncTransaction('delete', 'products', id).catch(e => console.error(e));
    }
  }
  return filtered;
};

// --- INVOICES ---
export const getInvoices = () => {
  initializeStorage();
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
  const invoices = getInvoices();

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

  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

  // Save to IndexedDB
  await BillQyroDB.put('invoices', invoice);

  // Sync / queue + syncStatus tracking (Non-blocking)
  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      invoice.syncStatus = 'pending';
      const idx = invoices.findIndex(inv => inv.id === invoice.id);
      if (idx !== -1) invoices[idx] = invoice;
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
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
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
      await BillQyroDB.put('invoices', invoice);
    }
  } else {
    invoice.syncStatus = 'offline';
    // Persist syncStatus back to localStorage + IndexedDB
    const idx = invoices.findIndex(inv => inv.id === invoice.id);
    if (idx !== -1) invoices[idx] = invoice;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    await BillQyroDB.put('invoices', invoice);
  }

  return {
    updatedInvoices: invoices,
    firebaseStatus
  };
};

const syncLocalInvoice = (cloudData) => {
  const invoices = getInvoices();
  const localIdx = invoices.findIndex(inv => inv.id === cloudData.id);
  if (localIdx !== -1) {
    invoices[localIdx] = cloudData;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
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
        syncLocalInvoice(cloudData);
        return cloudData;
      }

      // 2. Try legacy public_invoices for compatibility with older links
      console.log('[DEBUG] getInvoiceByPublicToken - Firestore path checked: public_invoices/' + token);
      docRef = doc(db, 'public_invoices', token);
      snap = await getDoc(docRef);

      console.log('[DEBUG] getInvoiceByPublicToken - Checked legacy public_invoices/' + token + ' - Document exists:', snap.exists());

      if (snap.exists()) {
        const cloudData = snap.data();
        syncLocalInvoice(cloudData);
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
  const invoices = getInvoices();
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
  const invoices = getInvoices();
  const idx = invoices.findIndex(inv => inv.id === invoice.id);
  if (idx !== -1) {
    invoices[idx] = invoice;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
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
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.id === invoice.id || inv.publicToken === invoice.publicToken);
  if (index !== -1) {
    invoices[index] = invoice;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
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

export const deleteInvoice = async (id) => {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(filtered));

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
    if (!Object.prototype.hasOwnProperty.call(backupData, k)) {
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

export const clearInvoices = () => {
  localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};

export const clearCustomers = () => {
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};

export const clearProducts = () => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};

export const clearExpenses = () => {
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};

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
    const invoicesMap = new Map();
    
    try {
      const snap1 = await getDocs(collection(db, 'invoices', userId, 'items'));
      snap1.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }
    
    try {
      const snap2 = await getDocs(collection(db, 'invoice', userId, 'items'));
      snap2.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }
    
    try {
      const snap3 = await getDocs(collection(db, 'users', userId, 'invoices'));
      snap3.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }

    const invoices = Array.from(invoicesMap.values());
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

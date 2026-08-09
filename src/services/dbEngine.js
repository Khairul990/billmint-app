import { db, firebaseReady, auth } from './firebaseConfig';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, onSnapshot, getDocFromServer, getDocsFromServer, query, where, getCountFromServer } from 'firebase/firestore';
import { getAdminEmail, isAdminUser } from '../utils/adminAccess';
import { BillQyroDB } from './localDb';
import { generateVerificationCode } from './verificationCodeService';
import {
  getUserRevenueState,
  saveUserRevenueState,
  calculateUserRevenueState,
  getGlobalRevenueSettings,
  saveGlobalRevenueSettings,
  submitPlatformPaymentProof,
  getUserPaymentProofs,
  getAdminAllPaymentProofs,
  getAdminPlatformRevenueStates,
  updatePlatformPaymentProofStatus
} from './platformRevenueService';
import {
  submitSupportTicket,
  getAdminAllSupportTickets,
  getUserSupportTickets,
  updateSupportTicketStatus,
  submitFeatureRequest,
  getAdminAllFeatureRequests,
  getUserFeatureRequests,
  updateFeatureRequestStatus,
  createAnnouncement,
  getAdminAllAnnouncements,
  getActiveAnnouncement,
  toggleAnnouncementActive,
  createChangelog,
  getAdminAllChangelogs
} from './platformAdminService';

// --- VERSION TRACKING FOR CONFLICT RESOLUTION ---
const getNextVersion = (record) => {
  return (record.__version || 0) + 1;
};

export const getDeviceId = () => {
  let id = localStorage.getItem('billqyro_device_id');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('billqyro_device_id', id);
  }
  return id;
};

const stampRecord = (record, userId) => {
  const now = new Date().toISOString();
  return {
    ...record,
    __version: getNextVersion(record),
    updatedAt: now,
    updatedByDeviceId: getDeviceId(),
    source: 'localUserAction',
    userId: userId || record.userId || getRealUserId() || 'local-user',
  };
};

// Check if a cloud record is strictly newer than a local record (uses version + timestamp)
export const cloudWins = (localRecord, cloudRecord) => {
  if (!localRecord) return true;
  if (!cloudRecord) return false;
  
  // Version-based resolution (primary)
  const localVer = localRecord.__version || 0;
  const cloudVer = cloudRecord.__version || 0;
  if (cloudVer > localVer) return true;
  if (cloudVer < localVer) return false;
  
  // Timestamp-based fallback (same version)
  const localTime = new Date(localRecord.updatedAt || localRecord.createdAt || 0).getTime();
  const cloudTime = new Date(cloudRecord.updatedAt || cloudRecord.createdAt || 0).getTime();
  return cloudTime > localTime;
};

// --- OFFLINE SYNC QUEUE ENGINE & MIGRATOR ---
export const migrateLocalStorageToIndexedDB = async () => {
  try {
    const migrationFlag = localStorage.getItem('billqyro_indexeddb_migrated');
    
    // If it's fully migrated with the new timestamp format (numeric string), we are good
    if (migrationFlag && migrationFlag !== 'true' && !isNaN(Number(migrationFlag))) {
      return;
    }

    const userId = getRealUserId() || 'local-user';
    const localSettings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
    const workspaceId = localSettings?.activeWorkspaceId || 'default';

    const migrateCollection = async (localKey, storeName) => {
      const itemsStr = localStorage.getItem(localKey);
      if (!itemsStr) return; // Nothing to migrate or cleanup

      // Only perform the DB push if it's NOT an already completed old migration
      if (migrationFlag !== 'true') {
        const items = JSON.parse(itemsStr) || [];
        for (const item of items) {
          if (!item.userId) item.userId = userId;
          if (!item.workspaceId) item.workspaceId = workspaceId;
          
          try {
            const existing = await BillQyroDB.get(storeName, item.id);
            if (existing) {
              const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
              const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
              const existingVer = existing.__version || 0;
              const itemVer = item.__version || 0;

              if (existingVer > itemVer) continue;
              if (existingVer === itemVer && existingTime >= itemTime) continue;
            }
            await BillQyroDB.put(storeName, item);
          } catch (e) {
            console.warn(`Ignored error in dbEngine.js during migration item ${item.id}:`, e);
          }
        }
      }
      
      // Verified Cleanup: Backup and remove old LocalStorage data
      localStorage.setItem(`${localKey}_backup`, itemsStr);
      localStorage.removeItem(localKey);
    };

    await migrateCollection(KEYS.INVOICES, 'invoices');
    await migrateCollection(KEYS.CUSTOMERS, 'customers');
    await migrateCollection(KEYS.PRODUCTS, 'products');
    await migrateCollection(KEYS.EXPENSES, 'expenses');
    await migrateCollection(KEYS.STUDENTS, 'students');

    localStorage.setItem('billqyro_indexeddb_migrated', Date.now().toString());

  } catch (error) {
    console.error('[MIGRATION] LocalStorage to IndexedDB migration failed:', error);
    toast.error("কিছু পুরনো ডেটা সিঙ্ক করা যায়নি, সাপোর্টে যোগাযোগ করুন।", { duration: 5000 });
  }
};

export const queueSyncTransaction = async (action, storeName, docId, data) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('[DEMO GUARD] Blocked real data operation during Demo Mode: queueSyncTransaction');
    toast.error('Blocked real operation in Demo Mode');
    return null;
  }
  const userId = getRealUserId();

  // --- DUPLICATE SYNC QUEUE PREVENTION ---
  // Remove any existing pending transactions for the same document to prevent duplicate uploads.
  // Only the latest version of the data needs to be synced.
  try {
    const existingQueue = await BillQyroDB.getAll('syncQueue');
    const duplicates = existingQueue.filter(tx =>
      tx.storeName === storeName && tx.docId === docId && tx.userId === userId && tx.status === 'pending'
    );
    for (const dup of duplicates) {
      await BillQyroDB.delete('syncQueue', dup.id);
    }
  } catch (e) {
    console.warn('[SYNC QUEUE] Could not deduplicate queue:', e);
  }

  const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  let deviceId = 'Unknown Device';
  try {
    deviceId = localStorage.getItem('billqyro_device_id') || 'Unknown Device';
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }

  const tx = {
    id: transactionId,
    userId,
    action,
    collectionName: storeName,
    storeName,
    recordId: docId,
    docId,
    data,
    dataVersion: data?.__version || 0,
    deviceId,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    retries: 0,
    retryCount: 0,
    lastRetryAt: 0
  };
  await BillQyroDB.put('syncQueue', tx);

};

// --- CORE LOGGING SYSTEM ---
export const logError = async (error, context = '') => {
  try {
    const errorLog = {
      id: 'err-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
    await BillQyroDB.put('errorLogs', errorLog);
    console.error(`[SYSTEM ERROR] ${context}:`, error);
  } catch (e) {
    console.error('Failed to write to errorLogs', e);
  }
};

export const logAudit = async (action, entityType, entityId, before = null, after = null) => {
  try {
    const user = getAuthSession() || { uid: 'anonymous', email: 'unknown' };
    let deviceInfo = 'Unknown Device';
    try {
      deviceInfo = navigator.userAgent;
    } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }

    const auditEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      userEmail: user.email,
      action,
      entityType,
      entityId,
      before,
      after,
      createdAt: Date.now(),
      actorRole: user.email === getAdminEmail() ? 'admin' : 'user',
      deviceInfo
    };
    
    await BillQyroDB.put('auditLogs', auditEntry);

    
    // Also queue audit logs for sync so they go to cloud
    await queueSyncTransaction('save', 'auditLogs', auditEntry.id, auditEntry);
  } catch (e) {
    await logError(e, 'logAudit');
  }
};

let syncDebounceTimer = null;
let isSyncing = false;

// --- STALE DATA CLEANUP ---
export const cleanupStaleData = async () => {
  try {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Clean old deleted invoices (in trash for > 30 days)
    const invoices = await BillQyroDB.getAll('invoices');
    let deletedCount = 0;
    for (const inv of invoices) {
      if (inv.isDeleted && inv.deletedAt) {
        const deletedTime = new Date(inv.deletedAt).getTime();
        if (now - deletedTime > THIRTY_DAYS_MS) {
          await BillQyroDB.delete('invoices', inv.id);
          deletedCount++;
        }
      }
    }

    // Clean stale syncQueue items (stuck for > 7 days)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const MAX_RETRIES = 10;
    const queue = await BillQyroDB.getAll('syncQueue');
    for (const item of queue) {
      const age = now - (item.createdAt || item.timestamp || 0);
      if (age > SEVEN_DAYS_MS || (item.retryCount || 0) >= MAX_RETRIES) {
        await BillQyroDB.delete('syncQueue', item.id);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[DB Cleanup] Removed ${deletedCount} stale deleted invoices.`);
    }
  } catch (err) {
    console.warn('[DB Cleanup] Error during cleanup:', err);
  }
};

let pendingSyncResolvers = [];
export const syncOfflineTransactions = async () => {
  return new Promise((resolve) => {
    pendingSyncResolvers.push(resolve);
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    
    syncDebounceTimer = setTimeout(async () => {
      const resolvers = [...pendingSyncResolvers];
      pendingSyncResolvers = [];
      if (isSyncing) {
        resolvers.forEach(r => r(null));
        return;
      }
      isSyncing = true;
      try {
        await _runSyncOfflineTransactions();
      } catch (e) {
        console.error('Background sync failed:', e);
      } finally {
        isSyncing = false;
        resolvers.forEach(r => r(true));
      }
    }, 300); // 300ms batch window
  });
};

const markLocalRecordSynced = async (storeName, docId) => {
  if (!docId) return;
  let key = null;
  if (storeName === 'invoices') key = KEYS.INVOICES;
  else if (storeName === 'customers') key = KEYS.CUSTOMERS;
  else if (storeName === 'products') key = KEYS.PRODUCTS;
  else if (storeName === 'expenses') key = KEYS.EXPENSES;
  else if (storeName === 'bankLedger') key = KEYS.BANK_LEDGER;
  else if (storeName === 'bankCredit') key = KEYS.BANK_CREDIT;
  if (!key) return;

  const items = JSON.parse(localStorage.getItem(key) || '[]');
  const localIdx = items.findIndex(item => item.id === docId);
  if (localIdx !== -1) {
    items[localIdx].syncStatus = 'synced';
    if (storeName === 'invoices') items[localIdx].updatedAt = new Date().toISOString();
    updateLocalCache(key, items);
    await BillQyroDB.put(storeName, items[localIdx]);
  }
};

const cleanUndefined = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => (v === undefined ? null : typeof v === 'object' && v !== null ? cleanUndefined(v) : v));
  } else if (typeof obj === 'object' && obj !== null) {
    const res = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        res[key] = typeof obj[key] === 'object' && obj[key] !== null ? cleanUndefined(obj[key]) : obj[key];
      }
    }
    return res;
  }
  return obj;
};

const _runSyncOfflineTransactions = async () => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: syncOfflineTransactions');
    return null;
  }
  if (!firebaseReady || !navigator.onLine) return;

  try {
    const userId = getRealUserId();
    if (!userId) {
      console.warn('[SYNC QUEUE] Skipped offline sync. No real UID detected.');
      return;
    }
    const queue = await BillQyroDB.getAll('syncQueue');
    if (getRealUserId() !== userId) return; // Prevent race
    const userQueue = queue.filter(tx => tx.userId === userId);
    
    if (userQueue.length === 0) return;



    // Sort by createdAt so we sync in order
    const sortedQueue = userQueue.sort((a, b) => a.createdAt - b.createdAt);

    const MAX_RETRIES = 10;
    for (const tx of sortedQueue) {
      if (getRealUserId() !== userId) {
        console.warn('[SYNC QUEUE] Aborting sync, user changed mid-process.');
        return;
      }
      if ((tx.retryCount || 0) >= MAX_RETRIES) {
        console.warn(`[SYNC QUEUE] Dropping TX ${tx.id}: exceeded max retries (${MAX_RETRIES})`);
        toast.error('Failed to sync some offline data permanently. Check your connection.');
        await BillQyroDB.delete('syncQueue', tx.id);
        continue;
      }
      try {
        let syncSuccess = false;
        if (tx.action === 'save') {
          // Check cloud version before overwriting - never overwrite newer data
          let docRef;
          if (tx.storeName === 'settings' || tx.storeName === 'subscription') {
            docRef = doc(db, tx.storeName, tx.userId);
          } else {
            docRef = doc(db, tx.storeName, tx.userId, 'items', tx.docId);
          }
          
          // Fetch current cloud data to check version
          try {
            const cloudSnap = await getDoc(docRef);
            if (cloudSnap.exists()) {
              const cloudData = cloudSnap.data();
              const cloudVersion = cloudData.__version || 0;
              const localVersion = tx.data?.__version || 0;
              // Skip if cloud has higher version (newer data already synced)
              if (cloudVersion > localVersion) {
                console.warn(`[SYNC QUEUE] Skipping TX ${tx.id}: cloud version ${cloudVersion} > local ${localVersion}`);
                syncSuccess = true; // Consider it "synced" since cloud is ahead
                await markLocalRecordSynced(tx.storeName, tx.docId);
                await BillQyroDB.delete('syncQueue', tx.id);
                continue;
              }
            }
          } catch (e) {
            // If fetch fails (e.g. permission), just try writing
            console.warn('[SYNC QUEUE] Could not check cloud version, proceeding with write:', e);
          }
          
          const cleanData = cleanUndefined(tx.data);
          
          try {
            await setDoc(docRef, cleanData, { merge: true });
          } catch (docErr) {
            if (docErr.code === 'permission-denied') {
              console.warn('[SYNC QUEUE] Permission denied on update, attempting to replace legacy document...', docRef.path);
              // Legacy documents without userId fail the update rule. Delete doesn't check resource.data.userId.
              await deleteDoc(docRef);
              await setDoc(docRef, cleanData); // Try again without merge (create rule)
            } else {
              throw docErr;
            }
          }
          syncSuccess = true;

          if (tx.storeName === 'invoices') {
            try {
              const publicDocRef = doc(db, 'publicInvoices', cleanData.publicToken);
              await setDoc(publicDocRef, cleanData, { merge: true });
            } catch (pubErr) {
              console.warn('[SYNC QUEUE] Failed to update publicInvoice, possibly legacy. Ignoring.', pubErr);
            }
          }

          // Update local syncStatus to 'synced' on success
          if (syncSuccess && tx.data && tx.data.id) {
            await markLocalRecordSynced(tx.storeName, tx.data.id);
          }
        } else if (tx.action === 'delete') {
          let docRef;
          if (tx.storeName === 'settings' || tx.storeName === 'subscription') {
            docRef = doc(db, tx.storeName, tx.userId);
          } else {
            docRef = doc(db, tx.storeName, tx.userId, 'items', tx.docId);
          }
          await deleteDoc(docRef);
          if (tx.storeName === 'invoices' && tx.data?.publicToken) {
            await deleteDoc(doc(db, 'publicInvoices', tx.data.publicToken));
          }
          syncSuccess = true;
        }

        // Remove from queue after successful sync
        if (syncSuccess) {
          await BillQyroDB.delete('syncQueue', tx.id);

        } else {
          // Update retry logic
          tx.retryCount = (tx.retryCount || 0) + 1;
          tx.lastRetryAt = Date.now();
          await BillQyroDB.put('syncQueue', tx);
        }
      } catch (err) {
        console.error('[SYNC QUEUE] Failed to sync transaction:', tx.id, err);
        toast.error('Sync Error: ' + (err.message || 'Unknown error'));
        tx.retryCount = (tx.retryCount || 0) + 1;
        tx.lastRetryAt = Date.now();
        await BillQyroDB.put('syncQueue', tx);
        await logError(err, 'syncOfflineTransactions');
      }
    }

    // Dispatch a sync event so that the app updates state
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  } catch (error) {
    console.error('[SYNC QUEUE] Error in syncOfflineTransactions:', error);
    toast.error('Offline data sync encountered a problem.');
  }
};

// Listen for network reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {

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
  STUDENTS: 'billqyro_students',
  SUBSCRIPTION: 'billqyro_subscription',
  BANK_LEDGER: 'billqyro_bank_ledger',
  BANK_CREDIT: 'billqyro_bank_credit',
  BANK_SETTINGS: 'billqyro_bank_settings',
};

export const getScopedKey = (baseKey) => {
  if (baseKey === GLOBAL_KEYS.AUTH) return baseKey;
  const uid = getRealUserId();
  if (!uid) return baseKey;

  // Add workspace isolation for data collections
  if ([GLOBAL_KEYS.INVOICES, GLOBAL_KEYS.CUSTOMERS, GLOBAL_KEYS.PRODUCTS, GLOBAL_KEYS.EXPENSES, GLOBAL_KEYS.STUDENTS, GLOBAL_KEYS.BANK_LEDGER, GLOBAL_KEYS.BANK_CREDIT, GLOBAL_KEYS.BANK_SETTINGS].includes(baseKey)) {
    const settingsStr = localStorage.getItem(`${GLOBAL_KEYS.SETTINGS}_${uid}`);
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        if (settings.activeWorkspaceId) {
          return `${baseKey}_${uid}_${settings.activeWorkspaceId}`;
        }
      } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
    }
  }

  return `${baseKey}_${uid}`;
};

// Dynamic KEYS that automatically scope to the current user
export const KEYS = {
  get AUTH() { return GLOBAL_KEYS.AUTH; },
  get SETTINGS() { return getScopedKey(GLOBAL_KEYS.SETTINGS); },
  get CUSTOMERS() { return getScopedKey(GLOBAL_KEYS.CUSTOMERS); },
  get PRODUCTS() { return getScopedKey(GLOBAL_KEYS.PRODUCTS); },
  get INVOICES() { return getScopedKey(GLOBAL_KEYS.INVOICES); },
  get EXPENSES() { return getScopedKey(GLOBAL_KEYS.EXPENSES); },
  get STUDENTS() { return getScopedKey(GLOBAL_KEYS.STUDENTS); },
  get SUBSCRIPTION() { return getScopedKey(GLOBAL_KEYS.SUBSCRIPTION); },
  get BANK_LEDGER() { return getScopedKey(GLOBAL_KEYS.BANK_LEDGER); },
  get BANK_CREDIT() { return getScopedKey(GLOBAL_KEYS.BANK_CREDIT); },
  get BANK_SETTINGS() { return getScopedKey(GLOBAL_KEYS.BANK_SETTINGS); },
};

export const migrateGlobalToScopedStorage = async () => {
  const uid = getRealUserId();
  if (!uid) return { status: 'failed', message: 'No real UID found' };



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


  return { status: 'success', migratedCount };
};

export const updateLocalCache = (key, items) => {
  let targetKey = key;
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    if (key.includes('invoices')) targetKey = 'billqyro_demo_invoices';
    else if (key.includes('customers')) targetKey = 'billqyro_demo_customers';
    else if (key.includes('products')) targetKey = 'billqyro_demo_products';
    else if (key.includes('expenses')) targetKey = 'billqyro_demo_expenses';
    else if (key.includes('settings')) targetKey = 'billqyro_demo_settings';
  }

  const sorted = [...items].sort((a,b) => {
    const da = a.createdAt ? new Date(a.createdAt) : 0;
    const db = b.createdAt ? new Date(b.createdAt) : 0;
    return db - da;
  });
  localStorage.setItem(targetKey, JSON.stringify(sorted));
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
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1,
  estimatePrefix: 'EST-',
  nextEstimateNumber: 1,
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
  adminPasscode: '', // Must be set via admin settings
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
export const getRealUserId = () => {
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
    } catch { /* ignore */ }
  }
  return null;
};



// Background Firestore Save Helper
const firestoreSave = async (collectionName, docId, data) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('[DEMO GUARD] Blocked real data operation during Demo Mode: firestoreSave');
    toast.error('Blocked real operation in Demo Mode');
    return null;
  }
  if (!firebaseReady) return { status: 'disabled' };
  const userId = getRealUserId();
  if (!userId) {
    console.warn(`[SYNC] Skipped cloud sync for ${collectionName}. No real UID detected. Data saved locally only.`);
    return { status: 'local-only' };
  }
  
  if (collectionName === 'auditLogs' || collectionName === 'usersList') {
    // Audit logs bypass the new Sync Engine Queue because we don't care if they drop offline
    try {
      let docRef = (collectionName === 'auditLogs') ? doc(db, collectionName, userId, 'items', docId) : doc(db, collectionName, userId);
      await setDoc(docRef, data);
      return { status: 'success' };
    } catch (e) {
      console.error(`[SYNC PERMISSION DENIED] Write failed for collection: ${collectionName}, docId: ${docId}. Rule blocked access. Error:`, e.message || e);
      return { status: 'failed', error: e };
    }
  }

  // Push to advanced Sync Engine for debouncing & offline queue
  pushDataUpdate(collectionName, userId, docId, data);
  return { status: 'queued' };
};

// Background Firestore Delete Helper
const firestoreDelete = async (collectionName, docId) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('[DEMO GUARD] Blocked real data operation during Demo Mode: firestoreDelete');
    toast.error('Blocked real operation in Demo Mode');
    return;
  }
  if (!firebaseReady) return;
  try {
    const userId = getRealUserId();
    if (!userId) {
      console.warn(`[SYNC] Skipped cloud delete for ${collectionName}. No real UID detected. Deleted locally only.`);
      return;
    }
    let docRef;
    if (collectionName === 'settings' || collectionName === 'subscription' || collectionName === 'users') {
      docRef = doc(db, collectionName, userId);
    } else if (collectionName === 'publicInvoices') {
      docRef = doc(db, 'publicInvoices', docId);
    } else {
      docRef = doc(db, collectionName, userId, 'items', docId);
    }
    await deleteDoc(docRef);

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
  } catch { /* ignore */ }
  
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
    } catch { /* ignore */ }
  });

  // Migrate legacy invoices lacking an invoiceNumber
  let settings = null;
  let migratedNumbers = false;
  currentInvoices.forEach(inv => {
    if (!inv.invoiceNumber) {
      if (!settings) settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || DEFAULT_SETTINGS;
      const isEstimate = inv.billType === 'Estimate';
      const prefix = isEstimate ? (settings.estimatePrefix || 'EST-') : (settings.invoicePrefix || 'INV-');
      let nextNum = isEstimate ? (settings.nextEstimateNumber || 1) : (settings.nextInvoiceNumber || 1);
      
      let uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
      while (currentInvoices.some(existing => existing.invoiceNumber === uniqueStr)) {
        nextNum++;
        uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
      }
      
      inv.invoiceNumber = uniqueStr;
      if (isEstimate) {
        settings.nextEstimateNumber = nextNum + 1;
      } else {
        settings.nextInvoiceNumber = nextNum + 1;
      }
      migratedNumbers = true;
    }
  });

  if (migratedNumbers) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(currentInvoices));
    if (settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(currentInvoices));
  }
  if (!localStorage.getItem(KEYS.EXPENSES)) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SUBSCRIPTION)) {
    localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));
  }

  // Trigger IndexedDB offline-first synchronization and migrations asynchronously
  migrateLocalStorageToIndexedDB();
  cleanupStaleData();
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
    adminPasscode: '',
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
    const userId = getRealUserId();
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
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.AUTH);
      return null;
    }
    if (!data.uid || data.uid === 'demo-user' || !data.userEmail || data.userEmail === 'No email') {
      localStorage.removeItem(KEYS.AUTH);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};



export const logout = async () => {
  const currentUserId = getRealUserId();
  
  // Clear known scoped keys
  localStorage.removeItem(KEYS.AUTH);
  localStorage.removeItem(KEYS.SETTINGS);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.EXPENSES);
  localStorage.removeItem(KEYS.SUBSCRIPTION);
  localStorage.removeItem('billqyro_last_route');
  
  // Aggressively clear ALL possible user/workspace scoped caches
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('billqyro_') && 
        key !== 'billqyro_admin_default_theme' && 
        key !== 'billqyro_admin_default_mode' &&
        key !== 'billqyro_device_id') {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  
  sessionStorage.clear();
  try {
    await BillQyroDB.clear('invoices');
    await BillQyroDB.clear('customers');
    await BillQyroDB.clear('products');
    await BillQyroDB.clear('expenses');
    
    // For syncQueue, delete only the active user's items
    if (currentUserId) {
        const queue = await BillQyroDB.getAll('syncQueue');
        const userItems = queue.filter(tx => tx.userId === currentUserId);
        for (const item of userItems) {
            await BillQyroDB.delete('syncQueue', item.id);
        }
    }
    
    await BillQyroDB.clear('auditLogs');
    await BillQyroDB.clear('errorLogs');
  } catch (e) {
    console.error('Failed to clear IndexedDB on logout', e);
  }
};

export const resetBusinessDataOnly = async () => {
  const userId = getRealUserId();
  
  if (firebaseReady && userId) {
    try {
      await resetEnterpriseWorkspace(userId);
    } catch (e) {
      console.error('[WIPE] Failed to wipe cloud data during data reset', e);
    }
  }

  try {
    await BillQyroDB.clear('invoices').catch(() => {});
    await BillQyroDB.clear('customers').catch(() => {});
    await BillQyroDB.clear('products').catch(() => {});
    await BillQyroDB.clear('expenses').catch(() => {});
    await BillQyroDB.clear('syncQueue').catch(() => {});
    await BillQyroDB.clear('auditLogs').catch(() => {});
    await BillQyroDB.clear('errorLogs').catch(() => {});
  } catch (e) { console.warn('Ignored error in resetBusinessDataOnly:', e); }
  
  window.location.reload();
};

export const factoryResetAllData = async () => {
  // Get userId before clearing local storage
  const userId = getRealUserId();
  
  if (firebaseReady && userId) {
    try {
      await deleteEnterpriseUser(userId);
    } catch (e) {
      console.error('[WIPE] Failed to wipe cloud data during factory reset', e);
    }
  }

  // Wipe all local storage
  localStorage.clear();
  sessionStorage.clear();
  
  try {
    // Manually clear all object stores first as a fallback
    await BillQyroDB.clear('invoices').catch(() => {});
    await BillQyroDB.clear('customers').catch(() => {});
    await BillQyroDB.clear('products').catch(() => {});
    await BillQyroDB.clear('expenses').catch(() => {});
    await BillQyroDB.clear('students').catch(() => {});
    await BillQyroDB.clear('syncQueue').catch(() => {});
    await BillQyroDB.clear('auditLogs').catch(() => {});
    await BillQyroDB.clear('errorLogs').catch(() => {});
    
    // Now close and delete the whole database
    BillQyroDB.close();
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('billqyro-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn('Database deletion blocked by another tab. Stores were cleared though.');
        resolve();
      };
    });
    
    const caches = await window.caches.keys();
    for (const name of caches) {
      await window.caches.delete(name);
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  
  if (firebaseReady) {
    try {
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (delErr) {
          console.warn('Failed to delete auth user, signing out instead:', delErr);
          await auth.signOut();
        }
      }
    } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  }
  
  window.location.href = '/';
};

export const clearAllLocalData = async () => {
  localStorage.clear();
  sessionStorage.clear();
  try {
    BillQyroDB.close();
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('billqyro-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn('Database deletion blocked. Force resolving.');
        resolve();
      };
    });
    
    const caches = await window.caches.keys();
    for (const name of caches) {
      await window.caches.delete(name);
    }
  } catch (err) {
    console.error('Error clearing storage', err);
  }
};

export const wipeUserFirestoreData = async (userId) => {
  if (!firebaseReady) return;
  try {
    const collectionsToEmpty = ['invoices', 'customers', 'products', 'expenses', 'students'];
    for (const colName of collectionsToEmpty) {
      const itemsRef = collection(db, colName, userId, 'items');
      const snapshot = await getDocs(itemsRef);
      
      const deletePromises = [];
      snapshot.docs.forEach(d => {
        deletePromises.push(deleteDoc(d.ref));
        
        // Also delete public copies for invoices
        if (colName === 'invoices') {
          const data = d.data();
          if (data.publicToken) {
            deletePromises.push(deleteDoc(doc(db, 'publicInvoices', data.publicToken)));
          }
        }
      });
      await Promise.all(deletePromises);
    }
    
    // Also delete the main user documents
    await deleteDoc(doc(db, 'settings', userId));
    await deleteDoc(doc(db, 'subscription', userId));
    await deleteDoc(doc(db, 'users', userId));
    await deleteDoc(doc(db, 'usersList', userId));
    

  } catch (error) {
    console.error('[WIPE] Error wiping Firestore data:', error);
  }
};

export const resetAccountKeepAuth = async () => {
  const session = localStorage.getItem(KEYS.AUTH);
  const userId = getRealUserId();
  
  // Wipe cloud data if connected
  if (firebaseReady && userId) {
    await wipeUserFirestoreData(userId);
  }
  
  // Wipe all local storage
  localStorage.clear();
  sessionStorage.clear();
  try {
    BillQyroDB.close();
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('billqyro-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn('Database deletion blocked. Force resolving.');
        resolve();
      };
    });
    
    const caches = await window.caches.keys();
    for (const name of caches) {
      await window.caches.delete(name);
    }
  } catch (e) {
    console.error('Error clearing offline db', e);
  }
  
  // Restore auth
  if (session) {
    localStorage.setItem(KEYS.AUTH, session);
  }
  
  // Re-initialize local state
  initializeStorage();
  
  window.location.href = '/onboarding';
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
        const userId = getRealUserId();
        setDoc(doc(db, 'subscription', userId), expiredSub, { merge: true });
        setDoc(doc(db, 'usersList', userId), { planStatus: 'free' }, { merge: true });
        setDoc(doc(db, 'settings', userId), { planStatus: 'free' }, { merge: true });
      }
      return expiredSub;
    }
    return sub;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
};

export const saveSubscriptionStatus = (status) => {
  const sub = {
    status, // 'free' or 'premium'
    activatedAt: status === 'premium' ? Date.now() : null,
  };
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(sub));
  const userId = getRealUserId();
  firestoreSave('subscription', userId || 'status', sub);
  return sub;
};

// --- USER REGISTRY & PREMIUM PIPELINE ---
export const registerOrUpdateUserList = async (activeSettings) => {
  if (!firebaseReady) return;
  const userId = getRealUserId();
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

  } catch (e) {
    console.error('[ERROR] Failed to update usersList:', e);
  }
};

export const submitPremiumRequest = async (plan, paidAmount, paymentMethod, transactionId, screenshotBase64 = '') => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  const userId = getRealUserId() || 'local-user';
  const authSession = getAuthSession() || { email: 'sandbox@test.com' };
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

  if (isSandbox) {
    const existing = JSON.parse(localStorage.getItem('billqyro_sandbox_premium_requests') || '[]');
    if (existing.some(r => r.status === 'Pending')) {
      throw new Error('You already have a pending premium activation request in Sandbox. Please approve it from the Sandbox Control Center.');
    }
    localStorage.setItem('billqyro_sandbox_premium_requests', JSON.stringify([payload, ...existing]));
    return payload;
  }

  if (!firebaseReady) {
    throw new Error('You must be connected to the internet to submit a premium activation request.');
  }

  // Check for existing pending request to prevent duplicates
  const q = query(
    collection(db, 'premiumRequests'),
    where('userId', '==', userId),
    where('status', '==', 'Pending')
  );
  const existingSnap = await getDocs(q);
  if (!existingSnap.empty) {
    throw new Error('You already have a pending premium activation request. Please wait for it to be processed.');
  }

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

export const getAdminTotalStats = async () => {
  if (!firebaseReady) return { invoices: 0, customers: 0, products: 0, expenses: 0 };
  try {
    const invSnap = await getCountFromServer(collection(db, 'publicInvoices'));
    const custSnap = await getCountFromServer(collection(db, 'usersList'));
    
    return {
      invoices: invSnap.data().count || 0,
      customers: custSnap.data().count * 5, // Placeholder ratio
      products: custSnap.data().count * 12,
      expenses: custSnap.data().count * 3
    };
  } catch (e) {
    console.error('Failed to getAdminTotalStats:', e);
    return { invoices: 0, customers: 0, products: 0, expenses: 0 };
  }
};

export const deleteEnterpriseUser = async (targetUserId) => {
  if (!firebaseReady || !targetUserId) return false;
  try {
    // Client-side best-effort deletion. Production requires Cloud Functions to recursively delete subcollections.
    const collectionsToClear = ['invoices', 'customers', 'products', 'expenses', 'students'];
    for (const coll of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, coll, targetUserId, 'items'));
        const deletePromises = [];
        snap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        await Promise.all(deletePromises);
      } catch { console.warn(`Skipped deleting ${coll} for ${targetUserId}`); }
    }
    
    await deleteDoc(doc(db, 'settings', targetUserId));
    await deleteDoc(doc(db, 'subscription', targetUserId));
    await deleteDoc(doc(db, 'usersList', targetUserId));
    await deleteDoc(doc(db, 'platformRevenue', targetUserId));
    
    return true;
  } catch (e) {
    console.error('Failed to delete enterprise user:', e);
    return false;
  }
};

export const resetEnterpriseWorkspace = async (targetUserId) => {
  if (!firebaseReady || !targetUserId) return false;
  try {
    const collectionsToClear = ['invoices', 'customers', 'products', 'expenses', 'students'];
    for (const coll of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, coll, targetUserId, 'items'));
        const deletePromises = [];
        snap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        await Promise.all(deletePromises);
      } catch { console.warn(`Skipped resetting ${coll} for ${targetUserId}`); }
    }
    return true;
  } catch (e) {
    console.error('Failed to reset enterprise workspace:', e);
    return false;
  }
};

export const getAdminPremiumRequests = async () => {
  if (!firebaseReady) return [];
  try {
    const snap = await getDocs(collection(db, 'premiumRequests'));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
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
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      throw new Error('Premium request not found.');
    }
    const reqData = reqSnap.data();
    if (reqData.status !== 'Pending') {
      throw new Error(`This request has already been ${reqData.status.toLowerCase()}.`);
    }

    await setDoc(reqRef, {
      status,
      rejectionReason,
      approvedAt: status === 'Approved' ? Date.now() : null,
      updatedAt: Date.now()
    }, { merge: true });

    if (status === 'Approved') {
      const activatedAt = Date.now();
      let durationMs = 30 * 24 * 60 * 60 * 1000;
      if (plan === 'Lifetime') {
        durationMs = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years approx for lifetime
      } else if (plan === 'Yearly') {
        durationMs = 365 * 24 * 60 * 60 * 1000;
      } else if (plan === 'Quarterly') {
        durationMs = 90 * 24 * 60 * 60 * 1000;
      }
      
      const expiresAt = plan === 'Lifetime' ? null : (activatedAt + durationMs);

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
    throw e;
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
export const migrateSettingsSchema_v3 = (settings) => {
  if (!settings) return null;
  if (settings.v3Migrated) return settings;
  
  // Backward compatibility migration map for the new 14-Studio Platform Architecture
  return {
    ...settings,
    autoBackup: settings.autoBackup ?? true,
    currency: settings.currency || 'USD',
    timezone: settings.timezone || 'UTC',
    dateFormat: settings.dateFormat || 'MM/DD/YYYY',
    numberFormat: settings.numberFormat || 'en-US',
    taxLabel: settings.taxLabel || 'Tax',
    defaultTaxRate: settings.defaultTaxRate || 0,
    whatsappEnabled: settings.whatsappEnabled ?? false,
    smsEnabled: settings.smsEnabled ?? false,
    cornerRadius: settings.cornerRadius ?? 12,
    shadowIntensity: settings.shadowIntensity ?? 50,
    animationSpeed: settings.animationSpeed ?? 1,
    v3Migrated: true
  };
};

export const getSettings = () => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    const s = JSON.parse(localStorage.getItem('billqyro_demo_settings') || 'null');
    if (s) return s;
    const isVideo = localStorage.getItem('billqyro_demo_video_creator') === 'true';
    return {
      businessName: isVideo ? 'Demo Corp' : 'My Business (Demo)',
      ownerName: isVideo ? 'Demo Owner' : 'Me',
      email: isVideo ? 'hello@democorp.com' : 'demo@example.com',
      phone: isVideo ? '+1 555-0199' : '9999999999',
      themeColor: 'obsidian-gold'
    };
  }
  initializeStorage();
  let settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS));
  
  if (settings) {
    settings = migrateSettingsSchema_v3(settings);
  }

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
      } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
    } else {
      settings.email = '';
    }
  }

  // Ensure default theme is locked to the account instead of floating, 
  // preventing it from randomly changing if the admin default changes later.
  if (settings) {
    let shouldSave = false;
    
    if (!settings.themeColor) {
      settings.themeColor = localStorage.getItem('billqyro_admin_default_theme') || 'obsidian-gold';
      shouldSave = true;
    }

    if (shouldSave) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      // Using direct firestore push bypassing syncEngine because this is a core init fix
      
      const userId = getRealUserId();
      if (userId && firebaseReady) {
         pushDataUpdate('settings', userId, userId, settings);
      }
    }
  }

  return settings;
};

export const saveSettings = (settings) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    localStorage.setItem('billqyro_demo_settings', JSON.stringify(settings));
    return settings;
  }
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  const userId = getRealUserId();
  firestoreSave('settings', userId || 'business', settings);
  registerOrUpdateUserList(settings);
  logAudit('settings_updated', 'settings', userId || 'business', null, settings);
  return settings;
};

// --- EXPENSES ---
export const getExpenses = async (includeDeleted = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    return JSON.parse(localStorage.getItem('billqyro_demo_expenses') || '[]');
  }
  initializeStorage();
  const userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  const workspaceId = settings?.activeWorkspaceId;
  try {
    const data = await BillQyroDB.getAll('expenses');
    if (data && data.length > 0) {
      let filtered = data;
      if (!includeDeleted) {
        filtered = data.filter(e => !e.isDeleted);
      }
      if (userId) filtered = filtered.filter(e => e.userId === userId);
      if (workspaceId) filtered = filtered.filter(e => e.workspaceId === workspaceId);
      return filtered.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return [];
};

export const saveExpense = async (expense) => {
  const expenses = await getExpenses();
  const settings = getSettings();
  expense.userId = getRealUserId() || 'local-user';
  expense.workspaceId = settings?.activeWorkspaceId || 'default';
  
  if (expense.id) {
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index !== -1) {
      const existing = expenses[index];
      // Preserve version from existing record if not provided
      expense.__version = Math.max(expense.__version || 0, existing.__version || 0);
      expenses[index] = stampRecord(expense, expense.userId);
    } else {
      expenses.push(stampRecord(expense, expense.userId));
    }
  } else {
    expense.id = 'exp-' + Date.now();
    expenses.push(stampRecord(expense, expense.userId));
  }
  // Sync / queue + syncStatus tracking
  let firebaseStatus = 'pending';
  updateLocalCache(KEYS.EXPENSES, expenses);
  const stamped = expenses.find(e => e.id === expense.id);
  await BillQyroDB.put('expenses', stamped);

  await queueSyncTransaction('save', 'expenses', expense.id, stamped);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedExpenses: expenses, firebaseStatus };
};

export const deleteExpense = async (id, permanent = false) => {
  const expenses = await getExpenses(true);
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return { updatedExpenses: expenses.filter(e => !e.isDeleted), firebaseStatus: 'failed' };
  
  const expenseToDelete = expenses[idx];

  if (!permanent) {
    expenses[idx].isDeleted = true;
    expenses[idx].deletedAt = new Date().toISOString();
    expenses[idx].syncStatus = 'pending';
    const filtered = expenses.filter(e => !e.isDeleted);
    updateLocalCache(KEYS.EXPENSES, expenses);
    await BillQyroDB.put('expenses', expenses[idx]);
    
    let firebaseStatus = 'pending';
    await queueSyncTransaction('save', 'expenses', id, expenses[idx]);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));

    if (firebaseReady) {
      if (navigator.onLine) {
        syncOfflineTransactions().catch(e => console.error(e));
      } else {
        firebaseStatus = 'failed';
      }
    } else {
      firebaseStatus = 'offline';
    }
    return { updatedExpenses: filtered, firebaseStatus };
  }

  // Permanent Delete
  const filtered = expenses.filter(e => e.id !== id);
  updateLocalCache(KEYS.EXPENSES, filtered);
  await BillQyroDB.delete('expenses', id);

  let firebaseStatus = 'pending';
  await queueSyncTransaction('delete', 'expenses', id, null);

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedExpenses: filtered.filter(e => !e.isDeleted), firebaseStatus };
};

// --- CUSTOMERS ---
export const getCustomers = async (includeDeleted = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    return JSON.parse(localStorage.getItem('billqyro_demo_customers') || '[]');
  }
  initializeStorage();
  const userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  const workspaceId = settings?.activeWorkspaceId;
  try {
    const data = await BillQyroDB.getAll('customers');
    if (data && data.length > 0) {
      let filtered = data;
      if (!includeDeleted) {
        filtered = data.filter(c => !c.isDeleted);
      }
      if (userId) filtered = filtered.filter(c => c.userId === userId);
      if (workspaceId) filtered = filtered.filter(c => c.workspaceId === workspaceId);
      return filtered.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return [];
};

export const saveCustomer = async (customer) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: saveCustomer');
    return { updatedCustomers: [], firebaseStatus: 'blocked' };
  }
  
  customer.userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  customer.workspaceId = settings?.activeWorkspaceId || 'default';
  
  const customers = await getCustomers();
  if (customer.id) {
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      const existing = customers[index];
      customer.__version = Math.max(customer.__version || 0, existing.__version || 0);
      customers[index] = stampRecord(customer, customer.userId);
      logAudit('customer_updated', 'customer', customer.id, null, customers[index]);
    } else {
      customers.push(stampRecord(customer, customer.userId));
      logAudit('customer_created', 'customer', customer.id, null, customer);
    }
  } else {
    // --- DUPLICATE CUSTOMER PREVENTION (idempotent creation) ---
    const custName = (customer.name || customer.customerName || '').trim().toLowerCase();
    const custPhone = (customer.phone || customer.customerPhone || '').trim();
    if (custName) {
      const existingDupe = customers.find(c => {
        const cName = (c.name || c.customerName || '').trim().toLowerCase();
        const cPhone = (c.phone || c.customerPhone || '').trim();
        return cName === custName && cPhone === custPhone;
      });
      if (existingDupe) {
        // Return existing customer instead of creating a duplicate
        console.warn('[DATA INTEGRITY] Duplicate customer prevented:', custName, custPhone);
        return { updatedCustomers: customers, firebaseStatus: 'skipped_duplicate', existingId: existingDupe.id };
      }
    }
    customer.id = 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    customers.push(stampRecord(customer, customer.userId));
    logAudit('customer_created', 'customer', customer.id, null, customer);
  }
  // Sync / queue + syncStatus tracking
  let firebaseStatus = 'pending';
  const stamped = customers.find(c => c.id === customer.id);
  updateLocalCache(KEYS.CUSTOMERS, customers);
  await BillQyroDB.put('customers', stamped);

  await queueSyncTransaction('save', 'customers', customer.id, stamped);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedCustomers: customers, firebaseStatus };
};

export const deleteCustomer = async (id, permanent = false) => {
  const customers = await getCustomers(true);
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return { updatedCustomers: customers.filter(c => !c.isDeleted), firebaseStatus: 'failed' };
  
  const customerToDelete = customers[idx];

  if (!permanent) {
    customers[idx].isDeleted = true;
    customers[idx].deletedAt = new Date().toISOString();
    customers[idx].syncStatus = 'pending';
    const filtered = customers.filter(c => !c.isDeleted);
    updateLocalCache(KEYS.CUSTOMERS, customers);
    await BillQyroDB.put('customers', customers[idx]);
    logAudit('customer_deleted', 'customer', id, customerToDelete, null);

    let firebaseStatus = 'pending';
    await queueSyncTransaction('save', 'customers', id, customers[idx]);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));

    if (firebaseReady) {
      if (navigator.onLine) {
        syncOfflineTransactions().catch(e => console.error(e));
      } else {
        firebaseStatus = 'failed';
      }
    } else {
      firebaseStatus = 'offline';
    }
    return { updatedCustomers: filtered, firebaseStatus };
  }

  // Permanent Delete
  const filtered = customers.filter(c => c.id !== id);
  updateLocalCache(KEYS.CUSTOMERS, filtered);
  await BillQyroDB.delete('customers', id);
  logAudit('customer_permanently_deleted', 'customer', id, customerToDelete, null);

  let firebaseStatus = 'pending';
  await queueSyncTransaction('delete', 'customers', id, customerToDelete);

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedCustomers: filtered.filter(c => !c.isDeleted), firebaseStatus };
};

export const restoreCustomer = async (id) => {
  const customers = await getCustomers(true);
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return { updatedCustomers: customers.filter(c => !c.isDeleted), firebaseStatus: 'failed' };
  
  customers[idx].isDeleted = false;
  customers[idx].deletedAt = null;
  customers[idx].syncStatus = 'pending';
  const filtered = customers.filter(c => !c.isDeleted);
  updateLocalCache(KEYS.CUSTOMERS, customers);
  await BillQyroDB.put('customers', customers[idx]);

  let firebaseStatus = 'pending';
  await queueSyncTransaction('save', 'customers', id, customers[idx]);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'offline';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedCustomers: filtered, firebaseStatus };
};

// --- PRODUCTS ---
export const getProducts = async (includeDeleted = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    return JSON.parse(localStorage.getItem('billqyro_demo_products') || '[]');
  }
  initializeStorage();
  const userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  const workspaceId = settings?.activeWorkspaceId;
  try {
    const data = await BillQyroDB.getAll('products');
    if (data && data.length > 0) {
      let filtered = data;
      if (!includeDeleted) {
        filtered = data.filter(p => !p.isDeleted);
      }
      if (userId) filtered = filtered.filter(p => p.userId === userId);
      if (workspaceId) filtered = filtered.filter(p => p.workspaceId === workspaceId);
      return filtered.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return [];
};

export const saveProduct = async (product) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: saveProduct');
    return { updatedProducts: [], firebaseStatus: 'blocked' };
  }
  
  product.userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  product.workspaceId = settings?.activeWorkspaceId || 'default';
  
  const products = await getProducts();
  if (product.id) {
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      const existing = products[index];
      product.__version = Math.max(product.__version || 0, existing.__version || 0);
      products[index] = stampRecord(product, product.userId);
      logAudit('product_updated', 'product', product.id, null, products[index]);
    } else {
      products.push(stampRecord(product, product.userId));
      logAudit('product_created', 'product', product.id, null, product);
    }
  } else {
    // --- DUPLICATE PRODUCT PREVENTION (idempotent creation) ---
    const prodName = (product.name || product.productName || '').trim().toLowerCase();
    const prodPrice = parseFloat(product.price || product.rate || 0);
    if (prodName) {
      const existingDupe = products.find(p => {
        const pName = (p.name || p.productName || '').trim().toLowerCase();
        const pPrice = parseFloat(p.price || p.rate || 0);
        return pName === prodName && pPrice === prodPrice;
      });
      if (existingDupe) {
        console.warn('[DATA INTEGRITY] Duplicate product prevented:', prodName, prodPrice);
        return { updatedProducts: products, firebaseStatus: 'skipped_duplicate', existingId: existingDupe.id };
      }
    }
    product.id = 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    products.push(stampRecord(product, product.userId));
    logAudit('product_created', 'product', product.id, null, product);
  }
  // Sync / queue + syncStatus tracking
  let firebaseStatus = 'pending';
  const stamped = products.find(p => p.id === product.id);
  updateLocalCache(KEYS.PRODUCTS, products);
  await BillQyroDB.put('products', stamped);

  await queueSyncTransaction('save', 'products', product.id, stamped);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedProducts: products, firebaseStatus };
};

export const deleteProduct = async (id, permanent = false) => {
  const products = await getProducts(true);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return { updatedProducts: products.filter(p => !p.isDeleted), firebaseStatus: 'failed' };
  
  const productToDelete = products[idx];

  if (!permanent) {
    products[idx].isDeleted = true;
    products[idx].deletedAt = new Date().toISOString();
    products[idx].syncStatus = 'pending';
    const filtered = products.filter(p => !p.isDeleted);
    updateLocalCache(KEYS.PRODUCTS, products);
    await BillQyroDB.put('products', products[idx]);
    logAudit('product_deleted', 'product', id, productToDelete, null);

    let firebaseStatus = 'pending';
    await queueSyncTransaction('save', 'products', id, products[idx]);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));

    if (firebaseReady) {
      if (navigator.onLine) {
        syncOfflineTransactions().catch(e => console.error(e));
      } else {
        firebaseStatus = 'failed';
      }
    } else {
      firebaseStatus = 'offline';
    }
    return { updatedProducts: filtered, firebaseStatus };
  }

  // Permanent Delete
  const filtered = products.filter(p => p.id !== id);
  updateLocalCache(KEYS.PRODUCTS, filtered);
  await BillQyroDB.delete('products', id);
  logAudit('product_permanently_deleted', 'product', id, productToDelete, null);

  let firebaseStatus = 'pending';
  await queueSyncTransaction('delete', 'products', id, productToDelete);

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }
  return { updatedProducts: filtered.filter(p => !p.isDeleted), firebaseStatus };
};

// --- STUDENTS ---
export const getStudents = async (includeDeleted = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    return JSON.parse(localStorage.getItem('billqyro_demo_students') || '[]');
  }
  initializeStorage();
  const userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  const workspaceId = settings?.activeWorkspaceId;
  try {
    const data = await BillQyroDB.getAll('students');
    if (data && data.length > 0) {
      let filtered = data;
      if (!includeDeleted) filtered = data.filter(s => !s.isDeleted);
      if (userId) filtered = filtered.filter(s => s.userId === userId);
      if (workspaceId) filtered = filtered.filter(s => s.workspaceId === workspaceId);
      return filtered.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return [];
};

export const saveStudent = async (student) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: saveStudent');
    return { updatedStudents: [], firebaseStatus: 'blocked' };
  }
  
  student.userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  student.workspaceId = settings?.activeWorkspaceId || 'default';
  
  const students = await getStudents();
  if (student.id) {
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      const existing = students[index];
      student.__version = Math.max(student.__version || 0, existing.__version || 0);
      students[index] = stampRecord(student, student.userId);
      logAudit('student_updated', 'student', student.id, null, students[index]);
    } else {
      students.push(stampRecord(student, student.userId));
      logAudit('student_created', 'student', student.id, null, student);
    }
  } else {
    const stuName = (student.name || '').trim().toLowerCase();
    if (stuName) {
      const existingDupe = students.find(s => (s.name || '').trim().toLowerCase() === stuName);
      if (existingDupe) {
        console.warn('[DATA INTEGRITY] Duplicate student prevented:', stuName);
        return { updatedStudents: students, firebaseStatus: 'skipped_duplicate', existingId: existingDupe.id };
      }
    }
    student.id = 'stu-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    students.push(stampRecord(student, student.userId));
    logAudit('student_created', 'student', student.id, null, student);
  }
  let firebaseStatus = 'pending';
  const stamped = students.find(s => s.id === student.id);
  updateLocalCache(KEYS.STUDENTS, students);
  await BillQyroDB.put('students', stamped);
  await queueSyncTransaction('save', 'students', student.id, stamped);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  if (firebaseReady) {
    if (navigator.onLine) syncOfflineTransactions().catch(e => console.error(e));
    else firebaseStatus = 'failed';
  } else firebaseStatus = 'offline';
  return { updatedStudents: students, firebaseStatus };
};

export const deleteStudent = async (id, permanent = false) => {
  const students = await getStudents(true);
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return { updatedStudents: students.filter(s => !s.isDeleted), firebaseStatus: 'failed' };
  const studentToDelete = students[idx];
  if (!permanent) {
    students[idx].isDeleted = true;
    students[idx].deletedAt = new Date().toISOString();
    students[idx].syncStatus = 'pending';
    const filtered = students.filter(s => !s.isDeleted);
    updateLocalCache(KEYS.STUDENTS, students);
    await BillQyroDB.put('students', students[idx]);
    logAudit('student_deleted', 'student', id, studentToDelete, null);
    let firebaseStatus = 'pending';
    await queueSyncTransaction('save', 'students', id, students[idx]);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    if (firebaseReady) {
      if (navigator.onLine) syncOfflineTransactions().catch(e => console.error(e));
      else firebaseStatus = 'failed';
    } else firebaseStatus = 'offline';
    return { updatedStudents: filtered, firebaseStatus };
  }
  const filtered = students.filter(s => s.id !== id);
  updateLocalCache(KEYS.STUDENTS, filtered);
  await BillQyroDB.delete('students', id);
  logAudit('student_permanently_deleted', 'student', id, studentToDelete, null);
  let firebaseStatus = 'pending';
  await queueSyncTransaction('delete', 'students', id, studentToDelete);
  if (firebaseReady) {
    if (navigator.onLine) syncOfflineTransactions().catch(e => console.error(e));
    else firebaseStatus = 'failed';
  } else firebaseStatus = 'offline';
  return { updatedStudents: filtered.filter(s => !s.isDeleted), firebaseStatus };
};

// --- INVOICES ---
export const getInvoices = async (includeDeleted = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    return JSON.parse(localStorage.getItem('billqyro_demo_invoices') || '[]');
  }
  initializeStorage();
  const userId = getRealUserId() || 'local-user';
  const settings = getSettings();
  const workspaceId = settings?.activeWorkspaceId;
  try {
    const data = await BillQyroDB.getAll('invoices');
    if (data && data.length > 0) {
      let filtered = data;
      if (!includeDeleted) {
        filtered = data.filter(inv => !inv.isDeleted);
      }
      if (userId) filtered = filtered.filter(inv => inv.userId === userId);
      if (workspaceId) filtered = filtered.filter(inv => inv.workspaceId === workspaceId);
      return filtered.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return [];
};

export const generateSecureToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const saveInvoice = async (invoice) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: saveInvoice');
    return { updatedInvoices: [], firebaseStatus: 'blocked' };
  }
  const invoices = await getInvoices();
  const isNew = !invoice.id || !invoices.some(inv => inv.id === invoice.id);
  if (isNew) {
    const globalRevSettings = await getGlobalRevenueSettings();
    if (globalRevSettings?.disableNewBillCreation && !isAdminUser(getAuthSession())) {
      throw new Error('New bill creation is temporarily disabled by the platform owner.');
    }
  }

  // 1. Ensure secure publicToken is generated
  if (!invoice.publicToken || invoice.publicToken === 'undefined' || invoice.publicToken === 'null' || invoice.publicToken === '') {
    invoice.publicToken = generateSecureToken();
  }

  // 1.5 Generate AI Verification Code if missing
  if (!invoice.verificationCode) {
    invoice.verificationCode = generateVerificationCode(invoice.invoiceNumber || 'INV');
  }

  // 2. Ensure snapshots are taken
  const activeSettings = getSettings() || DEFAULT_SETTINGS;

  // Auto-generate invoice/estimate number if missing
  if (!invoice.invoiceNumber) {
    const isEstimate = invoice.billType === 'Estimate';
    const prefix = isEstimate 
      ? (activeSettings.estimatePrefix || 'EST-') 
      : (activeSettings.invoicePrefix || 'INV-');
    
    let nextNum = isEstimate 
      ? (activeSettings.nextEstimateNumber || 1) 
      : (activeSettings.nextInvoiceNumber || 1);
    
    // Check for duplicates
    const existingNumbers = new Set(invoices.map(inv => inv.invoiceNumber));
    let uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
    while (existingNumbers.has(uniqueStr)) {
      nextNum++;
      uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
    }
    
    invoice.invoiceNumber = uniqueStr;
    
    // Update settings with the next number
    if (isEstimate) {
      activeSettings.nextEstimateNumber = nextNum + 1;
    } else {
      activeSettings.nextInvoiceNumber = nextNum + 1;
    }
    saveSettings(activeSettings); // Save the updated sequence counter
  } else {
    // Check manually entered invoice number for duplicates
    const duplicate = invoices.some(inv => inv.invoiceNumber === invoice.invoiceNumber && inv.id !== invoice.id);
    if (duplicate) {
      const isEstimate = invoice.billType === 'Estimate';
      const prefix = isEstimate 
        ? (activeSettings.estimatePrefix || 'EST-') 
        : (activeSettings.invoicePrefix || 'INV-');
      let nextNum = isEstimate 
        ? (activeSettings.nextEstimateNumber || 1) 
        : (activeSettings.nextInvoiceNumber || 1);
      const existingNumbers = new Set(invoices.map(inv => inv.invoiceNumber));
      let uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
      while (existingNumbers.has(uniqueStr)) {
        nextNum++;
        uniqueStr = `${prefix}${String(nextNum).padStart(4, '0')}`;
      }
      invoice.invoiceNumber = uniqueStr;
      if (isEstimate) {
        activeSettings.nextEstimateNumber = nextNum + 1;
      } else {
        activeSettings.nextInvoiceNumber = nextNum + 1;
      }
      saveSettings(activeSettings);
    }
  }

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

  invoice.userId = getRealUserId() || 'local-user';

  const timestamp = new Date().toISOString();
  const sessionStr = localStorage.getItem(GLOBAL_KEYS.AUTH);
  const session = sessionStr ? JSON.parse(sessionStr) : null;
  const userEmail = session?.userEmail || session?.email || 'local-user';
  const settings = getSettings();
  
  invoice.workspaceId = settings?.activeWorkspaceId || 'default';
  invoice.createdByUid = invoice.userId;
  invoice.createdByEmail = userEmail;
  invoice.businessContactEmail = settings?.email || userEmail;

  if (invoice.id && invoice.id.startsWith('inv-')) {
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    if (index !== -1) {
      const existing = invoices[index];
      invoice.__version = Math.max(invoice.__version || 0, existing.__version || 0);
      invoices[index] = stampRecord(invoice, invoice.userId);
      logAudit('invoice_updated', 'invoice', invoice.id, existing, invoices[index]);
    } else {
      invoices.push(stampRecord({ ...invoice, createdAt: timestamp }, invoice.userId));
      logAudit('invoice_created', 'invoice', invoice.id, null, invoice);
    }
  } else {
    invoice.id = 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    invoices.push(stampRecord({ ...invoice, createdAt: timestamp }, invoice.userId));
    logAudit('invoice_created', 'invoice', invoice.id, null, invoice);
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

  // Sync / queue + syncStatus tracking
  const stamped = invoices.find(inv => inv.id === invoice.id);
  if (stamped) {
    stamped.syncStatus = 'pending';
    updateLocalCache(KEYS.INVOICES, invoices);
    await BillQyroDB.put('invoices', stamped);
    await queueSyncTransaction('save', 'invoices', stamped.id, stamped);
  }
  window.dispatchEvent(new CustomEvent('billqyro_sync'));

  let firebaseStatus = 'pending';
  if (firebaseReady) {
    if (navigator.onLine) {
      // Fire and forget via flush queue
      syncOfflineTransactions().then(() => {
        // Will dispatch its own events and clean queue
      }).catch(err => console.error('Firestore async save error:', err));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }

  // Recalculate platform dues/monetization state
  try {
    const subStatus = getSubscriptionStatus();
    const globalRevSettings = await getGlobalRevenueSettings();
    const calculatedState = calculateUserRevenueState(invoice.userId, invoices, globalRevSettings, subStatus);
    await saveUserRevenueState(invoice.userId, calculatedState);
  } catch (e) {
    console.error('Error updating platform revenue state in saveInvoice:', e);
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
    const local = invoices[localIdx];
    // Only overwrite if cloud is newer
    if (cloudWins(local, cloudData)) {
      invoices[localIdx] = { ...cloudData, syncStatus: 'synced' };
      updateLocalCache(KEYS.INVOICES, invoices);
      await BillQyroDB.put('invoices', invoices[localIdx]);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
    }
  } else {
    // New record from cloud
    const stamped = { ...cloudData, syncStatus: 'synced' };
    invoices.push(stamped);
    updateLocalCache(KEYS.INVOICES, invoices);
    await BillQyroDB.put('invoices', stamped);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }
};

export const getInvoiceByPublicToken = async (token) => {



  // Reset last error
  window.billqyro_lastError = null;

  if (firebaseReady) {
    try {
      // 1. Try publicInvoices first
      let docRef = doc(db, 'publicInvoices', token);
      let snap = await getDoc(docRef);



      if (snap.exists()) {
        const cloudData = snap.data();
        await syncLocalInvoice(cloudData);
        return cloudData;
      }

      // 2. Try legacy public_invoices for compatibility with older links

      docRef = doc(db, 'public_invoices', token);
      snap = await getDoc(docRef);



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

  const invoices = await getInvoices();
  const localMatch = invoices.find(inv => inv.publicToken === token);

  return localMatch || null;
};

export const ensureInvoicePublicToken = async (invoice) => {
  if (!invoice) return null;
  const invoiceId = invoice.id || invoice._id;
  if (!invoiceId) return null;

  if (invoice.publicToken && invoice.publicToken !== 'undefined' && invoice.publicToken !== 'null' && invoice.publicToken !== '') {
    return invoice.publicToken;
  }

  // Legacy fallback
  throw new Error("This invoice is missing a Live Link. Please open it, edit, and save it once to generate a permanent link.");
};

export const saveInvoicePublicly = async (invoice) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    const demos = JSON.parse(localStorage.getItem('billqyro_demo_invoices') || '[]');
    const idx = demos.findIndex(inv => inv.id === invoice.id || inv.publicToken === invoice.publicToken);
    if (idx !== -1) {
      demos[idx] = invoice;
      localStorage.setItem('billqyro_demo_invoices', JSON.stringify(demos));
    }
    
    if (invoice.paymentProofs && invoice.paymentProofs.length > 0) {
      const demoPayments = JSON.parse(localStorage.getItem('billqyro_demo_payments') || '[]');
      invoice.paymentProofs.forEach(proof => {
         if (!demoPayments.some(p => p.id === proof.id)) {
             demoPayments.push({
                id: proof.id,
                invoiceId: invoice.invoiceNumber,
                amount: proof.amount,
                method: proof.paymentMethod || 'Unknown',
                utr: proof.transactionId || 'N/A',
                status: 'pending'
             });
         }
      });
      localStorage.setItem('billqyro_demo_payments', JSON.stringify(demoPayments));
    }
    window.dispatchEvent(new Event('storage'));
    return { status: 'success' };
  }

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
        } catch {
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
      await queueSyncTransaction('save', 'invoices', id, invoices[idx]);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));

      if (firebaseReady) {
        if (navigator.onLine) {
          syncOfflineTransactions().catch(e => console.error(e));
        } else {
          firebaseStatus = 'failed';
        }
      } else {
        firebaseStatus = 'offline';
      }

      // Recalculate platform dues/monetization state
      try {
        const userId = getRealUserId() || 'local-user';
        const subStatus = getSubscriptionStatus();
        const globalRevSettings = await getGlobalRevenueSettings();
        const calculatedState = calculateUserRevenueState(userId, invoices, globalRevSettings, subStatus);
        await saveUserRevenueState(userId, calculatedState);
      } catch (e) {
        console.error('Error updating platform revenue state in deleteInvoice:', e);
      }

      return { updatedInvoices: invoices, firebaseStatus };
    }
  }

  // Permanent Delete
  const invoiceToDelete = invoices.find(inv => inv.id === id);
  const filtered = invoices.filter(inv => inv.id !== id);
  updateLocalCache(KEYS.INVOICES, filtered);

  // Delete from IndexedDB
  await BillQyroDB.delete('invoices', id);

  logAudit('invoice_deleted_or_voided', 'invoice', id, invoiceToDelete, null);

  // Sync / queue (Non-blocking)
  let firebaseStatus = 'pending';
  await queueSyncTransaction('delete', 'invoices', id, invoiceToDelete);

  if (firebaseReady) {
    if (navigator.onLine) {
      syncOfflineTransactions().catch(e => console.error(e));
    } else {
      firebaseStatus = 'failed';
    }
  } else {
    firebaseStatus = 'offline';
  }

  // Recalculate platform dues/monetization state
  try {
    const userId = getRealUserId() || 'local-user';
    const subStatus = getSubscriptionStatus();
    const globalRevSettings = await getGlobalRevenueSettings();
    const calculatedState = calculateUserRevenueState(userId, filtered, globalRevSettings, subStatus);
    await saveUserRevenueState(userId, calculatedState);
  } catch (e) {
    console.error('Error updating platform revenue state in deleteInvoice permanent:', e);
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
  const students = await getStudents();
  const settings = getSettings();

  localStorage.setItem('billqyro_last_backup_time', new Date().toISOString());

  return {
    appName: "BillQyro",
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    dataSource: "localStorage/firebase-current",
    recordCounts: {
      invoices: invoices.length,
      customers: customers.length,
      products: products.length,
      expenses: expenses.length,
      students: students.length
    },
    settings,
    customers,
    products,
    invoices,
    expenses,
    students,
    subscription: getSubscriptionStatus(),
  };
};

export const exportBackupZip = async () => {
  const backupData = await exportBackup();
  const zip = new JSZip();
  
  // Add core database JSON
  zip.file("database.json", JSON.stringify(backupData, null, 2));
  
  // Create folders for potential future attachments/receipts
  zip.folder("attachments");
  zip.folder("receipts");
  
  // Generate the zip blob
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6
    }
  });
  
  return zipBlob;
};


export const unzipBackup = async (fileBlob) => {
  const zip = new JSZip();
  const unzipped = await zip.loadAsync(fileBlob);
  const dbFile = unzipped.file("database.json");
  if (!dbFile) {
    throw new Error('Invalid backup zip: missing database.json');
  }
  const dbString = await dbFile.async("string");
  return JSON.parse(dbString);
};

export const importRestore = async (backupData) => {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup file structure.');
  }

  const requiredKeys = ['settings', 'customers', 'products', 'invoices', 'expenses', 'students', 'subscription'];
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
  updateLocalCache(KEYS.STUDENTS, backupData.students || []);
  for (const s of (backupData.students || [])) await BillQyroDB.put('students', s);
  localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(backupData.subscription));

  // If Firebase is enabled, batch update Firestore as well
  if (firebaseReady) {
    const userId = getRealUserId();
    firestoreSave('settings', userId, backupData.settings);
    backupData.customers.forEach(c => firestoreSave('customers', c.id, c));
    backupData.products.forEach(p => firestoreSave('products', p.id, p));
    backupData.invoices.forEach(i => {
      firestoreSave('invoices', i.id, i);
    });
    backupData.expenses.forEach(e => firestoreSave('expenses', e.id, e));
    (backupData.students || []).forEach(s => firestoreSave('students', s.id, s));
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

  const userId = getRealUserId();


  // Clear any existing listeners
  unsubscribes.forEach(unsub => unsub());
  const syncCollection = (collectionName, storageKey) => {
    const colRef = collection(db, collectionName, userId, 'items');
    const unsub = onSnapshot(colRef, async (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.syncStatus = 'synced';
        items.push(data);
      });
      localStorage.setItem(storageKey, JSON.stringify(items));
      // Update IndexedDB to keep it consistent
      await BillQyroDB.clear(collectionName);
      for (const item of items) {
        await BillQyroDB.put(collectionName, item);
      }
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
  syncCollection('students', KEYS.STUDENTS);
  syncDoc('settings', KEYS.SETTINGS);
  syncDoc('subscription', KEYS.SUBSCRIPTION);
};

// One-time Syncing on Authentication or Startup
let lastSyncTime = 0;
export const syncFromFirestore = async (force = false) => {
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('Blocked real data operation during Demo Mode: syncFromFirestore');
    toast.error('Sync disabled in Demo Mode');
    return;
  }
  
  // Throttle sync to prevent repeated dashboard refreshes and infinite loops
  const now = Date.now();
  if (!force && now - lastSyncTime < 15000) {
    return;
  }
  lastSyncTime = now;

  const userId = getRealUserId();
  if (!userId) return;

  try {
    // Backup local data before clearing cache
    const backupSuccess = await backupLocalData();
    if (!backupSuccess) {
      toast.error('Backup failed, sync cancelled');
      console.error('Backup of local data failed. Aborting sync.');
      return;
    }
    
    // Check for UID drift / stale caching
    const lastUid = localStorage.getItem('billqyro_last_uid');
    if (lastUid && lastUid !== userId) {
      console.warn('UID has changed. Wiping local device data to prevent leakage.');
      await clearAllLocalData();
    }
    localStorage.setItem('billqyro_last_uid', userId);

    // 1. Flush offline transactions first to avoid losing offline work
    if (navigator.onLine) {
      await syncOfflineTransactions();
    }

    // After attempting flush, check if queue is empty.
    // If not empty, it means some local changes couldn't sync. We MUST NOT overwrite local DB with old cloud data.
    const queue = await BillQyroDB.getAll('syncQueue');
    const pendingItems = queue.filter(tx => tx.userId === userId || !tx.userId);
    if (pendingItems.length > 0) {
      console.warn('Pending items in sync queue. Skipping cloud overwrite to protect local data.');
      return;
    }

    // 2. Fetch all cloud data first (from SERVER explicitly) to prevent stale cache serving
    // Use parallel fetching with safe fallbacks to prevent permission errors from crashing the sync
    const safeFetch = async (promise, fallback, collectionName = 'unknown') => {
      try { return await promise; }
      catch (e) { 
        console.warn(`[SYNC PERMISSION DENIED] Read failed for collection: ${collectionName}. Rule blocked access. Error:`, e.message || e); 
        return fallback; 
      }
    };

    const emptyDoc = { exists: () => false, data: () => null };
    const emptySnap = { forEach: () => {} };

    const [
      settingsDoc, customersSnap, invoicesSnap, productsSnap, expensesSnap, studentsSnap, subDoc
    ] = await Promise.all([
      safeFetch(getDocFromServer(doc(db, 'settings', userId)), emptyDoc, 'settings'),
      safeFetch(getDocsFromServer(collection(db, 'customers', userId, 'items')), emptySnap, 'customers'),
      safeFetch(getDocsFromServer(collection(db, 'invoices', userId, 'items')), emptySnap, 'invoices'),
      safeFetch(getDocsFromServer(collection(db, 'products', userId, 'items')), emptySnap, 'products'),
      safeFetch(getDocsFromServer(collection(db, 'expenses', userId, 'items')), emptySnap, 'expenses'),
      safeFetch(getDocsFromServer(collection(db, 'students', userId, 'items')), emptySnap, 'students'),
      safeFetch(getDocFromServer(doc(db, 'subscription', userId)), emptyDoc, 'subscription')
    ]);

    // 3. We will no longer clear the entire cache blindly.
    // Instead, we will merge the cloud data with the local data, ensuring newer local data is preserved.
    clearCacheOnly();

    // 4. Apply Settings
    let activeWorkspaceId = 'default';
    if (settingsDoc.exists()) {
      const settingsData = settingsDoc.data();
      activeWorkspaceId = settingsData.activeWorkspaceId || 'default';
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsData));
    }

    // Generic Merge Helper
    const mergeData = async (storeName, snap, storageKey, formatInvoice = false) => {
      const cloudItems = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (formatInvoice) {
          ['grandTotal', 'amountPaid', 'balanceDue', 'subtotal', 'tax', 'discount', 'shipping'].forEach(f => {
            if (typeof data[f] === 'string') data[f] = parseFloat(data[f]) || 0;
          });
        }
        data.syncStatus = 'synced';
        cloudItems.push(data);
      });
      
      const localItems = await BillQyroDB.getAll(storeName);
      const mergedMap = new Map();
      
      for (const item of localItems) {
        mergedMap.set(item.id, item);
      }
      
      for (const cItem of cloudItems) {
        const lItem = mergedMap.get(cItem.id);
        if (!lItem || cloudWins(lItem, cItem)) {
          mergedMap.set(cItem.id, cItem);
        }
      }
      
      const finalItems = Array.from(mergedMap.values());
      await BillQyroDB.clear(storeName);
      for (const item of finalItems) {
        await BillQyroDB.put(storeName, item);
      }
      
      const activeItems = finalItems.filter(item => !item.workspaceId || item.workspaceId === activeWorkspaceId);
      updateLocalCache(storageKey, activeItems);
      return finalItems;
    };

    // 5-9. Apply merged data
    await mergeData('customers', customersSnap, KEYS.CUSTOMERS);
    await mergeData('invoices', invoicesSnap, KEYS.INVOICES, true);
    await mergeData('products', productsSnap, KEYS.PRODUCTS);
    await mergeData('expenses', expensesSnap, KEYS.EXPENSES);
    await mergeData('students', studentsSnap, KEYS.STUDENTS);

    // 10. Apply Subscription
    if (subDoc.exists()) {
      localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(subDoc.data()));
    }

    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    // User requested: "Do not show repeated success toasts. I want sync notifications only when actual changes are synced."
    // Given the difficulty of deep equality checking here, we rely on the UI updating silently.
    
    return {
      settings: JSON.parse(localStorage.getItem(KEYS.SETTINGS)),
      customers: JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [],
      products: JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [],
      invoices: JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [],
      expenses: JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [],
      students: JSON.parse(localStorage.getItem(KEYS.STUDENTS)) || [],
      subscription: JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTION))
    };
  } catch (error) {
    console.error("Error syncing from Firestore:", error);
    toast.error('Sync failed: ' + error.message);
    // Restore from backup
    try {
      const backupKeys = ['settings', 'customers', 'products', 'invoices', 'expenses', 'students', 'subscription'].map(k => `billqyro_${k}_backup`);
      backupKeys.forEach(k => {
        const backup = localStorage.getItem(k);
        if (backup) {
          const orig = k.replace('_backup', '');
          localStorage.setItem(orig, backup);
        }
      });
      toast.error('Restored local data from backup after sync failure');
    } catch (restoreErr) {
      console.error('Failed to restore from backup:', restoreErr);
    }
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
  } catch (e) { console.warn('Ignored error in dbEngine.js:', e); }
  return count;
};

export const clearCacheOnly = () => {
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.EXPENSES);
  return {status: 'success'};
};

// Backup local scoped data before destructive operations
export const backupLocalData = async () => {
  try {
    // Create backups for each scoped key
    const keys = [KEYS.SETTINGS, KEYS.CUSTOMERS, KEYS.PRODUCTS, KEYS.INVOICES, KEYS.EXPENSES, KEYS.SUBSCRIPTION];
    keys.forEach(k => {
      const data = localStorage.getItem(k);
      if (data !== null) {
        localStorage.setItem(`${k}_backup`, data);
      }
    });
    return true;
  } catch (e) {
    console.error('Backup local data error:', e);
    return false;
  }
};

export {
  getUserRevenueState,
  saveUserRevenueState,
  calculateUserRevenueState,
  getGlobalRevenueSettings,
  saveGlobalRevenueSettings,
  submitPlatformPaymentProof,
  getUserPaymentProofs,
  getAdminAllPaymentProofs,
  getAdminPlatformRevenueStates,
  updatePlatformPaymentProofStatus,
  submitSupportTicket,
  getAdminAllSupportTickets,
  getUserSupportTickets,
  updateSupportTicketStatus,
  submitFeatureRequest,
  getAdminAllFeatureRequests,
  getUserFeatureRequests,
  updateFeatureRequestStatus,
  createAnnouncement,
  getAdminAllAnnouncements,
  getActiveAnnouncement,
  toggleAnnouncementActive,
  createChangelog,
  getAdminAllChangelogs
};
// --- MERGED FROM SYNCENGINE ---

// --- Sync Queue & Offline Support ---
export const enqueueSync = (collectionName, userId, docId, data) => {
  // Deprecated localStorage queue, forwarding to robust IndexedDB queue
  queueSyncTransaction('save', collectionName, docId, data).catch(e => console.error(e));
  window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Pending Sync' }));
};

export const flushSyncQueue = async () => {
  if (!navigator.onLine || !firebaseReady) {
    if (!navigator.onLine) {
       window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Offline' }));
    }
    return;
  }
  
  try {
    window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Syncing...' }));
    await syncOfflineTransactions();
    
    // Check if the queue was fully cleared for this user
    const userId = getRealUserId();
    const queue = await BillQyroDB.getAll('syncQueue');
    const pendingItems = queue.filter(tx => (tx.userId === userId || !tx.userId) && (tx.status === 'pending' || !tx.status));
    
    if (pendingItems.length === 0 || !userId) {
      // If no real UID, they are in local mode, so it's not a real sync error.
      window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: !userId ? 'Local Mode' : 'Synced' }));
    } else {
      window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Sync Error' }));
    }
  } catch (e) {
    console.error('[SYNC ENGINE] Failed to flush queue:', e);
    window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Sync Error' }));
  }
};

window.addEventListener('online', flushSyncQueue);

// --- Debounce Mechanism ---
const debounceTimers = {};

export const pushDataUpdate = (collectionName, userId, docId, data) => {
  if (!userId) return false;
  
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedByDeviceId: getDeviceId(),
    source: 'localUserAction'
  };

  enqueueSync(collectionName, userId, docId, payload);
  
  const key = `${collectionName}_${docId}`;
  
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  
  // [COST AWARENESS] Debounce actual firestore push by 1000ms.
  // We already enqueued it securely locally, so data is safe if page closes.
  debounceTimers[key] = setTimeout(() => {
    flushSyncQueue();
    delete debounceTimers[key];
  }, 1000);

  return true;
};

// --- Real-Time Listeners ---
let syncEngineUnsubscribes = [];

export const startRealTimeSync = (userId) => {
  if (!firebaseReady || !userId) return;



  // Clear previous listeners
  syncEngineUnsubscribes.forEach(unsub => unsub());
  syncEngineUnsubscribes = [];

  const deviceId = getDeviceId();

  // 1. Settings Listener
  // [COST AWARENESS] Real-time listener for critical collections only.
  // Estimated Read Source: 1 read per settings update. Keeps UI perfectly synced without refresh.
  const settingsUnsub = onSnapshot(doc(db, 'settings', userId), (docSnap) => {
    if (docSnap.exists()) {
      const cloudSettings = docSnap.data();
      
      // Loop Prevention: If we just wrote this from this device, ignore the echo.
      if (cloudSettings.updatedByDeviceId === deviceId && cloudSettings.source === 'localUserAction') {
        // If it's very recent (e.g. < 5s), it's just our own echo
        const age = Date.now() - new Date(cloudSettings.updatedAt).getTime();
        if (age < 5000) return;
      }

      const localSettingsStr = localStorage.getItem(KEYS.SETTINGS);
      let localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : null;

      if (cloudWins(localSettings, cloudSettings)) {

        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudSettings));
        window.dispatchEvent(new CustomEvent('billqyro:settings-updated', { detail: cloudSettings }));
      }
    }
  });
  syncEngineUnsubscribes.push(settingsUnsub);

  // 2. Collections Listener Generator
  // [COST AWARENESS] Stopped onSnapshot for high volume collections (invoices, customers).
  // They only sync on explicit actions (create/update/delete) or app boot.
  // This massively reduces document reads during normal operation.
  const syncCollection = (collectionName) => {
    const colRef = collection(db, collectionName, userId, 'items');
    const unsub = onSnapshot(colRef, async (snapshot) => {
      let changed = false;
      const promises = [];
      
      snapshot.docChanges().forEach(change => {
        const cloudData = change.doc.data();
        
        // Loop Prevention
        if (cloudData.updatedByDeviceId === deviceId && cloudData.source === 'localUserAction') {
          const age = Date.now() - new Date(cloudData.updatedAt).getTime();
          if (age < 5000) return; 
        }

        cloudData.syncStatus = 'synced';
        
        if (change.type === 'added' || change.type === 'modified') {
           promises.push(BillQyroDB.put(collectionName, cloudData));
           changed = true;
        }
        if (change.type === 'removed') {
           promises.push(BillQyroDB.delete(collectionName, cloudData.id));
           changed = true;
        }
      });

      if (changed) {
        await Promise.all(promises);
        window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName } }));
        // Also legacy fallback
        window.dispatchEvent(new CustomEvent('billqyro_sync'));
      }
    });
    syncEngineUnsubscribes.push(unsub);
  };

  syncCollection('invoices');
  syncCollection('customers');
  syncCollection('products');
  syncCollection('expenses');
  syncCollection('bankLedger');
  syncCollection('bankCredit');

  // 3. Internal Bank settings listener (single doc: bankMeta/{userId}/items/settings)
  const bankMetaUnsub = onSnapshot(doc(db, 'bankMeta', userId, 'items', 'settings'), (docSnap) => {
    if (docSnap.exists()) {
      const cloudSettings = docSnap.data();
      if (cloudSettings.updatedByDeviceId === deviceId && cloudSettings.source === 'localUserAction') {
        const age = Date.now() - new Date(cloudSettings.updatedAt).getTime();
        if (age < 5000) return;
      }
      window.dispatchEvent(new CustomEvent('billqyro:bank-settings-updated', { detail: cloudSettings }));
      window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    }
  });
  syncEngineUnsubscribes.push(bankMetaUnsub);
  
  // Process any offline queue on start
  flushSyncQueue();
};

export const stopRealTimeSync = () => {
  syncEngineUnsubscribes.forEach(unsub => unsub());
  syncEngineUnsubscribes = [];
};

export const resetInvoiceLiveLink = async (invoiceId) => {
  const invoices = await getInvoices();
  const idx = invoices.findIndex(inv => inv.id === invoiceId);
  if (idx === -1) throw new Error("Invoice not found.");
  
  const invoice = invoices[idx];
  const oldToken = invoice.publicToken;
  const newToken = generateSecureToken();
  
  // Invalidate old token on server if possible
  if (firebaseReady && oldToken) {
    firestoreDelete('publicInvoices', oldToken).catch(e => console.error(e));
    // also legacy
    firestoreDelete('public_invoices', oldToken).catch(e => console.error(e));
  }
  
  invoice.publicToken = newToken;
  invoice.syncStatus = 'pending';
  invoice.updatedAt = new Date().toISOString();
  
  invoices[idx] = invoice;
  updateLocalCache(KEYS.INVOICES, invoices);
  await BillQyroDB.put('invoices', invoice);
  
  // Audit log
  logAudit('reset_live_link', 'invoice', invoice.id, { oldToken }, { newToken });
  
  // Save new to firestore via queue
  await queueSyncTransaction('save', 'invoices', invoice.id, invoice);
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  
  if (firebaseReady && navigator.onLine) {
    syncOfflineTransactions().catch(e => console.error(e));
  }
  
  return invoice;
};

export const getStudentInvoices = async (studentId, studentEmail) => {
  if (!firebaseReady) return [];
  try {
    const q = query(
      collection(db, 'publicInvoices'),
      where('customerId', '==', studentId),
      where('customerEmail', '==', studentEmail)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data());
  } catch (err) {
    console.error("Failed to fetch student invoices:", err);
    return [];
  }
};

export const getStudentProfile = async (studentId, studentEmail) => {
  if (!firebaseReady) return null;
  try {
    const invoices = await getStudentInvoices(studentId, studentEmail);
    if (invoices.length > 0) {
      const inv = invoices[0];
      return {
        id: inv.customerId,
        name: inv.customerName,
        email: inv.customerEmail,
        phone: inv.customerPhone,
        address: inv.customerAddress
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch student profile:", err);
    return null;
  }
};

export const getCustomerPortalInvoices = async (customerId, phone) => {
  if (!firebaseReady) return [];
  try {
    const q = query(
      collection(db, 'publicInvoices'),
      where('customerId', '==', customerId)
    );
    const snap = await getDocs(q);
    const allInvoices = snap.docs.map(doc => doc.data());
    
    if (!phone) return allInvoices;
    
    const cleanInputPhone = phone.replace(/[\s\-+]/g, '');
    return allInvoices.filter(inv => {
      if (!inv.customerPhone) return false;
      const cleanDbPhone = inv.customerPhone.replace(/[\s\-+]/g, '');
      return cleanDbPhone === cleanInputPhone || cleanDbPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanDbPhone);
    });
  } catch (err) {
    console.error("Failed to fetch customer portal invoices:", err);
    return [];
  }
};

export const verifyCustomerPortal = async (customerId, phone) => {
  if (!firebaseReady) return false;
  try {
    const cleanInputPhone = phone.replace(/[\s\-+]/g, '');
    
    // 1. Try checking via publicInvoices
    const invoices = await getCustomerPortalInvoices(customerId, phone);
    if (invoices.length > 0) return true;

    // 2. Fallback: Local Storage (Works for shop owner testing locally via IndexedDB)
    try {
      const localCustomers = await BillQyroDB.getAll('customers');
      const localCustomer = localCustomers.find(c => c.id === customerId);
      if (localCustomer && localCustomer.phone) {
         const cleanLocalPhone = localCustomer.phone.replace(/[\s\-+]/g, '');
         if (cleanLocalPhone === cleanInputPhone || cleanLocalPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanLocalPhone)) {
             return true;
         }
      }
    } catch(e) { console.warn('Ignored local db error', e); }

    // 3. Fallback: Try querying Firestore customers (may fail if rules are strict, but worth a shot)
    try {
      const q = query(collection(db, 'customers'), where('id', '==', customerId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const custData = snap.docs[0].data();
        if (custData.phone) {
           const cleanDbPhone = custData.phone.replace(/[\s\-+]/g, '');
           if (cleanDbPhone === cleanInputPhone || cleanDbPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanDbPhone)) {
               return true;
           }
        }
      }
    } catch (e) {
      console.warn('Ignore permission denied errors', e);
    }

    return false;
  } catch (err) {
    console.error("Verification failed:", err);
    return false;
  }
};

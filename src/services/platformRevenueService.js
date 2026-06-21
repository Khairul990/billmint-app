import { db, firebaseReady } from './firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const DEFAULT_GLOBAL_SETTINGS = {
  premiumModeEnabled: true,
  payPerBillEnabled: true,
  freeBillLimit: 10,
  chargePerBill: 5,
  percentageChargeSetting: 0,
  monthlyGraceLimit: 5,
  maxPendingDue: 100,
  maxUnpaidBillCount: 20,
  lockBehavior: 'bill_creation'
};

const DEFAULT_USER_STATE = {
  totalBillsCreated: 0,
  freeBillsUsed: 0,
  billableBillsCount: 0,
  platformDueAmount: 0,
  platformPaidAmount: 0,
  platformPendingAmount: 0,
  lastPlatformPaymentDate: null,
  lockStatus: 'none',
  graceStatus: 'none',
  premiumStatus: 'free'
};

// --- GLOBAL SETTINGS ---
export const getGlobalRevenueSettings = async () => {
  if (firebaseReady) {
    try {
      const docPromise = getDoc(doc(db, 'adminRevenueSettings', 'global'));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
      const docSnap = await Promise.race([docPromise, timeoutPromise]);
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem('billqyro_global_revenue_settings', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Error reading global revenue settings from Firestore, using local cache', e);
    }
  }

  try {
    const cached = localStorage.getItem('billqyro_global_revenue_settings');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  return DEFAULT_GLOBAL_SETTINGS;
};

export const saveGlobalRevenueSettings = async (settings) => {
  const payload = { ...DEFAULT_GLOBAL_SETTINGS, ...settings };
  localStorage.setItem('billqyro_global_revenue_settings', JSON.stringify(payload));

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'adminRevenueSettings', 'global'), payload, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving global revenue settings to Firestore', e);
      return false;
    }
  }
  return true;
};

// --- USER REVENUE STATE CALCULATION ---
export const calculateUserRevenueState = (userId, invoices, globalSettings, subscriptionStatus, paidAmountOverride = null) => {
  if (!userId) return DEFAULT_USER_STATE;

  const isPremium = subscriptionStatus?.status === 'premium';
  
  // Filter out deleted invoices
  const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.billType !== 'Estimate');
  const totalBillsCreated = activeInvoices.length;

  const freeBillLimit = globalSettings.freeBillLimit ?? 10;
  const freeBillsUsed = Math.min(totalBillsCreated, freeBillLimit);
  const billableBillsCount = Math.max(0, totalBillsCreated - freeBillLimit);

  let platformDueAmount = 0;
  if (!isPremium && globalSettings.payPerBillEnabled) {
    if (globalSettings.percentageChargeSetting > 0) {
      // Sort invoices by date or creation to apply charge setting
      const sorted = [...activeInvoices].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      const billable = sorted.slice(freeBillLimit);
      billable.forEach(inv => {
        const total = parseFloat(inv.grandTotal) || 0;
        platformDueAmount += (total * globalSettings.percentageChargeSetting) / 100;
      });
    } else {
      const charge = globalSettings.chargePerBill ?? 5;
      platformDueAmount = billableBillsCount * charge;
    }
  }

  // Retrieve cached / existing user state for paid amount
  let platformPaidAmount = 0;
  let lastPlatformPaymentDate = null;
  
  try {
    const existingStr = localStorage.getItem(`billqyro_user_revenue_state_${userId}`);
    if (existingStr) {
      const existing = JSON.parse(existingStr);
      platformPaidAmount = parseFloat(existing.platformPaidAmount) || 0;
      lastPlatformPaymentDate = existing.lastPlatformPaymentDate || null;
    }
  } catch (e) {}

  if (paidAmountOverride !== null) {
    platformPaidAmount = paidAmountOverride;
  }

  const platformPendingAmount = Math.max(0, platformDueAmount - platformPaidAmount);

  // Warning & Lock thresholds
  let lockStatus = 'none';
  let graceStatus = 'none';

  if (!isPremium && platformPendingAmount > 0) {
    const maxPendingDue = globalSettings.maxPendingDue ?? 100;
    const maxUnpaidBillCount = globalSettings.maxUnpaidBillCount ?? 20;
    const monthlyGraceLimit = globalSettings.monthlyGraceLimit ?? 5;
    
    const gracePendingThreshold = Math.max(0, maxPendingDue - monthlyGraceLimit);
    const graceBillThreshold = Math.max(0, maxUnpaidBillCount - monthlyGraceLimit);

    lockStatus = 'warn';

    if (platformPendingAmount >= gracePendingThreshold || billableBillsCount >= graceBillThreshold) {
      lockStatus = 'grace';
      graceStatus = 'active';
    }

    if (platformPendingAmount >= maxPendingDue || billableBillsCount >= maxUnpaidBillCount) {
      lockStatus = 'locked';
      graceStatus = 'expired';
    }

    // Lock behavior check
    if (globalSettings.lockBehavior !== 'bill_creation') {
      // If locking not enabled, cap it at grace or warn
      if (lockStatus === 'locked') {
        lockStatus = 'grace';
      }
    }
  }

  return {
    userId,
    totalBillsCreated,
    freeBillsUsed,
    billableBillsCount,
    platformDueAmount,
    platformPaidAmount,
    platformPendingAmount,
    lastPlatformPaymentDate,
    lockStatus,
    graceStatus,
    premiumStatus: isPremium ? 'premium' : 'free',
    updatedAt: new Date().toISOString()
  };
};

export const getUserRevenueState = async (userId, invoices, subscriptionStatus) => {
  if (!userId) return DEFAULT_USER_STATE;

  const globalSettings = await getGlobalRevenueSettings();
  let paidAmount = 0;
  let lastDate = null;

  if (firebaseReady) {
    try {
      const docSnap = await getDoc(doc(db, 'platformRevenue', userId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        paidAmount = parseFloat(data.platformPaidAmount) || 0;
        lastDate = data.lastPlatformPaymentDate || null;
      }
    } catch (e) {
      console.warn('Error fetching user platform revenue, using local cache', e);
    }
  }

  // Calculate stats on the fly but preserving the paid amount from DB / Cache
  const calculated = calculateUserRevenueState(userId, invoices, globalSettings, subscriptionStatus, paidAmount);
  if (lastDate) {
    calculated.lastPlatformPaymentDate = lastDate;
  }

  localStorage.setItem(`billqyro_user_revenue_state_${userId}`, JSON.stringify(calculated));
  return calculated;
};

export const saveUserRevenueState = async (userId, state) => {
  localStorage.setItem(`billqyro_user_revenue_state_${userId}`, JSON.stringify(state));
  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'platformRevenue', userId), state, { merge: true });
      
      // Also merge plan status indicators into usersList/settings for consistency
      await setDoc(doc(db, 'usersList', userId), { 
        lockStatus: state.lockStatus,
        platformPendingAmount: state.platformPendingAmount
      }, { merge: true });
      
      return true;
    } catch (e) {
      console.error('Error saving user revenue state to Firestore', e);
      return false;
    }
  }
  return true;
};

// --- PAYMENT PROOFS FLOW ---
export const submitPlatformPaymentProof = async (userId, userEmail, amount, paymentMethod, transactionId, screenshotBase64 = '', note = '') => {
  const proofId = 'proof-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const payload = {
    id: proofId,
    userId,
    userEmail,
    amount: parseFloat(amount) || 0,
    paymentMethod,
    transactionId,
    screenshotBase64,
    note,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminNote: ''
  };

  // Local Storage Queue
  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_payment_proofs') || '[]');
    cached.push(payload);
    localStorage.setItem('billqyro_platform_payment_proofs', JSON.stringify(cached));
  } catch (e) {}

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'platformPaymentProofs', proofId), payload);
      return payload;
    } catch (e) {
      console.error('Failed to upload platform payment proof to Firestore', e);
      throw e;
    }
  }

  return payload;
};

export const getUserPaymentProofs = async (userId) => {
  if (firebaseReady) {
    try {
      const q = query(
        collection(db, 'platformPaymentProofs'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Failed to get payment proofs from Firestore', e);
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_payment_proofs') || '[]');
    return cached.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return [];
  }
};

export const getAdminAllPaymentProofs = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'platformPaymentProofs'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Failed to fetch admin proofs', e);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('billqyro_platform_payment_proofs') || '[]');
  } catch (e) {
    return [];
  }
};

export const getAdminPlatformRevenueStates = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'platformRevenue'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list;
    } catch (e) {
      console.error('Failed to fetch admin users revenue status', e);
    }
  }
  return [];
};

export const updatePlatformPaymentProofStatus = async (proofId, status, adminNote = '', invoices = []) => {
  let matchedProof = null;

  // Local storage update
  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_payment_proofs') || '[]');
    const idx = cached.findIndex(p => p.id === proofId);
    if (idx !== -1) {
      cached[idx].status = status;
      cached[idx].adminNote = adminNote;
      cached[idx].updatedAt = new Date().toISOString();
      matchedProof = cached[idx];
      localStorage.setItem('billqyro_platform_payment_proofs', JSON.stringify(cached));
    }
  } catch (e) {}

  if (firebaseReady) {
    try {
      const proofRef = doc(db, 'platformPaymentProofs', proofId);
      const proofSnap = await getDoc(proofRef);
      if (proofSnap.exists()) {
        matchedProof = proofSnap.data();
      }
      
      await setDoc(proofRef, {
        status,
        adminNote,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Failed to update proof status in Firestore', e);
      return false;
    }
  }

  if (!matchedProof) return false;

  // If approved, add paid amount to user's platformPaidAmount
  if (status === 'Approved') {
    const { userId, amount } = matchedProof;
    const globalSettings = await getGlobalRevenueSettings();
    let currentPaid = 0;
    
    try {
      const stateStr = localStorage.getItem(`billqyro_user_revenue_state_${userId}`);
      if (stateStr) {
        currentPaid = parseFloat(JSON.parse(stateStr).platformPaidAmount) || 0;
      }
    } catch (e) {}

    if (firebaseReady) {
      try {
        const userRef = doc(db, 'platformRevenue', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          currentPaid = parseFloat(userSnap.data().platformPaidAmount) || 0;
        }
      } catch (e) {}
    }

    const newPaidAmount = currentPaid + amount;
    
    let userInvoices = invoices;
    if ((!userInvoices || userInvoices.length === 0) && firebaseReady) {
      try {
        const snap = await getDocs(collection(db, 'invoices', userId, 'items'));
        userInvoices = [];
        snap.forEach(d => userInvoices.push(d.data()));
      } catch (e) {
        console.error('Failed to fetch user invoices for dues recalculation:', e);
      }
    }

    const recalculated = calculateUserRevenueState(userId, userInvoices, globalSettings, { status: 'free' }, newPaidAmount);
    recalculated.lastPlatformPaymentDate = new Date().toISOString();
    
    await saveUserRevenueState(userId, recalculated);
  }

  return true;
};

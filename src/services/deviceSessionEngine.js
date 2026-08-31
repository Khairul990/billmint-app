import { auth, db, app, firebaseReady } from './firebaseConfig.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const DEVICE_ID_KEY = 'billqyro_device_id_v1';
const SESSION_ID_KEY = 'billqyro_session_id_v1';
const SESSION_SECRET_KEY = 'billqyro_session_secret_v1';
const HEARTBEAT_MS = 5 * 60 * 1000;
const STALE_MS = 15 * 60 * 1000;

const randomId = (prefix) => {
  const bytes = new Uint8Array(18);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
};

const getDeviceId = () => {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = randomId('dev');
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return randomId('dev');
  }
};

const getOrCreateSessionId = () => {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = randomId('ses');
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return randomId('ses');
  }
};

const getOrCreateSessionSecret = () => {
  try {
    const existing = sessionStorage.getItem(SESSION_SECRET_KEY);
    if (existing) return existing;
    const secret = randomId('sec');
    sessionStorage.setItem(SESSION_SECRET_KEY, secret);
    return secret;
  } catch {
    return randomId('sec');
  }
};

const hashSecret = async (secret) => {
  if (!globalThis.crypto?.subtle) return secret;
  const bytes = new TextEncoder().encode(secret);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
};

const describeDevice = () => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const platform = typeof navigator === 'undefined' ? '' : (navigator.userAgentData?.platform || navigator.platform || 'Unknown');
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  return {
    deviceType: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop',
    browser,
    operatingSystem: platform || 'Unknown'
  };
};

const getFunctionsClient = () => (firebaseReady && app ? getFunctions(app) : null);

const callSecurityFunction = async (name, data) => {
  const functions = getFunctionsClient();
  if (!functions) throw new Error('Security verification unavailable offline.');
  return httpsCallable(functions, name)(data);
};

export const deviceSessionEngine = {
  HEARTBEAT_MS,
  STALE_MS,
  getDeviceId,
  getSessionId: getOrCreateSessionId,
  getSessionSecret: getOrCreateSessionSecret,

  async registerCurrentSession({ requireApproval = false } = {}) {
    if (!firebaseReady || !auth?.currentUser) return null;
    const uid = auth.currentUser.uid;
    const sessionId = getOrCreateSessionId();
    const deviceId = getDeviceId();
    const secret = getOrCreateSessionSecret();
    const secretHash = await hashSecret(secret);
    const meta = describeDevice();
    const ref = doc(db, 'users', uid, 'sessions', sessionId);
    const existing = await getDoc(ref);
    const data = {
      sessionId,
      userId: uid,
      deviceId,
      ...meta,
      status: existing.exists() ? (existing.data().status || 'active') : (requireApproval ? 'pending' : 'active'),
      approvalRequired: existing.exists() ? Boolean(existing.data().approvalRequired) : Boolean(requireApproval),
      createdAt: existing.exists() ? (existing.data().createdAt || serverTimestamp()) : serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      sessionSecretHash: secretHash
    };
    await setDoc(ref, data, { merge: true });
    return { ...data, sessionId, deviceId, isCurrentDevice: true };
  },

  async touchCurrentSession() {
    if (!firebaseReady || !auth?.currentUser) return false;
    const uid = auth.currentUser.uid;
    const sessionId = getOrCreateSessionId();
    const ref = doc(db, 'users', uid, 'sessions', sessionId);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists() || ['revoked', 'blocked'].includes(snap.data().status)) return false;
      await updateDoc(ref, { lastActiveAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  },

  async validateCurrentSession() {
    if (!firebaseReady || !auth?.currentUser) return { valid: false, reason: 'unauthenticated' };
    const uid = auth.currentUser.uid;
    const sessionId = getOrCreateSessionId();
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'sessions', sessionId));
      if (!snap.exists()) return { valid: true, legacy: true };
      const data = snap.data();
      if (data.status === 'revoked' || data.status === 'blocked') return { valid: false, reason: data.status };
      if (data.status === 'pending' && data.approvalRequired) return { valid: false, reason: 'approval_required' };
      return { valid: true, data };
    } catch (error) {
      return { valid: false, reason: 'verification_unavailable', error };
    }
  },

  async listSessions() {
    if (!firebaseReady || !auth?.currentUser) return [];
    const uid = auth.currentUser.uid;
    const snap = await getDocs(query(collection(db, 'users', uid, 'sessions'), orderBy('lastSeenAt', 'desc'), limit(50)));
    const now = Date.now();
    return snap.docs.map((item) => {
      const data = item.data();
      const lastSeen = data.lastSeenAt?.toMillis?.() || 0;
      return {
        id: item.id,
        ...data,
        isCurrentDevice: item.id === getOrCreateSessionId(),
        presence: lastSeen && now - lastSeen <= STALE_MS ? 'active' : 'stale'
      };
    });
  },

  async revokeSession(sessionId) {
    if (!firebaseReady || !auth?.currentUser || !sessionId || sessionId === getOrCreateSessionId()) return false;
    await callSecurityFunction('revokeDeviceSession', {
      targetSessionId: sessionId,
      callerSessionId: getOrCreateSessionId(),
      callerSessionSecret: getOrCreateSessionSecret()
    });
    return true;
  },

  async approveSession(sessionId) {
    if (!firebaseReady || !auth?.currentUser || !sessionId || sessionId === getOrCreateSessionId()) return false;
    await callSecurityFunction('approveDeviceSession', {
      targetSessionId: sessionId,
      callerSessionId: getOrCreateSessionId(),
      callerSessionSecret: getOrCreateSessionSecret()
    });
    return true;
  },

  async logoutOtherSessions() {
    if (!firebaseReady || !auth?.currentUser) return 0;
    const result = await callSecurityFunction('logoutOtherDeviceSessions', {
      callerSessionId: getOrCreateSessionId(),
      callerSessionSecret: getOrCreateSessionSecret()
    });
    return Number(result?.data?.count || 0);
  },

  async setNewDeviceApproval(enabled) {
    if (!firebaseReady || !auth?.currentUser) return false;
    await setDoc(doc(db, 'settings', auth.currentUser.uid), { requireNewDeviceApproval: Boolean(enabled) }, { merge: true });
    return true;
  },

  async getNewDeviceApproval() {
    if (!firebaseReady || !auth?.currentUser) return false;
    const snap = await getDoc(doc(db, 'settings', auth.currentUser.uid));
    return Boolean(snap.exists() && snap.data().requireNewDeviceApproval);
  },

  clearLocalSession() {
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
      sessionStorage.removeItem(SESSION_SECRET_KEY);
    } catch { /* no-op */ }
  }
};

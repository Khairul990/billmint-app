import { auth, db, app, firebaseReady } from './firebaseConfig.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { logAudit } from './dbEngine.js';

const DEVICE_ID_KEY = 'billqyro_device_id_v1';
const SESSION_ID_KEY = 'billqyro_session_id_v1';
const SESSION_SECRET_KEY = 'billqyro_session_secret_v1';
const HEARTBEAT_MS = 3 * 60 * 1000; // 3 minutes
const STALE_MS = 15 * 60 * 1000; // 15 minutes

// In-memory sessions store for non-browser/unit testing environments
const _memorySessions = new Map();
const _memorySettings = new Map();
let _inMemoryDeviceId = null;
let _inMemorySessionId = null;
let _inMemorySessionSecret = null;

const randomId = (prefix) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  }
  const bytes = new Uint8Array(18);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
};

const getDeviceId = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      const id = randomId('dev');
      localStorage.setItem(DEVICE_ID_KEY, id);
      return id;
    }
  } catch {}
  if (!_inMemoryDeviceId) _inMemoryDeviceId = randomId('dev');
  return _inMemoryDeviceId;
};

const getOrCreateSessionId = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const existing = sessionStorage.getItem(SESSION_ID_KEY);
      if (existing) return existing;
      const id = randomId('ses');
      sessionStorage.setItem(SESSION_ID_KEY, id);
      return id;
    }
  } catch {}
  if (!_inMemorySessionId) _inMemorySessionId = randomId('ses');
  return _inMemorySessionId;
};

const getOrCreateSessionSecret = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const existing = sessionStorage.getItem(SESSION_SECRET_KEY);
      if (existing) return existing;
      const secret = randomId('sec');
      sessionStorage.setItem(SESSION_SECRET_KEY, secret);
      return secret;
    }
  } catch {}
  if (!_inMemorySessionSecret) _inMemorySessionSecret = randomId('sec');
  return _inMemorySessionSecret;
};

const hashSecret = async (secret) => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const bytes = new TextEncoder().encode(secret);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {}
  }
  return secret;
};

const describeDevice = () => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const platform = typeof navigator === 'undefined' ? '' : (navigator.userAgentData?.platform || navigator.platform || 'Unknown');
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';

  let os = platform || 'Unknown';
  if (/Win/i.test(ua) || /Windows/i.test(platform)) os = 'Windows';
  else if (/Mac/i.test(ua) || /Macintosh/i.test(platform)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  return {
    deviceType: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop',
    browser,
    operatingSystem: os
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
  describeDevice,

  /**
   * Registers current session on login or app open
   */
  async registerCurrentSession({ requireApproval = false, user = null, deviceId = null, sessionId = null } = {}) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const effectiveSessionId = sessionId || getOrCreateSessionId();
    const effectiveDeviceId = deviceId || getDeviceId();
    const secret = getOrCreateSessionSecret();
    const secretHash = await hashSecret(secret);
    const meta = describeDevice();

    let knownDevice = false;
    const userSessionKey = `sessions_${uid}`;

    // 1. Check in-memory store
    if (!_memorySessions.has(userSessionKey)) {
      _memorySessions.set(userSessionKey, new Map());
    }
    const memUserSessions = _memorySessions.get(userSessionKey);
    for (const [, s] of memUserSessions) {
      if (s.deviceId === effectiveDeviceId && !['REVOKED', 'revoked', 'blocked'].includes(s.status)) {
        knownDevice = true;
        break;
      }
    }

    // 2. Check Firestore if ready
    if (firebaseReady && db && activeUser) {
      try {
        const known = await getDocs(query(collection(db, 'users', uid, 'sessions'), where('deviceId', '==', effectiveDeviceId), limit(5)));
        if (known.docs.some((item) => !['REVOKED', 'revoked', 'blocked'].includes(item.data().status))) {
          knownDevice = true;
        }
      } catch {
        /* fail open for backward compatibility */
      }
    }

    const approvalRequired = Boolean(requireApproval && !knownDevice);
    const nowIso = new Date().toISOString();

    const sessionData = {
      sessionId: effectiveSessionId,
      userId: uid,
      deviceId: effectiveDeviceId,
      ...meta,
      status: approvalRequired ? 'PENDING_APPROVAL' : 'ACTIVE',
      approvalRequired,
      isCurrentDevice: effectiveSessionId === getOrCreateSessionId(),
      createdAt: nowIso,
      lastSeenAt: nowIso,
      lastActiveAt: nowIso,
      sessionSecretHash: secretHash
    };

    // Save to in-memory store
    memUserSessions.set(effectiveSessionId, sessionData);

    // Save to Firestore if available
    if (firebaseReady && db && activeUser) {
      try {
        const ref = doc(db, 'users', uid, 'sessions', effectiveSessionId);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          const exData = existing.data();
          sessionData.status = exData.status || (approvalRequired ? 'PENDING_APPROVAL' : 'ACTIVE');
          sessionData.createdAt = exData.createdAt || nowIso;
        }
        await setDoc(ref, {
          ...sessionData,
          createdAt: existing.exists() ? (existing.data().createdAt || serverTimestamp()) : serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          lastSeenAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore session write skipped / offline:', e);
      }
    }

    try {
      logAudit(knownDevice ? 'device_detected' : 'device_registered', 'security', effectiveSessionId, null, {
        deviceId: effectiveDeviceId,
        browser: meta.browser,
        operatingSystem: meta.operatingSystem,
        status: sessionData.status
      });
    } catch {}

    return { ...sessionData, sessionId: effectiveSessionId, deviceId: effectiveDeviceId, isNewDevice: !knownDevice };
  },

  /**
   * Heartbeat to keep session alive
   */
  async touchCurrentSession(user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const sessionId = getOrCreateSessionId();
    const nowIso = new Date().toISOString();

    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      const memSessions = _memorySessions.get(userSessionKey);
      if (memSessions.has(sessionId)) {
        const s = memSessions.get(sessionId);
        if (['REVOKED', 'revoked', 'blocked'].includes(s.status)) return false;
        s.lastSeenAt = nowIso;
        s.lastActiveAt = nowIso;
      }
    }

    if (!firebaseReady || !db || !activeUser) return true;
    try {
      const ref = doc(db, 'users', uid, 'sessions', sessionId);
      const snap = await getDoc(ref);
      if (!snap.exists() || ['REVOKED', 'revoked', 'blocked'].includes(snap.data().status)) return false;
      await updateDoc(ref, { lastActiveAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validates if current session is active and not revoked
   */
  async validateCurrentSession(user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const sessionId = getOrCreateSessionId();

    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      const memSessions = _memorySessions.get(userSessionKey);
      if (memSessions.has(sessionId)) {
        const data = memSessions.get(sessionId);
        if (data.status === 'REVOKED' || data.status === 'revoked') {
          return { valid: false, reason: 'revoked', status: 'REVOKED' };
        }
        if (data.status === 'PENDING_APPROVAL' || data.status === 'pending') {
          return { valid: false, reason: 'approval_required', status: 'PENDING_APPROVAL' };
        }
        return { valid: true, data, status: 'ACTIVE' };
      }
    }

    if (!firebaseReady || !db || !activeUser) {
      return { valid: true, offline: true, status: 'ACTIVE' };
    }

    try {
      const snap = await getDoc(doc(db, 'users', uid, 'sessions', sessionId));
      if (!snap.exists()) return { valid: true, legacy: true, status: 'ACTIVE' };
      const data = snap.data();
      const status = (data.status || 'ACTIVE').toUpperCase();
      if (status === 'REVOKED' || status === 'BLOCKED') return { valid: false, reason: 'revoked', status: 'REVOKED' };
      if (status === 'PENDING_APPROVAL' || (status === 'PENDING' && data.approvalRequired)) {
        return { valid: false, reason: 'approval_required', status: 'PENDING_APPROVAL' };
      }
      return { valid: true, data, status: 'ACTIVE' };
    } catch (error) {
      return { valid: false, reason: 'verification_unavailable', error };
    }
  },

  /**
   * Lists all sessions for user
   */
  async listSessions(user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const currentSessionId = getOrCreateSessionId();
    const now = Date.now();

    const sessionsMap = new Map();

    // 1. In-memory sessions
    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      for (const [id, s] of _memorySessions.get(userSessionKey)) {
        const lastSeenMillis = new Date(s.lastSeenAt || 0).getTime();
        const isCurrent = id === currentSessionId;
        const status = (s.status || 'ACTIVE').toUpperCase();
        let presence = 'STALE';
        if (lastSeenMillis && now - lastSeenMillis <= HEARTBEAT_MS) presence = 'ACTIVE';
        else if (lastSeenMillis && now - lastSeenMillis <= STALE_MS) presence = 'RECENTLY_ACTIVE';

        sessionsMap.set(id, {
          id,
          ...s,
          status,
          isCurrentDevice: isCurrent,
          presence: isCurrent ? 'ACTIVE' : presence
        });
      }
    }

    // 2. Firestore sessions
    if (firebaseReady && db && activeUser) {
      try {
        const snap = await getDocs(query(collection(db, 'users', uid, 'sessions'), orderBy('lastSeenAt', 'desc'), limit(50)));
        snap.docs.forEach((item) => {
          const data = item.data();
          const lastSeen = data.lastSeenAt?.toMillis?.() || new Date(data.lastSeenAt || 0).getTime();
          const isCurrent = item.id === currentSessionId;
          const status = (data.status || 'ACTIVE').toUpperCase();
          let presence = 'STALE';
          if (lastSeen && now - lastSeen <= HEARTBEAT_MS) presence = 'ACTIVE';
          else if (lastSeen && now - lastSeen <= STALE_MS) presence = 'RECENTLY_ACTIVE';

          sessionsMap.set(item.id, {
            id: item.id,
            ...data,
            status,
            isCurrentDevice: isCurrent,
            presence: isCurrent ? 'ACTIVE' : presence
          });
        });
      } catch (e) {
        console.warn('Could not fetch Firestore sessions:', e);
      }
    }

    // Sort: Current device first, then newest last seen
    return Array.from(sessionsMap.values()).sort((a, b) => {
      if (a.isCurrentDevice) return -1;
      if (b.isCurrentDevice) return 1;
      const aTime = new Date(a.lastSeenAt || 0).getTime();
      const bTime = new Date(b.lastSeenAt || 0).getTime();
      return bTime - aTime;
    });
  },

  /**
   * Remote logout / revoke session
   */
  async revokeSession(sessionId, user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const currentSessionId = getOrCreateSessionId();
    if (!sessionId || sessionId === currentSessionId) return false;

    // Update in-memory
    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      const memSessions = _memorySessions.get(userSessionKey);
      if (memSessions.has(sessionId)) {
        const s = memSessions.get(sessionId);
        s.status = 'REVOKED';
        s.revokedAt = new Date().toISOString();
      }
    }

    let success = false;
    try {
      await callSecurityFunction('revokeDeviceSession', {
        targetSessionId: sessionId,
        callerSessionId: currentSessionId,
        callerSessionSecret: getOrCreateSessionSecret()
      });
      success = true;
    } catch {
      // Direct Firestore fallback
      if (firebaseReady && db && activeUser) {
        try {
          const ref = doc(db, 'users', uid, 'sessions', sessionId);
          await updateDoc(ref, {
            status: 'REVOKED',
            revokedAt: serverTimestamp()
          });
          success = true;
        } catch (err) {
          console.warn('Direct Firestore revoke fallback:', err);
        }
      }
    }

    try {
      logAudit('remote_logout', 'security', sessionId, null, {
        targetSessionId: sessionId,
        callerSessionId: currentSessionId
      });
    } catch {}

    return true;
  },

  /**
   * Approve a pending session
   */
  async approveSession(sessionId, user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const currentSessionId = getOrCreateSessionId();
    if (!sessionId || sessionId === currentSessionId) return false;

    // Update in-memory
    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      const memSessions = _memorySessions.get(userSessionKey);
      if (memSessions.has(sessionId)) {
        const s = memSessions.get(sessionId);
        s.status = 'ACTIVE';
        s.approvedAt = new Date().toISOString();
        s.approvalRequired = false;
      }
    }

    try {
      await callSecurityFunction('approveDeviceSession', {
        targetSessionId: sessionId,
        callerSessionId: currentSessionId,
        callerSessionSecret: getOrCreateSessionSecret()
      });
    } catch {
      if (firebaseReady && db && activeUser) {
        try {
          const ref = doc(db, 'users', uid, 'sessions', sessionId);
          await updateDoc(ref, {
            status: 'ACTIVE',
            approvedAt: serverTimestamp(),
            approvalRequired: false
          });
        } catch (err) {
          console.warn('Direct Firestore approve fallback:', err);
        }
      }
    }

    try {
      logAudit('device_approved', 'security', sessionId, null, {
        targetSessionId: sessionId,
        callerSessionId: currentSessionId
      });
    } catch {}

    return true;
  },

  /**
   * Log out all other devices except the current session
   */
  async logoutOtherSessions(user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    const currentSessionId = getOrCreateSessionId();
    let count = 0;

    // Update in-memory
    const userSessionKey = `sessions_${uid}`;
    if (_memorySessions.has(userSessionKey)) {
      const memSessions = _memorySessions.get(userSessionKey);
      for (const [id, s] of memSessions) {
        if (id !== currentSessionId && s.status !== 'REVOKED') {
          s.status = 'REVOKED';
          s.revokedAt = new Date().toISOString();
          count++;
        }
      }
    }

    try {
      const result = await callSecurityFunction('logoutOtherDeviceSessions', {
        callerSessionId: currentSessionId,
        callerSessionSecret: getOrCreateSessionSecret()
      });
      count = Number(result?.data?.count || count);
    } catch {
      if (firebaseReady && db && activeUser) {
        try {
          const snap = await getDocs(query(collection(db, 'users', uid, 'sessions'), where('status', 'in', ['ACTIVE', 'active', 'PENDING_APPROVAL', 'pending'])));
          for (const item of snap.docs) {
            if (item.id !== currentSessionId) {
              await updateDoc(doc(db, 'users', uid, 'sessions', item.id), {
                status: 'REVOKED',
                revokedAt: serverTimestamp()
              });
              count++;
            }
          }
        } catch (err) {
          console.warn('Direct Firestore logoutOther fallback:', err);
        }
      }
    }

    try {
      logAudit('logout_all_other_devices', 'security', currentSessionId, null, {
        revokedCount: count,
        callerSessionId: currentSessionId
      });
    } catch {}

    return count;
  },

  /**
   * Require approval for new devices setting
   */
  async setNewDeviceApproval(enabled, user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    _memorySettings.set(`requireApproval_${uid}`, Boolean(enabled));

    if (!firebaseReady || !db || !activeUser) return true;
    try {
      await setDoc(doc(db, 'settings', uid), { requireNewDeviceApproval: Boolean(enabled) }, { merge: true });
      return true;
    } catch {
      return false;
    }
  },

  async getNewDeviceApproval(user = null) {
    const activeUser = user || (typeof auth !== 'undefined' ? auth?.currentUser : null);
    const uid = activeUser?.uid || 'anonymous_user';
    if (_memorySettings.has(`requireApproval_${uid}`)) {
      return _memorySettings.get(`requireApproval_${uid}`);
    }

    if (!firebaseReady || !db || !activeUser) return false;
    try {
      const snap = await getDoc(doc(db, 'settings', uid));
      return Boolean(snap.exists() && snap.data().requireNewDeviceApproval);
    } catch {
      return false;
    }
  },

  /**
   * Listen to real-time session status
   */
  listenToSessionChanges(userId, sessionId, onStatusChange) {
    if (!firebaseReady || !db || !userId || !sessionId) return () => {};
    try {
      const ref = doc(db, 'users', userId, 'sessions', sessionId);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          onStatusChange((data.status || 'ACTIVE').toUpperCase());
        }
      });
    } catch {
      return () => {};
    }
  },

  /**
   * Formats relative time
   */
  formatLastSeen(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'number'
      ? new Date(timestamp)
      : (timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp));
    const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diffSec < 60) return 'Active now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  clearLocalSession() {
    _inMemorySessionId = null;
    _inMemorySessionSecret = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_ID_KEY);
        sessionStorage.removeItem(SESSION_SECRET_KEY);
      }
    } catch {}
  }
};


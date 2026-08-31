import { firebaseReady, auth, db } from './firebaseConfig.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logAudit, getAuthSession, getRealUserId } from './dbEngine.js';
import { BillQyroDB } from './localDb.js';
import { deviceSessionEngine } from './deviceSessionEngine.js';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

export const securityEngine = {
  ROLES,

  async verifyWorkspace(userId, workspaceId) {
    if (!firebaseReady) return { verified: false, reason: 'offline' };
    try {
      const settingsRef = doc(db, 'settings', userId);
      const snap = await getDoc(settingsRef);
      if (!snap.exists()) return { verified: false, reason: 'no_settings' };
      const data = snap.data();
      const activeWs = data.activeWorkspaceId || 'default';
      return { verified: activeWs === workspaceId, workspace: activeWs };
    } catch (e) {
      return { verified: false, reason: e.message };
    }
  },

  async getUserRole(userId) {
    if (!firebaseReady) return ROLES.USER;
    try {
      const snap = await getDoc(doc(db, 'usersList', userId));
      return snap.exists() ? (snap.data().role || ROLES.USER) : ROLES.USER;
    } catch {
      return ROLES.USER;
    }
  },

  async setUserRole(userId, role) {
    if (!firebaseReady) return false;
    try {
      await setDoc(doc(db, 'usersList', userId), { role }, { merge: true });
      logAudit('role_changed', 'user', userId, null, { newRole: role });
      return true;
    } catch (e) {
      console.error('securityEngine.setUserRole error:', e);
      return false;
    }
  },

  async getPermissions(userId) {
    const role = await this.getUserRole(userId);
    const permissions = {
      canCreateInvoice: false,
      canEditInvoice: false,
      canDeleteInvoice: false,
      canManageCustomers: false,
      canManageProducts: false,
      canViewReports: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canManageWorkspace: false
    };
    switch (role) {
      case ROLES.OWNER:
        Object.keys(permissions).forEach(k => { permissions[k] = true; });
        break;
      case ROLES.ADMIN:
        permissions.canCreateInvoice = true;
        permissions.canEditInvoice = true;
        permissions.canDeleteInvoice = true;
        permissions.canManageCustomers = true;
        permissions.canManageProducts = true;
        permissions.canViewReports = true;
        break;
      case ROLES.USER:
        permissions.canCreateInvoice = true;
        permissions.canEditInvoice = true;
        permissions.canManageCustomers = true;
        permissions.canManageProducts = true;
        permissions.canViewReports = true;
        break;
      case ROLES.VIEWER:
        permissions.canViewReports = true;
        break;
    }
    return permissions;
  },

  async validateSession(userId) {
    const session = getAuthSession();
    if (!session || !session.userEmail) return false;
    try {
      if (auth?.currentUser) {
        const deviceSession = await deviceSessionEngine.validateCurrentSession();
        if (!deviceSession.valid && !deviceSession.legacy) return false;
        const token = await auth.currentUser.getIdTokenResult(true);
        return token.auth_time > 0;
      }
      return getRealUserId() === userId;
    } catch {
      return false;
    }
  },

  async registerDeviceSession(options = {}) {
    return deviceSessionEngine.registerCurrentSession(options);
  },

  async validateDeviceSession() {
    return deviceSessionEngine.validateCurrentSession();
  },

  async listDeviceSessions() {
    return deviceSessionEngine.listSessions();
  },

  async revokeDeviceSession(sessionId) {
    const ok = await deviceSessionEngine.revokeSession(sessionId);
    if (ok) await logAudit('device_revoked', 'session', sessionId, null, { reason: 'remote_logout' });
    return ok;
  },

  async logoutOtherDevices() {
    const count = await deviceSessionEngine.logoutOtherSessions();
    await logAudit('logout_all_other_devices', 'session', deviceSessionEngine.getSessionId(), null, { count });
    return count;
  },

  async setRequireNewDeviceApproval(enabled) {
    const ok = await deviceSessionEngine.setNewDeviceApproval(enabled);
    if (ok) await logAudit('new_device_security_changed', 'account', getRealUserId(), null, { enabled: Boolean(enabled) });
    return ok;
  },

  async getRequireNewDeviceApproval() {
    return deviceSessionEngine.getNewDeviceApproval();
  },

  checkFirestoreRules() {
    return firebaseReady;
  },

  async getAuditLogs(userId = null) {
    try {
      let logs = await BillQyroDB.getAll('auditLogs');
      if (userId) logs = logs.filter(l => l.userId === userId);
      return logs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch {
      return [];
    }
  },

  async logSecurityEvent(action, entityType, entityId, before, after) {
    return logAudit(action, entityType, entityId, before, after);
  },

  isOwner(session) {
    if (!session) return false;
    return session.isSuperAdmin === true;
  }
};

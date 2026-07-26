import { firebaseReady, auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  logAudit,
  getAuthSession,
  getRealUserId
} from './dbEngine';
import { BillQyroDB } from './localDb';

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
      if (snap.exists()) {
        return snap.data().role || ROLES.USER;
      }
      return ROLES.USER;
    } catch (e) {
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
        const token = await auth.currentUser.getIdTokenResult(true);
        return token.auth_time > 0;
      }
      const storedUid = getRealUserId();
      return storedUid === userId;
    } catch (e) {
      return false;
    }
  },

  checkFirestoreRules() {
    return firebaseReady;
  },

  async getAuditLogs(userId = null) {
    try {
      let logs = await BillQyroDB.getAll('auditLogs');
      if (userId) logs = logs.filter(l => l.userId === userId);
      return logs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch (e) {
      return [];
    }
  },

  async logSecurityEvent(action, entityType, entityId, before, after) {
    return logAudit(action, entityType, entityId, before, after);
  },

  isOwner(session) {
    const adminEmail = 'khairul2052007@gmail.com';
    if (!session) return false;
    const email = session.userEmail || session.email || '';
    return email.toLowerCase() === adminEmail.toLowerCase();
  }
};

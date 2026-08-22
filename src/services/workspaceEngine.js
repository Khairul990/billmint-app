import { db, firebaseReady } from './firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import {
  getSettings,
  saveSettings,
  getRealUserId,
  getAuthSession,
  logAudit
} from './dbEngine';

export const workspaceEngine = {
  async getCurrent() {
    const settings = getSettings();
    return {
      id: settings?.activeWorkspaceId || 'default',
      name: settings?.businessName || 'Default Workspace',
      settings
    };
  },

  async switchWorkspace(workspaceId) {
    const settings = getSettings();
    if (!settings) return false;
    settings.activeWorkspaceId = workspaceId;
    saveSettings(settings);
    logAudit('workspace_switched', 'workspace', workspaceId, null, { workspaceId });
    window.dispatchEvent(new CustomEvent('billqyro_workspace_changed', { detail: { workspaceId } }));
    return true;
  },

  async verifyAccess(userId, workspaceId) {
    const session = getAuthSession();
    if (!session) return { authorized: false, reason: 'no_session' };
    const settings = getSettings();
    const activeWs = settings?.activeWorkspaceId || 'default';
    if (workspaceId && workspaceId !== activeWs) {
      return { authorized: false, reason: 'workspace_mismatch' };
    }
    return { authorized: true, workspaceId: activeWs };
  },

  async getAll() {
    const settings = getSettings();
    const localWs = settings?.businessWorkspaces;
    if (Array.isArray(localWs) && localWs.length > 0) {
      return localWs;
    }
    if (!firebaseReady) return [{ id: settings?.activeWorkspaceId || 'default', name: settings?.businessName || 'Default Workspace' }];
    try {
      const session = getAuthSession();
      if (session?.isSuperAdmin) {
        const snap = await getDocs(collection(db, 'settings'));
        const workspaces = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.businessName || 'Unnamed Business',
            email: data.email || '',
            country: data.country || '',
            userId: d.id
          };
        });
        return workspaces;
      }
      return [{ id: settings?.activeWorkspaceId || 'default', name: settings?.businessName || 'Default Workspace' }];
    } catch {
      return [{ id: settings?.activeWorkspaceId || 'default', name: settings?.businessName || 'Default Workspace' }];
    }
  },

  getPermissionLevel() {
    const session = getAuthSession();
    if (!session) return 'none';
    if (session.isSuperAdmin === true) return 'owner';
    return 'user';
  },

  async createWorkspace(name, userId) {
    const uid = userId || getRealUserId() || 'local-user';
    const wsId = 'ws_' + Date.now();
    const settings = getSettings() || {};
    settings.activeWorkspaceId = wsId;
    settings.businessName = name;
    saveSettings(settings);
    logAudit('workspace_created', 'workspace', wsId, null, { name, userId: uid });
    window.dispatchEvent(new CustomEvent('billqyro_workspace_changed', { detail: { workspaceId: wsId } }));
    return wsId;
  }
};

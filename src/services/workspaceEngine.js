import { db, firebaseReady } from './firebaseConfig.js';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import {
  getSettings,
  saveSettings,
  getRealUserId,
  getAuthSession,
  logAudit
} from './dbEngine.js';

export const workspaceEngine = {
  async getCurrent() {
    const settings = getSettings();
    const uid = getRealUserId();
    const savedLastWs = uid ? localStorage.getItem(`billqyro_${uid}_last_workspace`) : null;
    const workspaces = Array.isArray(settings?.businessWorkspaces) ? settings.businessWorkspaces : [];
    
    let activeWs = workspaces.find(w => w.id === savedLastWs);
    if (!activeWs && settings?.activeWorkspaceId) {
      activeWs = workspaces.find(w => w.id === settings.activeWorkspaceId);
    }
    if (!activeWs && workspaces.length > 0) {
      activeWs = workspaces.find(w => w.name && w.name !== 'Default Workspace' && w.name !== 'My Retail Shop') || workspaces[0];
    }

    const wsId = activeWs ? activeWs.id : (settings?.activeWorkspaceId || 'default');
    const wsName = activeWs?.name || settings?.businessName || 'Default Workspace';

    return {
      id: wsId,
      name: wsName,
      settings
    };
  },

  async switchWorkspace(workspaceId) {
    const settings = getSettings();
    if (!settings) return false;
    const uid = getRealUserId();
    settings.activeWorkspaceId = workspaceId;
    saveSettings(settings);
    if (uid) {
      localStorage.setItem(`billqyro_${uid}_last_workspace`, workspaceId);
    }
    logAudit('workspace_switched', 'workspace', workspaceId, null, { workspaceId });
    window.dispatchEvent(new CustomEvent('billqyro_workspace_changed', { detail: { workspaceId } }));
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    return true;
  },

  async verifyAccess(userId, workspaceId) {
    const session = getAuthSession();
    if (!session) return { authorized: false, reason: 'no_session' };
    const settings = getSettings();
    const workspaces = Array.isArray(settings?.businessWorkspaces) ? settings.businessWorkspaces : [];
    if (workspaceId && workspaces.length > 0) {
      const exists = workspaces.some(w => w.id === workspaceId);
      if (!exists) {
        return { authorized: false, reason: 'workspace_not_found_in_account' };
      }
    }
    return { authorized: true, workspaceId: workspaceId || settings?.activeWorkspaceId || 'default' };
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

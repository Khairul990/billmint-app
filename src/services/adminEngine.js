import { db, firebaseReady } from './firebaseConfig.js';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import {
  getInvoices as dbGetInvoices,
  getCustomers as dbGetCustomers,
  getProducts as dbGetProducts,
  getExpenses as dbGetExpenses,
  getSettings as dbGetSettings,
  saveSettings as dbSaveSettings,
  getGlobalAdminSettings as dbGetGlobalAdminSettings,
  updateGlobalAdminSettings as dbUpdateGlobalAdminSettings,
  logAudit,
  getRealUserId,
  getAuthSession,
  getAdminUsersList as dbGetAdminUsersList,
  getAdminTotalStats as dbGetAdminTotalStats,
  updateUserBlockStatus as dbUpdateUserBlockStatus,
  deleteEnterpriseUser as dbDeleteEnterpriseUser,
  resetEnterpriseWorkspace as dbResetEnterpriseWorkspace,
  resetBusinessDataOnly as dbResetBusinessDataOnly,
  factoryResetAllData as dbFactoryResetAllData,
  clearAllLocalData as dbClearAllLocalData,
  clearInvoices as dbClearInvoices,
  emptyTrash as dbEmptyTrash,
  clearCustomers as dbClearCustomers,
  clearProducts as dbClearProducts,
  clearExpenses as dbClearExpenses,
  getStorageUsage as dbGetStorageUsage,
  cleanDuplicateDrafts as dbCleanDuplicateDrafts,
  cleanTemporaryData as dbCleanTemporaryData,
  clearCacheOnly as dbClearCacheOnly,
  migrateGlobalToScopedStorage as dbMigrateGlobalToScopedStorage,
  getActiveAnnouncement as dbGetActiveAnnouncement,
  getAdminPremiumRequests as dbGetAdminPremiumRequests,
  updatePremiumRequestStatus as dbUpdatePremiumRequestStatus
} from './dbEngine.js';
import {
  getAdminAllSupportTickets,
  updateSupportTicketStatus,
  getAdminAllFeatureRequests,
  updateFeatureRequestStatus,
  createAnnouncement,
  getAdminAllAnnouncements,
  toggleAnnouncementActive,
  createChangelog,
  getAdminAllChangelogs
} from './platformAdminService.js';
import {
  getAdminPlatformRevenueStates,
  getAdminAllPaymentProofs,
  updatePlatformPaymentProofStatus,
  getGlobalRevenueSettings,
  saveGlobalRevenueSettings
} from './platformRevenueService.js';
import { BillQyroDB } from './localDb.js';

const memoryCache = {
  revenueStates: { data: null, time: 0 },
  paymentProofs: { data: null, time: 0 },
  usersList: { data: null, time: 0 },
  totalStats: { data: null, time: 0 },
  workspaces: { data: null, time: 0 }
};
const CACHE_TTL = 30000; // 30 seconds

export const adminEngine = {
  // --- Analytics & Financial Telemetry ---
  async getAnalytics() {
    const [invoices, customers, products, expenses] = await Promise.all([
      dbGetInvoices(), dbGetCustomers(), dbGetProducts(), dbGetExpenses()
    ]);
    const totalRevenue = invoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((s, inv) => {
      const due = (inv.grandTotal || 0) - (inv.paidAmount || 0);
      return s + Math.max(0, due);
    }, 0);
    return {
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalExpenses: expenses.length,
      totalRevenue,
      totalOutstanding,
      paidInvoices: invoices.filter(i => (i.paidAmount || 0) >= (i.grandTotal || 0)).length,
      unpaidInvoices: invoices.filter(i => (i.paidAmount || 0) === 0).length
    };
  },

  // --- Workspaces Querying ---
  async getWorkspaces() {
    if (memoryCache.workspaces.data && Date.now() - memoryCache.workspaces.time < CACHE_TTL) {
      return memoryCache.workspaces.data;
    }
    if (!firebaseReady) {
      // Offline fallback: inspect local settings
      const localSettings = await BillQyroDB.getAll('settings').catch(() => []);
      const localList = localSettings.map(s => ({
        id: s.activeWorkspaceId || s.id || 'default_ws',
        name: s.businessName || 'Default Workspace',
        email: s.email || '',
        ownerName: s.ownerName || '',
        userId: s.userId || 'local_user',
        category: s.businessType || 'Retail / General',
        plan: s.subscriptionPlan || 'free',
        activeModules: s.enabledModules || ['invoices', 'customers', 'products', 'reports'],
        createdAt: s.createdAt || new Date().toISOString()
      }));
      memoryCache.workspaces = { data: localList, time: Date.now() };
      return localList;
    }
    try {
      const snap = await getDocs(collection(db, 'settings'));
      const workspaceMap = new Map();
      snap.docs.forEach(d => {
        const data = d.data();
        const wid = data.activeWorkspaceId || data.businessName || d.id;
        if (!workspaceMap.has(wid)) {
          workspaceMap.set(wid, {
            id: wid,
            name: data.businessName || 'Unnamed Workspace',
            email: data.email || '',
            ownerName: data.ownerName || '',
            userId: d.id,
            category: data.businessType || data.category || 'General Business',
            country: data.country || 'IN',
            plan: data.subscriptionPlan || (data.isPremium ? 'pro' : 'free'),
            activeModules: Array.isArray(data.enabledModules) ? data.enabledModules : ['invoices', 'customers', 'products', 'reports'],
            createdAt: data.createdAt || ''
          });
        }
      });
      const list = Array.from(workspaceMap.values());
      memoryCache.workspaces = { data: list, time: Date.now() };
      return list;
    } catch (e) {
      console.error('adminEngine.getWorkspaces error:', e);
      return [];
    }
  },

  // --- User Directory ---
  async getAllUsers() {
    return this.getUsersList();
  },

  async getUsersList() {
    if (memoryCache.usersList.data && Date.now() - memoryCache.usersList.time < CACHE_TTL) {
      return memoryCache.usersList.data;
    }
    const data = await dbGetAdminUsersList();
    memoryCache.usersList = { data, time: Date.now() };
    return data;
  },

  async getTotalStats() {
    if (memoryCache.totalStats.data && Date.now() - memoryCache.totalStats.time < CACHE_TTL) {
      return memoryCache.totalStats.data;
    }
    const data = await dbGetAdminTotalStats();
    memoryCache.totalStats = { data, time: Date.now() };
    return data;
  },

  async getPlatformStats() {
    const [users, workspaces, analytics] = await Promise.all([
      this.getAllUsers(),
      this.getWorkspaces(),
      this.getAnalytics()
    ]);
    return { users, workspaces, analytics };
  },

  // --- Maintenance Mode Cloud Architecture ---
  async getMaintenanceMode() {
    try {
      const settings = await dbGetGlobalAdminSettings();
      const isCloudMaintenance = settings?.maintenanceMode === true;
      const isLocalMaintenance = localStorage.getItem('billqyro_global_maintenance') === 'true';
      return {
        enabled: isCloudMaintenance || isLocalMaintenance,
        reason: settings?.maintenanceReason || 'Platform undergoing scheduled maintenance.',
        estimatedDuration: settings?.maintenanceDuration || '30 mins',
        updatedAt: settings?.maintenanceUpdatedAt || null
      };
    } catch (e) {
      console.error('getMaintenanceMode error:', e);
      return {
        enabled: localStorage.getItem('billqyro_global_maintenance') === 'true',
        reason: 'Platform undergoing scheduled maintenance.',
        estimatedDuration: '30 mins',
        updatedAt: null
      };
    }
  },

  async setMaintenanceMode(enabled, reason = 'Platform undergoing scheduled maintenance.', estimatedDuration = '30 mins') {
    try {
      localStorage.setItem('billqyro_global_maintenance', enabled ? 'true' : 'false');
      await dbUpdateGlobalAdminSettings({
        maintenanceMode: enabled,
        maintenanceReason: reason,
        maintenanceDuration: estimatedDuration,
        maintenanceUpdatedAt: new Date().toISOString()
      });
      await this.logAdminAudit({
        action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        target: 'GLOBAL_PLATFORM',
        result: 'SUCCESS',
        details: reason,
        metadata: { estimatedDuration }
      });
      return true;
    } catch (e) {
      console.error('setMaintenanceMode error:', e);
      localStorage.setItem('billqyro_global_maintenance', enabled ? 'true' : 'false');
      return true;
    }
  },

  // --- Comprehensive Audit Logging ---
  async logAdminAudit({ action, target, result = 'SUCCESS', details = '', metadata = {} }) {
    const session = getAuthSession();
    const actorEmail = session?.userEmail || 'owner@billqyro.admin';
    const auditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actor: actorEmail,
      action,
      target: String(target || 'GLOBAL'),
      result,
      details: String(details || ''),
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    // Store in local storage queue
    try {
      const existing = JSON.parse(localStorage.getItem('billqyro_admin_audit_logs') || '[]');
      existing.unshift(auditRecord);
      localStorage.setItem('billqyro_admin_audit_logs', JSON.stringify(existing.slice(0, 100)));
    } catch {
      // Ignore storage write error
    }

    // Persist to Firestore if available
    if (firebaseReady) {
      try {
        await setDoc(doc(db, 'adminAuditLogs', auditRecord.id), auditRecord);
      } catch (e) {
        console.warn('Failed to sync audit log to Firestore:', e);
      }
    }

    return auditRecord;
  },

  async getAuditLogs() {
    let cloudLogs = [];
    if (firebaseReady) {
      try {
        const snap = await getDocs(query(collection(db, 'adminAuditLogs'), limit(100)));
        cloudLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Failed to load cloud audit logs:', e);
      }
    }
    const localLogs = JSON.parse(localStorage.getItem('billqyro_admin_audit_logs') || '[]');
    
    // Merge without duplicates
    const map = new Map();
    [...localLogs, ...cloudLogs].forEach(log => {
      if (!map.has(log.id)) {
        map.set(log.id, log);
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  },

  // --- Real System Telemetry & Health ---
  async getSystemTelemetry() {
    let indexedDbStatus = 'Unknown';
    try {
      const dbs = await window.indexedDB.databases();
      indexedDbStatus = dbs.length > 0 ? 'Healthy' : 'Available';
    } catch {
      indexedDbStatus = typeof indexedDB !== 'undefined' ? 'Healthy' : 'Unavailable';
    }

    let storageEstimate = { usage: 0, quota: 0 };
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        storageEstimate = {
          usageMB: ((est.usage || 0) / (1024 * 1024)).toFixed(2),
          quotaMB: ((est.quota || 0) / (1024 * 1024)).toFixed(2)
        };
      } catch {
        storageEstimate = { usageMB: '0', quotaMB: 'Unknown' };
      }
    }

    let swStatus = 'Not Supported';
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        swStatus = regs.length > 0 ? 'Active' : 'Registered';
      } catch {
        swStatus = 'Inactive';
      }
    }

    let pendingSyncCount = 0;
    try {
      const activities = await BillQyroDB.getAll('activities').catch(() => []);
      pendingSyncCount = activities.filter(a => !a.synced && !a.syncedToCloud).length;
    } catch {
      pendingSyncCount = 0;
    }

    return {
      online: navigator.onLine,
      firebaseConnected: !!firebaseReady,
      indexedDbStatus,
      storageEstimate,
      serviceWorkerStatus: swStatus,
      pendingSyncQueue: pendingSyncCount,
      timestamp: new Date().toISOString()
    };
  },

  // --- Comprehensive Backup & Restore Engine ---
  async createPlatformBackup() {
    const backupData = {
      version: '8.0.0',
      exportedAt: new Date().toISOString(),
      schemaVersion: 8,
      invoices: await BillQyroDB.getAll('invoices').catch(() => []),
      customers: await BillQyroDB.getAll('customers').catch(() => []),
      products: await BillQyroDB.getAll('products').catch(() => []),
      expenses: await BillQyroDB.getAll('expenses').catch(() => []),
      settings: await BillQyroDB.getAll('settings').catch(() => []),
      bankLedger: await BillQyroDB.getAll('bankLedger').catch(() => []),
      bankCredit: await BillQyroDB.getAll('bankCredit').catch(() => []),
      appointments: await BillQyroDB.getAll('appointments').catch(() => []),
      orders: await BillQyroDB.getAll('orders').catch(() => []),
      activities: await BillQyroDB.getAll('activities').catch(() => []),
      announcements: await BillQyroDB.getAll('announcements').catch(() => [])
    };

    await this.logAdminAudit({
      action: 'PLATFORM_BACKUP_CREATED',
      target: 'ALL_COLLECTIONS',
      result: 'SUCCESS',
      details: `Generated snapshot with ${backupData.invoices.length} invoices, ${backupData.customers.length} customers, ${backupData.products.length} products.`
    });

    return backupData;
  },

  async restorePlatformBackup(backupContent) {
    if (!backupContent || typeof backupContent !== 'object') {
      throw new Error('Invalid backup file payload');
    }

    const stores = [
      'invoices', 'customers', 'products', 'expenses', 'settings',
      'bankLedger', 'bankCredit', 'appointments', 'orders', 'activities', 'announcements'
    ];

    let restoredCount = 0;
    for (const storeName of stores) {
      if (Array.isArray(backupContent[storeName])) {
        for (const item of backupContent[storeName]) {
          if (item && item.id) {
            await BillQyroDB.put(storeName, item).catch(() => {});
            restoredCount++;
          }
        }
      }
    }

    await this.logAdminAudit({
      action: 'PLATFORM_BACKUP_RESTORED',
      target: 'INDEXED_DB_STORES',
      result: 'SUCCESS',
      details: `Restored ${restoredCount} records across platform stores.`
    });

    return { success: true, restoredRecords: restoredCount };
  },

  // --- Support & Feature Requests ---
  async getSupportTickets() { return getAdminAllSupportTickets(); },
  async getFeatureRequests() { return getAdminAllFeatureRequests(); },
  async updateSupportTicket(ticketId, status, note) { return updateSupportTicketStatus(ticketId, status, note); },
  async updateFeatureRequest(requestId, status, note) { return updateFeatureRequestStatus(requestId, status, note); },

  // --- Announcements & Changelogs ---
  async createAnnouncement(announcement) { return createAnnouncement(announcement); },
  async getAnnouncements() { return getAdminAllAnnouncements(); },
  async toggleAnnouncement(id, active) { return toggleAnnouncementActive(id, active); },
  async createChangelog(entry) {
    return createChangelog(entry.version, new Date().toISOString().split('T')[0], entry.title, entry.notes, entry.type || 'new');
  },
  async getChangelogs() { return getAdminAllChangelogs(); },

  // --- Revenue & Proofs ---
  async getRevenueStates() {
    if (memoryCache.revenueStates.data && Date.now() - memoryCache.revenueStates.time < CACHE_TTL) {
      return memoryCache.revenueStates.data;
    }
    const data = await getAdminPlatformRevenueStates();
    memoryCache.revenueStates = { data, time: Date.now() };
    return data;
  },

  async getPaymentProofs() {
    if (memoryCache.paymentProofs.data && Date.now() - memoryCache.paymentProofs.time < CACHE_TTL) {
      return memoryCache.paymentProofs.data;
    }
    const data = await getAdminAllPaymentProofs();
    memoryCache.paymentProofs = { data, time: Date.now() };
    return data;
  },

  async updatePaymentProofStatus(proofId, status, note, invoices = []) {
    const res = await updatePlatformPaymentProofStatus(proofId, status, note, invoices);
    await this.logAdminAudit({
      action: `PAYMENT_PROOF_${status.toUpperCase()}`,
      target: proofId,
      result: 'SUCCESS',
      details: note || `Payment proof status updated to ${status}`
    });
    return res;
  },

  async getGlobalSettings() { return dbGetGlobalAdminSettings(); },
  async updateGlobalSettings(settings) {
    const res = await dbUpdateGlobalAdminSettings(settings);
    await this.logAdminAudit({
      action: 'GLOBAL_SETTINGS_UPDATED',
      target: 'CONFIG',
      result: 'SUCCESS',
      details: 'Updated global admin parameters'
    });
    return res;
  },

  async getRevenueSettings() { return getGlobalRevenueSettings(); },
  async saveRevenueSettings(settings) { return saveGlobalRevenueSettings(settings); },

  // --- User Lifecycle ---
  async getPremiumRequests() { return dbGetAdminPremiumRequests(); },
  async updatePremiumRequestStatus(requestId, status, targetUserId, plan, rejectionReason = '') {
    const res = await dbUpdatePremiumRequestStatus(requestId, status, targetUserId, plan, rejectionReason);
    await this.logAdminAudit({
      action: `PREMIUM_REQUEST_${status.toUpperCase()}`,
      target: targetUserId,
      result: 'SUCCESS',
      details: `Plan: ${plan}. Reason: ${rejectionReason}`
    });
    return res;
  },

  async updateUserPlan(userId, plan) {
    if (firebaseReady) {
      try {
        await setDoc(doc(db, 'usersList', userId), { planStatus: plan, updatedAt: Date.now() }, { merge: true });
        await setDoc(doc(db, 'settings', userId), { subscriptionPlan: plan, isPremium: plan === 'pro' || plan === 'enterprise', updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error('updateUserPlan firebase error:', e);
      }
    }
    await this.logAdminAudit({
      action: 'USER_PLAN_CHANGED',
      target: userId,
      result: 'SUCCESS',
      details: `Assigned tier: ${plan}`
    });
    return true;
  },

  async blockUser(userId) {
    const res = await dbUpdateUserBlockStatus(userId, true);
    await this.logAdminAudit({
      action: 'USER_BLOCKED',
      target: userId,
      result: 'SUCCESS',
      details: 'Account suspended by owner'
    });
    return res;
  },

  async unblockUser(userId) {
    const res = await dbUpdateUserBlockStatus(userId, false);
    await this.logAdminAudit({
      action: 'USER_UNBLOCKED',
      target: userId,
      result: 'SUCCESS',
      details: 'Account reactivated by owner'
    });
    return res;
  },

  async deleteUser(userId) {
    const res = await dbDeleteEnterpriseUser(userId);
    await this.logAdminAudit({
      action: 'USER_DELETED_PERMANENT',
      target: userId,
      result: 'SUCCESS',
      details: 'Complete enterprise deletion'
    });
    return res;
  },

  async resetWorkspace(userId) {
    const res = await dbResetEnterpriseWorkspace(userId);
    await this.logAdminAudit({
      action: 'WORKSPACE_RESET',
      target: userId,
      result: 'SUCCESS',
      details: 'Invoices, customers, and products purged'
    });
    return res;
  },

  // --- Maintenance & Wipe Operations ---
  async resetBusinessDataOnly() { return dbResetBusinessDataOnly(); },
  async factoryResetAllData() { return dbFactoryResetAllData(); },
  async clearAllLocalData() { return dbClearAllLocalData(); },
  async clearInvoices() { return dbClearInvoices(); },
  async emptyTrash() { return dbEmptyTrash(); },
  async clearCustomers() { return dbClearCustomers(); },
  async clearProducts() { return dbClearProducts(); },
  async clearExpenses() { return dbClearExpenses(); },
  getStorageUsage() { return dbGetStorageUsage(); },
  async cleanDuplicateDrafts() { return dbCleanDuplicateDrafts(); },
  async cleanTemporaryData() { return dbCleanTemporaryData(); },
  clearCacheOnly() { return dbClearCacheOnly(); },
  async migrateGlobalToScopedStorage() { return dbMigrateGlobalToScopedStorage(); },

  isAdminUser(session) {
    if (!session) return false;
    return session.isSuperAdmin === true;
  }
};

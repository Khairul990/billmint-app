import { db, firebaseReady } from './firebaseConfig';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
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
  getActiveAnnouncement as dbGetActiveAnnouncement
} from './dbEngine';
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
} from './platformAdminService';
import {
  getAdminPlatformRevenueStates,
  getAdminAllPaymentProofs,
  updatePlatformPaymentProofStatus,
  getGlobalRevenueSettings,
  saveGlobalRevenueSettings
} from './platformRevenueService';

export const adminEngine = {
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

  async getWorkspaces() {
    if (!firebaseReady) return [];
    try {
      const snap = await getDocs(collection(db, 'settings'));
      const workspaceMap = new Map();
      snap.docs.forEach(d => {
        const data = d.data();
        const wid = data.activeWorkspaceId || data.businessName || 'default';
        if (!workspaceMap.has(wid)) {
          workspaceMap.set(wid, {
            id: wid,
            name: data.businessName || 'Unnamed',
            email: data.email || '',
            ownerName: data.ownerName || '',
            userId: d.id,
            country: data.country || '',
            createdAt: data.createdAt || ''
          });
        }
      });
      return Array.from(workspaceMap.values());
    } catch (e) {
      console.error('adminEngine.getWorkspaces error:', e);
      return [];
    }
  },

  async getAllUsers() {
    if (!firebaseReady) return [];
    try {
      const snap = await getDocs(collection(db, 'usersList'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('adminEngine.getAllUsers error:', e);
      return [];
    }
  },

  async getPlatformStats() {
    const [users, workspaces, analytics] = await Promise.all([
      this.getAllUsers(),
      this.getWorkspaces(),
      this.getAnalytics()
    ]);
    return { users, workspaces, analytics };
  },

  async getSupportTickets() {
    return getAdminAllSupportTickets();
  },

  async getFeatureRequests() {
    return getAdminAllFeatureRequests();
  },

  async updateSupportTicket(ticketId, status, note) {
    return updateSupportTicketStatus(ticketId, status, note);
  },

  async updateFeatureRequest(requestId, status, note) {
    return updateFeatureRequestStatus(requestId, status, note);
  },

  async createAnnouncement(announcement) {
    return createAnnouncement(announcement);
  },

  async getAnnouncements() {
    return getAdminAllAnnouncements();
  },

  async toggleAnnouncement(id, active) {
    return toggleAnnouncementActive(id, active);
  },

  async createChangelog(entry) {
    return createChangelog(entry.version, new Date().toISOString().split('T')[0], entry.title, entry.notes, entry.type || 'new');
  },

  async getChangelogs() {
    return getAdminAllChangelogs();
  },

  async getRevenueStates() {
    return getAdminPlatformRevenueStates();
  },

  async getPaymentProofs() {
    return getAdminAllPaymentProofs();
  },

  async getSystemHealth() {
    return {
      firebaseConnected: !!firebaseReady,
      indexedDbAvailable: typeof indexedDB !== 'undefined',
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  },

  async getUsersList() {
    return dbGetAdminUsersList();
  },

  async getTotalStats() {
    return dbGetAdminTotalStats();
  },

  async getGlobalSettings() {
    return dbGetGlobalAdminSettings();
  },

  async updateGlobalSettings(settings) {
    return dbUpdateGlobalAdminSettings(settings);
  },

  async getRevenueSettings() {
    return getGlobalRevenueSettings();
  },

  async saveRevenueSettings(settings) {
    return saveGlobalRevenueSettings(settings);
  },

  async updatePaymentProofStatus(proofId, status, note, invoices = []) {
    return updatePlatformPaymentProofStatus(proofId, status, note, invoices);
  },

  async blockUser(userId) {
    return dbUpdateUserBlockStatus(userId, true);
  },

  async unblockUser(userId) {
    return dbUpdateUserBlockStatus(userId, false);
  },

  async deleteUser(userId) {
    return dbDeleteEnterpriseUser(userId);
  },

  async resetWorkspace(userId) {
    return dbResetEnterpriseWorkspace(userId);
  },

  // Maintenance & Wipe Operations
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
    const adminEmail = 'khairul2052007@gmail.com';
    if (!session) return false;
    const email = session.userEmail || session.email || '';
    return email.toLowerCase() === adminEmail.toLowerCase();
  }
};

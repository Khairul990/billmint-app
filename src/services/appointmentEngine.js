import { BillQyroDB } from './localDb.js';
import { getRealUserId, queueSyncTransaction, syncOfflineTransactions } from './dbEngine.js';

const STORE = 'appointments';

const getWorkspaceId = () => {
  try {
    const uid = getRealUserId();
    const raw = localStorage.getItem(uid ? `billqyro_settings_${uid}` : 'billqyro_settings');
    const settings = raw ? JSON.parse(raw) : {};
    return settings?.activeWorkspaceId || 'default';
  } catch {
    return 'default';
  }
};

const scope = (record) => ({
  ...record,
  userId: record.userId || getRealUserId() || 'local-user',
  workspaceId: record.workspaceId || getWorkspaceId(),
  updatedAt: record.updatedAt || new Date().toISOString(),
  __version: record.__version || 1
});

const readLocal = async () => {
  const uid = getRealUserId();
  const workspaceId = getWorkspaceId();
  const rows = await BillQyroDB.getAll(STORE).catch(() => []);
  return rows.filter(r => (!uid || r.userId === uid) && (!workspaceId || r.workspaceId === workspaceId));
};

export const appointmentEngine = {
  async getAll() {
    return readLocal();
  },

  async save(appointment) {
    const record = scope(appointment);
    await BillQyroDB.put(STORE, record);
    await queueSyncTransaction('save', STORE, record.id, record);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    if (navigator.onLine) syncOfflineTransactions().catch(() => {});
    return record;
  },

  async delete(id) {
    const existing = (await readLocal()).find(r => r.id === id);
    if (!existing) return false;
    await BillQyroDB.delete(STORE, id);
    await queueSyncTransaction('delete', STORE, id, existing);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    if (navigator.onLine) syncOfflineTransactions().catch(() => {});
    return true;
  },

  async syncFromCloud() {
    // The generic BillQyro sync queue handles Firestore persistence. This method
    // now returns the actual scoped local dataset instead of the old placeholder.
    return readLocal();
  }
};

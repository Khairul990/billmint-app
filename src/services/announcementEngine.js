import { BillQyroDB } from './localDb';
import { db, firebaseReady } from './firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORE = 'announcements';
const COLLECTION = 'adminAnnouncements';

const normalize = (item = {}) => ({
  id: item.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: String(item.title || '').trim(),
  message: String(item.message || '').trim(),
  type: item.type || 'feature',
  display: Array.isArray(item.display) && item.display.length ? item.display : ['popup'],
  audience: item.audience || 'all',
  workspaceIds: Array.isArray(item.workspaceIds) ? item.workspaceIds : [],
  plan: item.plan || 'all',
  status: item.status || 'draft',
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publishedAt: item.publishedAt || null,
  expiresAt: item.expiresAt || null,
  createdBy: item.createdBy || null,
});

const legacyToCanonical = (item = {}) => normalize({
  ...item,
  status: item.status || (item.active ? 'published' : 'draft'),
  display: item.display || ['popup'],
  audience: item.audience || 'all',
  expiresAt: item.expiresAt || (item.endDate ? new Date(`${item.endDate}T23:59:59`).toISOString() : null),
});

const isVisibleTo = (a, { workspaceId = null, plan = 'free' } = {}) => {
  if (a.status !== 'published') return false;
  if (a.expiresAt && new Date(a.expiresAt).getTime() < Date.now()) return false;
  if (a.audience === 'workspace' && (!workspaceId || !a.workspaceIds.includes(workspaceId))) return false;
  if (a.audience === 'plan' && a.plan !== 'all' && a.plan !== plan) return false;
  return true;
};

const readLocal = async () => {
  try { return await BillQyroDB.getAll(STORE); } catch { return []; }
};

const writeLocal = async (item) => {
  try { await BillQyroDB.put(STORE, item); } catch { /* offline fallback is best effort */ }
};

export const announcementEngine = {
  async getAll() {
    if (firebaseReady) {
      try {
        const snap = await getDocs(collection(db, COLLECTION));
        return snap.docs.map(d => legacyToCanonical({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (error) {
        console.warn('Shared announcements unavailable; using local cache.', error);
      }
    }
    return (await readLocal()).map(legacyToCanonical)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getPublished(context = {}) {
    const rows = await this.getAll();
    return rows.filter(a => isVisibleTo(a, context));
  },

  async save(input) {
    const item = normalize(input);
    await writeLocal(item);
    if (firebaseReady) {
      await setDoc(doc(db, COLLECTION, item.id), item, { merge: true });
    }
    return item;
  },

  async publish(input) {
    return this.save({ ...input, status: 'published', publishedAt: new Date().toISOString() });
  },

  async archive(id) {
    const item = (await this.getAll()).find(a => a.id === id);
    if (!item) throw new Error('Announcement not found');
    return this.save({ ...item, status: 'archived' });
  },

  async delete(id) {
    try { await BillQyroDB.delete(STORE, id); } catch { /* continue to cloud */ }
    if (firebaseReady) await deleteDoc(doc(db, COLLECTION, id));
    return true;
  },
};

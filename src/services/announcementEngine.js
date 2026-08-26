import { BillQyroDB } from './localDb';

const STORE = 'announcements';

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

const isVisibleTo = (a, { workspaceId = null, plan = 'free' } = {}) => {
  if (a.status !== 'published') return false;
  if (a.expiresAt && new Date(a.expiresAt).getTime() < Date.now()) return false;
  if (a.audience === 'workspace' && (!workspaceId || !a.workspaceIds.includes(workspaceId))) return false;
  if (a.audience === 'plan' && a.plan !== 'all' && a.plan !== plan) return false;
  return true;
};

export const announcementEngine = {
  async getAll() {
    return (await BillQyroDB.getAll(STORE)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getPublished(context = {}) {
    const rows = await this.getAll();
    return rows.filter(a => isVisibleTo(a, context));
  },
  async save(input) {
    const item = normalize(input);
    await BillQyroDB.put(STORE, item);
    return item;
  },
  async publish(input) {
    return this.save({ ...input, status: 'published', publishedAt: new Date().toISOString() });
  },
  async archive(id) {
    const item = (await BillQyroDB.getAll(STORE)).find(a => a.id === id);
    if (!item) throw new Error('Announcement not found');
    return this.save({ ...item, status: 'archived' });
  },
  async delete(id) {
    return BillQyroDB.delete(STORE, id);
  },
};

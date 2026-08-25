import { BillQyroDB } from './localDb';
import { getRealUserId, queueSyncTransaction, syncOfflineTransactions } from './dbEngine';

class ActivityEngine {
  getScopeKey(workspaceId) {
    const uid = getRealUserId() || 'local-user';
    return `billqyro_activities_${uid}_${workspaceId || 'default'}`;
  }

  async logActivity(workspaceId, action, entityType, entityId, details = {}) {
    const userId = getRealUserId() || 'local-user';
    const resolvedWorkspaceId = workspaceId || 'default';
    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      workspaceId: resolvedWorkspaceId,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __version: 1
    };

    try {
      const activities = await this.getActivities(resolvedWorkspaceId);
      const next = [activity, ...activities].slice(0, 100);
      localStorage.setItem(this.getScopeKey(resolvedWorkspaceId), JSON.stringify(next));
      await BillQyroDB.put('activities', activity);
      await queueSyncTransaction('save', 'activities', activity.id, activity);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
      if (navigator.onLine) syncOfflineTransactions().catch(() => {});
      return activity;
    } catch (e) {
      console.error('[ActivityEngine] Error logging activity', e);
      return null;
    }
  }

  async getActivities(workspaceId, limit = 50) {
    const userId = getRealUserId() || 'local-user';
    const resolvedWorkspaceId = workspaceId || 'default';
    try {
      const rows = await BillQyroDB.getAll('activities');
      const scoped = rows
        .filter(item => item.userId === userId && item.workspaceId === resolvedWorkspaceId)
        .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
      if (scoped.length) return scoped.slice(0, limit);

      const raw = localStorage.getItem(this.getScopeKey(resolvedWorkspaceId));
      if (!raw) return [];
      const activities = JSON.parse(raw);
      return Array.isArray(activities) ? activities.slice(0, limit) : [];
    } catch (e) {
      console.error('[ActivityEngine] Error fetching activities', e);
      return [];
    }
  }
}

export const activityEngine = new ActivityEngine();

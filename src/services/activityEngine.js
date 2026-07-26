import * as dbEngine from './dbEngine';

class ActivityEngine {
  async logActivity(workspaceId, action, entityType, entityId, details = {}) {
    // In production, save this to a dedicated activities subcollection in Firestore/IndexedDB
    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action, // e.g. 'CREATED', 'UPDATED', 'DELETED', 'PAID'
      entityType, // e.g. 'INVOICE', 'CUSTOMER', 'PAYMENT'
      entityId,
      details,
      timestamp: new Date().toISOString()
    };

    try {
      const activities = await this.getActivities(workspaceId);
      activities.unshift(activity); // Add to beginning
      
      // Keep only last 100 activities per workspace to prevent local bloat
      if (activities.length > 100) {
        activities.length = 100;
      }
      
      localStorage.setItem(`billqyro_activities_${workspaceId}`, JSON.stringify(activities));
      
      // In production, this would also push to dbEngine -> Firestore
      // await dbEngine.saveActivity(workspaceId, activity);
      
      return activity;
    } catch (e) {
      console.error('[ActivityEngine] Error logging activity', e);
      return null;
    }
  }

  async getActivities(workspaceId, limit = 50) {
    try {
      const raw = localStorage.getItem(`billqyro_activities_${workspaceId}`);
      if (raw) {
        const activities = JSON.parse(raw);
        return activities.slice(0, limit);
      }
      return [];
    } catch (e) {
      console.error('[ActivityEngine] Error fetching activities', e);
      return [];
    }
  }
}

export const activityEngine = new ActivityEngine();

import { BillQyroDB } from './localDb';

class AuditEngine {
  async getAllAuditLogsFromDb() {
    try {
      return await BillQyroDB.getAll('auditLogs');
    } catch (e) {
      console.error('Error fetching audit logs from DB', e);
      return [];
    }
  }

  async clearAllAuditLogsDb() {
    try {
      const allLogs = await this.getAllAuditLogsFromDb();
      for (const log of allLogs) {
        await BillQyroDB.delete('auditLogs', log.id);
      }
      return true;
    } catch (e) {
      console.error('Error clearing audit logs from DB', e);
      return false;
    }
  }
  async logAuditEvent(workspaceId, eventType, details = {}, severity = 'info') {
    // severity: 'info', 'warning', 'critical'
    // eventType: 'SETTINGS_CHANGED', 'ROLE_UPDATED', 'LOGIN_FAILED', 'DATA_EXPORTED'
    
    // In production, save this to an audit collection in Firestore which is strictly append-only
    const auditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      eventType,
      details,
      severity,
      timestamp: new Date().toISOString()
    };

    try {
      const logs = await this.getAuditLogs(workspaceId);
      logs.unshift(auditEvent); 
      
      // Keep up to 500 audit logs per workspace locally
      if (logs.length > 500) {
        logs.length = 500;
      }
      
      localStorage.setItem(`billqyro_audit_${workspaceId}`, JSON.stringify(logs));
      
      // In production, this pushes to dbEngine -> Firestore (append-only)
      return auditEvent;
    } catch (e) {
      console.error('[AuditEngine] Error logging audit event', e);
      return null;
    }
  }

  async getAuditLogs(workspaceId, limit = 100) {
    try {
      const raw = localStorage.getItem(`billqyro_audit_${workspaceId}`);
      if (raw) {
        const logs = JSON.parse(raw);
        return logs.slice(0, limit);
      }
      return [];
    } catch (e) {
      console.error('[AuditEngine] Error fetching audit logs', e);
      return [];
    }
  }

  async exportAuditLogs(workspaceId) {
    const logs = await this.getAuditLogs(workspaceId, 500);
    return logs;
  }
}

export const auditEngine = new AuditEngine();

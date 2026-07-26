import JSZip from 'jszip';
import {
  exportBackup as dbExportBackup,
  exportBackupZip as dbExportBackupZip,
  importRestore as dbImportRestore,
  backupLocalData as dbBackupLocalData,
  syncFromFirestore as dbSyncFromFirestore
} from './dbEngine';
import { BillQyroDB } from './localDb';
import { firebaseReady, db } from './firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export const backupEngine = {
  async exportLocal() {
    const data = await dbExportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billqyro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('last_backup_date', new Date().toISOString());
    return data;
  },

  async exportZip() {
    const result = await dbExportBackupZip();
    localStorage.setItem('last_export_date', new Date().toISOString());
    return result;
  },

  async restore(data) {
    return dbImportRestore(data);
  },

  async backupLocal() {
    return dbBackupLocalData();
  },

  async syncFromCloud(force = false) {
    return dbSyncFromFirestore(force);
  },

  async cloudBackup(userId) {
    if (!firebaseReady) return { status: 'error', message: 'Firebase not ready' };
    try {
      const backupData = await dbExportBackup();
      await setDoc(doc(db, 'cloudBackups', userId), {
        data: backupData,
        backedUpAt: new Date().toISOString(),
        userId
      });
      return { status: 'success', timestamp: new Date().toISOString() };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  async cloudRestore(userId) {
    if (!firebaseReady) return { status: 'error', message: 'Firebase not ready' };
    try {
      const snap = await getDoc(doc(db, 'cloudBackups', userId));
      if (!snap.exists()) return { status: 'error', message: 'No cloud backup found' };
      const backupData = snap.data().data;
      await this.restore(backupData);
      return { status: 'success' };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  async getLastBackupInfo() {
    return {
      localDate: localStorage.getItem('last_backup_date') || 'Never',
      exportDate: localStorage.getItem('last_export_date') || 'Never',
      autoBackupEnabled: localStorage.getItem('billqyro_auto_backup') === 'true',
      autoBackupFrequency: localStorage.getItem('billqyro_auto_backup_frequency') || 'weekly'
    };
  },

  toggleAutoBackup(enabled, frequency = 'weekly') {
    localStorage.setItem('billqyro_auto_backup', enabled ? 'true' : 'false');
    localStorage.setItem('billqyro_auto_backup_frequency', frequency);
    if (enabled) {
      const lastBackup = localStorage.getItem('last_backup_date');
      if (!lastBackup || lastBackup === 'Never') {
        this.exportLocal();
      }
    }
  }
};

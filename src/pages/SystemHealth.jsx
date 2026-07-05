import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowLeft, HardDrive, Wifi, WifiOff, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BillQyroDB } from '../services/localDb';

const SystemHealth = ({ setCurrentTab }) => {
  const [healthData, setHealthData] = useState({
    isOnline: navigator.onLine,
    pendingSync: 0,
    failedSync: 0,
    errorLogsCount: 0,
    auditLogsCount: 0,
    dbStorageUsage: 'Calculating...'
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const syncQueue = await BillQyroDB.getAll('syncQueue');
        const errorLogs = await BillQyroDB.getAll('errorLogs');
        const auditLogs = await BillQyroDB.getAll('auditLogs');

        let dbStorageUsage = 'Unknown';
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          dbStorageUsage = `${(estimate.usage / (1024 * 1024)).toFixed(2)} MB`;
        }

        setHealthData({
          isOnline: navigator.onLine,
          pendingSync: syncQueue.length,
          failedSync: 0, // In this model, failed are just kept in syncQueue or logged
          errorLogsCount: errorLogs.length,
          auditLogsCount: auditLogs.length,
          dbStorageUsage
        });
      } catch (e) {
        console.error('Failed to read system health', e);
      }
    };

    checkHealth();

    const handleOnline = () => setHealthData(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setHealthData(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check legacy global storage
    const checkLegacyStorage = () => {
      const collections = ['invoices', 'customers', 'products', 'expenses', 'settings', 'subscription'];
      let count = 0;
      let summary = [];
      
      collections.forEach(col => {
        const globalKey = `billqyro_${col}`;
        const data = localStorage.getItem(globalKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const itemsCount = Array.isArray(parsed) ? parsed.length : 1;
            if (itemsCount > 0) {
              count += itemsCount;
              summary.push(`${col}: ${itemsCount}`);
            }
          } catch (e) { console.warn('Ignored error in SystemHealth.jsx:', e); }
        }
      });
      return { hasLegacy: count > 0, summary: summary.join(', ') };
    };

    const legacyDataInfo = checkLegacyStorage();
    setHealthData(prev => ({ ...prev, legacyDataInfo }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleBackup = async () => {
    try {
      const invoices = await BillQyroDB.getAll('invoices');
      const customers = await BillQyroDB.getAll('customers');
      const products = await BillQyroDB.getAll('products');
      const expenses = await BillQyroDB.getAll('expenses');
      const syncQueue = await BillQyroDB.getAll('syncQueue');

      const dataToExport = {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        localStorage: { ...localStorage },
        indexedDB: {
          invoices, customers, products, expenses, syncQueue
        }
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billqyro_backup_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
      setHasBackedUp(true);
    } catch (e) {
      toast.error('Backup failed: ' + e.message);
    }
  };

  const [hasBackedUp, setHasBackedUp] = useState(false);

  const handleReplaceWithCloud = async () => {
    if (!hasBackedUp) {
      toast.error('Please backup your data before replacing with cloud data.');
      return;
    }

    try {
      const queue = await BillQyroDB.getAll('syncQueue');
      if (queue && queue.length > 0) {
        toast.loading('Flushing offline queue to cloud first...', { id: 'flush-toast' });
        const { syncOfflineTransactions } = await import('../services/dbEngine');
        await syncOfflineTransactions();
        
        const newQueue = await BillQyroDB.getAll('syncQueue');
        if (newQueue && newQueue.length > 0) {
          toast.dismiss('flush-toast');
          toast.error(`Cannot replace. ${newQueue.length} items failed to sync to cloud. Check your network or retry later.`);
          return;
        }
        toast.success('Queue flushed successfully!', { id: 'flush-toast' });
      }

      if (!window.confirm('This will clear all local cache on this device and replace it with data from the cloud. Proceed?')) {
        return;
      }

      const { clearCacheOnly, syncFromFirestore } = await import('../services/dbEngine');
      // Clear local cache first
      clearCacheOnly();
      // Sync from Firestore (cloud as source of truth)
      await syncFromFirestore();
      toast.success('Device data refreshed from cloud. Reloading...');
      setTimeout(() => window.location.reload(true), 1500);
    } catch (e) {
      console.error('Failed to replace device data with cloud:', e);
      toast.error('Failed to replace data. See console for details.');
    }
  };

  const handleMigrate = async () => {
    if (!hasBackedUp) {
      toast.error('Please backup your data first before migrating.');
      return;
    }
    if (window.confirm('Are you sure you want to merge old local data into the active account? This cannot be undone.')) {
      const { migrateGlobalToScopedStorage } = await import('../services/dbEngine');
      const result = await migrateGlobalToScopedStorage();
      if (result && result.status === 'success') {
        toast.success(`Successfully migrated ${result.migratedCount} items. Please reload the app.`);
        setTimeout(() => window.location.reload(true), 2000);
      } else {
        toast.error('Migration failed: ' + (result?.message || 'Unknown error'));
      }
    }
  };

  const handleHardReload = () => {
    if (window.confirm('Clear PWA caches and reload? Use this if the app is stuck or showing an old version.')) {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      window.location.reload(true);
    }
  };

  const handleClearDeviceCache = () => {
    if (!hasBackedUp) {
      toast.error('Please backup your device data first before clearing.');
      return;
    }
    if (window.confirm('WARNING: This will delete ALL local data on this device (localStorage & IndexedDB). It will NOT delete cloud data. Proceed?')) {
      if (window.confirm('Are you absolutely sure? You will be logged out.')) {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        
        // Clear IndexedDB
        const req = indexedDB.deleteDatabase('BillQyroDB');
        req.onsuccess = () => {
          window.location.href = '/';
        };
        req.onerror = () => {
          window.location.href = '/';
        };
      }
    }
  };

  const APP_VERSION = "2.0.1 - " + new Date().toISOString().split('T')[0];

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto pb-12 relative font-sans animate-fade-in space-y-6">
      <button 
        onClick={() => setCurrentTab('more')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium space-y-8">
        <div className="flex items-center justify-between border-b border-theme-border-soft pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-theme-primary tracking-tight">Storage & Sync Control</h1>
              <p className="text-sm text-theme-muted font-medium mt-1">Real-time status of local database and sync engine.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-1">App Version</p>
            <p className="text-sm font-semibold text-theme-primary">{APP_VERSION}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-theme-border-soft bg-theme-bg-soft">
            <div className="flex items-center gap-3 mb-2">
              {healthData.isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <h3 className="font-semibold text-theme-primary">Network Status</h3>
            </div>
            <p className="text-sm text-theme-secondary">
              {healthData.isOnline ? 'Online (Sync Active)' : 'Offline (Local Mode)'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-theme-border-soft bg-theme-bg-soft">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCcw className="w-5 h-5 text-theme-accent" />
              <h3 className="font-semibold text-theme-primary">Sync Queue</h3>
            </div>
            <p className="text-sm text-theme-secondary">
              {healthData.pendingSync} transactions pending
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-theme-border-soft bg-theme-bg-soft">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-theme-primary">Local Storage Usage</h3>
            </div>
            <p className="text-sm text-theme-secondary">
              IndexedDB: {healthData.dbStorageUsage}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-theme-border-soft bg-theme-bg-soft">
            <div className="flex items-center gap-3 mb-2">
              {healthData.errorLogsCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-theme-warning" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <h3 className="font-semibold text-theme-primary">System Errors</h3>
            </div>
            <p className="text-sm text-theme-secondary">
              {healthData.errorLogsCount} errors logged locally
            </p>
          </div>
        </div>

        {healthData.legacyDataInfo?.hasLegacy && (
          <div className="mt-8 p-6 rounded-2xl border border-theme-warning/30 bg-theme-warning/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-theme-warning/10 text-theme-warning rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-theme-primary mb-1">Old Local Data Found</h3>
                <p className="text-sm text-theme-secondary mb-3">
                  We found un-synced data from an older version: <strong>{healthData.legacyDataInfo.summary}</strong>
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleMigrate}
                    className="px-4 py-2 bg-theme-warning text-white text-sm font-bold rounded-xl shadow-premium hover:opacity-90 transition-opacity"
                  >
                    Migrate & Merge
                  </button>
                  <p className="text-xs text-theme-muted font-medium">Requires backup first</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleBackup}
            className="p-4 rounded-2xl border border-theme-border-soft bg-theme-card hover:bg-theme-surface transition-colors text-left"
          >
            <h4 className="font-bold text-theme-primary mb-1">Backup Data</h4>
            <p className="text-xs text-theme-secondary font-medium">Download local JSON snapshot</p>
          </button>
          
          <button 
            onClick={handleHardReload}
            className="p-4 rounded-2xl border border-theme-border-soft bg-theme-card hover:bg-theme-surface transition-colors text-left"
          >
            <h4 className="font-bold text-theme-primary mb-1">Hard Reload</h4>
            <p className="text-xs text-theme-secondary font-medium">Clear PWA cache & refresh</p>
          </button>
          
          <button 
            onClick={handleClearDeviceCache}
            className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left group"
          >
            <h4 className="font-bold text-red-500 group-hover:text-red-600 mb-1">Clear Device Cache</h4>
            <p className="text-xs text-red-400/80 font-medium">Wipe local device data only</p>
          </button>

          <button 
            onClick={handleReplaceWithCloud}
            className="p-4 rounded-2xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors text-left group"
          >
            <h4 className="font-bold text-green-500 group-hover:text-green-600 mb-1">Replace This Device With Cloud Data</h4>
            <p className="text-xs text-green-400/80 font-medium">Clear local cache and load fresh cloud data</p>
          </button>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default SystemHealth;

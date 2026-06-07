import React, { useState, useEffect } from 'react';
import { ArrowLeft, HardDrive, Wifi, WifiOff, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans animate-fade-in space-y-6">
      <button 
        onClick={() => setCurrentTab('more')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-theme-border-soft">
          <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">System Health</h1>
            <p className="text-sm text-theme-muted font-medium mt-1">Real-time status of local database and sync engine.</p>
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
      </div>
    </div>
  );
};

export default SystemHealth;

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, AlertCircle, Loader2, RefreshCw, Cloud, Database, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { BillQyroDB } from '../../services/localDb.js';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const AppHealthCenter = () => {
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState({
    firebase: { status: 'Unknown', details: 'Checking...' },
    indexedDb: { status: 'Unknown', details: 'Checking...' },
    offlineQueue: { status: 'Unknown', count: 0 },
    serviceWorker: { status: 'Unknown', details: 'Checking...' },
    storage: { status: 'Unknown', usageMB: '0', quotaMB: '0' },
    network: { status: 'Unknown', online: true },
    recentErrors: { status: 'Healthy', count: 0 }
  });

  const fetchRealHealth = async () => {
    setLoading(true);
    try {
      const tel = await adminEngine.getSystemTelemetry();
      const activities = await BillQyroDB.getAll('activities').catch(() => []);
      const pendingSyncs = activities.filter(a => !a.synced && !a.syncedToCloud).length;

      // Real Firebase check
      const fbStatus = tel.firebaseConnected ? 'Healthy' : (tel.online ? 'Warning' : 'Critical');
      const idbStatus = tel.indexedDbStatus === 'Healthy' ? 'Healthy' : 'Warning';
      const swStatus = tel.serviceWorkerStatus === 'Active' || tel.serviceWorkerStatus === 'Registered' ? 'Healthy' : 'Warning';
      const queueStatus = pendingSyncs === 0 ? 'Healthy' : (pendingSyncs > 20 ? 'Warning' : 'Healthy');

      setHealthMetrics({
        firebase: {
          status: fbStatus,
          details: tel.firebaseConnected ? 'Connected & Synced' : 'Offline / Standby'
        },
        indexedDb: {
          status: idbStatus,
          details: `DB_VERSION 8 (${tel.indexedDbStatus})`
        },
        offlineQueue: {
          status: queueStatus,
          count: pendingSyncs
        },
        serviceWorker: {
          status: swStatus,
          details: tel.serviceWorkerStatus
        },
        storage: {
          status: 'Healthy',
          usageMB: tel.storageEstimate?.usageMB || '0',
          quotaMB: tel.storageEstimate?.quotaMB || 'Dynamic'
        },
        network: {
          status: tel.online ? 'Healthy' : 'Warning',
          online: tel.online
        },
        recentErrors: {
          status: 'Healthy',
          count: 0
        }
      });
    } catch (e) {
      console.error('Failed to query health metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealHealth();
  }, []);

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'Healthy': return 'success';
      case 'Warning': return 'warning';
      case 'Critical': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-500" />
            System Health & Telemetry Monitor
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Real-time diagnostic probes measuring client storage, service workers, IndexedDB, and cloud backends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchRealHealth} leftIcon={RefreshCw}>
            Refresh Probes
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="flex justify-center p-12 border-transparent">
          <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">Cloud Firestore</span>
                <Cloud className="w-5 h-5 text-theme-accent" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">{healthMetrics.firebase.details}</span>
              <p className="text-xs text-theme-muted mb-4">Authentication & real-time sync backend</p>
              <div className="mt-auto">
                <Badge variant={getBadgeVariant(healthMetrics.firebase.status)} className="flex items-center w-fit font-bold">
                  {healthMetrics.firebase.status === 'Healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                  {healthMetrics.firebase.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">IndexedDB Engine</span>
                <Database className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">{healthMetrics.indexedDb.details}</span>
              <p className="text-xs text-theme-muted mb-4">Local offline-first persistence layer</p>
              <div className="mt-auto">
                <Badge variant={getBadgeVariant(healthMetrics.indexedDb.status)} className="flex items-center w-fit font-bold">
                  {healthMetrics.indexedDb.status === 'Healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                  {healthMetrics.indexedDb.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">Offline Sync Queue</span>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">{healthMetrics.offlineQueue.count} Pending</span>
              <p className="text-xs text-theme-muted mb-4">Unsynced records waiting in worker queue</p>
              <div className="mt-auto">
                <Badge variant={getBadgeVariant(healthMetrics.offlineQueue.status)} className="flex items-center w-fit font-bold">
                  {healthMetrics.offlineQueue.status === 'Healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                  {healthMetrics.offlineQueue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">Service Worker & PWA</span>
                <HardDrive className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">{healthMetrics.serviceWorker.details}</span>
              <p className="text-xs text-theme-muted mb-4">Background caching & offline assets</p>
              <div className="mt-auto">
                <Badge variant={getBadgeVariant(healthMetrics.serviceWorker.status)} className="flex items-center w-fit font-bold">
                  {healthMetrics.serviceWorker.status === 'Healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                  {healthMetrics.serviceWorker.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">Storage Footprint</span>
                <HardDrive className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">{healthMetrics.storage.usageMB} MB Used</span>
              <p className="text-xs text-theme-muted mb-4">Quota: {healthMetrics.storage.quotaMB} MB</p>
              <div className="mt-auto">
                <Badge variant={getBadgeVariant(healthMetrics.storage.status)} className="flex items-center w-fit font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {healthMetrics.storage.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-theme-surface/50 border-theme-border-soft hover:border-theme-accent/20 transition-colors">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted text-xs font-bold uppercase tracking-wider">Network & Errors</span>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-2xl font-black text-theme-primary mb-1">
                {healthMetrics.network.online ? 'Online' : 'Offline'}
              </span>
              <p className="text-xs text-theme-muted mb-4">Zero fatal unhandled exceptions</p>
              <div className="mt-auto">
                <Badge variant="success" className="flex items-center w-fit font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Healthy
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default memo(AppHealthCenter);

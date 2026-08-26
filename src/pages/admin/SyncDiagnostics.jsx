import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff, Cloud, Database, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { BillQyroDB } from '../../services/localDb.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const SyncDiagnostics = () => {
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [queueItems, setQueueItems] = useState([]);

  const fetchSyncData = async () => {
    setLoading(true);
    try {
      const tel = await adminEngine.getSystemTelemetry();
      const activities = await BillQyroDB.getAll('activities').catch(() => []);
      const pending = activities.filter(a => !a.synced && !a.syncedToCloud);
      setTelemetry(tel);
      setQueueItems(pending);
    } catch (e) {
      console.error('Failed to load sync diagnostics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  const handlePingServer = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await adminEngine.getTotalStats();
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      toast.success(`Server ping response: ${duration}ms`);
    } catch (e) {
      toast.error('Ping failed or connection timed out.');
      setLatency('Timeout');
    } finally {
      setPinging(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-theme-accent" />
            Sync Diagnostics & Edge Network
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Telemetry for real-time Firestore sync channels, offline mutations queue, and worker readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePingServer} disabled={pinging} leftIcon={Zap}>
            {pinging ? 'Pinging...' : 'Ping Cloud Server'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSyncData} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-theme-muted uppercase">Network State</span>
              {telemetry?.online ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
            </div>
            <div className="text-xl font-black text-theme-primary">
              {telemetry?.online ? 'Online (Broadband)' : 'Offline Mode'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-theme-muted uppercase">Cloud Backend</span>
              <Cloud className="w-4 h-4 text-theme-accent" />
            </div>
            <div className="text-xl font-black text-emerald-500">
              {telemetry?.firebaseConnected ? 'Connected & Ready' : 'Standby / Local'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-theme-muted uppercase">Round-Trip Latency</span>
              <Clock className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl font-black text-theme-primary">
              {latency !== null ? `${latency} ms` : 'Not Measured'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-theme-muted uppercase">Pending Queue</span>
              <Database className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-500">
              {queueItems.length} Mutations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Queue Inspector */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-theme-accent" />
            Offline Mutation Queue Pipeline
          </CardTitle>
          <p className="text-xs text-theme-secondary">
            Pending records waiting to be dispatched to cloud Firestore once network reconnection occurs.
          </p>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-sm text-theme-primary">All local records are synchronized.</p>
              <p className="text-xs mt-0.5">Zero pending offline mutations in the pipeline.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queueItems.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-theme-primary capitalize">{item.type || 'Activity'}</span>
                    <span className="text-theme-muted block">{item.title || item.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-black uppercase text-[10px]">
                    Pending Sync
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SyncDiagnostics;

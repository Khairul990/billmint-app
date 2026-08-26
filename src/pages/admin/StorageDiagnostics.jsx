import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Database, RefreshCw, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { BillQyroDB } from '../../services/localDb.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const StorageDiagnostics = () => {
  const [loading, setLoading] = useState(true);
  const [storesData, setStoresData] = useState([]);
  const [telemetry, setTelemetry] = useState(null);

  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const stores = [
        'invoices', 'customers', 'products', 'expenses', 'settings',
        'bankLedger', 'bankCredit', 'appointments', 'orders', 'activities', 'announcements'
      ];

      const counts = await Promise.all(
        stores.map(async (name) => {
          const items = await BillQyroDB.getAll(name).catch(() => []);
          const approxBytes = JSON.stringify(items).length;
          return {
            name,
            count: items.length,
            approxKB: (approxBytes / 1024).toFixed(1)
          };
        })
      );

      const tel = await adminEngine.getSystemTelemetry();
      setStoresData(counts);
      setTelemetry(tel);
    } catch (e) {
      console.error('Failed to load storage diagnostics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const totalRecords = storesData.reduce((acc, s) => acc + s.count, 0);
  const totalKB = storesData.reduce((acc, s) => acc + parseFloat(s.approxKB || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-cyan-500" />
            Storage Diagnostics & DB Partitioning
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Real IndexedDB table metrics, local byte footprint, and browser storage quota analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStorageData} leftIcon={RefreshCw}>
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Total Offline Records</span>
            <div className="text-3xl font-black text-theme-primary">{totalRecords.toLocaleString()}</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Across 11 indexed object stores</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">IndexedDB Size</span>
            <div className="text-3xl font-black text-cyan-500">{(totalKB / 1024).toFixed(2)} MB</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Approx JSON payload footprint</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Browser Storage Quota</span>
            <div className="text-3xl font-black text-emerald-500">
              {telemetry?.storageEstimate?.usageMB ? `${telemetry.storageEstimate.usageMB} MB` : 'Available'}
            </div>
            <span className="text-[11px] text-theme-muted mt-1 block">
              Quota: {telemetry?.storageEstimate?.quotaMB ? `${telemetry.storageEstimate.quotaMB} MB` : 'Dynamic'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Store Breakdown Table */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-theme-accent" />
            IndexedDB Store Registry (DB_VERSION = 8)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storesData.map((store) => (
              <div
                key={store.name}
                className="p-4 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-theme-primary capitalize">{store.name}</h4>
                  <span className="text-xs text-theme-muted">{store.count} documents</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-theme-accent">{store.approxKB} KB</span>
                  <span className="text-[10px] text-emerald-500 font-bold block flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Indexed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StorageDiagnostics;

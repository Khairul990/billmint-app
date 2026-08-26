import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, AlertTriangle, ShieldCheck, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const MaintenanceCenter = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [reason, setReason] = useState('Platform undergoing scheduled maintenance and system optimization.');
  const [duration, setDuration] = useState('30 minutes');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const state = await adminEngine.getMaintenanceMode();
      setIsMaintenance(state.enabled);
      if (state.reason) setReason(state.reason);
      if (state.estimatedDuration) setDuration(state.estimatedDuration);
      if (state.updatedAt) setLastUpdated(state.updatedAt);
    } catch (e) {
      console.error('Failed to load maintenance status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    const nextState = !isMaintenance;
    if (nextState) {
      const confirmAction = window.confirm(
        '⚠️ ACTIVATE GLOBAL MAINTENANCE MODE?\n\nThis will instantly block all non-admin users across the platform and present the maintenance screen.'
      );
      if (!confirmAction) return;
    }

    setSaving(true);
    try {
      await adminEngine.setMaintenanceMode(nextState, reason, duration);
      setIsMaintenance(nextState);
      setLastUpdated(new Date().toISOString());
      if (nextState) {
        toast.success('Global Maintenance Mode ENABLED. Non-admins blocked.');
      } else {
        toast.success('Maintenance Mode DISABLED. Platform is now live.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update maintenance mode.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfigOnly = async () => {
    setSaving(true);
    try {
      await adminEngine.setMaintenanceMode(isMaintenance, reason, duration);
      toast.success('Maintenance broadcast parameters updated.');
    } catch (e) {
      toast.error('Failed to save parameters.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <Power className={`w-8 h-8 ${isMaintenance ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
            Global Maintenance & Kill Switch
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Authoritative platform-wide access gate with cloud synchronization and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStatus} leftIcon={RefreshCw}>
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Main Status Banner */}
      <Card className={`border-2 transition-all ${isMaintenance ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isMaintenance ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-emerald-500 text-white'}`}>
                {isMaintenance ? 'Platform Locked / In Maintenance' : 'Platform Live / Operational'}
              </span>
              {lastUpdated && (
                <span className="text-xs text-theme-muted flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-theme-primary">
              {isMaintenance ? 'Emergency Lockout Active' : 'Normal Operations in Progress'}
            </h3>
            <p className="text-sm text-theme-secondary max-w-2xl leading-relaxed">
              {isMaintenance
                ? 'All non-owner users requesting workspace access or endpoints are served the maintenance lockout interface. Admin users retain full console access.'
                : 'All workspaces, API operations, invoicing engines, and real-time syncing endpoints are fully operational.'}
            </p>
          </div>

          <Button
            onClick={handleToggleMaintenance}
            disabled={saving || loading}
            variant={isMaintenance ? 'outline' : 'primary'}
            className={`w-full md:w-auto px-8 py-4 font-black uppercase tracking-wider text-sm shadow-xl active:scale-95 transition-all ${
              isMaintenance
                ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {isMaintenance ? 'Deactivate Maintenance (Go Live)' : 'Activate Maintenance Mode'}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast Message & Timer Configuration */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-theme-accent" />
            User Lockout Screen Message
          </CardTitle>
          <p className="text-xs text-theme-secondary">
            Customize the message displayed on tenant devices when maintenance mode is engaged.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Maintenance Notice</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scheduled database upgrade in progress. We will be back online shortly."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Estimated Downtime</label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 30 minutes / 1 hour"
              className="w-full md:w-64"
            />
          </div>

          <div className="p-4 rounded-2xl bg-theme-surface-elevated border border-theme-border-soft space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-theme-muted block">Live User Preview</span>
            <div className="p-4 rounded-xl bg-theme-main/80 border border-theme-border-soft text-center space-y-2">
              <h4 className="text-lg font-black text-theme-primary">System Under Maintenance</h4>
              <p className="text-xs text-theme-secondary font-semibold max-w-md mx-auto">{reason}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-accent/10 border border-theme-accent/20 text-theme-accent text-xs font-bold">
                <Clock className="w-3.5 h-3.5" /> Estimated Duration: {duration}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfigOnly} disabled={saving} variant="outline" size="sm">
              Save Parameters
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MaintenanceCenter;

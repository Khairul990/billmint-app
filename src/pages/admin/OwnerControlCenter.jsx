import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Trash2, Zap, RotateCcw, Power, CheckCircle2, Lock } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

const OwnerControlCenter = () => {
  const [activeAction, setActiveAction] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [processing, setProcessing] = useState(false);

  const dangerActions = [
    {
      id: 'purge_cache',
      title: 'Purge Platform Cache',
      description: 'Clears all indexed memory caches, temporary query results, and client-side session states.',
      confirmPhrase: 'PURGE CACHE',
      level: 'warning',
      icon: Zap,
      handler: async () => {
        await adminEngine.cleanTemporaryData();
        await adminEngine.clearCacheOnly();
        return 'System cache completely purged.';
      }
    },
    {
      id: 'clean_duplicates',
      title: 'Clean Duplicate Drafts',
      description: 'Scans and removes stale or orphaned draft documents across all offline collections.',
      confirmPhrase: 'CLEAN DRAFTS',
      level: 'warning',
      icon: RotateCcw,
      handler: async () => {
        await adminEngine.cleanDuplicateDrafts();
        return 'Duplicate drafts cleaned successfully.';
      }
    },
    {
      id: 'migrate_storage',
      title: 'Migrate Global to Scoped Storage',
      description: 'Re-indexes legacy global storage records into user-scoped and workspace-isolated partitions.',
      confirmPhrase: 'MIGRATE STORAGE',
      level: 'warning',
      icon: RotateCcw,
      handler: async () => {
        await adminEngine.migrateGlobalToScopedStorage();
        return 'Storage partitions successfully migrated.';
      }
    },
    {
      id: 'reset_business_data',
      title: 'Reset Local Business Data',
      description: 'Purges invoices, customers, and products in current workspace while preserving configuration settings.',
      confirmPhrase: 'RESET BUSINESS DATA',
      level: 'danger',
      icon: Trash2,
      handler: async () => {
        await adminEngine.resetBusinessDataOnly();
        return 'Local business data reset complete.';
      }
    },
    {
      id: 'factory_reset_all',
      title: 'Platform Factory Reset',
      description: 'Completely wipes all local IndexedDB stores, offline queues, and cached platform states on this machine.',
      confirmPhrase: 'FACTORY RESET ALL DATA',
      level: 'danger',
      icon: Power,
      handler: async () => {
        await adminEngine.factoryResetAllData();
        return 'Platform factory reset executed successfully.';
      }
    }
  ];

  const handleExecute = async () => {
    if (!activeAction) return;
    if (confirmInput.trim().toUpperCase() !== activeAction.confirmPhrase) {
      toast.error(`Confirmation mismatch! Please type "${activeAction.confirmPhrase}" exactly.`);
      return;
    }

    setProcessing(true);
    try {
      const msg = await activeAction.handler();
      await adminEngine.logAdminAudit({
        action: `OWNER_DANGEROUS_ACTION_${activeAction.id.toUpperCase()}`,
        target: 'SYSTEM_DATA',
        result: 'SUCCESS',
        details: msg
      });
      toast.success(msg);
      setActiveAction(null);
      setConfirmInput('');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Dangerous Action & Owner Controls
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Destructive and high-privilege maintenance routines. All operations require explicit typed confirmation.
          </p>
        </div>
      </div>

      <Card className="bg-rose-500/10 border-rose-500/20">
        <CardContent className="p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-500 leading-relaxed font-semibold">
            <strong>Security Warning:</strong> Actions performed here directly alter database states, local caches, and partition schemes. Always ensure a recent platform snapshot exists before executing destructive tasks.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dangerActions.map((action) => {
          const Icon = action.icon;
          const isDanger = action.level === 'danger';
          return (
            <Card
              key={action.id}
              className={`border transition-all ${
                isDanger
                  ? 'border-rose-500/20 hover:border-rose-500/40 bg-theme-surface/60'
                  : 'border-amber-500/20 hover:border-amber-500/40 bg-theme-surface/60'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-theme-primary flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
                    {action.title}
                  </CardTitle>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      isDanger ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}
                  >
                    {action.level}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-theme-secondary leading-relaxed">{action.description}</p>
                <Button
                  onClick={() => {
                    setActiveAction(action);
                    setConfirmInput('');
                  }}
                  variant="outline"
                  size="sm"
                  className={`w-full font-bold text-xs uppercase tracking-wider ${
                    isDanger
                      ? 'border-rose-500 text-rose-500 hover:bg-rose-500/10'
                      : 'border-amber-500 text-amber-500 hover:bg-amber-500/10'
                  }`}
                >
                  Initiate Routine
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Typed Confirmation Modal */}
      {activeAction && (
        <Modal
          isOpen={!!activeAction}
          onClose={() => {
            setActiveAction(null);
            setConfirmInput('');
          }}
          title="Destructive Action Confirmation"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm: {activeAction.title}</span>
              </div>
              <p className="text-xs text-rose-400 leading-relaxed font-medium">{activeAction.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                Type <span className="text-rose-500 font-mono select-all">"{activeAction.confirmPhrase}"</span> to confirm:
              </label>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={activeAction.confirmPhrase}
                className="font-mono text-sm uppercase"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveAction(null);
                  setConfirmInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processing || confirmInput.trim().toUpperCase() !== activeAction.confirmPhrase}
                onClick={handleExecute}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {processing ? 'Executing...' : 'Execute Operation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default OwnerControlCenter;

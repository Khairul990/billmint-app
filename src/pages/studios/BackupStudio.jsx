import React, { useState } from 'react';
import { Cloud, HardDrive, Download, RotateCcw, Clock, CheckCircle2, Upload, Trash2, DatabaseZap, AlertTriangle, ShieldCheck, FileSpreadsheet, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Label } from '../../components/ui/Input';
import { backupEngine } from '../../services/backupEngine';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';

const BackupStudio = ({ settings, onUpdate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);

  // Modal state for double confirmation
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, inputValue: '' });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await backupEngine.exportLocal();
      toast.success('Backup downloaded successfully!');
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setIsImporting(true);
      await backupEngine.importLocal(file);
      toast.success('Backup restored successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const executeResetRecords = async () => {
    try {
      setConfirmModal({ isOpen: false, type: null, inputValue: '' });
      setIsResetting(true);
      toast.loading('Deep cleaning records from cloud and device...', { id: 'reset-records' });
      await adminEngine.resetBusinessDataOnly(false); 
      toast.success('All business records wiped cleanly! Refreshing...', { id: 'reset-records' });
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error('Reset failed: ' + (err?.message || 'Unknown error'), { id: 'reset-records' });
      setIsResetting(false);
    }
  };

  const executeFactoryReset = async () => {
    try {
      setConfirmModal({ isOpen: false, type: null, inputValue: '' });
      setIsFactoryResetting(true);
      toast.loading('Purging entire application and account data...', { id: 'factory-reset' });
      await adminEngine.factoryResetAllData(false); 
      toast.success('App completely reset! Redirecting...', { id: 'factory-reset' });
      setTimeout(() => {
        window.location.href = '/';
      }, 600);
    } catch (err) {
      toast.error('Factory reset failed: ' + (err?.message || 'Unknown error'), { id: 'factory-reset' });
      setIsFactoryResetting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6 pb-4 relative">
        <div className="absolute -bottom-2 left-0 w-1/3 h-[1px] bg-gradient-to-r from-theme-accent/50 to-transparent" />
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 border border-theme-accent/20 text-theme-accent flex items-center justify-center shadow-inner relative overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)]"
          />
          <HardDrive className="w-6 h-6 relative z-10" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-theme-primary bg-clip-text text-transparent bg-gradient-to-r from-theme-primary to-theme-accent">
            Data & Backup Studio
          </h2>
          <p className="text-xs font-medium text-theme-muted mt-0.5">Export offline copies, restore records, and manage storage safety</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cloud & Sync Status */}
        <motion.div variants={itemVariants} className="card-premium relative overflow-hidden group p-6 bg-theme-surface/60 backdrop-blur-xl border border-theme-border-soft hover:border-theme-accent/40 hover:shadow-xl hover:shadow-theme-accent/5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-theme-accent" />
              </div>
              <h3 className="text-base font-black text-theme-primary">Cloud Sync</h3>
            </div>
            <button 
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center p-1 border ${settings?.autoBackup !== false ? 'bg-theme-accent border-theme-accent shadow-[0_0_15px_var(--accent-glow)]' : 'bg-theme-surface-elevated border-theme-border-strong'}`} 
              onClick={() => onUpdate({ autoBackup: !(settings?.autoBackup !== false) })}
            >
              <motion.span 
                layout
                className={`w-4 h-4 bg-white rounded-full shadow-md`} 
                animate={{ x: settings?.autoBackup !== false ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          <p className="text-[13px] text-theme-muted mb-6 leading-relaxed relative z-10">
            Automatically synchronizes your workspace records with secure cloud storage when internet is available.
          </p>

          <div className="p-4 bg-theme-surface/80 backdrop-blur-md rounded-2xl border border-theme-success/20 mb-6 flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-theme-success/15 text-theme-success flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-theme-primary">Enterprise Protection</p>
              <p className="text-[11px] font-medium text-theme-muted mt-0.5">Encrypted in IndexedDB & Backed Up</p>
            </div>
          </div>
          
          <Button 
            className="w-full relative z-10 h-12 text-sm" 
            variant="secondary"
            leftIcon={Cloud}
            onClick={async () => {
              toast.loading('Checking sync status...', { id: 'sync-status' });
              try {
                const { syncOfflineTransactions } = await import('../../services/dbEngine');
                const { BillQyroDB } = await import('../../services/localDb');
                await syncOfflineTransactions(true);
                const queue = await BillQyroDB.getAll('syncQueue');
                const pending = queue.filter(q => q.status === 'pending' || q.status === 'failed').length;
                if (pending > 0) {
                  toast.error(`There are ${pending} items waiting to sync. Please ensure internet is stable.`, { id: 'sync-status' });
                } else {
                  toast.success('Workspace synchronization verified! No pending items.', { icon: '✨', id: 'sync-status' });
                }
              } catch (e) {
                toast.error('Could not verify sync status.', { id: 'sync-status' });
              }
            }}
          >
            Verify Sync Status
          </Button>
        </motion.div>

        {/* 2. Local Backup & Restore */}
        <motion.div variants={itemVariants} className="card-premium relative overflow-hidden group p-6 bg-theme-surface/60 backdrop-blur-xl border border-theme-border-soft hover:border-theme-accent/40 hover:shadow-xl hover:shadow-theme-accent/5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-theme-accent" />
            </div>
            <h3 className="text-base font-black text-theme-primary">Offline Archive</h3>
          </div>
          
          <p className="text-[13px] text-theme-muted mb-6 leading-relaxed relative z-10">
            Save a complete offline snapshot of all your invoices, products, and customers to a single JSON file.
          </p>
          
          <div className="space-y-4 relative z-10">
            <Button 
              onClick={handleExport} 
              variant="outline" 
              className="w-full justify-start h-16 px-5 border-theme-border-strong hover:border-theme-accent hover:bg-theme-accent/5 transition-all duration-300 group/btn"
              isLoading={isExporting}
            >
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center mr-4 group-hover/btn:scale-110 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block text-theme-primary group-hover/btn:text-theme-accent transition-colors">Download JSON Snapshot</span>
                <span className="text-[11px] font-medium text-theme-muted block mt-0.5">Secure full backup to local device</span>
              </div>
            </Button>
            
            <label className="w-full block">
              <div className="w-full h-16 px-5 bg-theme-surface/80 backdrop-blur-md hover:bg-theme-accent/5 rounded-xl border border-theme-border-strong hover:border-theme-accent transition-all duration-300 flex items-center cursor-pointer group/btn">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center mr-4 shrink-0 group-hover/btn:scale-110 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block text-theme-primary group-hover/btn:text-theme-accent transition-colors">Restore from Archive</span>
                  <span className="text-[11px] font-medium text-theme-muted block mt-0.5">Upload a previously exported .json file</span>
                </div>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </motion.div>
      </div>

      {/* 3. Isolated Danger Zone */}
      <motion.div variants={itemVariants} className="card-premium relative overflow-hidden group p-6 border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-rose-500/20 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">Danger Zone</h3>
            <p className="text-[12px] font-medium text-theme-muted mt-0.5">Destructive actions for testing or full account reset</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          <div className="p-5 rounded-2xl border border-rose-500/20 bg-theme-surface/80 backdrop-blur-md flex flex-col justify-between hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
            <div className="mb-5">
              <p className="text-sm font-bold text-theme-primary">Reset Business Records</p>
              <p className="text-[12px] text-theme-muted mt-2 leading-relaxed">
                Deletes all invoices, customers, and products in this workspace. Your login account and settings remain safe.
              </p>
            </div>
            <Button 
              variant="danger" 
              className="h-11 w-full"
              leftIcon={DatabaseZap}
              disabled={isResetting || isFactoryResetting}
              onClick={() => setConfirmModal({ isOpen: true, type: 'reset', inputValue: '' })}
            >
              {isResetting ? 'Resetting...' : 'Reset Records Only'}
            </Button>
          </div>

          <div className="p-5 rounded-2xl border border-rose-500/20 bg-theme-surface/80 backdrop-blur-md flex flex-col justify-between hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
            <div className="mb-5">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Factory Reset Application</p>
              <p className="text-[12px] text-theme-muted mt-2 leading-relaxed">
                Permanently wipes all accounts, settings, and local database cache. You will be logged out immediately.
              </p>
            </div>
            <Button 
              variant="danger" 
              className="h-11 w-full shadow-lg shadow-rose-500/20"
              leftIcon={Trash2}
              disabled={isResetting || isFactoryResetting}
              onClick={() => setConfirmModal({ isOpen: true, type: 'factory', inputValue: '' })}
            >
              {isFactoryResetting ? 'Resetting...' : 'Factory Reset App'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.type === 'factory' ? "Factory Reset Application" : "Reset Business Records"}
        maxWidth="max-w-md"
      >
        <div className="space-y-5 p-1">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[13px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
              {confirmModal.type === 'factory' 
                ? "PERMANENT ACTION: This will wipe your account, settings, and ALL cloud and local data. This CANNOT be undone."
                : "Are you sure you want to permanently delete ALL invoices, customers, products, and expenses in this workspace? Your account login will remain safe."}
            </p>
          </div>

          <div className="space-y-2">
            <Label required className="text-sm font-bold">Type "DELETE" to confirm</Label>
            <Input 
              value={confirmModal.inputValue}
              onChange={(e) => setConfirmModal({ ...confirmModal, inputValue: e.target.value })}
              placeholder="DELETE"
              className="uppercase h-12 font-mono text-center tracking-widest text-lg font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" className="px-6 h-11" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="px-6 h-11"
              disabled={confirmModal.inputValue !== 'DELETE'}
              onClick={confirmModal.type === 'factory' ? executeFactoryReset : executeResetRecords}
            >
              {confirmModal.type === 'factory' ? 'Permanently Factory Reset' : 'Permanently Reset Records'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default BackupStudio;

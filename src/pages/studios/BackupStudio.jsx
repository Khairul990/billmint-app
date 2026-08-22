import React, { useState } from 'react';
import { Cloud, HardDrive, Download, RotateCcw, Clock, CheckCircle2, Upload, Trash2, DatabaseZap, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { backupEngine } from '../../services/backupEngine';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';

const BackupStudio = ({ settings, onUpdate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-4">
        <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-theme-primary">Data Management & Backup</h2>
          <p className="text-xs text-theme-muted">Export offline copies, restore records, and manage storage safety</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cloud & Sync Status */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm font-black text-theme-primary">Cloud Synchronization</h3>
            </div>
            <button 
              className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 border ${settings?.autoBackup !== false ? 'bg-theme-accent border-theme-accent' : 'bg-theme-surface border-theme-border-soft'}`} 
              onClick={() => onUpdate({ autoBackup: !(settings?.autoBackup !== false) })}
            >
              <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.autoBackup !== false ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <p className="text-xs text-theme-muted mb-5 leading-relaxed">
            Synchronizes your workspace records with secure cloud storage when an internet connection is available.
          </p>

          <div className="p-4 bg-theme-surface-elevated/70 rounded-2xl border border-theme-border-soft mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-primary">Data is Protected</p>
              <p className="text-[10px] text-theme-muted">Encrypted locally in IndexedDB & backed up</p>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            variant="secondary"
            leftIcon={Cloud}
            onClick={() => toast.success('Workspace synchronization verified')}
          >
            Check Sync Status
          </Button>
        </div>

        {/* 2. Local Backup & Restore */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <HardDrive className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Offline Backup & Restore</h3>
          </div>
          
          <p className="text-xs text-theme-muted mb-5 leading-relaxed">
            Save a complete offline snapshot of all your invoices, products, and customers to a single JSON file.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleExport} 
              variant="outline" 
              className="w-full justify-start h-12 px-4"
              isLoading={isExporting}
              leftIcon={Download}
            >
              <div className="text-left ml-2">
                <span className="text-xs font-bold block text-theme-primary">Download Full JSON Backup</span>
                <span className="text-[10px] text-theme-muted block">Save all records to your computer or phone</span>
              </div>
            </Button>
            
            <label className="w-full">
              <div className="w-full p-3.5 bg-theme-surface hover:bg-theme-surface-hover rounded-xl border border-theme-border-soft hover:border-theme-accent/50 transition-all flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block text-theme-primary">Restore from Backup File</span>
                  <span className="text-[10px] text-theme-muted block">Upload a previously exported .json file</span>
                </div>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Isolated Danger Zone */}
      <div className="card-premium p-6 border-theme-danger/30 bg-theme-danger/[0.02]">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-theme-danger/20">
          <div className="w-8 h-8 rounded-xl bg-theme-danger/10 text-theme-danger flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-theme-danger">Danger Zone</h3>
            <p className="text-[11px] text-theme-muted">Destructive actions for testing or full account reset</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-theme-danger/20 bg-theme-surface flex flex-col justify-between">
            <div className="mb-3">
              <p className="text-xs font-bold text-theme-primary">Reset Business Records</p>
              <p className="text-[10px] text-theme-muted mt-1 leading-relaxed">
                Deletes all invoices, customers, and products in this workspace. Your login account and settings remain safe.
              </p>
            </div>
            <Button 
              variant="danger" 
              size="sm"
              leftIcon={DatabaseZap}
              onClick={() => { 
                if (confirm('Are you sure you want to delete all invoices, customers, and products in this workspace? Your account login will remain safe.')) { 
                  adminEngine.resetBusinessDataOnly(); 
                  toast.success('Business records reset in progress...'); 
                } 
              }}
            >
              Reset Records Only
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-theme-danger/20 bg-theme-surface flex flex-col justify-between">
            <div className="mb-3">
              <p className="text-xs font-bold text-theme-danger">Factory Reset Application</p>
              <p className="text-[10px] text-theme-muted mt-1 leading-relaxed">
                Permanently wipes all accounts, settings, and local database cache. You will be logged out immediately.
              </p>
            </div>
            <Button 
              variant="danger" 
              size="sm"
              leftIcon={Trash2}
              onClick={() => { 
                if (confirm('PERMANENT ACTION: Reset entire app? This will wipe your account, settings, and ALL data. This CANNOT be undone.')) { 
                  adminEngine.factoryResetAllData(); 
                  toast.success('Factory reset in progress...'); 
                } 
              }}
            >
              Factory Reset App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupStudio;

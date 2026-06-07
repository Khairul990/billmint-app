import React, { useState, useRef } from 'react';
import { 
  Database, 
  DownloadCloud, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  History,
  FileJson
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportBackup } from '../services/dbEngine';

const BackupRestore = ({ settings, invoices, customers, products, expenses, onImportBackup }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const fileInputRef = useRef(null);

  const lastBackupDate = localStorage.getItem('last_backup_date') || 'Never';
  const totalRecords = (invoices?.length || 0) + (customers?.length || 0) + (products?.length || 0) + (expenses?.length || 0);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const backupData = await exportBackup();
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `BillQyro_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const now = new Date().toLocaleString();
      localStorage.setItem('last_backup_date', now);
      
      toast.success('Backup exported successfully!');
    } catch (err) {
      toast.error('Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        
        // Validation check (hardened)
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure. Root must be an object.');
        }
        if (parsed.appName !== 'BillQyro' && !parsed.invoices) {
          throw new Error('Invalid file type. Not a BillQyro backup.');
        }
        if (!Array.isArray(parsed.invoices)) {
          throw new Error('Corrupted data. Invoices data is missing or invalid.');
        }

        // Add default arrays if they are missing (for backward compatibility)
        if (!Array.isArray(parsed.customers)) parsed.customers = [];
        if (!Array.isArray(parsed.products)) parsed.products = [];
        if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
        if (!parsed.settings || typeof parsed.settings !== 'object') parsed.settings = {};

        setPendingImportData(parsed);
        setShowConfirmModal(true);
      } catch (err) {
        console.error("Backup import error:", err);
        toast.error(`Invalid backup file: ${err.message}`);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImportData || !onImportBackup) return;
    
    setIsImporting(true);
    try {
      onImportBackup(pendingImportData);
      toast.success('Data restored successfully!');
      setShowConfirmModal(false);
      setPendingImportData(null);
    } catch (err) {
      toast.error('Failed to restore data.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-theme-border-soft pb-6 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center shadow-sm">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Backup & Restore</h1>
          <p className="text-xs text-theme-muted font-bold mt-1">Keep your business data safe or migrate it to another device.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-theme-app dark:bg-theme-surface rounded-xl text-theme-muted">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Last Backup</p>
            <p className="text-sm font-extrabold text-theme-primary">{lastBackupDate}</p>
          </div>
        </div>
        <div className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-theme-app dark:bg-theme-surface rounded-xl text-theme-muted">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Total Local Records</p>
            <p className="text-sm font-extrabold text-theme-primary">{totalRecords} items</p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Export Box */}
        <div className="bg-theme-card border-2 border-theme-accent/20 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-premium hover:border-theme-accent/50 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <DownloadCloud className="w-6 h-6 text-theme-accent" />
              <h2 className="text-lg font-black text-theme-primary">Export Data</h2>
            </div>
            <p className="text-xs font-semibold text-theme-muted leading-relaxed mb-6">
              Download a complete snapshot of your database including invoices, customers, products, and settings. This file is encrypted safely.
            </p>
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2 text-[10px] font-bold text-theme-secondary">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Includes all local records
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-theme-secondary">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Standard JSON format
              </div>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-4 rounded-xl bg-theme-accent hover:bg-theme-accent-dark text-white font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><FileJson className="w-4 h-4" /> Download JSON Backup</>
            )}
          </button>
        </div>

        {/* Import Box */}
        <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UploadCloud className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-theme-primary">Restore Data</h2>
            </div>
            <p className="text-xs font-semibold text-theme-muted leading-relaxed mb-6">
              Import a previously exported BillQyro backup file to restore your entire database.
            </p>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex gap-3 mb-8">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                Warning: Restoring a backup will <strong className="font-black">overwrite</strong> your current local data. Please export your current data first.
              </p>
            </div>
          </div>
          
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-xl bg-theme-app dark:bg-theme-surface hover:bg-theme-border-soft dark:hover:bg-theme-surface text-theme-primary border border-theme-border-soft font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Select Backup File
          </button>
        </div>

      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your data stays on your device until synced.
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingImportData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-card/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-theme-card rounded-3xl w-full max-w-md shadow-2xl border border-theme-border-soft overflow-hidden animate-scaleUp">
            <div className="bg-rose-500 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-white">Overwrite Warning</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-theme-primary text-center">
                You are about to restore a backup created on <br/>
                <span className="text-theme-accent">
                  {new Date(pendingImportData.timestamp).toLocaleString()}
                </span>
              </p>
              
              <div className="bg-theme-app dark:bg-theme-surface rounded-xl p-4 text-[11px] font-semibold text-theme-muted space-y-2 border border-theme-border-soft">
                <p>• Current data will be erased</p>
                <p>• {pendingImportData.invoices?.length || 0} Invoices will be imported</p>
                <p>• {pendingImportData.customers?.length || 0} Customers will be imported</p>
              </div>

              <p className="text-[10px] text-center font-black uppercase tracking-widest text-rose-500">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 bg-theme-app dark:bg-theme-surface hover:bg-theme-border-soft dark:hover:bg-theme-surface rounded-xl text-xs font-black text-theme-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={isImporting}
                  className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 transition-all flex items-center justify-center"
                >
                  {isImporting ? 'Restoring...' : 'Yes, Restore Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BackupRestore;

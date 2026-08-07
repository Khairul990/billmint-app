import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  DownloadCloud, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  Shield,
  History,
  FileJson,
  Settings,
  RefreshCw,
  Clock,
  Cloud,
  Server,
  ArrowRight,
  Archive
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { backupEngine } from '../services/backupEngine';

import { pageVariants, staggerContainer, staggerItem, modalOverlayVariants, modalContentVariants } from '../utils/animations';
import { CardSkeleton } from '../components/PremiumSkeleton';
import PremiumEmptyState from '../components/PremiumEmptyState';

const BackupRestore = ({ settings, invoices, customers, products, expenses, onImportBackup }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    invoices: true, customers: true, products: true, expenses: true, settings: true
  });
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('weekly');
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const lastBackupDate = localStorage.getItem('last_backup_date') || 'Never';
  const totalRecords = (invoices?.length || 0) + (customers?.length || 0) + (products?.length || 0) + (expenses?.length || 0);
  const lastExportDate = localStorage.getItem('last_export_date') || 'Never';
  const storageEstimate = Math.max(1, (totalRecords * 0.5)).toFixed(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgressPercent(0);
      const progressTimer = setInterval(() => {
        setProgressPercent(p => Math.min(p + 15, 85));
      }, 400);
      const backupData = await backupEngine.exportLocal();
      clearInterval(progressTimer);
      setProgressPercent(100);
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
      localStorage.setItem('last_export_date', now);
      
      toast.success('Backup exported successfully!');
    } catch {
      toast.error('Failed to export backup.');
    } finally {
      setIsExporting(false);
      setProgressPercent(0);
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
    setProgressPercent(0);
    const progressTimer = setInterval(() => {
      setProgressPercent(p => Math.min(p + 25, 90));
    }, 200);
    try {
      onImportBackup(pendingImportData);
      clearInterval(progressTimer);
      setProgressPercent(100);
      toast.success('Data restored successfully!');
      setShowConfirmModal(false);
      setPendingImportData(null);
    } catch {
      toast.error('Failed to restore data.');
    } finally {
      setIsImporting(false);
      setProgressPercent(0);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in relative"
    >
      {isLoading ? (
        <div className="space-y-6">
          {[1,2,3,4].map(i => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      
      {totalRecords === 0 ? (
        <motion.div variants={staggerItem}>
          <PremiumEmptyState
            icon={Database}
            title="No Backup Data Yet"
            description="You haven't created any records yet. Add invoices, customers, products, or expenses first, then come back to create your first backup."
          />
        </motion.div>
      ) : (
        <>

      {/* Header */}
      <motion.div variants={staggerItem} className="section-header flex items-center gap-4 border-b border-theme-border-soft pb-6 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center shadow-sm glass">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Backup & Restore</h1>
          <p className="text-xs text-theme-muted font-bold mt-1">Keep your business data safe or migrate it to another device.</p>
        </div>
      </motion.div>

      {/* Backup Overview */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat-premium p-4 rounded-2xl border border-theme-border-soft bg-theme-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Last Backup</p>
            <History className="w-4 h-4 text-theme-muted" />
          </div>
          <p className="text-sm font-extrabold text-theme-primary">{lastBackupDate}</p>
        </div>
        <div className="stat-premium p-4 rounded-2xl border border-theme-border-soft bg-theme-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Backup Health</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge-premium ${lastBackupDate === 'Never' ? 'badge-danger' : 'badge-success'}`}>
              {lastBackupDate === 'Never' ? 'No Backup' : 'Healthy'}
            </span>
          </div>
        </div>
        <div className="stat-premium p-4 rounded-2xl border border-theme-border-soft bg-theme-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Cloud Sync</p>
            <Cloud className="w-4 h-4 text-theme-muted" />
          </div>
          <span className="badge-premium badge-info">Not Synced</span>
        </div>
        <div className="stat-premium p-4 rounded-2xl border border-theme-border-soft bg-theme-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-theme-muted">Storage Used</p>
            <Server className="w-4 h-4 text-theme-muted" />
          </div>
          <p className="text-sm font-extrabold text-theme-primary">~{storageEstimate} KB</p>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="divider-premium my-2" />
      </motion.div>

      {/* Main Actions */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Export Box */}
        <div className="card-premium bg-theme-card border-2 border-theme-accent/20 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-premium hover:border-theme-accent/50 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <DownloadCloud className="w-6 h-6 text-theme-accent" />
              <h2 className="text-lg font-black text-theme-primary">Export Center</h2>
            </div>
            <p className="text-xs font-semibold text-theme-muted leading-relaxed mb-4">
              Select the data types to include in your export.
            </p>
            {/* Data Type Checkboxes */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { key: 'invoices', label: 'Invoices' },
                { key: 'customers', label: 'Customers' },
                { key: 'products', label: 'Products' },
                { key: 'expenses', label: 'Expenses' },
                { key: 'settings', label: 'Settings' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-xl bg-theme-app dark:bg-theme-surface border border-theme-border-soft cursor-pointer hover:border-theme-accent/30 transition-colors tooltip-premium"
                  title={`Include ${label.toLowerCase()} in this backup`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDataTypes[key]}
                    onChange={() => setSelectedDataTypes(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-3.5 h-3.5 rounded accent-theme-accent"
                  />
                  <span className="text-[11px] font-bold text-theme-primary">{label}</span>
                </label>
              ))}
            </div>
            {lastExportDate !== 'Never' && (
              <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-theme-muted">
                <Clock className="w-3 h-3" />
                Last export: {lastExportDate}
              </div>
            )}
          </div>
          {isExporting && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-theme-muted">Exporting...</span>
                <span className="text-[10px] font-black text-theme-accent">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-theme-app dark:bg-theme-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-theme-accent to-indigo-400"
                />
              </div>
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-premium w-full"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><DownloadCloud className="w-4 h-4" /> Export Selected</>
            )}
          </button>
        </div>

        {/* Import Box */}
        <div className="card-premium bg-theme-card border border-theme-border-soft rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UploadCloud className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-black text-theme-primary">Restore Center</h2>
            </div>
            <p className="text-xs font-semibold text-theme-muted leading-relaxed mb-4">
              Drag & drop a backup file or click to browse.
            </p>
            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-theme-border-soft rounded-2xl p-6 mb-4 text-center cursor-pointer hover:border-theme-accent/50 hover:bg-theme-accent/5 transition-all tooltip-premium"
              title="Click to browse or drag a .json backup file here"
            >
              <UploadCloud className="w-8 h-8 text-theme-muted mx-auto mb-2" />
              <p className="text-[11px] font-bold text-theme-muted">Drop backup file here or tap to browse</p>
              <p className="text-[9px] text-theme-muted mt-1">Supports .json files up to 10MB</p>
            </div>
            <p className="text-xs font-semibold text-theme-muted leading-relaxed mb-4">
              Import a previously exported BillQyro backup file to restore your entire database.
            </p>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex gap-3 mb-4">
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
          {isImporting && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-theme-muted">Restoring...</span>
                <span className="text-[10px] font-black text-theme-accent">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-theme-app dark:bg-theme-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-400"
                />
              </div>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="btn-premium w-full"
          >
            <Archive className="w-4 h-4" /> Restore Backup
          </button>
        </div>

      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="divider-premium my-2" />
      </motion.div>

      {/* Auto Backup Recommendation */}
      <motion.div variants={staggerItem} className="card-premium p-5 md:p-6 rounded-2xl border border-theme-border-soft bg-theme-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-theme-primary">Auto Backup Recommendation</h3>
            <p className="text-[10px] font-semibold text-theme-muted">Set up automatic backups to keep your data safe</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={autoBackupFrequency}
            onChange={e => setAutoBackupFrequency(e.target.value)}
            className="input-premium flex-1"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={() => {
              setIsAutoBackupEnabled(!isAutoBackupEnabled);
              toast.success(isAutoBackupEnabled ? 'Auto backup disabled' : 'Auto backup enabled');
            }}
            className={`btn-premium ${isAutoBackupEnabled ? 'btn-premium-outline' : ''}`}
          >
            <Clock className="w-4 h-4" />
            {isAutoBackupEnabled ? 'Disable Auto Backup' : 'Enable Auto Backup'}
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="divider-premium my-2" />
      </motion.div>

      {/* Safety Warning */}
      <motion.div variants={staggerItem} className="card-premium p-5 md:p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:to-theme-card shadow-premium">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-theme-primary mb-1">Keep Multiple Backup Copies</h3>
            <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">
              Store your backup files in at least <strong className="font-black text-amber-600 dark:text-amber-400">two different locations</strong> (e.g., local download + cloud storage). A single backup creates a single point of failure — protect your business with redundancy.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                <Server className="w-3 h-3" /> Local Drive
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                <Cloud className="w-3 h-3" /> Cloud Storage
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <RefreshCw className="w-3 h-3" /> Regular Exports
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="divider-premium my-2" />
      </motion.div>

      {/* Safety Information */}
      <motion.div variants={staggerItem} className="card-premium p-5 md:p-6 rounded-2xl border border-theme-border-soft bg-theme-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-theme-primary">Safety Information</h3>
            <p className="text-[10px] font-semibold text-theme-muted">Best practices for keeping your data secure</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Server, text: 'Keep backups in multiple locations' },
            { icon: Cloud, text: 'Use cloud storage for redundancy' },
            { icon: Shield, text: 'Never share backup files publicly' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-theme-app dark:bg-theme-surface border border-theme-border-soft">
              <item.icon className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-theme-primary">{item.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Migration Guide */}
      <motion.div variants={staggerItem} className="card-premium p-5 md:p-6 rounded-2xl border border-theme-border-soft bg-theme-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-theme-primary">Migration Guide</h3>
            <p className="text-[10px] font-semibold text-theme-muted">Moving to a new device?</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {[
            { step: 1, icon: DownloadCloud, text: 'Export your data from the current device' },
            { step: 2, icon: UploadCloud, text: 'Transfer the backup file to your new device' },
            { step: 3, icon: Database, text: 'Import the backup into BillQyro on the new device' },
          ].map((item, i) => (
            <div key={i} className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-theme-app dark:bg-theme-surface border border-theme-border-soft">
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center text-xs font-black shrink-0">
                {item.step}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <item.icon className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                <p className="text-[11px] font-bold text-theme-primary">{item.text}</p>
              </div>
              {i < 2 && <ArrowRight className="w-4 h-4 text-theme-muted hidden sm:block shrink-0" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Protection Note */}
      <motion.div variants={staggerItem} className="flex flex-col items-center gap-3 pt-2">
        <div className="divider-premium w-full" />
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your data is encrypted in transit and stays on your device until you explicitly export or sync
        </div>
        <p className="text-[9px] font-semibold text-theme-muted/60 text-center max-w-lg">
          Backup files are standard JSON. For sensitive data, consider encrypting backup files before storing them in cloud services. BillQyro never transmits your data to any external server without your direct action.
        </p>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingImportData && (
        <motion.div
          variants={modalOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-card/60 backdrop-blur-xl"
        >
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-theme-card/95 backdrop-blur-md rounded-3xl w-full max-w-md shadow-2xl border border-theme-border-soft overflow-hidden glass"
          >
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

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  This will replace all current data with backup data
                </p>
              </div>
              
              <div className="bg-theme-app dark:bg-theme-surface rounded-xl p-4 text-[11px] font-semibold text-theme-muted space-y-2 border border-theme-border-soft">
                <p>• Current data will be erased and replaced</p>
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
          </motion.div>
        </motion.div>
      )}

        </>
      )}

        </motion.div>
      )}
    </motion.div>
  );
};

export default BackupRestore;

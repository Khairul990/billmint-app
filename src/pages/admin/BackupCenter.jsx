import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload, RefreshCw, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { BillQyroDB } from '../../services/localDb.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const BackupCenter = () => {
  const [exporting, setExporting] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const handleCreateBackup = async () => {
    setExporting(true);
    const toastId = toast.loading('Generating platform snapshot...');
    try {
      const backupData = await adminEngine.createPlatformBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billqyro-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Platform backup exported successfully.', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create backup: ' + e.message, { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid JSON format');
        }
        setPendingBackupData(json);
        setRestoreModalOpen(true);
      } catch (err) {
        toast.error('Invalid backup file. Must be valid BillQyro JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!pendingBackupData) return;
    setRestoring(true);
    const toastId = toast.loading('Restoring data records...');
    try {
      const res = await adminEngine.restorePlatformBackup(pendingBackupData);
      toast.success(`Successfully restored ${res.restoredRecords} records.`, { id: toastId });
      setRestoreModalOpen(false);
      setPendingBackupData(null);
    } catch (e) {
      console.error(e);
      toast.error('Restore failed: ' + e.message, { id: toastId });
    } finally {
      setRestoring(false);
    }
  };

  const handleExportCSV = async (type) => {
    const toastId = toast.loading(`Exporting ${type} CSV...`);
    try {
      let items = [];
      let headers = [];
      let filename = `billqyro-${type}-${new Date().toISOString().split('T')[0]}.csv`;

      if (type === 'users') {
        items = await adminEngine.getUsersList();
        headers = ['User ID', 'Email', 'Business Name', 'Plan', 'Created At'];
        items = items.map(u => [u.userId || u.id, u.email, u.businessName, u.planStatus, u.createdAt]);
      } else if (type === 'invoices') {
        items = await BillQyroDB.getAll('invoices').catch(() => []);
        headers = ['Invoice No', 'Customer Name', 'Grand Total', 'Paid Amount', 'Status', 'Date'];
        items = items.map(i => [i.invoiceNumber, i.customerName, i.grandTotal, i.paidAmount, i.status, i.date]);
      } else if (type === 'customers') {
        items = await BillQyroDB.getAll('customers').catch(() => []);
        headers = ['Customer Name', 'Phone', 'Email', 'Total Invoiced', 'Total Paid'];
        items = items.map(c => [c.name, c.phone, c.email, c.totalInvoiced || 0, c.totalPaid || 0]);
      }

      if (items.length === 0) {
        toast.error(`No ${type} records to export.`, { id: toastId });
        return;
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + [
        headers.join(','),
        ...items.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} CSV exported successfully.`, { id: toastId });
    } catch (e) {
      toast.error('Export failed: ' + e.message, { id: toastId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-theme-accent" />
            Backup, Snapshot & Restore Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Authoritative platform-wide JSON snapshots, schema validation, and table-level CSV exports.
          </p>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-500" />
              Full Platform Backup
            </CardTitle>
            <p className="text-xs text-theme-secondary">
              Generates a complete multi-store snapshot including invoices, customers, products, ledger, and settings.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-xs text-theme-muted space-y-1">
              <div className="flex justify-between">
                <span>Schema Version:</span> <strong className="text-theme-primary">8.0.0 (IndexedDB v8)</strong>
              </div>
              <div className="flex justify-between">
                <span>Format:</span> <strong className="text-theme-primary">Encrypted JSON Structure</strong>
              </div>
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={exporting}
              variant="primary"
              className="w-full font-bold"
              leftIcon={Download}
            >
              {exporting ? 'Generating...' : 'Download Full Backup (.json)'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Restore Platform Snapshot
            </CardTitle>
            <p className="text-xs text-theme-secondary">
              Import and merge a previous BillQyro backup file. Data is validated before applying to stores.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-semibold leading-relaxed">
              Restoring imports records without deleting unmentioned tables. Existing records with identical IDs are safely updated.
            </div>
            <label className="w-full flex items-center justify-center p-3 rounded-xl border border-dashed border-theme-border-soft hover:border-theme-accent cursor-pointer bg-theme-surface-elevated text-xs font-bold text-theme-primary transition-colors">
              <Upload className="w-4 h-4 mr-2 text-theme-accent" /> Select Backup File (.json)
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export Studio */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-theme-accent" />
            Table-Level CSV Exports
          </CardTitle>
          <p className="text-xs text-theme-secondary">
            Export granular tabular datasets for spreadsheet accounting and external audits.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => handleExportCSV('invoices')} leftIcon={FileText} className="font-bold text-xs">
              Export Invoices (CSV)
            </Button>
            <Button variant="outline" onClick={() => handleExportCSV('customers')} leftIcon={FileText} className="font-bold text-xs">
              Export Customers (CSV)
            </Button>
            <Button variant="outline" onClick={() => handleExportCSV('users')} leftIcon={FileText} className="font-bold text-xs">
              Export User Directory (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restore Verification Modal */}
      {restoreModalOpen && pendingBackupData && (
        <Modal
          isOpen={restoreModalOpen}
          onClose={() => {
            setRestoreModalOpen(false);
            setPendingBackupData(null);
          }}
          title="Validate & Confirm Platform Restore"
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Backup Payload Verified</span>
              </div>
              <p className="text-xs text-amber-400 font-medium">
                The selected snapshot was created on <strong>{new Date(pendingBackupData.exportedAt || Date.now()).toLocaleString()}</strong> (Schema v{pendingBackupData.schemaVersion || 8}).
              </p>
            </div>

            <div className="p-4 bg-theme-surface-elevated rounded-xl border border-theme-border-soft space-y-2 text-xs">
              <span className="font-black uppercase tracking-wider text-theme-muted block mb-1">Records to Restore:</span>
              <div className="grid grid-cols-2 gap-2 text-theme-secondary">
                <div>Invoices: <strong className="text-theme-primary">{pendingBackupData.invoices?.length || 0}</strong></div>
                <div>Customers: <strong className="text-theme-primary">{pendingBackupData.customers?.length || 0}</strong></div>
                <div>Products: <strong className="text-theme-primary">{pendingBackupData.products?.length || 0}</strong></div>
                <div>Expenses: <strong className="text-theme-primary">{pendingBackupData.expenses?.length || 0}</strong></div>
                <div>Ledger: <strong className="text-theme-primary">{pendingBackupData.bankLedger?.length || 0}</strong></div>
                <div>Settings: <strong className="text-theme-primary">{pendingBackupData.settings?.length || 0}</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setPendingBackupData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={restoring}
                onClick={handleExecuteRestore}
                className="font-bold"
              >
                {restoring ? 'Restoring...' : 'Confirm & Restore Records'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default BackupCenter;

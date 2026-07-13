import React from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';

const BackupCenter = () => {
  const handleBackup = () => {
    toast.success('Database backup initiated. This may take a few minutes.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-theme-primary flex items-center tracking-tight">
            <Database className="w-8 h-8 mr-3 text-theme-accent" /> Backup Center
          </h2>
          <p className="text-theme-secondary text-sm mt-1">Manage database backups and exports.</p>
        </div>
      </div>

      <div className="bg-theme-surface-elevated p-6 rounded-3xl border border-theme-border-soft">
        <h3 className="text-theme-primary font-bold mb-4">Platform Backups</h3>
        <p className="text-theme-secondary text-sm mb-6">Create manual backups of the entire Firestore database.</p>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleBackup} variant="primary" leftIcon={Database}>
            Create Backup
          </Button>
          <Button variant="outline" leftIcon={Download}>
            Download Latest
          </Button>
          <Button variant="outline" className="border-theme-danger text-theme-danger hover:bg-theme-danger/10" leftIcon={Upload}>
            Restore Backup
          </Button>
        </div>
      </div>

      <div className="bg-theme-surface-elevated p-6 rounded-3xl border border-theme-border-soft">
        <h3 className="text-theme-primary font-bold mb-4">Export Tools</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="ghost" className="border border-theme-border-soft" size="sm">Export Users (CSV)</Button>
          <Button variant="ghost" className="border border-theme-border-soft" size="sm">Export Payment Proofs (ZIP)</Button>
          <Button variant="ghost" className="border border-theme-border-soft" size="sm">Export Revenue Reports</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default BackupCenter;

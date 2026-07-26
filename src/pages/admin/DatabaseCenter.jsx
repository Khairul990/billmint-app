import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const DatabaseCenter = () => {
  const handleBackup = () => {
    toast.success('Database backup initiated. This may take a few minutes.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Server className="w-8 h-8 mr-3 text-theme-accent" /> Database Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Manage database backups, exports, and platform collections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Backups</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Create manual backups of the entire Firestore database.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleBackup} 
                variant="primary"
                leftIcon={Database}
              >
                Create Backup
              </Button>
              <Button 
                variant="outline"
                leftIcon={Download}
              >
                Download Latest
              </Button>
              <Button 
                variant="outline"
                className="border-theme-danger text-theme-danger hover:bg-theme-danger/10"
                leftIcon={Upload}
              >
                Restore Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Tools</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Export specific collections for analysis.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm">Export Users (CSV)</Button>
              <Button variant="outline" size="sm">Export Payment Proofs (ZIP)</Button>
              <Button variant="outline" size="sm">Export Revenue Reports</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default memo(DatabaseCenter);

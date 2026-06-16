import React from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BackupCenter = () => {
  const handleBackup = () => {
    toast.success('Database backup initiated. This may take a few minutes.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Database className="w-6 h-6 mr-3 text-blue-500" /> Backup Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage database backups and exports.</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Platform Backups</h3>
        <p className="text-slate-400 text-sm mb-6">Create manual backups of the entire Firestore database.</p>
        
        <div className="flex flex-wrap gap-4">
          <button onClick={handleBackup} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center transition-colors">
            <Database className="w-5 h-5 mr-2" /> Create Backup
          </button>
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center border border-slate-700 transition-colors">
            <Download className="w-5 h-5 mr-2" /> Download Latest
          </button>
          <button className="px-6 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold rounded-xl flex items-center transition-colors border border-rose-500/20">
            <Upload className="w-5 h-5 mr-2" /> Restore Backup
          </button>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Export Tools</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">Export Users (CSV)</button>
          <button className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">Export Payment Proofs (ZIP)</button>
          <button className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">Export Revenue Reports</button>
        </div>
      </div>
    </motion.div>
  );
};

export default BackupCenter;

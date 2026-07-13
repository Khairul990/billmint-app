import React from 'react';
import { Cloud, HardDrive, Download, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

const BackupStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 flex items-center justify-center shadow-inner">
          <Cloud className="w-6 h-6 text-indigo-400 drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Backup Studio</h2>
          <p className="text-xs text-theme-muted font-medium">Manage cloud backups, local exports, and disaster recovery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloud Auto-Backup */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">Cloud Auto-Backup</h3>
            </div>
            <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 ${settings?.autoBackup ? 'bg-indigo-500' : 'bg-white/10'}`} onClick={() => onUpdate({ autoBackup: !settings?.autoBackup })}>
              <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.autoBackup ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <p className="text-xs text-theme-muted mb-6 leading-relaxed">
            Automatically backup your database, settings, and files to BillQyro secure cloud every 24 hours.
          </p>

          <div className="p-4 bg-black/20 rounded-xl border border-white/5 mb-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-white">System is Protected</p>
            <p className="text-[10px] text-theme-muted mt-1">Last backup: Today at 02:00 AM</p>
          </div>
          
          <button className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
            <Cloud className="w-4 h-4" /> Backup Now
          </button>
        </div>

        {/* Local Backup & Restore */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-black text-white">Local Snapshots</h3>
          </div>
          
          <p className="text-xs text-theme-muted mb-6 leading-relaxed">
            Download a complete offline copy of your workspace data (JSON/SQLite). You can restore from a local file anytime.
          </p>
          
          <div className="space-y-3 mb-6">
            <button className="w-full p-4 bg-black/20 hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Export Database</p>
                  <p className="text-[10px] text-theme-muted mt-0.5">Download full .bqy backup</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-4 bg-black/20 hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Restore from File</p>
                  <p className="text-[10px] text-theme-muted mt-0.5">Upload a .bqy backup file</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupStudio;

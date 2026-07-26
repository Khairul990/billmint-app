import React from 'react';
import { Cloud, HardDrive, Download, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const BackupStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
          <Cloud className="w-6 h-6 text-theme-accent drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">Backup Studio</h2>
          <p className="text-xs text-theme-secondary font-medium">Manage cloud backups, local exports, and disaster recovery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloud Auto-Backup */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-premium-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[50px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm font-black text-theme-primary">Cloud Auto-Backup</h3>
            </div>
            <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 border ${settings?.autoBackup ? 'bg-theme-accent border-theme-accent' : 'bg-theme-surface border-theme-border-strong'}`} onClick={() => onUpdate({ autoBackup: !settings?.autoBackup })}>
              <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.autoBackup ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <p className="text-xs text-theme-secondary mb-6 leading-relaxed">
            Automatically backup your database, settings, and files to BillQyro secure cloud every 24 hours.
          </p>

          <div className="p-4 bg-theme-surface-elevated rounded-2xl border border-theme-border-soft mb-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-8 h-8 text-theme-success mb-2 drop-shadow-sm" />
            <p className="text-sm font-bold text-theme-primary">System is Protected</p>
            <p className="text-[10px] text-theme-secondary mt-1">Last backup: Today at 02:00 AM</p>
          </div>
          
          <Button className="w-full" leftIcon={Cloud}>
            Backup Now
          </Button>
        </div>

        {/* Local Backup & Restore */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden shadow-premium-sm">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Local Snapshots</h3>
          </div>
          
          <p className="text-xs text-theme-secondary mb-6 leading-relaxed">
            Download a complete offline copy of your workspace data (JSON/SQLite). You can restore from a local file anytime.
          </p>
          
          <div className="space-y-3 mb-6">
            <button className="w-full p-4 bg-theme-surface-elevated hover:bg-theme-surface-hover rounded-2xl border border-theme-border-soft hover:border-theme-accent/50 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-theme-accent" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors">Export Database</p>
                  <p className="text-[10px] text-theme-secondary mt-0.5">Download full .bqy backup</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-4 bg-theme-surface-elevated hover:bg-theme-surface-hover rounded-2xl border border-theme-border-soft hover:border-theme-warning/50 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-warning/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-theme-warning" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-theme-primary group-hover:text-theme-warning transition-colors">Restore from File</p>
                  <p className="text-[10px] text-theme-secondary mt-0.5">Upload a .bqy backup file</p>
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

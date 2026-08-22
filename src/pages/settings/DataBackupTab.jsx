import React from 'react';
import { Database, Download, Upload, Trash2, ShieldAlert, Smartphone, Laptop, RefreshCw } from 'lucide-react';

const DataBackupTab = (props) => {
  const { handleExportData, handleImportData, dbProvider, handleSetDbProvider, handleGranularWipe, handleResetData, storageInfo } = props;

  return (
    <>
          
            <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent2/20 text-theme-accent">
                  <Database size={28} className="drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-text to-theme-text/70 dark:from-theme-dark-text dark:to-theme-dark-text/70">Data Backup & Storage</h2>
                  <p className="text-theme-text-soft dark:text-theme-dark-text-soft text-sm">Monitor and manage your business data safely</p>
                </div>
              </div>

              {storageInfo && (
                <div className="space-y-4">

                  <div className="bg-theme-bg/50 dark:bg-theme-dark-bg/50 rounded-2xl p-6 border border-theme-border-soft dark:border-theme-border-soft relative overflow-hidden group hover:border-theme-accent/30 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-theme-text dark:text-theme-dark-text">LocalStorage Usage</span>
                      <span className={`font-bold ${storageInfo.percentage > 95 ? 'text-theme-danger' : storageInfo.percentage > 80 ? 'text-theme-warning' : 'text-theme-success'}`}>
                        {storageInfo.percentage}% ({storageInfo.kb} / {storageInfo.limitKb} KB)
                      </span>
                    </div>
                    <div className="w-full bg-theme-border-soft dark:bg-theme-border-soft/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${storageInfo.percentage > 95 ? 'bg-red-500' : storageInfo.percentage > 80 ? 'bg-theme-warning/50' : 'bg-theme-success'}`} 
                        style={{ width: `${storageInfo.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft mt-2">
                      {storageInfo.percentage > 95 ? 'CRITICAL: Clear cache or delete items.' : storageInfo.percentage > 80 ? 'WARNING: Usage is getting high.' : 'SAFE: Storage is healthy.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={handleExport}
                      className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-theme-success/5 hover:bg-theme-success/10 transition-colors text-left"
                    >
                      <Database className="text-theme-success" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Download Full Backup</div>
                        <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Save a complete offline JSON backup of your workspace</div>
                      </div>
                    </button>
                    
                    <div className="flex flex-col gap-2">
                      <div className="text-[10px] text-theme-warning dark:text-theme-warning/80 font-bold uppercase tracking-wider px-1">
                        ⚠️ This will NOT delete invoices or customers. Recommendation: Download Backup first.
                      </div>
                      <button 
                        onClick={handleClearCacheOnly}
                        className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left h-full"
                      >
                        <RotateCcw className="text-blue-500" size={24} />
                        <div>
                          <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clear App Cache</div>
                          <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Fixes UI bugs by resetting temporary local cache</div>
                        </div>
                      </button>
                    </div>
                    
                    {isAdmin && (
                      <>
                        <button 
                          onClick={handleCleanTemporaryData}
                          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-theme-success/5 hover:bg-theme-success/10 transition-colors text-left"
                        >
                          <RefreshCw className="text-theme-success" size={24} />
                          <div>
                            <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clean Temporary Data</div>
                            <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Clear logs & old sync queue</div>
                          </div>
                        </button>

                        <button 
                          onClick={handleCleanDuplicateDrafts}
                          className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-theme-warning/50/5 hover:bg-theme-warning/10 transition-colors text-left"
                        >
                          <Trash2 className="text-theme-warning" size={24} />
                          <div>
                            <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clean Duplicate Drafts</div>
                            <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Remove empty/zero drafts</div>
                          </div>
                        </button>
                        <button 
                          onClick={handleClearAllLocalData}
                          className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-theme-danger/10 transition-colors text-left md:col-span-1"
                        >
                          <ShieldAlert className="text-theme-danger" size={24} />
                          <div>
                            <div className="font-semibold text-red-600 dark:text-theme-danger">HARD RESET (Admin)</div>
                            <div className="text-xs text-theme-danger/80">Completely wipe ALL local storage</div>
                          </div>
                        </button>

                        <button 
                          onClick={handleEmptyTrash}
                          className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left md:col-span-1"
                        >
                          <Trash2 className="text-theme-danger" size={24} />
                          <div>
                            <div className="font-semibold text-theme-danger dark:text-theme-danger">Empty Trash Data</div>
                            <div className="text-xs text-theme-danger/80">Permanently delete all soft-deleted invoices</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
    </>
  );
};

export default DataBackupTab;
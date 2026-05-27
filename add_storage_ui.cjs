const fs = require('fs');

let settings = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// 1. Add imports
settings = settings.replace(
  'getStorageUsage,',
  `getStorageUsage,
  cleanDuplicateDrafts,
  cleanTemporaryData,
  clearCacheOnly,`
);

// 2. Add Tab object
settings = settings.replace(
  /{ id: 'pwa', label: 'Install App', icon: Download }/g,
  `{ id: 'pwa', label: 'Install App', icon: Download },
            { id: 'storage', label: 'Storage & Health', icon: HardDrive }`
);

// 3. Add Storage State
const storageState = `
  const [storageInfo, setStorageInfo] = useState(null);
  
  useEffect(() => {
    if (activeTab === 'storage') {
      try {
        setStorageInfo(getStorageUsage());
      } catch (e) {
        console.log('Failed to get storage usage', e);
      }
    }
  }, [activeTab]);

  const handleCleanTemporaryData = async () => {
    if (window.confirm("Are you sure you want to clean temporary data? (Logs, 7-day old sync queue items)")) {
      const removed = await cleanTemporaryData();
      toast.success(\`Temporary data cleaned. Removed \${removed} items.\`);
      setStorageInfo(getStorageUsage());
    }
  };

  const handleCleanDuplicateDrafts = async () => {
    if (window.confirm("Are you sure you want to clean duplicate zero-amount drafts? Real invoices will NOT be deleted.")) {
      const removed = await cleanDuplicateDrafts();
      toast.success(\`Duplicate drafts cleaned. Removed \${removed} items.\`);
      setStorageInfo(getStorageUsage());
    }
  };

  const handleClearCacheOnly = () => {
    if (window.confirm("This will clear LocalStorage cache. Real data stays in IndexedDB. Proceed?")) {
      clearCacheOnly();
      toast.success("Cache cleared! Please refresh the page.");
      setStorageInfo(getStorageUsage());
    }
  };
`;
settings = settings.replace(
  /const \[activeTab, setActiveTab\] = useState\('profile'\);/,
  `const [activeTab, setActiveTab] = useState('profile');\n${storageState}`
);

// 4. Add Storage Render Block
const storageRender = `
          {/* 7. STORAGE & HEALTH TAB */}
          {activeTab === 'storage' && (
            <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent2/20 text-theme-accent">
                  <HardDrive size={28} className="drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-text to-theme-text/70 dark:from-theme-dark-text dark:to-theme-dark-text/70">Storage & Data Health</h2>
                  <p className="text-theme-text-soft dark:text-theme-dark-text-soft text-sm">Monitor and manage application data usage</p>
                </div>
              </div>

              {storageInfo && (
                <div className="space-y-4">
                  <div className="bg-theme-bg/50 dark:bg-theme-dark-bg/50 rounded-2xl p-6 border border-theme-border-soft dark:border-theme-border-soft relative overflow-hidden group hover:border-theme-accent/30 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-theme-text dark:text-theme-dark-text">LocalStorage Usage</span>
                      <span className={\`font-bold \${storageInfo.percentage > 95 ? 'text-red-500' : storageInfo.percentage > 80 ? 'text-amber-500' : 'text-emerald-500'}\`}>
                        {storageInfo.percentage}% ({storageInfo.kb} / {storageInfo.limitKb} KB)
                      </span>
                    </div>
                    <div className="w-full bg-theme-border-soft dark:bg-theme-border-soft/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className={\`h-3 rounded-full transition-all duration-1000 \${storageInfo.percentage > 95 ? 'bg-red-500' : storageInfo.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}\`} 
                        style={{ width: \`\${storageInfo.percentage}%\` }}
                      ></div>
                    </div>
                    <p className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft mt-2">
                      {storageInfo.percentage > 95 ? 'CRITICAL: Clear cache or delete items.' : storageInfo.percentage > 80 ? 'WARNING: Usage is getting high.' : 'SAFE: Storage is healthy.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={exportBackup}
                      className="flex items-center gap-3 p-4 rounded-xl border border-theme-accent/20 bg-theme-accent/5 hover:bg-theme-accent/10 transition-colors text-left"
                    >
                      <Database className="text-theme-accent" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Export Full Backup</div>
                        <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Download complete JSON backup</div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleCleanTemporaryData}
                      className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left"
                    >
                      <RefreshCw className="text-emerald-500" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clean Temporary Data</div>
                        <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Clear logs & old sync queue</div>
                      </div>
                    </button>

                    <button 
                      onClick={handleCleanDuplicateDrafts}
                      className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <Trash2 className="text-amber-500" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clean Duplicate Drafts</div>
                        <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Remove empty/zero drafts</div>
                      </div>
                    </button>

                    <button 
                      onClick={handleClearCacheOnly}
                      className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <RotateCcw className="text-blue-500" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Clear Cache Only</div>
                        <div className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft">Resets LocalStorage UI cache</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
`;

settings = settings.replace(
  /{\/\* 6\. APP INSTALL \/ PWA TAB \*\//,
  storageRender + '\n\n          {/* 6. APP INSTALL / PWA TAB */'
);

fs.writeFileSync('src/pages/Settings.jsx', settings);
console.log('Settings.jsx updated with Storage UI');

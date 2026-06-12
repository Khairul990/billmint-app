import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ReceiptText, LogOut, ShieldCheck, Sun, Moon, User } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Logo from './Logo';
import { getSettings, saveSettings } from '../services/dbEngine';
import { updateFaviconForTheme } from '../utils/themeIcon';
import { flushSyncQueue } from '../services/syncEngine';

/**
 * Global App Layout Shell
 * @param {React.ReactNode} children - inner page node
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Function} onLogout - logout event callback
 * @param {Object} businessSettings - current active business details
 */
const Layout = ({ children, currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userRole, invoices = [], subscription = {}, userEmail, onQuickBillOpen, pendingPaymentsCount = 0, businessWorkspaces, activeWorkspaceId, setActiveWorkspace, syncSource, syncStatus }) => {
  // Theme and Mode state
  const [themeColor, setThemeColor] = useState(() => {
    // Migration: If old themePreset is "dark", default to "light" color (dark mode handled below)
    const preset = businessSettings?.themeColor || businessSettings?.themePreset || localStorage.getItem('billqyro_theme_color') || 'light';
    return preset === 'dark' ? 'light' : preset;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const isDark = businessSettings?.darkMode ?? (businessSettings?.themePreset === 'dark') ?? (localStorage.getItem('billqyro_dark_mode') === 'true');
    return isDark;
  });

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close dropdown on outside click or tab change
  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [currentTab]);

  useEffect(() => {
    if (businessSettings?.themeColor || businessSettings?.themePreset) {
      const preset = businessSettings.themeColor || businessSettings.themePreset;
      setThemeColor(preset === 'dark' ? 'light' : preset);
    }
    if (businessSettings?.darkMode !== undefined) {
      setIsDarkMode(businessSettings.darkMode);
    } else if (businessSettings?.themePreset === 'dark') {
      setIsDarkMode(true);
    }
  }, [businessSettings?.themeColor, businessSettings?.darkMode, businessSettings?.themePreset]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeColor);
    updateFaviconForTheme(themeColor);
    localStorage.setItem('billqyro_theme_color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('billqyro_dark_mode', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newDarkMode = !prev;
      const currentSettings = getSettings() || {};
      currentSettings.darkMode = newDarkMode;
      
      // Clear legacy dark preset so it doesn't conflict
      if (currentSettings.themePreset === 'dark') {
        currentSettings.themePreset = 'light';
      }
      
      saveSettings(currentSettings);
      window.dispatchEvent(new CustomEvent('billqyro_sync'));
      return newDarkMode;
    });
  };

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Financial Dashboard';
      case 'invoices':
        return 'Invoices System';
      case 'create-invoice':
        return 'Invoice Builder';
      case 'customers':
        return 'Client CRM';
      case 'products':
        return 'Product & Service Catalog';
      case 'expenses':
        return 'Overhead Expense Logger';
      case 'subscription':
        return 'SaaS Licensing Tiers';
      case 'more':
        return 'More Workspace Options';
      case 'admin-panel':
        return 'Admin Control Panel';
      case 'settings':
        return 'Business Settings';
      default:
        return 'BillQyro';
    }
  };

  return (
    <div className="h-[100dvh] bg-theme-app flex flex-col lg:flex-row w-full font-sans antialiased text-theme-primary transition-colors duration-300 overflow-hidden">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
        businessSettings={businessSettings}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        userEmail={userEmail}
        pendingPaymentsCount={pendingPaymentsCount}
        businessWorkspaces={businessWorkspaces}
        activeWorkspaceId={activeWorkspaceId}
      />

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 overflow-y-auto overflow-x-hidden">
        
        {/* Header Block with Premium Dual-Theme Layout */}
        <header className="relative bg-theme-card/80 backdrop-blur-md border-b border-theme-border-soft px-6 py-8 md:py-10 text-theme-primary shadow-[0_1px_3px_rgba(7,13,25,0.01),0_10px_20px_-10px_rgba(7,13,25,0.02)] transition-colors duration-200 z-30">
          {/* Subtle Ambient Background Gradients wrapped to prevent overflow spill */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-theme-surface dark:bg-theme-surface/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
            <div className="absolute -bottom-10 left-10 w-48 h-48 bg-theme-accent-light dark:bg-theme-accent-light rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-[1600px] w-full mx-auto px-4 lg:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-theme-muted bg-theme-app px-2.5 py-0.5 rounded-full border border-theme-border-soft backdrop-blur-md">
                  Active Workspace
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-theme-accent dark:text-theme-accent bg-theme-accent-light border border-theme-accent/15 dark:border-theme-border-soft px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure
                </span>
                {/* Workspace Switcher */}
                <WorkspaceSwitcher
                  businessWorkspaces={businessWorkspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  setActiveWorkspace={setActiveWorkspace}
                  setCurrentTab={setCurrentTab}
                />
                {/* Sync Status Badge */}
                <div className="relative group">
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-colors ${
                    syncStatus === 'Synced' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 
                    syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20 animate-pulse' : 
                    syncStatus === 'Offline' ? 'text-red-500 bg-red-500/10 border border-red-500/20' :
                    'text-amber-500 bg-amber-500/10 border border-amber-500/20' // Pending or Error
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      syncStatus === 'Synced' ? 'bg-emerald-500' : 
                      syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-blue-500 animate-ping' : 
                      syncStatus === 'Offline' ? 'bg-red-500' :
                      'bg-amber-500'
                    }`}></span> 
                    {syncStatus === 'Synced' ? 'Cloud Synced' : syncStatus}
                  </span>

                  {/* Retry Button Dropdown */}
                  {(syncStatus === 'Pending Sync' || syncStatus === 'Sync Error') && (
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-50">
                      <button
                        onClick={flushSyncQueue}
                        className="text-[10px] font-bold uppercase tracking-wider bg-theme-card border border-theme-border-soft px-3 py-1.5 rounded shadow-lg text-theme-primary hover:bg-theme-accent hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Retry Sync
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-theme-primary">
                {getPageTitle(currentTab)}
              </h2>
              <p className="text-xs md:text-sm text-theme-muted font-semibold mt-1">
                Manage your enterprise invoices, clients, and assets smoothly.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Premium Light/Dark Theme Switcher */}
              <button
                onClick={toggleTheme}
                type="button"
                className="w-10 h-10 rounded-2xl bg-theme-app border border-theme-border-soft flex items-center justify-center text-theme-primary hover:scale-105 active:scale-95 transition-transform shadow-sm cursor-pointer"
                title={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
              >
                {!isDarkMode ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </button>

              {/* Account Dropdown Container */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-10 h-10 rounded-2xl bg-theme-app border border-theme-border-soft flex items-center justify-center text-theme-primary hover:scale-105 active:scale-95 transition-transform shadow-sm cursor-pointer"
                  title="Account Settings"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {isAccountMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAccountMenuOpen(false)}
                    />
                    <div className="absolute top-14 right-0 w-72 bg-theme-card dark:bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft dark:border-theme-border-soft z-50 overflow-hidden flex flex-col">
                      <div className="p-4 bg-theme-app dark:bg-theme-surface border-b border-theme-border-soft dark:border-theme-border-soft">
                        <p className="text-sm font-bold text-theme-primary dark:text-theme-primary dark:text-theme-primary truncate">
                          {businessSettings?.businessName || 'My Business'}
                        </p>
                        <p className="text-xs text-theme-muted dark:text-theme-muted truncate">
                          {businessSettings?.email || userEmail || 'No email provided'}
                        </p>
                      </div>
                      
                      <div className="p-4 border-b border-theme-border-soft dark:border-theme-border-soft">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-theme-muted dark:text-theme-muted">Free Bills Limit</span>
                          <span className="text-xs font-bold text-theme-accent dark:text-theme-accent">
                            {invoices.length} / {subscription?.status === 'premium' ? '∞' : (businessSettings?.freeInvoiceLimit || 15)}
                          </span>
                        </div>
                        <div className="w-full bg-theme-surface dark:bg-theme-card rounded-full h-1.5 mb-3">
                          <div 
                            className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((invoices.length / (subscription?.status === 'premium' ? 100 : (businessSettings?.freeInvoiceLimit || 15))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        {subscription?.status !== 'premium' && (
                          <button
                            onClick={() => {
                              setCurrentTab('subscription');
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full py-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 text-xs font-bold rounded-xl shadow-sm transition-opacity"
                          >
                            Upgrade to Premium
                          </button>
                        )}
                      </div>

                      <div className="p-2">
                        {isAuthenticated ? (
                          <button
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              if(onLogout) onLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-theme-danger dark:text-theme-danger hover:bg-theme-danger/5 dark:hover:bg-theme-danger/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentTab('login');
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-theme-accent dark:text-theme-accent hover:bg-theme-accent-light dark:hover:bg-theme-accent-light rounded-xl transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4" />
                            Log In
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Shell */}
        <main className={`flex-1 ${currentTab === 'create-invoice' ? 'max-w-[1500px] lg:px-6' : 'max-w-6xl'} w-full mx-auto p-4 md:px-6 md:py-6`}>
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Nav Menu (Hidden on Desktop) */}
      <BottomNav 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onQuickBillOpen={onQuickBillOpen} 
        pendingPaymentsCount={pendingPaymentsCount}
        businessSettings={businessSettings}
      />
    </div>
  );
};

export default Layout;

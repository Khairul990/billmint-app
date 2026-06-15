import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ReceiptText, LogOut, ShieldCheck, Sun, Moon, User, Search, Bell, Settings as SettingsIcon, HelpCircle, Activity, Briefcase, Sparkles } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Logo from './Logo';
import { getSettings, saveSettings } from '../services/dbEngine';
import { updateFaviconForTheme } from '../utils/themeIcon';
import { flushSyncQueue } from '../services/syncEngine';
import { motion } from 'framer-motion';
import AnimatedBorderTrail from './AnimatedBorderTrail';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';

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
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchInputRef = React.useRef(null);

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

  // Close dropdowns on outside click or tab change
  useEffect(() => {
    setIsAccountMenuOpen(false);
    setIsNotificationMenuOpen(false);
  }, [currentTab]);

  // Global Keyboard Shortcut: Ctrl + K for Search Focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        setActiveWorkspace={setActiveWorkspace}
        syncStatus={syncStatus}
        flushSyncQueue={flushSyncQueue}
      />

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 overflow-y-auto overflow-x-hidden bg-theme-app transition-colors duration-300 relative z-10">
        
        {/* Header Block with Premium Dual-Theme Layout */}
        <header className="sticky top-0 z-40 bg-theme-card/80 backdrop-blur-xl border-b border-theme-accent/50 px-4 sm:px-6 py-4 md:py-5 text-theme-primary shadow-sm transition-all duration-300">
          {/* Subtle Ambient Background Gradients wrapped to prevent overflow spill */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-theme-surface dark:bg-theme-surface/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
            <div className="absolute -bottom-10 left-10 w-48 h-48 bg-theme-accent-light dark:bg-theme-accent-light rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-full w-full mx-auto px-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            
            {/* LEFT: Workspace Info */}
            <div className="flex items-start md:items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-theme-muted bg-theme-app px-2.5 py-0.5 rounded-full border border-theme-border-soft backdrop-blur-md hidden sm:block">
                    Active Workspace
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent/15 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Secure
                  </span>
                </div>
                <div className="flex items-center">
                  <WorkspaceSwitcher
                    businessWorkspaces={businessWorkspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    setActiveWorkspace={setActiveWorkspace}
                    setCurrentTab={setCurrentTab}
                  />
                  {/* Sync Status Badge */}
                  <div className="relative group ml-2">
                    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                      syncStatus === 'Synced' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 
                      syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20 animate-pulse' : 
                      syncStatus === 'Offline' ? 'text-red-500 bg-red-500/10 border border-red-500/20' :
                      'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        syncStatus === 'Synced' ? 'bg-emerald-500' : 
                        syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-blue-500 animate-ping' : 
                        syncStatus === 'Offline' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`}></span> 
                      {syncStatus === 'Synced' ? 'Cloud Synced' : syncStatus}
                    </span>
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
              </div>
            </div>

            {/* CENTER: Global Search Bar */}
            <div className="flex-1 max-w-xl hidden md:block px-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-theme-muted group-focus-within:text-theme-accent transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search invoices, customers, products..."
                  className="block w-full pl-10 pr-14 py-2.5 bg-theme-surface border border-theme-accent/50 rounded-full text-sm font-semibold shadow-sm text-theme-primary placeholder-theme-secondary focus:bg-theme-card focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent transition-all duration-300 hover:shadow-md hover:border-theme-accent/70"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <span className="text-[10px] font-bold text-theme-muted bg-theme-surface px-1.5 py-0.5 rounded-md border border-theme-border-soft shadow-sm">
                    Ctrl K
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 justify-end">
              {/* Mobile Search Icon */}
              <button className="md:hidden w-11 h-11 rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary hover:bg-theme-app hover:shadow-md hover:border-theme-accent/30 active:scale-95 transition-all duration-300 shadow-sm relative group overflow-hidden">
                <AnimatedBorderTrail />
                <Search className="w-5 h-5 relative z-10" />
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                  className="w-11 h-11 md:w-[42px] md:h-[42px] rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary hover:bg-theme-app hover:shadow-md hover:border-theme-accent/30 active:scale-95 transition-all duration-300 shadow-sm relative group overflow-hidden"
                >
                  <AnimatedBorderTrail />
                  <Bell className="w-5 h-5 relative z-10" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-theme-danger rounded-full border border-theme-app animate-pulse z-20"></span>
                </button>
                
                {isNotificationMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationMenuOpen(false)} />
                    <div className="absolute top-14 right-0 w-80 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-theme-border-soft flex justify-between items-center bg-theme-surface/50">
                        <h3 className="text-sm font-bold text-theme-primary">Notifications</h3>
                        <span className="text-[10px] font-bold text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded-full">3 New</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto no-scrollbar p-2 space-y-1">
                        {/* Dummy Notifications */}
                        <div className="p-3 hover:bg-theme-surface rounded-xl transition-colors cursor-pointer flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-theme-primary">Cloud Sync Complete</p>
                            <p className="text-[10px] text-theme-muted mt-0.5">All your data is securely backed up.</p>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-theme-surface rounded-xl transition-colors cursor-pointer flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                            <ReceiptText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-theme-primary">New Invoice Created</p>
                            <p className="text-[10px] text-theme-muted mt-0.5">INV-2026-001 was generated successfully.</p>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-theme-surface rounded-xl transition-colors cursor-pointer flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-theme-primary">Subscription Updated</p>
                            <p className="text-[10px] text-theme-muted mt-0.5">Your premium features are now active.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <AnimatedThemeToggler
                className="w-11 h-11 md:w-[42px] md:h-[42px] rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary hover:bg-theme-app hover:shadow-md hover:border-theme-accent/30 active:scale-95 transition-all duration-300 shadow-sm relative group overflow-hidden"
                variant="circle"
                theme={isDarkMode ? "dark" : "light"}
                onThemeChange={(newTheme) => {
                  const newDarkMode = newTheme === "dark";
                  if (newDarkMode !== isDarkMode) {
                    toggleTheme();
                  }
                }}
                title={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
              >
                <AnimatedBorderTrail />
              </AnimatedThemeToggler>

              {/* Settings Action */}
              <button
                onClick={() => setCurrentTab('settings')}
                className="hidden sm:flex w-11 h-11 md:w-[42px] md:h-[42px] rounded-2xl bg-theme-surface border border-theme-border-soft items-center justify-center text-theme-primary hover:bg-theme-app hover:shadow-md hover:border-theme-accent/30 active:scale-95 transition-all duration-300 shadow-sm relative group overflow-hidden"
                title="Settings"
              >
                <AnimatedBorderTrail />
                <SettingsIcon className="w-5 h-5 relative z-10" />
              </button>

              {/* Premium Account Dropdown Container */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-11 h-11 md:w-[42px] md:h-[42px] rounded-2xl bg-[image:var(--accent-gradient)] shadow-premium text-theme-button-text flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden border border-white/10 group relative"
                  title="Account Settings"
                >
                  <AnimatedBorderTrail />
                  {businessSettings?.logoUrl ? (
                    <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover relative z-10" />
                  ) : (
                    <span className="font-black text-lg relative z-10">{businessSettings?.businessName?.charAt(0) || 'B'}</span>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {isAccountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)} />
                    <div className="absolute top-14 right-0 w-80 bg-theme-card rounded-3xl shadow-2xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
                      
                      {/* Top Profile Section */}
                      <div className="p-5 bg-theme-surface/50 border-b border-theme-border-soft flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-theme-card shadow-sm border border-theme-border-soft flex items-center justify-center overflow-hidden shrink-0">
                          {businessSettings?.logoUrl ? (
                            <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-black text-xl text-theme-primary">{businessSettings?.businessName?.charAt(0) || 'B'}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-theme-primary truncate">{businessSettings?.businessName || 'My Business'}</p>
                          <p className="text-xs font-semibold text-theme-muted truncate">{businessSettings?.email || userEmail || 'No email provided'}</p>
                        </div>
                      </div>
                      
                      {/* Premium Workspace Card */}
                      <div className="p-4">
                        <div className="bg-[image:var(--accent-gradient)] rounded-2xl p-4 shadow-premium relative overflow-hidden text-white">
                          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span className="text-xs font-black uppercase tracking-wider">{subscription?.status === 'premium' ? 'Premium Plan' : 'Free Plan'}</span>
                              </div>
                              <p className="text-[10px] font-bold text-white/80">
                                Workspace: {businessSettings?.businessWorkspaces?.find(w => w.id === activeWorkspaceId)?.name || 'Default'}
                              </p>
                            </div>
                            <span className="bg-white/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
                              Active
                            </span>
                          </div>
                          
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-white/90">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Cloud Sync Connected
                          </div>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="px-3 pb-3 space-y-1 border-b border-theme-border-soft">
                        <button onClick={() => { setCurrentTab('dashboard'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <User className="w-4 h-4 text-theme-muted" /> Profile
                        </button>
                        <button onClick={() => { setCurrentTab('settings'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <SettingsIcon className="w-4 h-4 text-theme-muted" /> Business Settings
                        </button>
                        <button onClick={() => { setCurrentTab('more'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <Briefcase className="w-4 h-4 text-theme-muted" /> Workspace Manager
                        </button>
                        <button onClick={() => { setCurrentTab('subscription'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <Sparkles className="w-4 h-4 text-theme-muted" /> Subscription Plan
                        </button>
                        <button onClick={() => { setCurrentTab('system-health'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <Activity className="w-4 h-4 text-theme-muted" /> Storage & Health
                        </button>
                        <button onClick={() => { setCurrentTab('help-center'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <HelpCircle className="w-4 h-4 text-theme-muted" /> Help Center
                        </button>
                      </div>

                      {/* What's New Section */}
                      <div className="p-4 bg-theme-surface/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-black text-theme-primary">🚀 What's New</span>
                          <span className="text-[9px] font-bold text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded-full">v2.0</span>
                        </div>
                        <ul className="text-[10px] font-semibold text-theme-muted space-y-1 ml-4 list-disc">
                          <li>Faster Sync Engine</li>
                          <li>Multi Business Support</li>
                          <li>Live Invoice Link</li>
                          <li>Mobile Improvements</li>
                        </ul>
                        <p className="text-[9px] text-theme-muted/70 mt-3 font-semibold">Last Updated: Just now</p>
                      </div>

                      {/* Logout */}
                      <div className="p-2 border-t border-theme-border-soft">
                        {isAuthenticated ? (
                          <button
                            onClick={() => { setIsAccountMenuOpen(false); if(onLogout) onLogout(); }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" /> Log Out
                          </button>
                        ) : (
                          <button
                            onClick={() => { setCurrentTab('login'); setIsAccountMenuOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-theme-accent hover:bg-theme-accent-light rounded-xl transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4" /> Log In
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
        <main className="flex-1 min-w-0 w-full max-w-full mx-auto p-4 md:px-6 md:py-6">
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

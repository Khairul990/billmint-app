import React, { useState, useEffect } from 'react';
import PremiumClock from './PremiumClock';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Search, Bell, Settings as SettingsIcon, Sparkles, ShieldCheck, User, Briefcase, Activity, HelpCircle, LogOut, Cloud, CloudOff, RefreshCw, Crown } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Logo from './Logo';
import { settingsEngine } from '../services/settingsEngine';
import { flushSyncQueue } from '../services/syncEngine';
import AnimatedBorderTrail from './AnimatedBorderTrail';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';
import { getNotifications, markNotificationAsRead, clearAllNotifications } from '../services/notificationsService';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children, currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userRole, invoices = [], subscription = {}, userEmail, onQuickBillOpen, pendingPaymentsCount = 0, businessWorkspaces, activeWorkspaceId, setActiveWorkspace, syncSource, syncStatus }) => {
  const { isDarkMode } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchInputRef = React.useRef(null);
  const notificationMenuRef = React.useRef(null);
  const accountMenuRef = React.useRef(null);
  const mobileNotificationMenuRef = React.useRef(null);
  const mobileAccountMenuRef = React.useRef(null);

  useOnClickOutside(notificationMenuRef, () => setIsNotificationMenuOpen(false));
  useOnClickOutside(accountMenuRef, () => setIsAccountMenuOpen(false));
  useOnClickOutside(mobileNotificationMenuRef, () => setIsNotificationMenuOpen(false));
  useOnClickOutside(mobileAccountMenuRef, () => setIsAccountMenuOpen(false));

  useEffect(() => {
    setNotifications(getNotifications());
    const handleNotifUpdate = () => setNotifications(getNotifications());
    window.addEventListener('billqyro_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('billqyro_notifications_updated', handleNotifUpdate);
  }, []);

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

  useEffect(() => {
    setIsAccountMenuOpen(false);
    setIsNotificationMenuOpen(false);
  }, [currentTab]);

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

  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;
    const currentSettings = await settingsEngine.getSettings() || {};
    currentSettings.darkMode = newDarkMode;
    if (currentSettings.themePreset === 'dark') {
      currentSettings.themePreset = 'light';
    }
    settingsEngine.saveSettings(currentSettings);
    
    // Broadcast setting update for ThemeContext
    window.dispatchEvent(new CustomEvent('billqyro:settings-updated', { detail: currentSettings }));
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  };

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Financial Dashboard';
      case 'invoices':
        return 'Invoices System';
      case 'create-invoice':
        return 'Invoice Builder';
      case 'estimates':
        return 'Estimates & Quotes';
      case 'pdf-templates':
        return 'PDF Templates';
      case 'live-link-templates':
      case 'billing-portal-settings':
      case 'student-portal-settings':
        return 'Live Link Studio';
      case 'marketplace':
        return 'Template Marketplace';
      case 'customers':
        return 'Client CRM';
      case 'patients':
        return 'Patient Records';
      case 'students':
        return 'Student Directory';
      case 'clients':
        return 'Client Roster';
      case 'products':
        return 'Product & Service Catalog';
      case 'expenses':
        return 'Overhead Expense Logger';
      case 'outsource':
        return 'Outsource & Vendor Hub';
      case 'subscription':
        return 'Subscription Plan';
      case 'reports':
        return 'Reports & Analytics';
      case 'due-ledger':
        return 'Due Ledger';
      case 'pending-payments':
        return 'Payment Proofs';
      case 'backup-restore':
        return 'Backup & Restore';
      case 'help-center':
        return 'Help Center';
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
    <div className="h-screen overflow-hidden bg-theme-app flex flex-col lg:flex-row w-full font-sans antialiased text-theme-primary transition-colors duration-300">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
        businessSettings={businessSettings}
        subscription={subscription}
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

      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-theme-app transition-colors duration-300 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {localStorage.getItem('billqyro_demo_session_active') === 'true' && (
          <div className="bg-amber-500 text-amber-950 font-black text-xs py-1.5 text-center uppercase tracking-widest z-50 relative shadow-md flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-900 animate-pulse"></span>
            DEMO MODE ACTIVE — Real data is safe
          </div>
        )}

        {businessSettings?.maintenanceMode && userRole !== 'admin' && (
          <div className="bg-rose-600 text-white font-black text-xs py-1.5 text-center uppercase tracking-widest z-50 relative shadow-md flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            SYSTEM MAINTENANCE ACTIVE — Invoice creation, live links, and premium upgrades are temporarily disabled.
          </div>
        )}        {/* ===== ULTRA LUXURY COMMAND TOPBAR ===== */}
        <header className="sticky top-0 z-40 bg-theme-app/80 backdrop-blur-2xl text-theme-primary border-b border-theme-border-soft/70 transition-all select-none">
          <div className="max-w-full w-full mx-auto px-4 lg:px-6 hidden md:flex items-center justify-between gap-4 py-2.5">
            
            {['settings', 'create-invoice'].includes(currentTab) ? (
              <div id="studio-header-portal" className="flex items-center flex-1 min-w-[280px]"></div>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-theme-primary">
                    {currentTab === 'dashboard' ? 'Dashboard' : getPageTitle(currentTab)}
                  </span>
                  <span className="text-theme-border-strong font-light">/</span>
                  <span className="text-[11px] font-semibold text-theme-muted truncate max-w-[160px]">
                    {currentTab === 'dashboard' ? 'Financial Overview' : (businessSettings?.businessName || 'Workspace')}
                  </span>
                </div>

                {/* Sync status pill */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted">
                  {syncStatus === 'Synced' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="hidden lg:inline">Cloud Synced</span>
                    </>
                  ) : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-500" />
                      <span className="hidden lg:inline text-blue-500">Syncing</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-2.5 h-2.5 text-rose-500" />
                      <span className="hidden lg:inline text-rose-500">Offline</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* INTEGRATED SEARCH COMMAND (Center) */}
            <div className="flex-1 max-w-md hidden md:block px-2">
              <button
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="w-full flex items-center justify-between pl-3 pr-2 py-1.5 bg-theme-surface/70 hover:bg-theme-surface border border-theme-border-soft hover:border-theme-border-strong rounded-xl text-xs font-semibold text-theme-muted transition-all shadow-inner-glow cursor-pointer text-left group"
                title="Open Command Search (⌘K / Ctrl+K)"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-theme-muted group-hover:text-theme-accent transition-colors" />
                  <span className="text-theme-muted group-hover:text-theme-primary transition-colors">Search invoices, customers, reports...</span>
                </div>
                <kbd className="text-[9px] font-bold text-theme-muted bg-theme-card px-1.5 py-0.5 rounded border border-theme-border-soft font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* COMMAND BAR CONTROLS (Right) */}
            <div className="flex items-center gap-2 shrink-0">
              <div id="studio-header-actions-portal" className="flex items-center"></div>
              
              {/* Notification Hub */}
              <div className="relative" ref={notificationMenuRef}>
                <button 
                  onClick={() => setIsNotificationMenuOpen(prev => !prev)}
                  title="Notifications"
                  aria-label="Notifications"
                  className="w-8 h-8 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {isNotificationMenuOpen && (
                  <div className="absolute top-10 right-0 w-80 bg-theme-card rounded-2xl shadow-xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
                    <div className="p-3.5 border-b border-theme-border-soft flex justify-between items-center bg-theme-surface/50">
                      <h3 className="text-xs font-bold text-theme-primary">Notifications</h3>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button onClick={clearAllNotifications} className="text-[10px] font-bold text-theme-muted hover:text-theme-primary underline">Clear All</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-theme-muted text-center py-4 font-medium">No new notifications</p>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setIsNotificationMenuOpen(false);
                            }}
                            className={`p-2.5 hover:bg-theme-surface rounded-xl transition-colors cursor-pointer flex gap-2.5 ${notif.read ? 'opacity-60' : ''}`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-theme-primary truncate">{notif.title}</p>
                              <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Switcher */}
              <AnimatedThemeToggler
                className="w-8 h-8 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
                variant="circle"
                theme={isDarkMode ? "dark" : "light"}
                onThemeChange={(newTheme) => {
                  const newDarkMode = newTheme === "dark";
                  if (newDarkMode !== isDarkMode) {
                    toggleTheme();
                  }
                }}
                title={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
              />

              {/* Settings Action */}
              <button
                onClick={() => setCurrentTab('settings')}
                className="w-8 h-8 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors"
                title="Business Settings"
                aria-label="Settings"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
              </button>

              {/* User Avatar Menu */}
              <div className="relative flex items-center" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="w-8 h-8 rounded-xl bg-theme-accent text-white flex items-center justify-center font-black text-xs shadow-sm hover:opacity-90 transition-opacity overflow-hidden border border-theme-border-soft"
                  title="Account Settings"
                >
                  {businessSettings?.logoUrl ? (
                    <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{businessSettings?.businessName?.charAt(0) || 'B'}</span>
                  )}
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute top-12 right-0 w-64 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-y-auto max-h-[65vh] py-2 flex flex-col custom-scrollbar">
                      
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
                          <p className="text-xs font-semibold text-theme-muted truncate">
                            {localStorage.getItem('billqyro_demo_video_creator') === 'true'
                              ? '••••••••@••••.•••'
                              : (businessSettings?.email || userEmail || 'No email provided')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="bg-[image:var(--accent-gradient)] rounded-xl p-4 shadow-sm relative overflow-hidden text-white">
                          
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
                        <button onClick={() => { setCurrentTab('system-health'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <Activity className="w-4 h-4 text-theme-muted" /> Storage & Health
                        </button>
                        <button onClick={() => { setCurrentTab('help-center'); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-theme-primary hover:bg-theme-surface rounded-xl transition-colors cursor-pointer">
                          <HelpCircle className="w-4 h-4 text-theme-muted" /> Help Center
                        </button>
                      </div>

                      <div className="p-4 bg-theme-surface/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-black text-theme-primary">What's New</span>
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
                )}
              </div>
            </div>
          </div>

          {/* ===== MOBILE HEADER: Compact 2-Row (max 110px) ===== */}
          <div className="md:hidden flex flex-col relative z-10">
            {/* Row 1: Workspace + Sync Badge */}
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <WorkspaceSwitcher
                  businessWorkspaces={businessWorkspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  setActiveWorkspace={setActiveWorkspace}
                  setCurrentTab={setCurrentTab}
                  mobile
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {syncStatus === 'Synced' ? (
                  <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    Synced
                  </span>
                ) : syncStatus === 'Offline' ? (
                  <span className="flex items-center gap-1 text-[8px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    Offline
                  </span>
                ) : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? (
                  <span className="flex items-center gap-1 text-[8px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping"></span>
                    Sync
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                    <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                    Pending
                  </span>
                )}
                <span className="flex items-center gap-1 text-[8px] font-bold text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded-full border border-theme-accent/15">
                  <ShieldCheck className="w-2 h-2" />
                  Secure
                </span>
              </div>
            </div>
            {/* Row 2: Search + Notification + Theme + Profile */}
            <div className="flex items-center justify-end gap-1.5 px-4 pb-2 pt-0">
              <button
                onClick={() => document.querySelector('[data-search-input]')?.focus()}
                title="Search"
                aria-label="Search"
                className="w-9 h-9 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary active:scale-95 transition-all"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <div className="relative" ref={mobileNotificationMenuRef}>
                <button
                  onClick={() => setIsNotificationMenuOpen(prev => !prev)}
                  title="Notifications"
                  aria-label="Notifications"
                  className="w-9 h-9 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary active:scale-95 transition-all"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {pendingPaymentsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-theme-card">
                      {pendingPaymentsCount}
                    </span>
                  )}
                </button>
                {isNotificationMenuOpen && (
                    <div className="absolute top-12 right-0 w-72 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-theme-border-soft flex justify-between items-center">
                        <p className="text-xs font-bold text-theme-primary">Notifications</p>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[9px] font-bold text-theme-muted underline">Clear All</button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto no-scrollbar p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-theme-muted text-center py-4 font-semibold">No new notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`p-2 hover:bg-theme-surface rounded-xl transition-colors cursor-pointer flex gap-2 ${notif.read ? 'opacity-60' : ''}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : notif.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-theme-accent/10 text-theme-accent'}`}>
                                <Bell className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-theme-primary leading-tight">{notif.title}</p>
                                <p className="text-[9px] text-theme-muted mt-0.5 leading-tight">{notif.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                )}
              </div>
              <AnimatedThemeToggler
                className="rounded-full bg-theme-surface border border-theme-border-soft flex items-center text-theme-primary active:scale-95 transition-all"
                variant="circle"
                theme={isDarkMode ? "dark" : "light"}
                onThemeChange={(newTheme) => {
                  const newDarkMode = newTheme === "dark";
                  if (newDarkMode !== isDarkMode) toggleTheme();
                }}
                title={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
                aria-label={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
              />
              <div className="relative" ref={mobileAccountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                title="Account"
                aria-label="Account"
                className="w-9 h-9 rounded-xl bg-[image:var(--accent-gradient)] text-theme-button-text flex items-center justify-center active:scale-95 transition-transform overflow-hidden border border-white/10 shadow-sm"
              >
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-sm">{businessSettings?.businessName?.charAt(0) || 'B'}</span>
                )}
              </button>
              {isAccountMenuOpen && (
                <div className="absolute top-12 right-0 w-64 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-y-auto max-h-[65vh] py-2 flex flex-col custom-scrollbar">
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
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setIsAccountMenuOpen(false); if(onLogout) onLogout(); }} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-colors cursor-pointer">
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* ===== MOBILE STUDIO TOOLBAR (md:hidden) ===== */}
          {['settings', 'create-invoice'].includes(currentTab) && (
            <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 border-t border-theme-border-soft bg-theme-surface/60 backdrop-blur-md">
              <div id="studio-header-portal-mobile" className="flex items-center gap-2 min-w-0 flex-1" />
              <div id="studio-header-actions-portal-mobile" className="flex items-center gap-2 shrink-0" />
            </div>
          )}
        </header>

        <main className={`flex-1 min-w-0 w-full mx-auto ${['create-invoice', 'settings'].includes(currentTab) ? 'p-0 max-w-none' : 'max-w-full p-3 md:px-6 md:py-6'}`}>
          {children}
        </main>
      </div>

      <BottomNav 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onQuickBillOpen={onQuickBillOpen} 
        pendingPaymentsCount={pendingPaymentsCount}
        businessSettings={businessSettings}
      />

      {/* Safe area spacer for mobile notch/home indicator */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-theme-card pointer-events-none z-50" />
    </div>
  );
};

export default Layout;

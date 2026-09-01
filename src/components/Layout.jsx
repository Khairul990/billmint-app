import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumClock from './PremiumClock';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { 
  Clock,
  Search, 
  Bell, 
  Settings as SettingsIcon, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Briefcase, 
  Activity, 
  HelpCircle, 
  LogOut, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Crown,
  Menu,
  X,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Layers,
  TrendingDown,
  BookOpen,
  BarChart3,
  CreditCard,
  Landmark,
  Plus,
  ChevronRight,
  Database
} from 'lucide-react';
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
  const [timeNow, setTimeNow] = useState(new Date());
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchInputRef = React.useRef(null);
  const notificationMenuRef = React.useRef(null);
  const accountMenuRef = React.useRef(null);
  const mobileNotificationMenuRef = React.useRef(null);
  const mobileAccountMenuRef = React.useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

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
    setIsMobileDrawerOpen(false);
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
      case 'collection-center':
      case 'payments':
      case 'pending-payments':
        return 'Payment Collection Center';
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
            <div className="flex items-center gap-2 shrink-0 pr-1">
              <div id="studio-header-actions-portal" className="flex items-center"></div>
              
              {/* Executive Command Cluster */}
              <div className="p-1 bg-white/90 dark:bg-theme-card/90 backdrop-blur-xl rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft flex items-center gap-1.5 shadow-sm">
                {/* 1. Live Real-Time Clock Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <Clock className="w-3.5 h-3.5 text-[#c2410c] dark:text-theme-accent shrink-0" />
                  <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary font-numbers tracking-tight">
                    {timeNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-[#f0ece6] dark:bg-theme-border-soft mx-0.5" />

                {/* 2. Notification Hub */}
                <div className="relative" ref={notificationMenuRef}>
                  <button 
                    onClick={() => setIsNotificationMenuOpen(prev => !prev)}
                    title="Notifications"
                    aria-label="Notifications"
                    className="w-9 h-9 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted hover:text-[#c2410c] dark:hover:text-theme-accent transition-all relative cursor-pointer group active:scale-95"
                  >
                    <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-theme-card animate-pulse"></span>
                    )}
                  </button>
                  
                  {isNotificationMenuOpen && (
                    <div className="absolute top-11 right-0 w-80 bg-theme-card rounded-2xl shadow-xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
                      <div className="p-3.5 border-b border-theme-border-soft flex justify-between items-center bg-theme-surface/50">
                        <h3 className="text-xs font-bold text-theme-primary">Notifications</h3>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[10px] font-bold text-theme-muted hover:text-theme-primary underline cursor-pointer">Clear All</button>
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

                {/* 2. Theme Switcher */}
                <AnimatedThemeToggler
                  className="w-9 h-9 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted hover:text-[#c2410c] dark:hover:text-theme-accent transition-all cursor-pointer active:scale-95"
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

                {/* 3. Settings Action */}
                <button
                  onClick={() => setCurrentTab('settings')}
                  className="w-9 h-9 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted hover:text-[#c2410c] dark:hover:text-theme-accent transition-all cursor-pointer group active:scale-95"
                  title="Business Settings"
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-4 h-4 transition-transform group-hover:rotate-45 duration-300" />
                </button>

                {/* Separator */}
                <div className="w-px h-5 bg-[#f0ece6] dark:bg-theme-border-soft mx-0.5" />

                {/* 4. User Avatar Menu */}
                <div className="relative flex items-center" ref={accountMenuRef}>
                  <button
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c2410c] to-[#ea580c] p-0.5 shadow-2xs hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center cursor-pointer border border-[#c2410c]/20"
                    title="Account Settings"
                  >
                    {businessSettings?.logoUrl ? (
                      <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[9px] bg-white" />
                    ) : (
                      <span className="text-white font-black text-xs">{businessSettings?.businessName?.charAt(0) || 'B'}</span>
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
          </div>

          {/* ===== MOBILE HEADER: Compact 2-Row (max 110px) ===== */}
          <div className="md:hidden flex flex-col relative z-10">
            {/* Row 1: Drawer Toggle + Workspace + Sync Badge */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
                className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-primary active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                <Menu className="w-4 h-4 text-theme-primary" />
              </button>

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
            {/* Row 2: Search + Notification + Theme + Settings + Profile (Unified Executive Cluster) */}
            <div className="flex items-center justify-between px-3 pb-2 pt-0 gap-2">
              <button
                onClick={() => document.querySelector('[data-search-input]')?.focus()}
                title="Search"
                aria-label="Search"
                className="h-9 px-3 rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center gap-2 text-theme-muted text-xs flex-1 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="truncate">Search...</span>
              </button>

              <div className="p-1 bg-white/90 dark:bg-theme-card/90 backdrop-blur-xl rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft flex items-center gap-1 shrink-0 shadow-sm">
                {/* Mobile Clock Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#faf8f5] dark:bg-theme-surface text-[10px] font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{timeNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>

                <div className="w-px h-4 bg-[#f0ece6] dark:bg-theme-border-soft mx-0.5" />

                <div className="relative" ref={mobileNotificationMenuRef}>
                  <button
                    onClick={() => setIsNotificationMenuOpen(prev => !prev)}
                    title="Notifications"
                    aria-label="Notifications"
                    className="w-8 h-8 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted active:scale-95 transition-all relative"
                  >
                    <Bell className="w-4 h-4" />
                    {pendingPaymentsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-theme-card">
                        {pendingPaymentsCount}
                      </span>
                    )}
                  </button>
                  {isNotificationMenuOpen && (
                    <div className="absolute top-10 right-0 w-72 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-hidden flex flex-col">
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
                  className="w-8 h-8 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted active:scale-95 transition-all"
                  variant="circle"
                  theme={isDarkMode ? "dark" : "light"}
                  onThemeChange={(newTheme) => {
                    const newDarkMode = newTheme === "dark";
                    if (newDarkMode !== isDarkMode) toggleTheme();
                  }}
                  title={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
                  aria-label={`Switch to ${!isDarkMode ? 'Dark' : 'Light'} Mode`}
                />

                <button
                  onClick={() => setCurrentTab('settings')}
                  className="w-8 h-8 rounded-xl hover:bg-[#faf5ef] dark:hover:bg-theme-surface flex items-center justify-center text-[#78716c] dark:text-theme-muted active:scale-95 transition-all"
                  title="Settings"
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-[#f0ece6] dark:bg-theme-border-soft mx-0.5" />

                <div className="relative" ref={mobileAccountMenuRef}>
                  <button
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    title="Account"
                    aria-label="Account"
                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#c2410c] to-[#ea580c] p-0.5 shadow-2xs hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center cursor-pointer border border-[#c2410c]/20"
                  >
                    {businessSettings?.logoUrl ? (
                      <img src={businessSettings.logoUrl} alt="" className="w-full h-full object-cover rounded-[8px] bg-white" />
                    ) : (
                      <span className="font-black text-xs text-white">{businessSettings?.businessName?.charAt(0) || 'B'}</span>
                    )}
                  </button>
                  {isAccountMenuOpen && (
                    <div className="absolute top-10 right-0 w-64 bg-theme-card rounded-2xl shadow-2xl border border-theme-border-soft z-50 overflow-y-auto max-h-[65vh] py-2 flex flex-col custom-scrollbar">
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

      {/* ===== MOBILE NAVIGATION DRAWER (Slide-in) ===== */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-4/5 max-w-xs bg-theme-card h-full shadow-2xl z-10 flex flex-col border-r border-theme-border-soft overflow-hidden"
            >
              {/* Drawer Brand Header */}
              <div className="p-4 border-b border-theme-border-soft flex items-center justify-between bg-theme-surface/50">
                <div className="flex items-center gap-2.5">
                  <Logo className="w-7 h-7" />
                  <div>
                    <span className="font-black text-sm text-theme-primary tracking-tight block">BillQyro</span>
                    <span className="text-[10px] font-bold text-theme-accent">Smart Billing Platform</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-theme-surface flex items-center justify-center text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Create Invoice Action */}
              <div className="p-3 border-b border-theme-border-soft">
                <button
                  onClick={() => {
                    setCurrentTab('create-invoice');
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[image:var(--accent-gradient)] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Invoice</span>
                </button>
              </div>

              {/* Categorized Navigation Items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-bold custom-scrollbar">
                {/* Main */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">Main</span>
                  <button
                    onClick={() => { setCurrentTab('dashboard'); setIsMobileDrawerOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'dashboard' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>

                {/* Billing */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">Billing</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCurrentTab('invoices'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'invoices' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Invoices</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('estimates'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'estimates' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Estimates & Quotes</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </div>
                </div>

                {/* Customers & Products */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">Customers</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCurrentTab('customers'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'customers' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4" />
                        <span>Clients & Customers</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('products'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'products' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4" />
                        <span>Products & Services</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </div>
                </div>

                {/* Finance */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">Finance</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCurrentTab('collection-center'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${['collection-center', 'payments', 'pending-payments'].includes(currentTab) ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4" />
                        <span>Payment Center</span>
                      </div>
                      {pendingPaymentsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">{pendingPaymentsCount}</span>
                      )}
                    </button>
                    <button
                      onClick={() => { setCurrentTab('due-ledger'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'due-ledger' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4" />
                        <span>Due Ledger & Collections</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('expenses'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'expenses' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingDown className="w-4 h-4" />
                        <span>Expenses</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('bank'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'bank' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Landmark className="w-4 h-4" />
                        <span>Bank & Cash</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </div>
                </div>

                {/* Insights */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">Insights</span>
                  <button
                    onClick={() => { setCurrentTab('reports'); setIsMobileDrawerOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'reports' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>Reports & Analytics</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>

                {/* System */}
                <div>
                  <span className="text-[10px] font-black tracking-wider text-theme-muted uppercase px-2 block mb-1.5">System</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCurrentTab('settings'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'settings' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SettingsIcon className="w-4 h-4" />
                        <span>Business Settings</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('workspace-manager'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'workspace-manager' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4" />
                        <span>Workspace Manager</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('backup-restore'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'backup-restore' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4" />
                        <span>Backup & Restore</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      onClick={() => { setCurrentTab('help-center'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentTab === 'help-center' ? 'bg-theme-accent text-white' : 'text-theme-primary hover:bg-theme-surface'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4" />
                        <span>Help Center</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-theme-border-soft bg-theme-surface/60 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-theme-primary truncate">{businessSettings?.businessName || 'BillQyro'}</p>
                  <p className="text-[10px] text-theme-muted truncate">{userEmail || 'Active Session'}</p>
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={() => { setIsMobileDrawerOpen(false); if(onLogout) onLogout(); }}
                    title="Log Out"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setCurrentTab('login'); setIsMobileDrawerOpen(false); }}
                    className="px-2.5 py-1 rounded-lg bg-theme-accent text-white text-xs font-bold"
                  >
                    Log In
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safe area spacer for mobile notch/home indicator */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-theme-card pointer-events-none z-50" />
    </div>
  );
};

export default Layout;

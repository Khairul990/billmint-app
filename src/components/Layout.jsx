import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ReceiptText, LogOut, ShieldCheck, Sun, Moon, User } from 'lucide-react';
import Logo from './Logo';

/**
 * Global App Layout Shell
 * @param {React.ReactNode} children - inner page node
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Function} onLogout - logout event callback
 * @param {Object} businessSettings - current active business details
 */
const Layout = ({ children, currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userRole, invoices = [], subscription = {}, userEmail, onQuickBillOpen }) => {
  // Theme state persisted in LocalStorage and synced from Firebase Settings Cloud
  const [theme, setTheme] = useState(() => {
    return businessSettings?.themePreset || localStorage.getItem('billqyro_theme') || 'light';
  });

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Close dropdown on outside click or tab change
  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [currentTab]);

  useEffect(() => {
    if (businessSettings?.themePreset) {
      setTheme(businessSettings.themePreset);
    }
  }, [businessSettings?.themePreset]);

  useEffect(() => {
    // Apply data-theme attribute for dynamic CSS custom properties
    document.documentElement.setAttribute('data-theme', theme);
    
    // Toggle dark class to support standard dark: utility states for Dark Premium theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('billqyro_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    <div className="min-h-screen bg-theme-background flex flex-col md:flex-row w-full font-sans antialiased text-theme-text transition-colors duration-300">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
        businessSettings={businessSettings}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        userEmail={userEmail}
      />

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Header Block with Premium Dual-Theme Layout */}
        <header className="relative bg-theme-card/80 backdrop-blur-md border-b border-theme-border px-6 py-8 md:py-10 text-theme-text shadow-[0_1px_3px_rgba(7,13,25,0.01),0_10px_20px_-10px_rgba(7,13,25,0.02)] transition-all duration-300 z-30">
          {/* Subtle Ambient Background Gradients wrapped to prevent overflow spill */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
            <div className="absolute -bottom-10 left-10 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-theme-muted bg-theme-background px-2.5 py-0.5 rounded-full border border-theme-border backdrop-blur-md">
                  Active Workspace
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-theme-text">
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
                className="w-10 h-10 rounded-2xl bg-theme-background border border-theme-border flex items-center justify-center text-theme-text hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </button>

              {/* Account Dropdown Container */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-10 h-10 rounded-2xl bg-theme-background border border-theme-border flex items-center justify-center text-theme-text hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
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
                    <div className="absolute top-14 right-0 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden flex flex-col animate-fadeIn">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 dark:text-white truncate">
                          {businessSettings?.businessName || 'My Business'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {userEmail || businessSettings?.email || 'billing@firm.com'}
                        </p>
                      </div>
                      
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Free Bills Limit</span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {invoices.length} / {subscription?.status === 'premium' ? '∞' : (businessSettings?.freeInvoiceLimit || 15)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-teal-400 h-1.5 rounded-full" 
                            style={{ width: `${Math.min((invoices.length / (subscription?.status === 'premium' ? 100 : (businessSettings?.freeInvoiceLimit || 15))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        {subscription?.status !== 'premium' && (
                          <button
                            onClick={() => {
                              setCurrentTab('subscription');
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
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
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
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
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
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
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 md:py-8 transition-opacity duration-300 animate-fadeIn">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Nav Menu (Hidden on Desktop) */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} onQuickBillOpen={onQuickBillOpen} />
    </div>
  );
};

export default Layout;

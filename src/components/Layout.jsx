import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ReceiptText, LogOut, ShieldCheck, Sun, Moon } from 'lucide-react';
import Logo from './Logo';

/**
 * Global App Layout Shell
 * @param {React.ReactNode} children - inner page node
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Function} onLogout - logout event callback
 * @param {Object} businessSettings - current active business details
 */
const Layout = ({ children, currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userRole }) => {
  // Theme state persisted in LocalStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('billqyro_theme') || 'light';
  });

  useEffect(() => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070c18] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-[#0d1627] dark:via-[#070c18] dark:to-[#040810] flex flex-col md:flex-row w-full font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
        businessSettings={businessSettings}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
      />

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Header Block with Premium Indigo/Blue Gradient Card */}
        <header className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 dark:from-[#0d1627]/80 dark:via-[#111c33]/80 dark:to-[#0a1122]/80 dark:backdrop-blur-xl dark:border-b dark:border-white/5 px-6 py-8 md:py-10 text-white shadow-md overflow-hidden transition-all duration-300">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-500/20 backdrop-blur-md dark:border-indigo-400/20">
                  Active Workspace
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
                {getPageTitle(currentTab)}
              </h2>
              <p className="text-xs md:text-sm text-indigo-100/90 font-medium mt-1">
                Manage your enterprise invoices, clients, and assets smoothly.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Premium Light/Dark Theme Switcher */}
              <button
                onClick={toggleTheme}
                type="button"
                className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-indigo-100" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-300 animate-pulse" />
                )}
              </button>

              {/* Mobile Header Brand & Fast Actions */}
              <div className="md:hidden flex items-center">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <Logo type="icon" className="w-6 h-6 text-white" />
                </div>
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
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
};

export default Layout;

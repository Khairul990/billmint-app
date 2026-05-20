import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ReceiptText, LogOut, ShieldCheck } from 'lucide-react';

/**
 * Global App Layout Shell
 * @param {React.ReactNode} children - inner page node
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Function} onLogout - logout event callback
 * @param {Object} businessSettings - current active business details
 */
const Layout = ({ children, currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated }) => {
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
      case 'admin-panel':
        return 'Admin Control Panel';
      case 'settings':
        return 'Business Settings';
      default:
        return 'BillMint';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full font-sans antialiased text-slate-800">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
        businessSettings={businessSettings}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Header Block with Premium Indigo/Blue Gradient Card */}
        <header className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-6 py-8 md:py-10 text-white shadow-md overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-500/20 backdrop-blur-md">
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
            
            {/* Mobile Header Brand & Fast Actions */}
            <div className="md:hidden flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <ReceiptText className="w-5 h-5" />
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

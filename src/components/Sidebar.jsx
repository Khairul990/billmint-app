import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, LogOut, TrendingDown, Sparkles, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { logout } from '../utils/storage';
import Logo from './Logo';

/**
 * Desktop Sidebar Navigation
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Function} onLogout - logout event handler
 * @param {Object} businessSettings - current active company name & logo
 * @param {boolean} isAuthenticated - whether currently logged in as admin
 */
const Sidebar = ({ currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'expenses', label: 'Overhead Expenses', icon: TrendingDown },
    { id: 'products', label: 'Products & Catalog', icon: Layers },
    { id: 'subscription', label: 'Subscription Plan', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'guide', label: 'How to Use', icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-theme-sidebar border-r border-theme-border-soft/10 h-screen sticky top-0 left-0 z-30 shadow-2xl transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-theme-border-soft/10 flex items-center">
        <Logo type="horizontal" forceWhiteText={false} />
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'invoices' && currentTab === 'create-invoice');
          
          return (
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-300 group cursor-pointer ${
                isActive 
                  ? 'text-theme-button-text' 
                  : 'text-theme-sidebar-text/70 hover:text-theme-button-text hover:bg-theme-accent-light/10'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-xl shadow-glow"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`relative z-10 w-5 h-5 transition-transform duration-300 ${
                isActive ? 'text-theme-button-text scale-110' : 'text-theme-sidebar-text/70 group-hover:text-theme-accent group-hover:scale-110'
              }`} />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Business Account Summary & Logout */}
      <div className="p-4 border-t border-theme-border-soft/10 flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-theme-accent-light/10 border border-theme-border-soft rounded-xl">
          {businessSettings?.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover shadow-sm bg-theme-card dark:bg-theme-card"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-theme-accent-light text-theme-accent font-bold flex items-center justify-center text-sm">
              {businessSettings?.businessName?.charAt(0) || 'B'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-theme-sidebar-text truncate">{businessSettings?.businessName || 'My Business'}</h4>
            <p className="text-[10px] text-theme-sidebar-text/70 font-medium truncate">{userEmail || businessSettings?.email || 'billing@firm.com'}</p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all animate-fadeIn cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

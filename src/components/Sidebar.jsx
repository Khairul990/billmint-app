import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, Shield, LogOut, TrendingDown, Sparkles, HelpCircle } from 'lucide-react';
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
const Sidebar = ({ currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'expenses', label: 'Overhead Expenses', icon: TrendingDown },
    { id: 'products', label: 'Products & Catalog', icon: Layers },
    { id: 'subscription', label: 'Subscription Plan', icon: Sparkles },
    { id: 'guide', label: 'How to Use', icon: HelpCircle },
    { id: 'admin-panel', label: 'Admin Settings', icon: Shield },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#071B3A] border-r border-slate-800 h-screen sticky top-0 left-0 z-30 shadow-2xl transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#14284B] flex items-center">
        <Logo type="horizontal" />
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'invoices' && currentTab === 'create-invoice');
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-[#14284B]'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                isActive ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'
              }`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Business Account Summary & Logout */}
      <div className="p-4 border-t border-[#14284B] flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-[#14284B] border border-slate-800/50 rounded-xl">
          {businessSettings?.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover shadow-sm bg-white"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-sm">
              {businessSettings?.businessName?.charAt(0) || 'B'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{businessSettings?.businessName || 'My Business'}</h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">{businessSettings?.email || 'billing@firm.com'}</p>
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

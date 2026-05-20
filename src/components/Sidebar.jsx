import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, Shield, LogOut, ReceiptText } from 'lucide-react';
import { logout } from '../utils/storage';

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
    { id: 'products', label: 'Products & Services', icon: Layers },
    { id: 'admin-panel', label: 'Admin Panel', icon: Shield },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 left-0 z-30 shadow-sm">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <ReceiptText className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
            BillMint
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Billing SaaS</p>
        </div>
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
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-100/50' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
              }`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Business Account Summary & Logout */}
      <div className="p-4 border-t border-slate-50 flex flex-col gap-3">
        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
          {businessSettings?.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover shadow-sm bg-white"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
              {businessSettings?.businessName?.charAt(0) || 'B'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-700 truncate">{businessSettings?.businessName || 'My Business'}</h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">{businessSettings?.email || 'billing@firm.com'}</p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all animate-fadeIn"
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

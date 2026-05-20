import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Users, MoreHorizontal } from 'lucide-react';

/**
 * Mobile Bottom Navigation Menu
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 */
const BottomNav = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];


  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100/80 dark:border-slate-800/80 shadow-lg px-2 py-1.5 flex items-center justify-around pb-safe-bottom transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = 
          currentTab === tab.id || 
          (tab.id === 'invoices' && currentTab === 'create-invoice') ||
          (tab.id === 'more' && ['more', 'expenses', 'products', 'subscription', 'admin-panel'].includes(currentTab));
        
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-100/50 dark:shadow-none scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold mt-1 tracking-tight ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;

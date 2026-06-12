import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Users, MoreHorizontal } from 'lucide-react';
import { triggerLightHaptic } from '../utils/feedback';
import { t } from '../utils/i18n';

/**
 * Mobile Bottom Navigation Menu
 * @param {string} currentTab - active state key
 * @param {Function} setCurrentTab - state update dispatcher
 */
const BottomNav = ({ currentTab, setCurrentTab, onQuickBillOpen, pendingPaymentsCount = 0, businessSettings }) => {
  // Dynamic terminology
  const activeWsId = businessSettings?.activeWorkspaceId;
  const activeWorkspace = businessSettings?.businessWorkspaces?.find(ws => ws.id === activeWsId) || {};
  const wsType = activeWorkspace.type || 'retail';

  const getCustomerLabel = () => {
    switch(wsType) {
      case 'doctor': return 'Patients';
      case 'teacher': return 'Students';
      case 'freelance':
      case 'service': return 'Clients';
      default: return t('customers');
    }
  };

  const getInvoiceLabel = () => {
    switch(wsType) {
      case 'teacher': return 'Fee Receipts';
      case 'doctor': return 'Bills';
      default: return t('invoices');
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'invoices', label: getInvoiceLabel(), icon: FileSpreadsheet },
    { id: 'create', isAction: true },
    { id: 'customers', label: getCustomerLabel(), icon: Users },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-card dark:bg-theme-card/95 dark:bg-[#070c18]/80 backdrop-blur-xl border-t border-theme-border-soft dark:border-theme-border-soft/80 dark:border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] px-3 py-2 flex items-center justify-around pb-6 transition-colors duration-300">
      {tabs.map((tab) => {
        if (tab.isAction) {
          return (
            <div key="action" className="relative -top-5 flex-1 flex justify-center">
              <button
                onClick={() => {
                  triggerLightHaptic();
                  onQuickBillOpen();
                }}
                className="w-14 h-14 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] border-[3px] border-white dark:border-[#070c18] transform active:scale-95 transition-all"
              >
                <div className="w-6 h-6 font-bold text-2xl leading-none flex items-center justify-center -mt-1">+</div>
              </button>
            </div>
          );
        }

        const Icon = tab.icon;
        const isActive = 
          currentTab === tab.id || 
          (tab.id === 'invoices' && currentTab === 'create-invoice') ||
          (tab.id === 'more' && ['more', 'expenses', 'products', 'subscription', 'admin-panel', 'settings', 'help-center', 'estimates', 'pdf-templates', 'live-link-templates', 'marketplace', 'backup-restore'].includes(currentTab));
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerLightHaptic();
              setCurrentTab(tab.id);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all cursor-pointer min-w-[44px] min-h-[44px]"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-[image:var(--accent-gradient)] text-white shadow-md shadow-theme-glow dark:shadow-none scale-110' 
                : 'text-theme-muted dark:text-theme-muted hover:text-theme-muted dark:hover:text-theme-muted hover:bg-theme-app dark:hover:bg-theme-card/30'
            }`}>
              <div className="relative">
                <Icon className="w-6 h-6" />
                {tab.id === 'more' && pendingPaymentsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-[#070c18]">
                    {pendingPaymentsCount}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-semibold mt-1 tracking-tight ${
              isActive ? 'text-theme-accent dark:text-theme-accent font-bold' : 'text-theme-muted dark:text-theme-muted font-medium'
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

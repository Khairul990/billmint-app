import React from 'react';
import { LayoutDashboard, CreditCard, Users, MoreHorizontal } from 'lucide-react';
import { triggerLightHaptic } from '../utils/feedback';
import { getCustomerLabelByType, getInvoiceLabelByType } from '../config/businessPresets';

const BottomNav = ({ currentTab, setCurrentTab, onQuickBillOpen, pendingPaymentsCount = 0, businessSettings }) => {
  const activeWsId = businessSettings?.activeWorkspaceId;
  const activeWorkspace = businessSettings?.businessWorkspaces?.find(ws => ws.id === activeWsId) || {};
  const wsType = activeWorkspace.type || 'retail';

  const getCustomerLabel = () => getCustomerLabelByType(wsType);
  const getInvoiceLabel = () => getInvoiceLabelByType(wsType);

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'due', label: 'Due', icon: CreditCard, badge: pendingPaymentsCount },
    { id: 'create', isAction: true },
    { id: 'customers', label: getCustomerLabel(), icon: Users },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-theme-card/95 backdrop-blur-xl border-t border-theme-border-soft shadow-[0_-10px_30px_rgba(0,0,0,0.08)] px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around transition-colors duration-300" style={{ height: 'calc(64px + env(safe-area-inset-bottom))', minHeight: '64px' }}>
      {tabs.map((tab) => {
        if (tab.isAction) {
          return (
            <div key="action" className="relative -top-4 flex-1 flex justify-center">
              <button
                onClick={() => {
                  triggerLightHaptic();
                  onQuickBillOpen();
                }}
                className="w-13 h-13 w-[52px] h-[52px] bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] border-[3px] border-white dark:border-theme-card transform active:scale-90 hover:scale-105 transition-all"
              >
                <div className="w-6 h-6 font-bold text-2xl leading-none flex items-center justify-center -mt-0.5">+</div>
              </button>
            </div>
          );
        }

        const Icon = tab.icon;
        const isActive = 
          currentTab === tab.id || 
          (tab.id === 'create' && currentTab === 'create-invoice') ||
          (tab.id === 'due' && ['due-ledger', 'pending-payments'].includes(currentTab)) ||
          (tab.id === 'more' && ['more', 'expenses', 'products', 'subscription', 'admin-panel', 'settings', 'help-center', 'estimates', 'pdf-templates', 'live-link-templates', 'marketplace', 'backup-restore', 'invoices', 'reports'].includes(currentTab));
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerLightHaptic();
              setCurrentTab(tab.id);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-[44px] min-h-[44px]"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-[image:var(--accent-gradient)] text-white shadow-md shadow-theme-glow scale-110' 
                : 'text-theme-muted hover:text-theme-muted hover:bg-theme-app'
            }`}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.id === 'due' && pendingPaymentsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-theme-card">
                    {pendingPaymentsCount > 9 ? '9+' : pendingPaymentsCount}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              isActive ? 'text-theme-accent font-bold' : 'text-theme-muted font-medium'
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

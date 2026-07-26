import { LayoutDashboard, CreditCard, Users, MoreHorizontal } from 'lucide-react';
import { triggerLightHaptic } from '../utils/feedback';
import { getCustomerLabelByType } from '../config/businessPresets';

const BottomNav = ({ currentTab, setCurrentTab, onQuickBillOpen, pendingPaymentsCount = 0, businessSettings }) => {
  const activeWsId = businessSettings?.activeWorkspaceId;
  const activeWorkspace = businessSettings?.businessWorkspaces?.find(ws => ws.id === activeWsId) || {};
  const wsType = activeWorkspace.type || 'retail';

  const getCustomerLabel = () => getCustomerLabelByType(wsType);

  let tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'due', label: 'Due', icon: CreditCard, badge: pendingPaymentsCount },
    { id: 'create', isAction: true },
    { id: 'customers', label: getCustomerLabel(), icon: Users },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  if (wsType === 'cybercafe' || wsType === 'cyber_cafe') {
    tabs = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'customer-register', label: 'Register', icon: Users },
      { id: 'create', isAction: true },
      { id: 'portal-hub', label: 'Portals', icon: CreditCard },
      { id: 'more', label: 'More', icon: MoreHorizontal },
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-theme-border-soft safe-area-bottom backdrop-blur-2xl"
      style={{ height: 'calc(64px + env(safe-area-inset-bottom))', minHeight: '64px' }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => {
          if (tab.isAction) {
            return (
              <div key="action" className="relative -top-3 flex-1 flex justify-center">
                <button
                  onClick={() => {
                    triggerLightHaptic();
                    onQuickBillOpen();
                  }}
                  className="w-14 h-14 rounded-full bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-lg shadow-theme-glow border-[3px] border-theme-border-soft dark:border-slate-800 active:scale-90 hover:scale-105 transition-all duration-200 hover:shadow-xl"
                >
                  <span className="text-2xl font-light leading-none -mt-0.5">+</span>
                </button>
              </div>
            );
          }

          const Icon = tab.icon;
          const isActive = 
            currentTab === tab.id || 
            (tab.id === 'due' && ['due-ledger', 'pending-payments'].includes(currentTab)) ||
            (tab.id === 'more' && ['more', 'expenses', 'products', 'subscription', 'admin-panel', 'settings', 'help-center', 'estimates', 'pdf-templates', 'live-link-templates', 'marketplace', 'backup-restore', 'invoices', 'reports', 'quick-tools', 'cash-management'].includes(currentTab));
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerLightHaptic();
                setCurrentTab(tab.id);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer min-w-[44px] group relative"
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[image:var(--accent-gradient)] text-white shadow-md scale-110' 
                  : 'text-theme-muted hover:text-theme-muted hover:bg-theme-app'
              }`}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.badge > 0 && tab.id === 'due' && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-theme-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-theme-border-soft dark:border-slate-800 animate-pulse-soft">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] sm:text-xs mt-0.5 font-semibold tracking-tight ${
                isActive ? 'text-theme-accent' : 'text-theme-muted'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
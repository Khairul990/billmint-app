import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, LogOut, TrendingDown, Sparkles, HelpCircle, Settings as SettingsIcon, Bell, BookOpen, PieChart, Palette, Smartphone, Store, Database, ChevronsLeft, ChevronsRight, Scissors, Wrench, Briefcase, ShieldCheck, ShoppingBag, Calendar, Truck, FileText, Globe } from 'lucide-react';
import { authEngine } from '../services/authEngine';
import { t } from '../utils/i18n';
import { triggerLightHaptic } from '../utils/feedback';
import { getCustomerLabelByType, getInvoiceLabelByType, getPortalLabelByType } from '../config/businessPresets';
import Logo from './Logo';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { isEducationBusiness } from '../config/businessPresets';
import { useFeatureControl } from '../hooks/useFeatureControl';

/**
 * Premium Collapsible Desktop Sidebar Navigation
 * - Expanded: 240px with full text, logo, user card
 * - Collapsed: 72px with icons only + tooltips
 * - Persists collapsed state via localStorage
 */
const Sidebar = ({ 
  currentTab, setCurrentTab, onLogout, businessSettings, isAuthenticated, userEmail, pendingPaymentsCount = 0,
  businessWorkspaces, activeWorkspaceId, setActiveWorkspace, syncStatus, flushSyncQueue 
}) => {
  // Determine active workspace and its enabled modules
  const activeWsId = businessSettings?.activeWorkspaceId;
  const activeWorkspace = businessSettings?.businessWorkspaces?.find(ws => ws.id === activeWsId) || {};
  const enabledModules = activeWorkspace.enabledModules || [];

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('billqyro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await authEngine.logout();
    window.location.reload();
  };

  const { isFeatureEnabled, isCategoryEnabled, loading: featuresLoading } = useFeatureControl(activeWsId);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('billqyro_sidebar_collapsed', String(next)); } catch (e) { console.warn(e); }
      return next;
    });
  };

  const wsType = businessSettings?.businessType || activeWorkspace.type || 'retail';

  const getCustomerLabel = () => getCustomerLabelByType(wsType);

  const getInvoiceLabel = () => getInvoiceLabelByType(wsType);

  let menuItems = [
    { id: 'dashboard', label: "Today's Business", icon: LayoutDashboard },

    { type: 'label', label: 'Billing' },
    { id: 'invoices', label: getInvoiceLabel(), icon: FileSpreadsheet, featureId: 'invoice' },
    { id: 'estimates', label: 'Estimates & Quotes', icon: FileSpreadsheet, featureId: 'invoice' },

    { type: 'label', label: 'Customers' },
    { id: 'customers', label: getCustomerLabel(), icon: Users, featureId: 'customer' },
    { id: 'patients', label: 'Patient Records', icon: Users, featureId: 'customer' },
    { id: 'students', label: 'Student Directory', icon: Users, featureId: 'customer' },
    { id: 'clients', label: 'Client Roster', icon: Users, featureId: 'customer' },

    { type: 'label', label: 'Collections' },
    { id: 'due-ledger', label: 'Due Ledger', icon: BookOpen, featureId: 'treasury' },
    { id: 'pending-payments', label: 'Payment Proofs', icon: Bell, featureId: 'payment' },

    { type: 'label', label: 'Analytics' },
    { id: 'reports', label: 'Reports', icon: PieChart, featureId: 'reports' },
    { id: 'expenses', label: t('expenses'), icon: TrendingDown, featureId: 'treasury.moneyOut' },

    { type: 'label', label: 'Operations' },
    { id: 'products', label: t('products'), icon: Layers, featureId: 'product' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, featureId: 'product' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, featureId: 'customer' },
    { id: 'delivery', label: 'Delivery Tracking', icon: Truck, featureId: 'product' },
    { id: 'measurements', label: 'Measurements', icon: Scissors, featureId: 'product' },
    { id: 'designBook', label: 'Design Book', icon: BookOpen, featureId: 'product' },
    { id: 'devices', label: 'Device Management', icon: Wrench, featureId: 'product' },
    { id: 'serviceJobs', label: 'Service Jobs', icon: Wrench, featureId: 'product' },
    { id: 'projects', label: 'Projects', icon: Briefcase, featureId: 'product' },

    { type: 'label', label: 'Portals' },
    { id: 'customer-portal-config', label: getPortalLabelByType(wsType), icon: Globe },

    { type: 'label', label: 'System' },
    { id: 'settings', label: 'Settings Studio', icon: SettingsIcon },
    ...(localStorage.getItem('billqyro_demo_session_active') === 'true' ? [{ id: 'sandbox-admin', label: 'Sandbox Control Center', icon: ShieldCheck, module: 'sandbox' }] : []),
    { id: 'help-center', label: 'Help Center', icon: HelpCircle },
  ];

  if (wsType === 'cybercafe' || wsType === 'cyber_cafe') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { type: 'label', label: 'Services' },
      { id: 'portal-hub', label: 'Portal Hub', icon: Globe },
      { id: 'quick-tools', label: 'Quick Tools', icon: Sparkles },
      { type: 'label', label: 'Management' },
      { id: 'customer-register', label: 'Customer Register', icon: Users },
      { id: 'cash-management', label: 'Cash Management', icon: Briefcase },
      { type: 'label', label: 'System' },
      { id: 'settings', label: 'Settings Studio', icon: SettingsIcon },
      ...(localStorage.getItem('billqyro_demo_session_active') === 'true' ? [{ id: 'sandbox-admin', label: 'Sandbox Control Center', icon: ShieldCheck, module: 'sandbox' }] : []),
      { id: 'help-center', label: 'Help Center', icon: HelpCircle },
    ];
  }

  // Filter items based on V8 Feature Control
  if (!featuresLoading) {
    menuItems = menuItems.filter(item => {
      // Backwards compat check if module is defined but featureId is missing
      if (item.module && !item.featureId) {
        if (!enabledModules.includes(item.module)) {
          if (wsType === 'billing_only' && item.module === 'customers') return true;
          if (item.module === 'sandbox') return true;
          return false;
        }
      }
      // V8 Feature Engine Check
      if (item.featureId) {
        return isFeatureEnabled(item.featureId);
      }
      return true;
    });
  }

  // Final pass: clean up empty labels
  menuItems = menuItems.filter((item, index) => {
    if (item.type === 'label') {
      const nextItem = menuItems[index + 1];
      if (!nextItem || nextItem.type === 'label') {
        return false;
      }
    }
    return true;
  });

  return (
    <aside
      className="hidden lg:flex flex-col h-full z-30 overflow-hidden shrink-0 border-r border-theme-accent/50 glass-panel"
      style={{
        width: isCollapsed ? 72 : 240,
        minWidth: isCollapsed ? 72 : 240,
        transition: isMounted ? 'width 200ms cubic-bezier(0.25,0.1,0.25,1), min-width 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none',
      }}
    >
      {/* Brand Header */}
      <div className="shrink-0 border-b border-theme-accent/50 flex items-center justify-between overflow-hidden"
        style={{ padding: isCollapsed ? '16px 12px' : '20px 20px', transition: isMounted ? 'padding 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none' }}
      >
        {isCollapsed ? (
          <div className="w-full flex justify-center">
            <Logo type="icon" className="w-9 h-9" />
          </div>
        ) : (
          <Logo type="horizontal" forceWhiteText={false} />
        )}
      </div>

      {/* User Card & Collapse Toggle */}
      <div className={`shrink-0 border-b border-theme-accent/50 flex ${isCollapsed ? 'flex-col items-center py-2 gap-2' : 'flex-row items-center justify-between px-3 py-2'}`}>
        {/* User Card */}
        <div className={`flex items-center rounded-xl overflow-hidden ${
          isCollapsed ? 'justify-center p-1' : 'gap-2.5 p-1 min-w-0 flex-1'
        }`}
          style={{ transition: isMounted ? 'all 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none' }}
        >
          {businessSettings?.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm bg-theme-card shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[image:var(--accent-gradient)] text-theme-button-text font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {businessSettings?.businessName?.charAt(0) || 'B'}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-bold text-theme-sidebar-text truncate leading-tight">
                {businessSettings?.businessName || 'My Business'}
              </h4>
              <p className="text-[9px] text-theme-sidebar-text/55 font-medium truncate leading-tight">
                {businessSettings?.email || userEmail || 'No email'}
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="shrink-0 flex items-center justify-center">
          <button
            onClick={toggleCollapsed}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light/15 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{ padding: isCollapsed ? '8px 8px' : '8px 12px', transition: isMounted ? 'padding 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none' }}
      >
        <div className="space-y-0.5">
          {menuItems.map((item, idx) => {
            if (item.type === 'label') {
              if (isCollapsed) return <div key={`label-${idx}`} className="h-2" />;
              return (
                <div key={`label-${idx}`} className="pt-3 pb-1 px-3.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-sidebar-text/30">{item.label}</p>
                </div>
              );
            }
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'invoices' && currentTab === 'create-invoice');

            return (
              <div key={item.id} className="relative group">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    triggerLightHaptic();
                    setCurrentTab(item.id);
                  }}
                  className={`relative w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] cursor-pointer overflow-hidden ${
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'text-theme-button-text shadow-lg'
                      : 'text-theme-sidebar-text/65 hover:text-theme-sidebar-text hover:bg-theme-accent-light/10'
                  }`}
                >
                  {/* Active gradient background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebar"
                      className="absolute inset-0 bg-[image:var(--accent-gradient)] rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      style={{ boxShadow: '0 4px 16px -2px var(--accent-glow)' }}
                    />
                  )}

                  {/* Left accent bar for active state */}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeBar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-theme-button-text/60"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <Icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-theme-button-text' : 'group-hover:scale-110 group-hover:text-theme-accent'
                  }`} />

                  {/* Label - only show when expanded */}
                  {!isCollapsed && (
                    <span className="relative z-10 truncate whitespace-nowrap text-[13px]"
                      style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 200ms cubic-bezier(0.25,0.1,0.25,1)' }}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Badge */}
                  {item.id === 'pending-payments' && pendingPaymentsCount > 0 && (
                    <span className={`relative z-10 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-red-500/30 animate-pulse ${
                      isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'
                    }`}>
                      {pendingPaymentsCount}
                    </span>
                  )}
                </motion.button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-theme-card dark:bg-theme-card text-theme-primary text-xs font-bold rounded-lg shadow-xl border border-theme-border-soft whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-[100]">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-theme-card" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

    </aside>
  );
};

export default Sidebar;

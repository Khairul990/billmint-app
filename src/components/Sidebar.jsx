import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, LogOut, TrendingDown, Sparkles, HelpCircle, Settings as SettingsIcon, Bell, BookOpen, PieChart, Palette, Smartphone, Store, Database, ChevronsLeft, ChevronsRight, Scissors, Wrench, Briefcase, ShieldCheck, ShoppingBag, Calendar, Truck, FileText, Globe, ChevronDown, Landmark, Crown, Map } from 'lucide-react';
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
  currentTab, setCurrentTab, onLogout, businessSettings, subscription, isAuthenticated, userEmail, pendingPaymentsCount = 0,
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

  const [expandedGroups, setExpandedGroups] = useState([]);
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
    { id: 'estimates', label: 'Estimates & Quotes', icon: FileSpreadsheet, featureId: 'invoice.estimates' },

    { type: 'label', label: 'Customers' },
    { id: 'customers', label: getCustomerLabel(), icon: Users, featureId: 'customer' },
    ...(enabledModules.includes('patients') ? [{ id: 'patients', label: 'Patient Records', icon: Users, featureId: 'customer' }] : []),
    ...(enabledModules.includes('students') ? [{ id: 'students', label: 'Student Directory', icon: Users, featureId: 'customer' }] : []),
    ...(enabledModules.includes('clients') ? [{ id: 'clients', label: 'Client Roster', icon: Users, featureId: 'customer' }] : []),

    { type: 'label', label: 'Staff' },
    { id: 'staff-ledger', label: 'Staff Ledger', icon: Users, featureId: 'staff.ledger' },

    { type: 'label', label: 'Collections' },
    { id: 'due-ledger', label: 'Due Ledger', icon: BookOpen, featureId: 'treasury' },
    { id: 'pending-payments', label: 'Payment Proofs', icon: Bell, featureId: 'payment' },
    { id: 'bank', label: 'Internal Bank', icon: Landmark, featureId: 'treasury' },

    { type: 'label', label: 'Analytics' },
    { id: 'reports', label: 'Reports', icon: PieChart, featureId: 'reports' },
    { id: 'expenses', label: t('expenses'), icon: TrendingDown, featureId: 'treasury.moneyOut' },

    { type: 'label', label: 'Operations' },
    { id: 'products', label: t('products'), icon: Layers, featureId: 'product' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, featureId: 'operations' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, featureId: 'operations' },
    { id: 'delivery', label: 'Delivery Tracking', icon: Truck, featureId: 'operations' },
    { id: 'measurements', label: 'Measurements', icon: Scissors, featureId: 'operations' },
    { id: 'designBook', label: 'Design Book', icon: BookOpen, featureId: 'operations' },
    { id: 'devices', label: 'Device Management', icon: Wrench, featureId: 'operations' },
    { id: 'serviceJobs', label: 'Service Jobs', icon: Wrench, featureId: 'operations' },
    { id: 'projects', label: 'Projects', icon: Briefcase, featureId: 'operations' },

    { type: 'label', label: 'Portals' },
    { id: 'customer-portal-config', label: getPortalLabelByType(wsType), icon: Globe, featureId: 'liveLink' },

    { type: 'label', label: 'System' },
    { id: 'settings', label: 'Settings Studio', icon: SettingsIcon },
    { id: 'architecture-map', label: 'Architecture Map', icon: Map },
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

  // Transform into structured grouped menu
  const structuredMenu = [];
  let currentGroup = null;

  menuItems.forEach(item => {
    if (item.type === 'label') {
      currentGroup = {
        id: `group-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        label: item.label,
        isGroup: true,
        icon: null,
        items: []
      };
      structuredMenu.push(currentGroup);
    } else {
      if (currentGroup) {
        if (!currentGroup.icon) currentGroup.icon = item.icon; // Inherit icon
        currentGroup.items.push(item);
      } else {
        structuredMenu.push(item);
      }
    }
  });

  // Auto-expand group containing current active tab
  useEffect(() => {
    if (featuresLoading) return;
    let foundGroupId = null;
    let currentGrp = null;
    for (const item of menuItems) {
      if (item.type === 'label') {
        currentGrp = `group-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      } else {
        if (currentGrp && (item.id === currentTab || (item.id === 'invoices' && currentTab === 'create-invoice'))) {
          foundGroupId = currentGrp;
          break;
        }
      }
    }
    if (foundGroupId) {
      setExpandedGroups(prev => prev.includes(foundGroupId) ? prev : [...prev, foundGroupId]);
    }
  }, [currentTab, featuresLoading]);

  const toggleGroup = (groupId) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedGroups(prev => prev.includes(groupId) ? prev : [...prev, groupId]);
    } else {
      setExpandedGroups(prev =>
        prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
      );
    }
  };

  const isPremium = subscription?.planStatus === 'premium' || (subscription?.planId && subscription.planId.toLowerCase() !== 'free');

  return (
    <aside
      className="hidden lg:flex flex-col h-full z-30 overflow-hidden shrink-0 border-r border-theme-border-soft bg-theme-surface shadow-xl"
      style={{
        width: isCollapsed ? 72 : 220,
        minWidth: isCollapsed ? 72 : 220,
        transition: isMounted ? 'width 200ms cubic-bezier(0.25,0.1,0.25,1), min-width 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none',
      }}
    >
      {/* Brand Header & Identity Card */}
      <div className="shrink-0 relative z-20"
        style={{ padding: isCollapsed ? '16px 8px' : '20px 16px', transition: isMounted ? 'padding 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none' }}
      >
        {/* Premium Glass Panel Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-theme-surface to-theme-surface/80 border-b border-theme-border-soft shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl -z-10" />
        
        {/* Logo & Toggle Row */}
        <div className={`flex items-center justify-between overflow-hidden ${isCollapsed ? 'mb-4' : 'mb-6 px-1'}`}>
          {isCollapsed ? (
            <div className="w-full flex justify-center hover:scale-105 transition-transform duration-300" onClick={toggleCollapsed} title="Expand Sidebar" style={{cursor: 'pointer'}}>
              <Logo type="icon" className="w-9 h-9" />
            </div>
          ) : (
            <div className="hover:opacity-90 transition-opacity duration-300">
              <Logo type="horizontal" forceWhiteText={false} />
            </div>
          )}
          
          {/* Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapsed}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary bg-theme-surface hover:bg-theme-app border border-transparent hover:border-theme-border-soft hover:shadow-sm transition-all duration-300 cursor-pointer group"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* User Profile Block */}
        <div className={`relative overflow-hidden flex items-center rounded-2xl bg-theme-surface/50 border hover:shadow-md hover:bg-theme-surface transition-all duration-300 ${isCollapsed ? 'justify-center p-1.5' : 'p-2'} ${isPremium ? 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-theme-border-soft hover:border-theme-primary/20'}`}
        >
          {isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-100 pointer-events-none animate-pulse" />
          )}
          {!isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-transparent opacity-50 pointer-events-none" />
          )}
          
          <div className="relative z-10 flex items-center gap-3 w-full">
            {/* Avatar */}
            <div className={`relative shrink-0 ${isPremium ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-theme-surface rounded-[14px]' : ''}`}>
              {businessSettings?.logoUrl ? (
                <img
                  src={businessSettings.logoUrl}
                  alt="Logo"
                  className={`${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} rounded-[14px] object-cover shadow-sm bg-theme-card transition-all duration-300`}
                />
              ) : (
                <div className={`${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} rounded-[14px] bg-gradient-to-br from-theme-primary to-blue-600 p-[1px] shadow-sm transition-all duration-300`}>
                  <div className="w-full h-full bg-theme-surface/90 rounded-[13px] flex items-center justify-center text-theme-primary font-black text-sm backdrop-blur-sm">
                    {businessSettings?.businessName?.charAt(0) || 'B'}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-theme-success border-2 border-theme-surface rounded-full z-20" title="Online" />
              )}
            </div>
            
            {/* User Info */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5 pr-1">
                <h4 className="text-xs font-black text-theme-primary truncate leading-tight mb-0.5 tracking-tight flex items-center gap-1.5">
                  <span className="truncate">{businessSettings?.businessName || 'My Business'}</span>
                  {isPremium && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20 shrink-0" title="Premium Member" />}
                </h4>
                <p className="text-[10px] font-semibold text-theme-muted truncate leading-tight">
                  {businessSettings?.email || userEmail || 'No email'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{ padding: isCollapsed ? '8px 8px' : '8px 12px', transition: isMounted ? 'padding 200ms cubic-bezier(0.25,0.1,0.25,1)' : 'none' }}
      >
        <div className="space-y-0.5">
          {structuredMenu.map((item, idx) => {
            if (item.isGroup) {
              const isExpanded = expandedGroups.includes(item.id);
              const isActiveGroup = item.items.some(i => i.id === currentTab || (i.id === 'invoices' && currentTab === 'create-invoice'));
              const GroupIcon = item.icon;

              return (
                <div key={item.id} className="relative group mb-1">
                  {/* Group Header */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleGroup(item.id)}
                    className={`relative w-full flex items-center justify-between rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer overflow-hidden group/header ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2.5'
                      } ${isActiveGroup && !isExpanded
                        ? 'bg-theme-accent-light/15 text-theme-accent shadow-sm'
                        : 'text-theme-sidebar-text/75 hover:text-theme-sidebar-text hover:bg-theme-accent-light/10'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${isActiveGroup && !isExpanded ? 'text-theme-accent' : 'group-hover/header:scale-110 group-hover/header:text-theme-accent'
                        }`} />
                      {!isCollapsed && (
                        <span className="truncate whitespace-nowrap text-[12px] uppercase tracking-wider font-black">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </motion.button>

                  {/* Tooltip for group when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-0 ml-2 px-3 py-1.5 bg-theme-card text-theme-primary text-xs font-bold rounded-lg shadow-xl border border-theme-border-soft whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-[100]">
                      {item.label} (Expand to see options)
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-theme-card" />
                    </div>
                  )}

                  {/* Dropdown Items */}
                  <AnimatePresence initial={false}>
                    {isExpanded && !isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pr-2 py-1 space-y-0.5 relative mt-1">
                          {/* Tree branch line */}
                          <div className="absolute left-[20px] top-0 bottom-3 w-px bg-theme-border-soft/60" />

                          {item.items.map(subItem => {
                            const isSubActive = currentTab === subItem.id || (subItem.id === 'invoices' && currentTab === 'create-invoice');
                            const SubIcon = subItem.icon;
                            return (
                              <motion.button
                                key={subItem.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  triggerLightHaptic();
                                  setCurrentTab(subItem.id);
                                }}
                                className={`relative w-full flex items-center rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden gap-3 px-3 py-2 group/sub ${isSubActive
                                  ? 'text-theme-accent bg-theme-accent/10 font-bold'
                                  : 'text-theme-sidebar-text/65 hover:text-theme-sidebar-text hover:bg-theme-accent-light/10'
                                  }`}
                              >

                                {isSubActive && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3 bg-theme-accent rounded-r-full shadow-sm z-10" />
                                )}

                                <SubIcon className={`relative z-10 w-[14px] h-[14px] shrink-0 transition-transform duration-200 ${isSubActive ? 'text-theme-accent' : 'group-hover/sub:scale-110 group-hover/sub:text-theme-accent'
                                  }`} />
                                <span className="relative z-10 truncate whitespace-nowrap">
                                  {subItem.label}
                                </span>

                                {subItem.id === 'pending-payments' && pendingPaymentsCount > 0 && (
                                  <span className="relative z-10 ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                                    {pendingPaymentsCount}
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Standard Item rendering for non-group items (e.g. Dashboard)
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'invoices' && currentTab === 'create-invoice');

            return (
              <div key={item.id} className="relative group mb-0.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    triggerLightHaptic();
                    setCurrentTab(item.id);
                  }}
                  className={`relative w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                    } ${isActive
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

                  <Icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${isActive ? 'text-theme-button-text' : 'group-hover:scale-110 group-hover:text-theme-accent'
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
                    <span className={`relative z-10 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-red-500/30 animate-pulse ${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'
                      }`}>
                      {pendingPaymentsCount}
                    </span>
                  )}
                </motion.button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-theme-card text-theme-primary text-xs font-bold rounded-lg shadow-xl border border-theme-border-soft whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-[100]">
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

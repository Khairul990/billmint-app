import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Layers, 
  LogOut, 
  TrendingDown, 
  HelpCircle, 
  Settings as SettingsIcon, 
  Bell, 
  BookOpen, 
  PieChart, 
  ChevronsLeft, 
  ChevronsRight, 
  Scissors, 
  Wrench, 
  Briefcase, 
  ShieldCheck, 
  ShoppingBag, 
  Calendar, 
  Truck, 
  Globe, 
  ChevronDown, 
  Landmark, 
  Crown, 
  Map, 
  Plus, 
  ChevronRight, 
  CreditCard, 
  BarChart3,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import { authEngine } from '../services/authEngine';
import { t } from '../utils/i18n';
import { triggerLightHaptic } from '../utils/feedback';
import { getCustomerLabelByType, getInvoiceLabelByType, getPortalLabelByType } from '../config/businessPresets';
import Logo from './Logo';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useFeatureControl } from '../hooks/useFeatureControl';

/**
 * BillQyro — Premium Command Navigation Rail
 * - Category-based modular navigation
 * - Collapsible with smooth width transition
 * - Independent scrollable nav rail with anchored brand & account headers
 */
const Sidebar = ({
  currentTab, 
  setCurrentTab, 
  onLogout, 
  businessSettings, 
  subscription, 
  isAuthenticated, 
  userEmail, 
  pendingPaymentsCount = 0,
  businessWorkspaces, 
  activeWorkspaceId, 
  setActiveWorkspace, 
  syncStatus, 
  flushSyncQueue
}) => {
  const activeWsId = businessSettings?.activeWorkspaceId || activeWorkspaceId || 'default';
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

  const { isFeatureEnabled, loading: featuresLoading } = useFeatureControl(activeWsId);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('billqyro_sidebar_collapsed', String(next)); } catch (e) { console.warn(e); }
      return next;
    });
  };

  const wsType = (businessSettings?.businessType || activeWorkspace.type || 'retail').toLowerCase();
  const getCustomerLabel = () => getCustomerLabelByType(wsType);
  const getInvoiceLabel = () => getInvoiceLabelByType(wsType);

  const sections = [
    {
      id: 'main',
      label: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      id: 'billing',
      label: 'BILLING',
      items: [
        { id: 'invoices', label: getInvoiceLabel(), icon: FileSpreadsheet, featureId: 'invoice' },
        ...(enabledModules.includes('orders') ? [{ id: 'orders', label: 'Order Slips', icon: ShoppingBag, featureId: 'operations' }] : []),
        { id: 'estimates', label: 'Estimates & Quotes', icon: FileSpreadsheet, featureId: 'invoice.estimates' },
      ]
    },
    {
      id: 'customers',
      label: 'CUSTOMERS',
      items: [
        { id: 'customers', label: getCustomerLabel(), icon: Users, featureId: 'customer' },
        ...(enabledModules.includes('patients') ? [{ id: 'patients', label: 'Patient Records', icon: Users, featureId: 'customer' }] : []),
        ...(enabledModules.includes('students') ? [{ id: 'students', label: 'Student Directory', icon: Users, featureId: 'customer' }] : []),
        ...(enabledModules.includes('clients') ? [{ id: 'clients', label: 'Client Roster', icon: Users, featureId: 'customer' }] : []),
        { id: 'products', label: 'Products & Services', icon: Layers, featureId: 'product' },
      ]
    },
    {
      id: 'finance',
      label: 'FINANCE',
      items: [
        { id: 'collection-center', label: 'Payments', icon: CreditCard, featureId: 'payment', badge: pendingPaymentsCount },
        { id: 'due-ledger', label: 'Collections', icon: BookOpen, featureId: 'treasury' },
        { id: 'expenses', label: t('expenses') || 'Expenses', icon: TrendingDown, featureId: 'treasury.moneyOut' },
        { id: 'outsource', label: 'Outsource & Vendors', icon: Briefcase, featureId: 'outsource' },
        { id: 'bank', label: 'Bank & Cash', icon: Landmark, featureId: 'treasury' },
      ]
    },
    {
      id: 'insights',
      label: 'INSIGHTS',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, featureId: 'reports' },
      ]
    },
    {
      id: 'system',
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'staff-ledger', label: 'Users & Roles', icon: Users, featureId: 'staff.ledger' },
        { id: 'help-center', label: 'Help Center', icon: HelpCircle },
      ]
    }
  ];

  // Filter items based on Feature Control
  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (featuresLoading) return true;
      if (item.featureId) return isFeatureEnabled(item.featureId);
      return true;
    })
  })).filter(section => section.items.length > 0);

  const isPremium = subscription?.planStatus === 'premium' || (subscription?.planId && subscription.planId.toLowerCase() !== 'free');

  return (
    <aside
      className="hidden lg:flex flex-col h-full z-30 overflow-hidden shrink-0 border-r border-theme-border-soft bg-theme-surface/75 backdrop-blur-2xl select-none"
      style={{
        width: isCollapsed ? 72 : 240,
        minWidth: isCollapsed ? 72 : 240,
        transition: isMounted ? 'width 200ms cubic-bezier(0.2,0,0,1), min-width 200ms cubic-bezier(0.2,0,0,1)' : 'none',
      }}
    >
      {/* 1. BRAND & WORKSPACE AREA */}
      <div className="shrink-0 p-3.5 pb-2 border-b border-theme-border-soft/60 space-y-3">
        <div className="flex items-center justify-between">
          {isCollapsed ? (
            <button 
              onClick={toggleCollapsed} 
              className="w-full flex justify-center hover:opacity-80 transition-opacity p-1 cursor-pointer" 
              title="Expand Sidebar"
            >
              <Logo type="icon" className="w-8 h-8" />
            </button>
          ) : (
            <>
              <div className="min-w-0">
                <Logo type="horizontal" forceWhiteText={false} />
                <p className="text-[9px] font-semibold text-theme-muted tracking-tight mt-0.5 uppercase">
                  Smart Billing Platform
                </p>
              </div>
              <button
                onClick={toggleCollapsed}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface border border-transparent hover:border-theme-border-soft transition-all shrink-0 cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* WORKSPACE IDENTITY CONTROL */}
        {!isCollapsed ? (
          <div>
            <WorkspaceSwitcher
              businessWorkspaces={businessWorkspaces}
              activeWorkspaceId={activeWorkspaceId}
              setActiveWorkspace={setActiveWorkspace}
              setCurrentTab={setCurrentTab}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentTab('settings')}
              title={`Workspace: ${activeWorkspace.name || 'Default'}`}
              className="w-8 h-8 rounded-xl bg-theme-accent/15 text-theme-accent flex items-center justify-center text-xs font-black hover:scale-105 transition-transform"
            >
              {(activeWorkspace.name || 'W').charAt(0).toUpperCase()}
            </button>
          </div>
        )}
      </div>

      {/* 2. PRIMARY CREATE ACTION */}
      <div className="px-3 pt-2.5 pb-1 shrink-0">
        {isCollapsed ? (
          <button
            onClick={() => {
              triggerLightHaptic();
              setCurrentTab('create-invoice');
            }}
            title="Create Invoice"
            className="w-full h-9 rounded-xl bg-theme-accent text-white flex items-center justify-center shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              triggerLightHaptic();
              setCurrentTab('create-invoice');
            }}
            className="relative overflow-hidden w-full py-2.5 px-3 rounded-xl bg-[image:var(--accent-gradient)] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer group/cta"
          >
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
            <Plus className="w-3.5 h-3.5 relative" />
            <span className="relative">Create Invoice</span>
          </button>
        )}
      </div>

      {/* 3. SCROLLABLE NAVIGATION RAIL */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-3 custom-scrollbar">
        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-0.5">
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                <span className="w-1 h-1 rounded-full bg-theme-accent/60" aria-hidden="true" />
                <span className="text-[9px] font-black tracking-widest text-theme-muted/80 uppercase">
                  {section.label}
                </span>
                <span className="flex-1 h-px bg-theme-border-soft/50" aria-hidden="true" />
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || 
                (item.id === 'invoices' && currentTab === 'create-invoice') ||
                (item.id === 'collection-center' && ['collection-center', 'payments', 'pending-payments'].includes(currentTab));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerLightHaptic();
                    setCurrentTab(item.id);
                  }}
                  className={`relative w-full flex items-center rounded-xl text-xs transition-colors text-left cursor-pointer group ${
                    isCollapsed ? 'p-2 justify-center' : 'px-2.5 py-1.5 gap-2'
                  } ${isActive
                    ? 'text-theme-accent'
                    : 'text-theme-secondary hover:text-theme-primary font-semibold'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sb-active-pill"
                      className="absolute inset-0 rounded-xl bg-theme-accent/10 ring-1 ring-inset ring-theme-accent/20 shadow-xs"
                      transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-lg shrink-0 transition-colors ${isActive ? 'bg-theme-accent/15 text-theme-accent' : 'text-theme-muted group-hover:text-theme-primary group-hover:bg-theme-surface/80'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {!isCollapsed && (
                    <div className="relative z-10 flex-1 flex items-center justify-between truncate">
                      <span className={`truncate ${isActive ? 'font-black' : ''}`}>{item.label}</span>
                      {item.badge > 0 && (
                        <span className="px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black bg-rose-500 text-white font-numbers shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 4. ANCHORED ACCOUNT & PROFILE FOOTER */}
      <div className="shrink-0 p-3 border-t border-theme-border-soft/60 bg-theme-surface/40">
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2.5 min-w-0 text-left rounded-xl p-1.5 hover:bg-theme-surface transition-colors flex-1 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            title="Business Settings"
          >
            <div className="w-9 h-9 rounded-xl p-[1.5px] bg-[image:var(--accent-gradient)] shrink-0 shadow-sm">
              <div className="w-full h-full rounded-[10.5px] bg-theme-surface flex items-center justify-center text-theme-accent font-black text-xs overflow-hidden">
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{(businessSettings?.businessName || 'B').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-theme-primary truncate leading-tight flex items-center gap-1">
                  <span className="truncate">{businessSettings?.businessName || 'My Business'}</span>
                  {isPremium && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                </p>
                <p className="text-[10px] text-theme-muted font-medium truncate mt-0.5">
                  {businessSettings?.email || userEmail || 'Workspace Settings'}
                </p>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-theme-muted hover:text-rose-500 hover:bg-theme-surface transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

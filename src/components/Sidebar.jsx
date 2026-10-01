import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useI18n } from '../utils/i18n';
import { triggerLightHaptic } from '../utils/feedback';
import { getCustomerLabelByType, getInvoiceLabelByType, getPortalLabelByType } from '../config/businessPresets';
import Logo from './Logo';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useFeatureControl } from '../hooks/useFeatureControl';
import confetti from 'canvas-confetti';

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

  const handleLogoClick = () => {
    triggerLightHaptic();
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2147483647 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#0B8F78', '#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#0B8F78', '#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']
      });
    }, 250);
  };

  const { isFeatureEnabled, loading: featuresLoading } = useFeatureControl(activeWsId);
  const { t, lang, setLanguage } = useI18n();

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
      label: t('sec.main', 'MAIN'),
      items: [
        { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
      ]
    },
    {
      id: 'billing',
      label: t('sec.billing', 'BILLING'),
      items: [
        { id: 'invoices', label: t('nav.invoices', getInvoiceLabel()), icon: FileSpreadsheet, featureId: 'invoice' },
        ...(enabledModules.includes('orders') ? [{ id: 'orders', label: t('nav.orders', 'Order Slips'), icon: ShoppingBag, featureId: 'operations' }] : []),
        { id: 'estimates', label: t('nav.estimates', 'Estimates & Quotes'), icon: FileSpreadsheet, featureId: 'invoice.estimates' },
      ]
    },
    {
      id: 'customers',
      label: t('sec.customers', 'CUSTOMERS'),
      items: [
        { id: 'customers', label: t('nav.customers', getCustomerLabel()), icon: Users, featureId: 'customer' },
        ...(enabledModules.includes('patients') ? [{ id: 'patients', label: 'Patient Records', icon: Users, featureId: 'customer' }] : []),
        ...(enabledModules.includes('students') ? [{ id: 'students', label: 'Student Directory', icon: Users, featureId: 'customer' }] : []),
        ...(enabledModules.includes('clients') ? [{ id: 'clients', label: 'Client Roster', icon: Users, featureId: 'customer' }] : []),
        { id: 'products', label: t('nav.products', 'Products & Services'), icon: Layers, featureId: 'product' },
      ]
    },
    {
      id: 'finance',
      label: t('sec.finance', 'FINANCE'),
      items: [
        { id: 'collection-center', label: t('nav.payments', 'Payments'), icon: CreditCard, featureId: 'payment', badge: pendingPaymentsCount },
        { id: 'due-ledger', label: t('nav.collections', 'Collections'), icon: BookOpen, featureId: 'treasury' },
        { id: 'expenses', label: t('nav.expenses', 'Expenses'), icon: TrendingDown, featureId: 'treasury.moneyOut' },
        { id: 'work-cost', label: t('nav.workCost', 'Work Cost'), icon: Briefcase, featureId: 'outsource' },
        { id: 'bank', label: t('nav.bank', 'Bank & Cash'), icon: Landmark, featureId: 'treasury' },
      ]
    },
    {
      id: 'insights',
      label: t('sec.insights', 'INSIGHTS'),
      items: [
        { id: 'reports', label: t('nav.reports', 'Reports & Analytics'), icon: BarChart3, featureId: 'reports' },
      ]
    },
    {
      id: 'system',
      label: t('sec.system', 'SYSTEM'),
      items: [
        { id: 'settings', label: t('nav.settings', 'Settings'), icon: SettingsIcon },
        { id: 'staff-ledger', label: t('nav.users_roles', 'Users & Roles'), icon: Users, featureId: 'staff.ledger' },
        { id: 'help-center', label: t('nav.help_center', 'Help Center'), icon: HelpCircle },
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
    <div className="hidden lg:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 z-30 shrink-0">
      <aside
        className="relative flex flex-col h-full overflow-hidden rounded-[2.5rem] border border-white/60 shadow-[0_24px_64px_-12px_rgba(11,143,120,0.15),0_0_40px_rgba(255,255,255,0.9)] bg-gradient-to-b from-white/90 via-theme-surface/70 to-[var(--bq26-emerald)]/5 backdrop-blur-3xl select-none transition-all duration-300 ring-1 ring-white dark:bg-gradient-to-b dark:from-[#0B1220]/90 dark:to-[#0B1220]/70"
        style={{
          width: isCollapsed ? 96 : 280,
          minWidth: isCollapsed ? 96 : 280,
        }}
      >
        {/* Breathtaking Background Decor */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--bq26-emerald-bright)] opacity-[0.15] blur-[50px] rounded-full" />
          <div className="absolute bottom-[20%] -left-10 w-40 h-40 bg-[var(--bq26-emerald)] opacity-10 blur-[60px] rounded-full" />
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
      {/* 1. BRAND & WORKSPACE AREA */}
      <div className="shrink-0 p-3.5 pb-2 border-b border-theme-border-soft/60 space-y-3">
        <div className="flex items-center justify-between">
          {isCollapsed ? (
            <button 
              onClick={() => { toggleCollapsed(); handleLogoClick(); }} 
              className="w-full flex justify-center hover:opacity-80 transition-opacity p-1 cursor-pointer hover:scale-110 active:scale-95" 
              title="Expand Sidebar & Celebrate!"
            >
              <Logo type="icon" className="w-8 h-8" />
            </button>
          ) : (
            <>
              <button onClick={handleLogoClick} className="min-w-0 text-left hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none group flex flex-col items-start">
                <Logo type="horizontal" forceWhiteText={false} />
                <p className="text-[9px] font-semibold text-theme-muted tracking-tight mt-0.5 uppercase group-hover:text-[var(--bq26-emerald)] transition-colors">
                  {t('sidebar.smart_billing', 'Smart Billing Platform')}
                </p>
              </button>
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
              businessSettings={businessSettings}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentTab('settings')}
              title={`Workspace: ${(activeWorkspace.name && activeWorkspace.name !== 'Default Workspace') ? activeWorkspace.name : (businessSettings?.businessName || activeWorkspace.name || 'Default')}`}
              className="w-8 h-8 rounded-xl bg-theme-accent/15 text-theme-accent flex items-center justify-center text-xs font-black hover:scale-105 transition-transform"
            >
              {((activeWorkspace.name && activeWorkspace.name !== 'Default Workspace' ? activeWorkspace.name : businessSettings?.businessName) || 'W').charAt(0).toUpperCase()}
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
            className="w-full h-12 rounded-full bg-[var(--bq26-emerald)] text-[var(--bq26-app)] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => {
              triggerLightHaptic();
              setCurrentTab('create-invoice');
            }}
            className="btn-premium w-full py-3 shadow-[0_8px_24px_-6px_var(--accent-glow)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
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
                  className={`relative w-full flex items-center rounded-full text-xs transition-colors text-left cursor-pointer group ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2 gap-3'
                  } ${isActive
                    ? 'text-[var(--bq26-emerald-deep)]'
                    : 'text-theme-secondary hover:text-[var(--bq26-emerald)] font-bold'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/10 to-transparent shadow-[inset_1px_0_0_0_#10b981] border border-emerald-500/10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)] ring-2 ring-white/50 scale-105' 
                      : 'bg-theme-surface/50 group-hover:bg-white text-theme-muted group-hover:text-emerald-500 shadow-inner border border-theme-border-soft group-hover:border-emerald-500/30 group-hover:shadow-[0_4px_12px_rgba(16,185,129,0.1)] group-hover:scale-105'
                  }`}>
                    <Icon className="w-4 h-4" />
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
      <div className="shrink-0 p-3 border-t border-[var(--bq26-line-soft)] bg-theme-surface/60">
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-3 min-w-0 text-left rounded-full p-1.5 hover:bg-[var(--bq26-emerald-muted)]/20 hover:ring-1 hover:ring-[var(--bq26-emerald)]/30 transition-all flex-1 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            title={t('sidebar.business_settings', 'Business Settings')}
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[var(--bq26-emerald)] to-[var(--bq26-emerald-bright)] shrink-0 shadow-md">
              <div className="w-full h-full rounded-full bg-theme-surface flex items-center justify-center text-[var(--bq26-emerald)] font-black text-xs overflow-hidden">
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{(businessSettings?.businessName || 'B').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-theme-primary truncate leading-tight flex items-center gap-1">
                  <span className="truncate">{businessSettings?.businessName || t('sidebar.my_business', 'My Business')}</span>
                  {isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </p>
                <p className="text-[10px] text-theme-muted font-bold truncate mt-0.5 tracking-wider">
                  {businessSettings?.email || userEmail || t('sidebar.workspace_settings', 'Workspace Settings')}
                </p>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={() => setLanguage(lang === 'bn' ? 'en' : 'bn')}
              className="px-2 py-1.5 rounded-xl border border-theme-border-soft text-[10px] font-black text-theme-muted hover:text-theme-accent hover:border-theme-accent/40 transition-all cursor-pointer shrink-0"
              title={t('sidebar.toggle_lang', 'Switch language')}
              aria-label={t('sidebar.toggle_lang', 'Switch language')}
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-theme-muted hover:text-rose-500 hover:bg-theme-surface transition-colors cursor-pointer"
              title={t('sidebar.sign_out', 'Sign Out')}
              aria-label={t('sidebar.sign_out', 'Sign Out')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </div>
    </aside>
    </div>
  );
};

export default Sidebar;

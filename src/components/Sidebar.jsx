import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileSpreadsheet, Users, Layers, LogOut, TrendingDown, Sparkles, HelpCircle, Settings as SettingsIcon, Bell, BookOpen, PieChart, Palette, Smartphone, Store, Database, ChevronsLeft, ChevronsRight, Scissors, Wrench, Briefcase, ShieldCheck } from 'lucide-react';
import { logout } from '../services/dbEngine';
import { triggerLightHaptic } from '../utils/feedback';
import { t } from '../utils/i18n';
import Logo from './Logo';
import WorkspaceSwitcher from './WorkspaceSwitcher';

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

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('billqyro_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

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

  let menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'invoices', label: getInvoiceLabel(), icon: FileSpreadsheet, module: 'billing' },
    { id: 'estimates', label: 'Estimates & Quotes', icon: FileSpreadsheet },
    { id: 'marketplace', label: 'Template Marketplace', icon: Store },
    { id: 'pdf-templates', label: 'PDF Templates', icon: Palette },
    { id: 'live-link-templates', label: 'Live Link Studio', icon: Smartphone },
    { id: 'customers', label: getCustomerLabel(), icon: Users, module: 'customers' },
    { id: 'patients', label: 'Patient Records', icon: Users, module: 'patients' },
    { id: 'students', label: 'Student Directory', icon: Users, module: 'students' },
    { id: 'clients', label: 'Client Roster', icon: Users, module: 'clients' },
    { id: 'appointments', label: 'Appointments', icon: Users, module: 'appointments' },
    { id: 'measurements', label: 'Measurements', icon: Scissors, module: 'measurements' },
    { id: 'designBook', label: 'Design Book', icon: Palette, module: 'designBook' },
    { id: 'devices', label: 'Device Management', icon: Wrench, module: 'devices' },
    { id: 'serviceJobs', label: 'Service Jobs', icon: Wrench, module: 'serviceJobs' },
    { id: 'projects', label: 'Projects', icon: Briefcase, module: 'projects' },
    { id: 'orders', label: 'Orders', icon: Store, module: 'orders' },
    { id: 'delivery', label: 'Delivery Tracking', icon: Store, module: 'delivery' },
    { id: 'reports', label: 'Reports', icon: PieChart, module: 'reports' },
    { id: 'expenses', label: t('expenses'), icon: TrendingDown, module: 'expenses' },
    { id: 'backup-restore', label: 'Backup & Restore', icon: Database },
    { id: 'products', label: t('products'), icon: Layers, module: 'products' },
    { id: 'due-ledger', label: 'Due Ledger', icon: BookOpen, module: 'dueLedger' },
    { id: 'pending-payments', label: 'Payment Proofs', icon: Bell, module: 'paymentProofs' },
    { id: 'subscription', label: 'Subscription Plan', icon: Sparkles },
    { id: 'help-center', label: 'Help Center', icon: HelpCircle },
  ];

  // Filter items based on enabledModules (if any)
  if (enabledModules.length) {
    menuItems = menuItems.filter(item => {
      // If the item has a 'module' property, check if it's enabled
      if (item.module && !enabledModules.includes(item.module)) {
        // Special case: if wsType is 'billing_only' and module is 'customers', we still show it because it's recommended
        if (wsType === 'billing_only' && item.module === 'customers') return true;
        return false;
      }
      return true;
    });
  }

  return (
    <aside
      className="hidden lg:flex flex-col h-full z-30 overflow-hidden shrink-0 border-r border-theme-border-soft/40 bg-theme-sidebar/80 backdrop-blur-xl shadow-[4px_0_24px_-6px_rgba(0,0,0,0.08)]"
      style={{
        width: isCollapsed ? 72 : 240,
        minWidth: isCollapsed ? 72 : 240,
        transition: isMounted ? 'width 180ms cubic-bezier(0.4,0,0.2,1), min-width 180ms cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}
    >
      {/* Brand Header */}
      <div className="shrink-0 border-b border-theme-border-soft/20 flex items-center justify-between overflow-hidden"
        style={{ padding: isCollapsed ? '16px 12px' : '20px 20px', transition: isMounted ? 'padding 180ms ease' : 'none' }}
      >
        {isCollapsed ? (
          <div className="w-full flex justify-center">
            <Logo type="icon" className="w-9 h-9" />
          </div>
        ) : (
          <Logo type="horizontal" forceWhiteText={false} />
        )}
      </div>

      {/* User Card (Moved to top) */}
      <div className="shrink-0 border-b border-theme-border-soft/20 px-3 py-3">
        <div className={`flex items-center rounded-xl border border-theme-border-soft/40 bg-theme-accent-light/8 overflow-hidden ${
          isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2.5'
        }`}
          style={{ transition: isMounted ? 'all 180ms ease' : 'none' }}
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
      </div>

      {/* Collapse Toggle */}
      <div className="shrink-0 flex justify-end px-2 py-1.5">
        <button
          onClick={toggleCollapsed}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light/15 transition-all duration-200 cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{ padding: isCollapsed ? '8px 8px' : '8px 12px', transition: isMounted ? 'padding 180ms ease' : 'none' }}
      >
        <div className="space-y-0.5">
          {menuItems.map((item) => {
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
                  className={`relative w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
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
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white/60"
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
                      style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 200ms ease' }}
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

      {/* Sidebar Footer */}
      <div className="shrink-0 border-t border-theme-border-soft/20 bg-theme-sidebar/50"
        style={{ padding: isCollapsed ? '12px 8px' : '12px 12px', transition: isMounted ? 'padding 180ms ease' : 'none' }}
      >
        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center rounded-xl text-sm font-semibold text-theme-danger/80 hover:bg-theme-danger/8 hover:text-theme-danger transition-all cursor-pointer mt-1.5 ${
              isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3.5 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-xs">Log out</span>}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Building2, ListPlus, CreditCard, IndianRupee,
  Settings, Megaphone, ToggleRight, Power, ShieldCheck, Database,
  HardDrive, RefreshCw, ShieldAlert, ArrowLeft, Menu, X, Crown,
  ChevronLeft, ChevronRight, Sliders, Search, Zap, LayoutDashboard,
  BarChart3, LifeBuoy, History, Beaker, BadgePercent
} from 'lucide-react';

/**
 * BillQyro Owner Console — command-center layout
 * - Instant search across every console section
 * - Spring-animated active pill
 * - Collapsible rail with tooltips
 * - Mobile: slide-in drawer with backdrop
 */
const AdminLayout = ({ setCurrentTab, children, activeAdminTab, setActiveAdminTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  const adminMenuGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, hint: 'KPIs & live activity' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, hint: 'Growth & revenue charts' }
      ]
    },
    {
      group: 'USERS & WORKSPACES',
      items: [
        { id: 'users', label: 'Users', icon: Users, hint: 'Accounts & access' },
        { id: 'workspaces', label: 'Workspaces', icon: Building2, hint: 'Tenant management' }
      ]
    },
    {
      group: 'FINANCIAL',
      items: [
        { id: 'payments', label: 'Payment Proofs', icon: CreditCard, hint: 'Approve UPI proofs' },
        { id: 'subscriptions', label: 'Premium Control', icon: Crown, hint: 'Plans, pricing & overrides' },
        { id: 'revenue', label: 'Platform Revenue', icon: IndianRupee, hint: 'Earnings & dues' },
        { id: 'billing', label: 'Billing Configuration', icon: Settings, hint: 'UPI, limits & charges' }
      ]
    },
    {
      group: 'ENGAGEMENT',
      items: [
        { id: 'support', label: 'Support Inbox', icon: LifeBuoy, hint: 'Tickets & feature requests' },
        { id: 'changelog', label: 'Changelog', icon: History, hint: 'Publish release notes' },
        { id: 'announcements', label: 'Announcements', icon: Megaphone, hint: 'Broadcast messages' },
        { id: 'advertising', label: 'Advertising', icon: BadgePercent, hint: 'Landing page ad slot' }
      ]
    },
    {
      group: 'PLATFORM',
      items: [
        { id: 'modules', label: 'Modules & Features', icon: ToggleRight, hint: 'Feature switches' },
        { id: 'maintenance', label: 'Maintenance Mode', icon: Power, hint: 'Global lock' },
        { id: 'health', label: 'System Health', icon: Activity, hint: 'Telemetry' },
        { id: 'test-lab', label: 'Owner Test Lab', icon: Beaker, hint: 'Demo data & sandbox' }
      ]
    },
    {
      group: 'DATA',
      items: [
        { id: 'backup', label: 'Backup & Restore', icon: Database, hint: 'Snapshots' },
        { id: 'storage', label: 'Storage Diagnostics', icon: HardDrive, hint: 'Usage & quota' },
        { id: 'sync', label: 'Sync Diagnostics', icon: RefreshCw, hint: 'Queue health' }
      ]
    },
    {
      group: 'SECURITY',
      items: [
        { id: 'security', label: 'Security Center', icon: ShieldCheck, hint: 'Policies & rules' },
        { id: 'audit', label: 'Audit Logs', icon: Sliders, hint: 'Action history' },
        { id: 'owner-controls', label: 'Owner Controls', icon: ShieldAlert, hint: 'Root operations' }
      ]
    }
  ];

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return adminMenuGroups;
    return adminMenuGroups
      .map((grp) => ({
        ...grp,
        items: grp.items.filter(
          (it) => it.label.toLowerCase().includes(q) || it.id.includes(q) || (it.hint || '').toLowerCase().includes(q)
        )
      }))
      .filter((grp) => grp.items.length > 0);
  }, [query, adminMenuGroups]);

  const handleNavClick = (id) => {
    setActiveAdminTab(id);
    setIsMobileMenuOpen(false);
    setQuery('');
  };

  const NavList = ({ collapsed = false }) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand header */}
      <div className={`h-14 ${collapsed ? 'px-2' : 'px-3.5'} border-b border-theme-border-soft flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[image:var(--accent-gradient)] flex items-center justify-center shrink-0 shadow-md">
            <Crown className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-xs font-black text-theme-primary tracking-tight truncate leading-tight">BillQyro</h1>
              <span className="text-[9px] font-black tracking-[0.16em] text-theme-accent uppercase block leading-none">OWNER ROOM</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
            title="Collapse rail"
            aria-label="Collapse rail"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Command search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search console…"
              className="w-full pl-8 pr-7 py-1.5 bg-theme-surface border border-theme-border-soft rounded-xl text-[11px] font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-theme-muted hover:text-theme-primary cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {filteredGroups.length === 0 && !collapsed && (
          <p className="px-2.5 py-4 text-[11px] font-bold text-theme-muted text-center">No section matches “{query}”.</p>
        )}
        {filteredGroups.map((grp) => (
          <div key={grp.group} className="space-y-0.5">
            {!collapsed ? (
              <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1">
                <span className="w-1 h-1 rounded-full bg-theme-accent/60" aria-hidden="true" />
                <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-theme-muted block leading-none">
                  {grp.group}
                </span>
                <span className="flex-1 h-px bg-theme-border-soft/50" aria-hidden="true" />
              </div>
            ) : (
              <div className="h-1.5" />
            )}
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? `${item.label}${item.hint ? ` — ${item.hint}` : ''}` : undefined}
                  className={`relative w-full min-h-[38px] flex items-center ${collapsed ? 'px-0 justify-center' : 'px-2.5'} py-1.5 rounded-xl text-xs transition-colors group cursor-pointer ${
                    isActive ? 'text-theme-accent' : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-active-pill"
                      className="absolute inset-0 rounded-xl bg-theme-accent/10 ring-1 ring-inset ring-theme-accent/20 shadow-xs"
                      transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-lg shrink-0 transition-colors ${isActive ? 'bg-theme-accent/15 text-theme-accent' : 'text-theme-muted group-hover:text-theme-primary'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {!collapsed && (
                    <span className="relative z-10 ml-2 min-w-0 flex-1 text-left">
                      <span className={`block truncate leading-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                      <span className="block text-[9px] text-theme-muted truncate leading-tight">{item.hint}</span>
                    </span>
                  )}
                  {!collapsed && isActive && <Zap className="relative z-10 w-3 h-3 text-theme-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Exit control */}
      <div className="p-2.5 border-t border-theme-border-soft shrink-0 space-y-2">
        {collapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex w-full min-h-[34px] items-center justify-center rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
            title="Expand rail"
            aria-label="Expand rail"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="w-full min-h-[38px] flex items-center justify-center p-2 rounded-xl bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary text-xs font-bold transition-all border border-theme-border-soft cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${collapsed ? '' : 'mr-1.5'}`} />
          {!collapsed && <span>Exit Console</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="billqyro-admin-premium h-screen bg-theme-main text-theme-primary font-sans flex flex-col md:flex-row overflow-hidden relative">
      {/* Desktop rail */}
      <aside
        className={`hidden md:flex flex-col h-full bg-theme-surface/80 backdrop-blur-xl border-r border-theme-border-soft shrink-0 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-14' : 'w-64'
        }`}
      >
        <NavList collapsed={isCollapsed} />
      </aside>

      {/* Mobile top header */}
      <div className="md:hidden flex items-center justify-between px-4 h-12 bg-theme-surface/80 backdrop-blur-xl border-b border-theme-border-soft z-30 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-theme-primary">
          <div className="w-6 h-6 rounded-lg bg-[image:var(--accent-gradient)] flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Owner Console</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-theme-secondary hover:text-theme-primary cursor-pointer"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 top-12 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="md:hidden fixed left-0 top-12 bottom-0 w-[280px] bg-theme-main border-r border-theme-border-soft z-50 flex flex-col shadow-2xl"
            >
              <NavList collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-[calc(100vh-48px)] md:h-screen overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

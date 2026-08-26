import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Building2, ListPlus, CreditCard, IndianRupee,
  Settings, Megaphone, ToggleRight, Power, ShieldCheck, Database,
  HardDrive, RefreshCw, ShieldAlert, ArrowLeft, Menu, X, Crown, ChevronLeft, ChevronRight, Sliders
} from 'lucide-react';

const AdminLayout = ({ setCurrentTab, children, activeAdminTab, setActiveAdminTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminMenuGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: Activity }
      ]
    },
    {
      group: 'USERS & WORKSPACES',
      items: [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'workspaces', label: 'Workspaces', icon: Building2 },
        { id: 'subscriptions', label: 'Plans & Subscriptions', icon: ListPlus }
      ]
    },
    {
      group: 'FINANCIAL',
      items: [
        { id: 'payments', label: 'Payment Proofs', icon: CreditCard },
        { id: 'revenue', label: 'Platform Revenue', icon: IndianRupee },
        { id: 'billing', label: 'Billing Configuration', icon: Settings }
      ]
    },
    {
      group: 'PLATFORM',
      items: [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'modules', label: 'Modules & Feature Controls', icon: ToggleRight },
        { id: 'maintenance', label: 'Maintenance Mode', icon: Power },
        { id: 'health', label: 'System Health', icon: Activity }
      ]
    },
    {
      group: 'DATA',
      items: [
        { id: 'backup', label: 'Backup & Restore', icon: Database },
        { id: 'storage', label: 'Storage Diagnostics', icon: HardDrive },
        { id: 'sync', label: 'Sync Diagnostics', icon: RefreshCw }
      ]
    },
    {
      group: 'SECURITY',
      items: [
        { id: 'security', label: 'Security Center', icon: ShieldCheck },
        { id: 'audit', label: 'Audit Logs', icon: Sliders },
        { id: 'owner-controls', label: 'Owner Controls', icon: ShieldAlert }
      ]
    }
  ];

  const handleNavClick = (id) => {
    setActiveAdminTab(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-14 px-3.5 border-b border-theme-border-soft flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
            <Crown className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xs font-black text-theme-primary tracking-tight truncate leading-tight">BillQyro</h1>
              <span className="text-[8px] font-black tracking-widest text-theme-accent uppercase block leading-none">OWNER ROOM</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {adminMenuGroups.map((grp) => (
          <div key={grp.group} className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-black uppercase tracking-wider text-theme-muted block mb-0.5">
                {grp.group}
              </span>
            )}
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full min-h-[38px] flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors relative group ${
                    isActive
                      ? 'bg-theme-accent/10 text-theme-accent font-extrabold border border-theme-accent/20 shadow-sm'
                      : 'text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary border border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-theme-accent" />
                  )}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-2.5'} ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-primary'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Exit Control */}
      <div className="p-2.5 border-t border-theme-border-soft shrink-0">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="w-full min-h-[38px] flex items-center justify-center p-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary text-xs font-bold transition-all border border-theme-border-soft"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isCollapsed ? '' : 'mr-1.5'}`} />
          {!isCollapsed && <span>Exit Console</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="billqyro-admin-premium h-screen bg-theme-main text-theme-primary font-sans flex flex-col md:flex-row overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-theme-surface/80 backdrop-blur-xl border-r border-theme-border-soft shrink-0 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-14' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-12 bg-theme-surface/80 backdrop-blur-xl border-b border-theme-border-soft z-30 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-theme-primary">
          <Crown className="w-4 h-4 text-theme-accent" />
          <span>BillQyro Owner Control</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-theme-secondary hover:text-theme-primary"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-12 bg-theme-main z-40 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
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

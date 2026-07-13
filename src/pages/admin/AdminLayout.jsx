import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ShieldAlert, ArrowLeft, Activity, Users, Settings as SettingsIcon, 
  CreditCard, ShieldCheck, Menu, X, User, Crown, ToggleRight, Database, 
  ListPlus, MessageSquare, Megaphone, Building2, Workflow, BarChart3
} from 'lucide-react';

const AdminLayout = ({ setCurrentTab, children, activeAdminTab, setActiveAdminTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
    { id: 'users', label: 'User Manager', icon: <Users className="w-5 h-5" /> },
    { id: 'workspaces', label: 'Workspaces', icon: <Building2 className="w-5 h-5" /> },
    { id: 'premium', label: 'Subscriptions', icon: <Crown className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'features', label: 'Feature Control', icon: <ToggleRight className="w-5 h-5" /> },
    { id: 'health', label: 'App Health', icon: <Activity className="w-5 h-5" /> },
    { id: 'security', label: 'Security Center', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'automation', label: 'Automation', icon: <Workflow className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'settings', label: 'Global Settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'lab', label: 'Owner Test Lab', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'changelog', label: 'Changelog', icon: <ListPlus className="w-5 h-5" /> },
  ];

  const handleNavClick = (id) => {
    setActiveAdminTab(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-theme-border-soft flex items-center shrink-0">
        <Lock className="w-5 h-5 mr-2 text-theme-danger" />
        <div>
          <h1 className="text-theme-primary font-black text-xl tracking-tight leading-none">KM Admin</h1>
          <p className="text-[10px] text-theme-success uppercase tracking-wider font-bold mt-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-success mr-2 animate-pulse"></span>
            Secure Session
          </p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
        {adminMenu.map(item => {
          const isActive = activeAdminTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-sm font-semibold relative overflow-hidden group ${
                isActive 
                  ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20' 
                  : 'text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent shadow-[0_0_10px_var(--accent)]" 
                />
              )}
              <div className={`mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-theme-border-soft shrink-0">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="w-full flex items-center justify-center p-3 rounded-xl bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-primary text-sm font-bold transition-all border border-theme-border-soft"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Exit Admin
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-theme-main text-theme-primary font-sans flex flex-col md:flex-row overflow-hidden relative">
      {/* Background gradients similar to platform studio */}
      <div className="absolute top-0 left-0 w-full h-96 bg-theme-accent/5 rounded-b-[100%] blur-[120px] pointer-events-none" />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-theme-surface/80 backdrop-blur-xl border-r border-theme-border-soft flex-col z-20 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-theme-surface/80 backdrop-blur-lg border-b border-theme-border-soft z-30 sticky top-0">
        <div className="flex items-center text-theme-primary font-black text-lg">
          <Lock className="w-5 h-5 mr-2 text-theme-danger" /> KM Admin
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-theme-secondary hover:text-theme-primary p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[69px] left-0 right-0 bottom-0 bg-theme-main z-20 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Top Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-transparent border-b border-theme-border-soft shrink-0">
          <div>
            <h2 className="text-xl font-bold text-theme-primary tracking-tight">Enterprise Control Center</h2>
            <p className="text-xs text-theme-secondary mt-1">Manage global platform resources and security.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1.5 bg-theme-success/10 rounded-full border border-theme-success/20">
              <span className="w-2 h-2 rounded-full bg-theme-success mr-2 animate-pulse"></span>
              <span className="text-xs font-bold text-theme-success">System Healthy</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-theme-accent/20 border border-theme-accent p-0.5 shadow-glass">
              <div className="w-full h-full bg-theme-surface rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-theme-accent" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
          <motion.div
            key={activeAdminTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

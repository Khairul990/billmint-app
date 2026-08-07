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
    { id: 'subscriptions', label: 'Subscription Plans', icon: <ListPlus className="w-5 h-5" /> },
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
      <div className="h-24 px-6 border-b border-theme-border-soft flex items-center shrink-0 bg-gradient-to-r from-amber-900/10 to-transparent">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-[0_0_15px_rgba(251,191,36,0.3)] mr-3 shrink-0">
          <div className="w-full h-full bg-theme-surface-elevated rounded-[10.5px] flex items-center justify-center">
             <Crown className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div>
          <h1 className="text-theme-primary font-black text-xl tracking-tight leading-none vip-text-glow">KM Admin</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.5)]">VIP Pro+</span>
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
              Secure
            </p>
          </div>
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
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.6)]" 
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
    <div className="h-screen bg-theme-main text-theme-primary font-sans flex flex-col md:flex-row overflow-hidden relative selection:bg-theme-accent selection:text-white">
      {/* VIP Luxury Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen opacity-70 animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] mix-blend-screen opacity-40 animate-blob animation-delay-4000" />
      </div>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-full bg-theme-surface/60 backdrop-blur-2xl border-r border-theme-border-soft flex-col z-20 shrink-0 shadow-glass">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-theme-surface/60 backdrop-blur-2xl border-b border-theme-border-soft z-30 sticky top-0 shadow-glass">
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
            className="md:hidden absolute top-[69px] left-0 right-0 bottom-0 bg-theme-main/90 backdrop-blur-3xl z-20 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Top Header */}
        {/* VIP Top Header */}
        <header className="hidden md:flex h-24 items-center justify-between px-8 bg-theme-surface/40 backdrop-blur-xl border-b border-theme-border-soft shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
          <div>
            <h2 className="text-2xl font-black text-theme-primary tracking-tight flex items-center gap-3">
              VIP Control Center
              <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] uppercase font-black tracking-widest shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]">Level 99</span>
            </h2>
            <p className="text-xs font-semibold text-theme-secondary mt-1">Exclusive administrative access to the global BillQyro ecosystem.</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_var(--color-success)]"></span>
              <span className="text-[11px] font-black tracking-widest uppercase text-emerald-500">System Nominal</span>
            </div>
            
            {/* VIP Avatar Ring */}
            <div className="relative w-12 h-12 rounded-full p-[2px] overflow-hidden group cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-500 to-purple-600 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-[2px] bg-theme-surface rounded-full flex items-center justify-center overflow-hidden z-10">
                <Crown className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10 custom-scrollbar">
          <motion.div
            key={activeAdminTab}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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

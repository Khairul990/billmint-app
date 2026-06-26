import React, { useState, useEffect } from 'react';
import { getAuthSession } from '../../services/dbEngine';
import { auth } from '../../services/firebaseConfig';
import { Lock, ShieldAlert, ArrowLeft, Activity, Users, Settings as SettingsIcon, CreditCard, ShieldCheck, Menu, X, User, Crown, ToggleRight, Database, ListPlus, MessageSquare, Megaphone, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = ({ setCurrentTab, children, activeAdminTab, setActiveAdminTab }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
    { id: 'users', label: 'User Manager', icon: <Users className="w-5 h-5" /> },
    { id: 'workspaces', label: 'Workspace Admin', icon: <Building2 className="w-5 h-5" /> },
    { id: 'premium', label: 'Premium Control', icon: <Crown className="w-5 h-5" /> },
    { id: 'payments', label: 'Payment Proofs', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'settings', label: 'Global Settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'features', label: 'Feature Switch', icon: <ToggleRight className="w-5 h-5" /> },
    { id: 'lab', label: 'Owner Test Lab', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'health', label: 'App Health', icon: <Activity className="w-5 h-5" /> },
    { id: 'security', label: 'Security Center', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'backup', label: 'Backup Center', icon: <Database className="w-5 h-5" /> },
    { id: 'changelog', label: 'Changelog Manager', icon: <ListPlus className="w-5 h-5" /> },
    { id: 'support', label: 'Support & Features', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-5 h-5" /> },
  ];

  // The PIN check is now handled upstream by App.jsx -> AdminPINLogin.jsx
  // So we don't need the internal lock screen here. IsAuthorized logic is removed to avoid conflicts.
  // We can just rely on the parent wrapper guarding access.

  const handleNavClick = (id) => {
    setActiveAdminTab(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-800/50">
        <h1 className="text-white font-black text-xl tracking-tight flex items-center">
          <Lock className="w-5 h-5 mr-2 text-rose-500" /> KM Admin
        </h1>
        <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mt-2 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          Secure Session
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {adminMenu.map(item => {
          const isActive = activeAdminTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-sm font-semibold relative overflow-hidden group ${
                isActive 
                  ? 'bg-gradient-to-r from-rose-500/10 to-transparent text-rose-400' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
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
      
      <div className="p-4 border-t border-slate-800/50">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 text-sm font-bold transition-all border border-slate-700/50 hover:border-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to BillQyro
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1e293b]/40 backdrop-blur-xl border-r border-slate-800/50 flex-col z-20 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1e293b]/80 backdrop-blur-lg border-b border-slate-800/50 z-30 sticky top-0">
        <div className="flex items-center text-white font-black text-lg">
          <Lock className="w-5 h-5 mr-2 text-rose-500" /> KM Admin
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[69px] left-0 right-0 bottom-0 bg-[#0f172a] z-20 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-transparent border-b border-slate-800/30 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Owner Control Panel</h2>
            <p className="text-xs text-slate-400 mt-1">Manage all aspects of the BillQyro platform.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400">System Healthy</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-[2px]">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-rose-100" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
          <motion.div
            key={activeAdminTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

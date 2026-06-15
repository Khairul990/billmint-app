import React, { useState, useEffect } from 'react';
import { getAuthSession } from '../../services/dbEngine';
import { auth } from '../../services/firebaseConfig';
import { Lock, ShieldAlert, ArrowLeft, Activity, Users, Settings as SettingsIcon, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLayout = ({ setCurrentTab, children, activeAdminTab, setActiveAdminTab }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
    { id: 'users', label: 'User Manager', icon: <Users className="w-5 h-5" /> },
    { id: 'payments', label: 'Payment Proofs', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'settings', label: 'Global Settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'lab', label: 'Owner Test Lab', icon: <ShieldAlert className="w-5 h-5" /> },
  ];

  useEffect(() => {
    // Basic session validation
    const session = getAuthSession();
    // Assuming the Owner's email is khairmurafiq@gmail.com or similar
    // We should ideally check against the actual owner email or a list of admin emails
    if (session && session.userEmail === 'khairmurafiq@gmail.com') { // Replace with actual logic
      if (sessionStorage.getItem('billqyro_admin_unlocked') === 'true') {
        setIsAuthorized(true);
      }
    } else {
      // Not authorized at all
      setIsAuthorized(false);
    }
  }, []);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    // Assuming PIN is 1234 for now, should be configurable or securely stored
    if (pin === '1234') {
      sessionStorage.setItem('billqyro_admin_unlocked', 'true');
      setIsAuthorized(true);
    } else {
      setPinError('Invalid Security PIN');
    }
  };

  if (!isAuthorized && sessionStorage.getItem('billqyro_admin_unlocked') !== 'true') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-[#1e293b] p-8 rounded-3xl border border-rose-500/20 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-xs text-slate-400 mb-6">Enter Admin Security PIN to continue.</p>
          
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white p-4 rounded-xl text-center text-2xl tracking-[0.5em] mb-4 focus:outline-none focus:border-rose-500 transition-colors"
              autoFocus
            />
            {pinError && <p className="text-rose-500 text-xs mb-4">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Unlock
            </button>
          </form>
          
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="mt-6 text-slate-500 text-xs hover:text-slate-300 font-medium flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to App
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-rose-500 font-black text-xl tracking-tight flex items-center">
            <Lock className="w-5 h-5 mr-2" /> KM Admin
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Owner Control Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminMenu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-colors text-sm font-semibold ${
                activeAdminTab === item.id 
                  ? 'bg-rose-500/10 text-rose-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Admin
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0f172a] p-6 md:p-10">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

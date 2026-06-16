import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Moon, ShieldAlert, Zap, Edit3, Sliders, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const ToggleSwitch = ({ label, enabled, setEnabled }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
    <div className="relative">
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={enabled}
        onChange={() => setEnabled(!enabled)} 
      />
      <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);

const GlobalSettings = () => {
  const [maintenance, setMaintenance] = useState(false);
  const [allowReg, setAllowReg] = useState(true);
  const [liveLinks, setLiveLinks] = useState(true);
  const [paymentSystem, setPaymentSystem] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Sliders className="w-6 h-6 mr-3 text-emerald-400" /> Global Settings
          </h2>
          <p className="text-slate-400 text-sm mt-1">Configure platform-wide parameters and feature flags.</p>
        </div>
        <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Settings */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <h3 className="font-bold text-white mb-6 flex items-center border-b border-slate-700/50 pb-4">
            <Globe className="w-5 h-5 mr-2 text-blue-400" /> Core Preferences
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Theme</label>
              <select className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                <option value="system">System Default</option>
                <option value="dark">Dark Mode (Premium)</option>
                <option value="light">Light Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Language</label>
              <select className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                <option value="en">English (US)</option>
                <option value="hi">Hindi (India)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Global Announcement</label>
              <textarea 
                placeholder="Enter an announcement to display to all users..."
                className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none h-24"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Business Limits */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <h3 className="font-bold text-white mb-6 flex items-center border-b border-slate-700/50 pb-4">
            <Zap className="w-5 h-5 mr-2 text-amber-400" /> Subscription & Limits
          </h3>
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Free Bill Limit</label>
                <input 
                  type="number" 
                  defaultValue={20}
                  className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Charge Per Bill</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                  <input 
                    type="number" 
                    defaultValue={2.50}
                    step="0.10"
                    className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Pending Due</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                  <input 
                    type="number" 
                    defaultValue={500}
                    className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grace Period (Days)</label>
                <input 
                  type="number" 
                  defaultValue={3}
                  className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Access Controls */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <h3 className="font-bold text-white mb-6 flex items-center border-b border-slate-700/50 pb-4">
            <ShieldAlert className="w-5 h-5 mr-2 text-rose-400" /> Platform Controls
          </h3>
          <div className="space-y-6">
            <ToggleSwitch label="Maintenance Mode" enabled={maintenance} setEnabled={setMaintenance} />
            <ToggleSwitch label="Allow New Registrations" enabled={allowReg} setEnabled={setAllowReg} />
            {maintenance && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
              >
                <p className="text-rose-400 text-xs font-bold flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Only Admin IPs can access the platform currently.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Feature Switches */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <h3 className="font-bold text-white mb-6 flex items-center border-b border-slate-700/50 pb-4">
            <SettingsIcon className="w-5 h-5 mr-2 text-purple-400" /> Feature Toggles
          </h3>
          <div className="space-y-6">
            <ToggleSwitch label="Live Link Sharing" enabled={liveLinks} setEnabled={setLiveLinks} />
            <ToggleSwitch label="Payment Proof System" enabled={paymentSystem} setEnabled={setPaymentSystem} />
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default GlobalSettings;

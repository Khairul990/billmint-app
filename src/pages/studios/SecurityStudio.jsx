import React from 'react';
import { Shield, Key, Smartphone, Clock, AlertTriangle } from 'lucide-react';

const SecurityStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
          <Shield className="w-6 h-6 text-emerald-400 drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Security Studio</h2>
          <p className="text-xs text-theme-muted font-medium">Manage 2FA, session devices, and API access tokens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Two-Factor Authentication */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white">Two-Factor Auth (2FA)</h3>
          </div>
          
          <p className="text-xs text-theme-muted mb-6 leading-relaxed">
            Add an extra layer of security to your account. Require a time-based code in addition to your password when signing in.
          </p>

          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 mb-4">
            <div>
              <p className="text-xs font-bold text-white">Authenticator App</p>
              <p className="text-[10px] text-theme-muted mt-1">Google Auth, Authy</p>
            </div>
            <button className="relative w-10 h-5 bg-white/10 rounded-full transition-all flex items-center p-0.5">
              <span className="w-4 h-4 bg-gray-400 rounded-full shadow-md" />
            </button>
          </div>
          
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/5">
            Configure 2FA
          </button>
        </div>

        {/* Active Sessions */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-black text-white">Active Sessions</h3>
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">2 Devices</span>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">iPhone 14 Pro</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Current Device
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-theme-muted" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">MacBook Pro M2</p>
                  <p className="text-[10px] text-theme-muted flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Last active 2h ago
                  </p>
                </div>
              </div>
              <button className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase">Revoke</button>
            </div>
          </div>

          <button className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-xl transition-all border border-rose-500/20 flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Sign Out All Other Devices
          </button>
        </div>
      </div>
    </div>
  );
};

// Add missing icon for Monitor locally just for rendering
const Monitor = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

export default SecurityStudio;

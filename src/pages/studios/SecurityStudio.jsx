import React from 'react';
import { Shield, Key, Smartphone, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const SecurityStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
          <Shield className="w-6 h-6 text-theme-accent drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">Security Studio</h2>
          <p className="text-xs text-theme-secondary font-medium">Manage 2FA, session devices, and API access tokens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Two-Factor Authentication */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-premium-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[50px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Two-Factor Auth (2FA)</h3>
          </div>
          
          <p className="text-xs text-theme-secondary mb-6 leading-relaxed">
            Add an extra layer of security to your account. Require a time-based code in addition to your password when signing in.
          </p>

          <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-xl border border-theme-border-soft mb-4">
            <div>
              <p className="text-xs font-bold text-theme-primary">Authenticator App</p>
              <p className="text-[10px] text-theme-secondary mt-1">Google Auth, Authy</p>
            </div>
            <button className="relative w-10 h-5 bg-theme-surface rounded-full border border-theme-border-strong transition-all flex items-center p-0.5">
              <span className="w-4 h-4 bg-theme-muted rounded-full shadow-md" />
            </button>
          </div>
          
          <Button variant="secondary" className="w-full">
            Configure 2FA
          </Button>
        </div>

        {/* Active Sessions */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden shadow-premium-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm font-black text-theme-primary">Active Sessions</h3>
            </div>
            <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-md">2 Devices</span>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-theme-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">iPhone 14 Pro</p>
                  <p className="text-[10px] text-theme-success flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-theme-success rounded-full" /> Current Device
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft flex items-center justify-between group hover:border-theme-border-strong transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-surface flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-theme-secondary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">MacBook Pro M2</p>
                  <p className="text-[10px] text-theme-secondary flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Last active 2h ago
                  </p>
                </div>
              </div>
              <button className="text-[10px] font-bold text-theme-danger hover:text-white uppercase tracking-wider">Revoke</button>
            </div>
          </div>

          <Button variant="danger" className="w-full" leftIcon={AlertTriangle}>
            Sign Out All Other Devices
          </Button>
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

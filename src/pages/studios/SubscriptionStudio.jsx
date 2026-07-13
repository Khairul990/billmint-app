import React from 'react';
import { CreditCard, Crown, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const SubscriptionStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
          <Crown className="w-6 h-6 text-theme-accent drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">Subscription Studio</h2>
          <p className="text-xs text-theme-secondary font-medium">Manage your Premium plan, storage limits, and usage analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Main Plan Card */}
          <div className="p-8 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-glass">
            <div className="absolute top-0 right-0 w-48 h-48 bg-theme-accent/5 rounded-full blur-[60px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-theme-primary flex items-center gap-2">
                  Pro Enterprise <Sparkles className="w-5 h-5 text-theme-accent" />
                </h3>
                <p className="text-sm text-theme-accent font-bold mt-1">Active Subscription</p>
              </div>
              <span className="px-3 py-1 bg-theme-accent/10 text-theme-accent text-[10px] font-black uppercase tracking-wider rounded-lg border border-theme-accent/20">
                Billed Annually
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-5 mb-8 relative z-10">
              <div className="p-5 bg-theme-surface-elevated rounded-2xl border border-theme-border-soft hover:border-theme-accent/30 transition-colors">
                <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-wider mb-2">Bills Generated</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-theme-primary">1,245</span>
                  <span className="text-xs text-theme-secondary mb-1">/ Unlimited</span>
                </div>
                <div className="w-full bg-theme-border-soft h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-theme-accent w-[15%] h-full rounded-full shadow-[0_0_10px_var(--accent)]" />
                </div>
              </div>
              <div className="p-5 bg-theme-surface-elevated rounded-2xl border border-theme-border-soft hover:border-theme-accent/30 transition-colors">
                <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-wider mb-2">Cloud Storage</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-theme-primary">4.2 GB</span>
                  <span className="text-xs text-theme-secondary mb-1">/ 100 GB</span>
                </div>
                <div className="w-full bg-theme-border-soft h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-theme-accent w-[4%] h-full rounded-full shadow-[0_0_10px_var(--accent)]" />
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" leftIcon={Crown}>
              Manage Billing & Upgrade
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment History */}
          <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-premium-sm">
            <h3 className="text-sm font-bold text-theme-primary mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-theme-secondary" /> Payment History
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft hover:border-theme-accent/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-theme-accent/5 flex items-center justify-center group-hover:bg-theme-accent/10 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-theme-success" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors">Pro Plan - Annual</p>
                      <p className="text-[10px] text-theme-secondary mt-0.5">Oct 12, 2026</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-theme-primary">$299.00</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-[10px] uppercase tracking-wider">
              View All Invoices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStudio;

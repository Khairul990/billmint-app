import React, { useState } from 'react';
import { 
  TrendingDown, 
  Layers, 
  Sparkles, 
  Settings, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  ExternalLink,
  HelpCircle,
  Bell
} from 'lucide-react';
import { login } from '../services/dbEngine';

/**
 * Premium iOS-style consolidated submenu hub for mobile/responsive users
 */
const MoreMenu = ({ 
  setCurrentTab, 
  isAuthenticated, 
  onLoginSuccess,
  businessSettings,
  pendingPaymentsCount = 0
}) => {

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Dynamic SaaS Hub Greeting Header */}
      <div className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-3xl p-6 text-white shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-theme-card dark:bg-theme-card/10 rounded-full blur-2xl pointer-events-none"></div>
        <span className="text-[9px] font-black tracking-widest text-theme-accent bg-theme-card dark:bg-theme-card/20 px-2.5 py-1 rounded-full uppercase">
          BillQyro Workspace Hub
        </span>
        <h2 className="text-xl font-extrabold tracking-tight mt-2.5">
          {businessSettings?.businessName || 'BillQyro Embroidery'}
        </h2>
        <p className="text-xs text-white/80 font-bold mt-1">
          Owner: {businessSettings?.ownerName || 'Administrator'} • Phone: {businessSettings?.phone || 'N/A'}
        </p>
      </div>

      {/* Grid of iOS-Style Premium Navigation Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Expenses page */}
        <button
          onClick={() => setCurrentTab('expenses')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-danger/5 text-theme-danger flex items-center justify-center group-hover:bg-rose-100 transition-colors shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Overhead Expenses</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Log machine threads, needles, bills, repairs
            </p>
          </div>
        </button>

        {/* Pending Payments page */}
        <button
          onClick={() => setCurrentTab('pending-payments')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full relative"
        >
          {pendingPaymentsCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/30 animate-pulse flex items-center justify-center border-2 border-white dark:border-[#070c18]">
              {pendingPaymentsCount}
            </span>
          )}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${pendingPaymentsCount > 0 ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-100' : 'bg-theme-accent-light/50 text-theme-accent group-hover:bg-theme-accent-light'}`}>
            <Bell className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Payment Proofs</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Review customer payment screenshots
            </p>
          </div>
        </button>

        {/* Inventory page */}
        <button
          onClick={() => setCurrentTab('products')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Products & Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Prefill stitch types, sizes, catalog prices
            </p>
          </div>
        </button>

        {/* Subscriptions page */}
        <button
          onClick={() => setCurrentTab('subscription')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-warning/5 text-theme-warning flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>SaaS Subscriptions</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Unlock custom logo uploads & watermarks
            </p>
          </div>
        </button>

        {/* User Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Business Settings</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Setup your company profile, logo, and taxes
            </p>
          </div>
        </button>


        {/* How to Use Guide page */}
        <button
          onClick={() => setCurrentTab('guide')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full sm:col-span-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>How to Use BillQyro</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Learn to create invoices and manage customers
            </p>
          </div>
        </button>

      </div>


    </div>
  );
};

export default MoreMenu;

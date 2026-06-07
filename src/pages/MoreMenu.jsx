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
  Bell,
  RefreshCcw,
  BookOpen,
  PieChart,
  FileSpreadsheet,
  Palette,
  Smartphone,
  Store,
  Database,
  Shield,
  Activity
} from 'lucide-react';
import { login, factoryResetAllData } from '../services/dbEngine';

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

  const handleFactoryReset = () => {
    if (window.confirm("🚨 WARNING: Are you sure you want to completely factory reset your app? This will wipe all data, invoices, and settings, and return you to the onboarding screen like a new user. This action cannot be undone locally!")) {
      factoryResetAllData();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      
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
        
        {/* Due Ledger page */}
        <button
          onClick={() => setCurrentTab('due-ledger')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light/50 text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Due Ledger</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Track customer payments & balances
            </p>
          </div>
        </button>

        {/* Estimates page */}
        <button
          onClick={() => setCurrentTab('estimates')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Estimates & Quotes</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Manage business proposals & quotes
            </p>
          </div>
        </button>

        {/* Reports & Analytics page */}
        <button
          onClick={() => setCurrentTab('reports')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Reports & Analytics</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Analyze sales, tax, and item reports
            </p>
          </div>
        </button>
        
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

        {/* Template Marketplace */}
        <button
          onClick={() => setCurrentTab('marketplace')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 flex items-center justify-center group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900 transition-colors shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Template Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Browse & apply business starter packs
            </p>
          </div>
        </button>

        {/* PDF Template Studio */}
        <button
          onClick={() => setCurrentTab('pdf-templates')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>PDF Template Studio</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Customize the look and feel of your invoice documents
            </p>
          </div>
        </button>

        {/* Live Link Template Studio */}
        <button
          onClick={() => setCurrentTab('live-link-templates')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900 transition-colors shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Live Link Studio</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Customize your public payment link layout
            </p>
          </div>
        </button>

        {/* Backup & Restore Center */}
        <button
          onClick={() => setCurrentTab('backup-restore')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900 transition-colors shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Backup & Restore Center</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Safely export or import your business database
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

        {/* System Health */}
        <button
          onClick={() => setCurrentTab('system-health')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>System Health</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Local database and sync engine status
            </p>
          </div>
        </button>

        {/* Audit Logs */}
        <button
          onClick={() => setCurrentTab('audit-logs')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 flex items-center justify-center group-hover:bg-slate-100 transition-colors shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Audit Logs</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Append-only security and action traces
            </p>
          </div>
        </button>


        {/* Help Center page */}
        <button
          onClick={() => setCurrentTab('help-center')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Help Center</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-theme-muted transition-opacity" />
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Guides, tutorials, FAQs & troubleshooting
            </p>
          </div>
        </button>

        {/* Legal & Compliance */}
        <button
          onClick={() => setCurrentTab('support')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center group-hover:bg-theme-accent/20 transition-colors shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Support</span>
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Get help and contact support
            </p>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab('privacy')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Privacy Policy</span>
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              How we collect and protect your data
            </p>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab('terms')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Terms of Service</span>
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Rules and guidelines for usage
            </p>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab('refund')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center group-hover:bg-theme-accent-light transition-colors shrink-0">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Refund Policy</span>
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Billing and subscription refunds
            </p>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab('data-deletion')}
          className="bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface text-left p-5 rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-danger/10 text-theme-danger flex items-center justify-center group-hover:bg-theme-danger/20 transition-colors shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-1.5">
              <span>Data Management</span>
            </h4>
            <p className="text-[11px] text-theme-muted font-semibold truncate">
              Export or delete your account data
            </p>
          </div>
        </button>

        {/* Factory Reset button */}
        <button
          onClick={handleFactoryReset}
          className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-left p-5 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full sm:col-span-2 mt-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-200 dark:group-hover:bg-rose-900 transition-colors shrink-0">
            <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-rose-700 dark:text-rose-400 tracking-tight flex items-center gap-1.5">
              <span>Factory Reset App</span>
            </h4>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-semibold truncate">
              Wipe all data and restart as a new user
            </p>
          </div>
        </button>

      </div>


    </div>
  );
};

export default MoreMenu;

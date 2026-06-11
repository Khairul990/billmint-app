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
  Activity,
  ChevronRight,
  Info,
  MessageSquare
} from 'lucide-react';
import { login, factoryResetAllData } from '../services/dbEngine';

/**
 * Android Settings Style More Menu
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

  const SectionTitle = ({ title }) => (
    <h3 className="text-theme-accent font-black text-xs uppercase tracking-widest px-4 mb-2 mt-6">
      {title}
    </h3>
  );

  const SettingsItem = ({ icon: Icon, title, description, onClick, alertCount }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-theme-card dark:bg-theme-card hover:bg-theme-app active:scale-[0.99] transition-all border-b border-theme-border-soft last:border-b-0 first:rounded-t-3xl last:rounded-b-3xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h4 className="font-extrabold text-sm text-theme-primary tracking-tight">
            {title}
          </h4>
          <p className="text-[11px] text-theme-muted font-semibold truncate max-w-[200px]">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {alertCount > 0 && (
          <span className="w-6 h-6 bg-theme-danger text-white text-[10px] font-black rounded-full shadow-lg shadow-theme-danger/30 flex items-center justify-center">
            {alertCount}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-theme-muted/50" />
      </div>
    </button>
  );

  return (
    <div className="space-y-2 max-w-2xl mx-auto pb-10">
      
      {/* Header Profile Card */}
      <div className="bg-[image:var(--accent-gradient)] text-theme-button-text rounded-3xl p-6 text-white shadow-premium relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 w-36 h-36 bg-theme-card dark:bg-theme-card/10 rounded-full blur-2xl pointer-events-none"></div>
        <span className="text-[9px] font-black tracking-widest text-theme-accent bg-theme-card dark:bg-theme-card/20 px-2.5 py-1 rounded-full uppercase">
          {businessSettings?.activeWorkspaceName || 'Main Workspace'}
        </span>
        <h2 className="text-xl font-extrabold tracking-tight mt-2.5">
          {businessSettings?.businessName || 'BillQyro Embroidery'}
        </h2>
        <p className="text-xs text-white/80 font-bold mt-1">
          Owner: {businessSettings?.ownerName || 'Administrator'} • Phone: {businessSettings?.phone || 'N/A'}
        </p>
      </div>

      {/* Business Section */}
      <SectionTitle title="Business" />
      <div className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-premium">
        <SettingsItem 
          icon={Settings} 
          title="Business Profile" 
          description="Setup company details & logo" 
          onClick={() => setCurrentTab('settings')} 
        />
        <SettingsItem 
          icon={Store} 
          title="Workspace Manager" 
          description="Manage multiple businesses" 
          onClick={() => setCurrentTab('workspace-manager')} 
        />
        <SettingsItem 
          icon={Palette} 
          title="Templates" 
          description="Invoice & Live Link layouts" 
          onClick={() => setCurrentTab('marketplace')} 
        />
        {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('products')) && (
          <SettingsItem 
            icon={Layers} 
            title="Products" 
            description="Manage inventory & catalog" 
            onClick={() => setCurrentTab('products')} 
          />
        )}
      </div>

      {/* Finance Section */}
      <SectionTitle title="Finance" />
      <div className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-premium">
        {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('reports')) && (
          <SettingsItem 
            icon={PieChart} 
            title="Reports" 
            description="Sales, tax, and analytics" 
            onClick={() => setCurrentTab('reports')} 
          />
        )}
        {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('dueLedger')) && (
          <SettingsItem 
            icon={BookOpen} 
            title="Due Ledger" 
            description="Track customer balances" 
            onClick={() => setCurrentTab('due-ledger')} 
          />
        )}
        {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('expenses')) && (
          <SettingsItem 
            icon={TrendingDown} 
            title="Expenses" 
            description="Overhead and operational costs" 
            onClick={() => setCurrentTab('expenses')} 
          />
        )}
        {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('paymentProofs')) && (
          <SettingsItem 
            icon={Bell} 
            title="Payment Proofs" 
            description="Review collected payments" 
            onClick={() => setCurrentTab('pending-payments')} 
            alertCount={pendingPaymentsCount}
          />
        )}
      </div>

      {/* System Section */}
      <SectionTitle title="System" />
      <div className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-premium">
        <SettingsItem 
          icon={Database} 
          title="Backup" 
          description="Export & restore database" 
          onClick={() => setCurrentTab('backup-restore')} 
        />
        <SettingsItem 
          icon={Activity} 
          title="Storage Health" 
          description="Sync engine status" 
          onClick={() => setCurrentTab('system-health')} 
        />
        <SettingsItem 
          icon={Sparkles} 
          title="Subscription" 
          description="Manage SaaS features" 
          onClick={() => setCurrentTab('subscription')} 
        />
      </div>

      {/* Support Section */}
      <SectionTitle title="Support" />
      <div className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-premium">
        <SettingsItem 
          icon={HelpCircle} 
          title="Help Center" 
          description="Guides and tutorials" 
          onClick={() => setCurrentTab('help-center')} 
        />
        <SettingsItem 
          icon={MessageSquare} 
          title="Contact" 
          description="Get help and support" 
          onClick={() => setCurrentTab('support')} 
        />
        <SettingsItem 
          icon={Info} 
          title="About" 
          description="Privacy, Terms & Legal" 
          onClick={() => setCurrentTab('about')} 
        />
      </div>

      {/* Danger Zone */}
      <div className="mt-8">
        <button
          onClick={handleFactoryReset}
          className="w-full flex items-center justify-center gap-2 p-4 bg-theme-danger/10 text-theme-danger hover:bg-theme-danger/20 rounded-3xl transition-colors font-extrabold text-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Factory Reset App
        </button>
      </div>

    </div>
  );
};

export default MoreMenu;

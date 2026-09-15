import React from 'react';
import { 
  TrendingDown, 
  Layers, 
  Sparkles, 
  Settings, 
  HelpCircle, 
  Bell, 
  RefreshCcw, 
  BookOpen, 
  PieChart, 
  FileSpreadsheet, 
  FileText, 
  Palette, 
  Store, 
  Database, 
  Activity, 
  ChevronRight, 
  Info, 
  MessageSquare,
  Landmark,
  Sliders,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Phone,
  User,
  ArrowRight
} from 'lucide-react';
import { adminEngine } from '../services/adminEngine';
import { useFeatureControl } from '../hooks/useFeatureControl';
import { SignatureSurface, Badge } from '../components/ui';

/**
 * Signature BillQyro Command Center — More Menu Experience
 * Follows Financial Clarity + Soft Luxury design philosophy.
 * Organized into intuitive command groups with accessible touch targets.
 */
const MoreMenu = ({ 
  setCurrentTab, 
  businessSettings,
  pendingPaymentsCount = 0,
  isAuthenticated = false,
  userRole = 'owner'
}) => {
  const activeWsId = businessSettings?.activeWorkspaceId || 'default';
  const { isFeatureEnabled } = useFeatureControl(activeWsId);

  const handleFactoryReset = () => {
    if (window.confirm("🚨 WARNING: Are you sure you want to completely factory reset your app? This will wipe local cache and return you to the onboarding screen. Your cloud data remains safe if logged in.")) {
      adminEngine.factoryResetAllData();
    }
  };

  const SectionHeader = ({ title, subtitle }) => (
    <div className="flex items-center justify-between px-1 mb-2.5 mt-6 first:mt-2">
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-theme-muted font-mono">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-theme-muted/70 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const CommandItem = ({ 
    icon: Icon, 
    title, 
    description, 
    onClick, 
    alertCount = 0,
    tag = null,
    isFirst = false,
    isLast = false
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-theme-card hover:bg-theme-surface/80 active:bg-theme-surface transition-all duration-150 border-b border-theme-border-soft last:border-b-0 cursor-pointer group text-left ${
        isFirst ? 'rounded-t-2xl' : ''
      } ${isLast ? 'rounded-b-2xl' : ''}`}
      style={{ minHeight: '64px' }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-border-soft group-hover:border-theme-accent/30 group-hover:bg-theme-accent/10 text-theme-muted group-hover:text-theme-accent flex items-center justify-center shrink-0 transition-colors">
          <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xs sm:text-sm text-theme-primary tracking-tight group-hover:text-theme-accent transition-colors truncate">
              {title}
            </h4>
            {tag && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-theme-surface border border-theme-border-soft text-theme-muted shrink-0">
                {tag}
              </span>
            )}
          </div>
          <p className="text-[11px] text-theme-muted font-medium truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {alertCount > 0 && (
          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-sm flex items-center justify-center animate-pulse">
            {alertCount}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-theme-muted/50 group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto pb-16 px-3 sm:px-4 space-y-4 animate-fadeIn">
      
      {/* 1. Signature Business Identity Header */}
      <div className="rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-premium bg-gradient-to-br from-[#075E50] via-[#0B8F78] to-[#18B99B] text-white border border-theme-tint-border">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest text-theme-accent bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase border border-white/10">
                {businessSettings?.activeWorkspaceName || 'Main Business'}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-theme-accent/90 bg-theme-tint-bg px-2 py-0.5 rounded-full border border-theme-tint-border">
                <CheckCircle2 className="w-2.5 h-2.5 text-theme-accent" />
                Cloud Active
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
              {businessSettings?.businessName || 'BillQyro Workspace'}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-theme-accent/80 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-theme-accent" />
                {businessSettings?.ownerName || 'Administrator'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-theme-accent" />
                {businessSettings?.phone || 'No phone registered'}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
            <button
              onClick={() => setCurrentTab('settings')}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold text-white border border-white/20 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Business Command Group */}
      <div>
        <SectionHeader title="Business & Identity" subtitle="Core company configuration and multi-workspace" />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={Building2} 
            title="Business Profile" 
            description="Company name, logo, phone, address and tax identification" 
            onClick={() => setCurrentTab('settings')} 
            isFirst={true}
          />
          <CommandItem 
            icon={Store} 
            title="Workspace Manager" 
            description="Create, switch, or manage multiple separate business branches" 
            onClick={() => setCurrentTab('workspace-manager')} 
            tag="Multi-Business"
          />
          <CommandItem 
            icon={Sliders} 
            title="Modules & Presets" 
            description="Configure industry presets (Retail, Tailor, Clinic, Tuition, etc.)" 
            onClick={() => setCurrentTab('settings')} 
          />
          <CommandItem 
            icon={Palette} 
            title="Templates & Layouts" 
            description="Custom invoice PDF layouts, typography & Live Link studios" 
            onClick={() => setCurrentTab('marketplace')} 
          />
          {isFeatureEnabled('product') && (
            <CommandItem 
              icon={Layers} 
              title="Products & Inventory" 
              description="Manage item catalog, pricing, SKU codes & stock" 
              onClick={() => setCurrentTab('products')} 
              isLast={true}
            />
          )}
        </div>
      </div>

      {/* 3. Bills & Finance Command Group */}
      <div>
        <SectionHeader title="Bills & Financial Intelligence" subtitle="Ledgers, invoicing, and incoming payments" />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={FileSpreadsheet} 
            title="Invoices & Bills" 
            description="View, issue, print, and track all customer bills" 
            onClick={() => setCurrentTab('invoices')} 
            isFirst={true}
          />
          {isFeatureEnabled('invoice.estimates') && (
            <CommandItem 
              icon={FileText} 
              title="Estimates & Quotations" 
              description="Create proforma invoices, quotes and proposals" 
              onClick={() => setCurrentTab('estimates')} 
            />
          )}
          {isFeatureEnabled('reports') && (
            <CommandItem 
              icon={PieChart} 
              title="Reports & Analytics" 
              description="Revenue breakdown, collection velocity, tax & margin reports" 
              onClick={() => setCurrentTab('reports')} 
              tag="Intelligence"
            />
          )}
          {isFeatureEnabled('treasury') && (
            <CommandItem 
              icon={BookOpen} 
              title="Customer Due Ledger" 
              description="Comprehensive customer debit/credit balance ledger" 
              onClick={() => setCurrentTab('due-ledger')} 
            />
          )}
          {isFeatureEnabled('treasury') && (
            <CommandItem 
              icon={Landmark} 
              title="Internal Bank & Cash" 
              description="Bank accounts, cash registers, and reconciled liquidity" 
              onClick={() => setCurrentTab('bank')} 
            />
          )}
          {isFeatureEnabled('treasury.moneyOut') && (
            <CommandItem 
              icon={TrendingDown} 
              title="Business Expenses" 
              description="Overhead, operational costs, vendor payouts & receipts" 
              onClick={() => setCurrentTab('expenses')} 
            />
          )}
          {isFeatureEnabled('payment') && (
            <CommandItem 
              icon={CreditCard} 
              title="Collection Center" 
              description="Collect UPI/QR payments & verify digital payment proofs" 
              onClick={() => setCurrentTab('collection-center')} 
              alertCount={pendingPaymentsCount}
              tag="Verification"
              isLast={true}
            />
          )}
        </div>
      </div>

      {/* 4. System & Cloud Operations Group */}
      <div>
        <SectionHeader title="System & Cloud Operations" subtitle="Safety, snapshots, and SaaS subscription" />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={Database} 
            title="Backup & Restore" 
            description="Export encrypted database backup & restore offline snapshots" 
            onClick={() => setCurrentTab('backup-restore')} 
            isFirst={true}
          />
          <CommandItem 
            icon={Activity} 
            title="Storage & Sync Health" 
            description="Verify IndexedDB storage and real-time cloud sync queue" 
            onClick={() => setCurrentTab('system-health')} 
          />
          <CommandItem 
            icon={Sparkles} 
            title="Subscription & Plan" 
            description="Manage BillQyro plan, invoice limits & cloud features" 
            onClick={() => setCurrentTab('subscription')} 
            isLast={true}
          />
        </div>
      </div>

      {/* 5. Support & Compliance Group */}
      <div>
        <SectionHeader title="Support & Compliance" subtitle="Documentation, help desk, and privacy terms" />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={HelpCircle} 
            title="Help Center" 
            description="Interactive guides, shortcuts, and billing tutorials" 
            onClick={() => setCurrentTab('help-center')} 
            isFirst={true}
          />
          <CommandItem 
            icon={MessageSquare} 
            title="Contact Support" 
            description="Direct developer & customer service support line" 
            onClick={() => setCurrentTab('support')} 
          />
          <CommandItem 
            icon={Info} 
            title="Privacy & Legal" 
            description="Privacy Policy, Terms of Service & Refund commitments" 
            onClick={() => setCurrentTab('privacy')} 
            isLast={true}
          />
        </div>
      </div>

      {/* 6. Danger Zone */}
      <div className="pt-4">
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h5 className="text-xs font-bold text-rose-500">Factory Reset Safe Mode</h5>
            <p className="text-[10px] text-theme-muted font-medium">Clears local cached state. Cloud database stays completely safe.</p>
          </div>
          <button
            onClick={handleFactoryReset}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Factory Reset App</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default MoreMenu;

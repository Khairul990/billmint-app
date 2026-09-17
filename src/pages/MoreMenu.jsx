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
import { useI18n } from '../utils/i18n';
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
  const { t } = useI18n();

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
                {businessSettings?.activeWorkspaceName || t('more.main_business', 'Main Business')}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-theme-accent/90 bg-theme-tint-bg px-2 py-0.5 rounded-full border border-theme-tint-border">
                <CheckCircle2 className="w-2.5 h-2.5 text-theme-accent" />
                {t('more.cloud_active', 'Cloud Active')}
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
                {businessSettings?.phone || t('more.no_phone', 'No phone registered')}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
            <button
              onClick={() => setCurrentTab('settings')}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold text-white border border-white/20 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t('more.configure', 'Configure')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Business Command Group */}
      <div>
        <SectionHeader title={t('more.business_identity', 'Business & Identity')} subtitle={t('more.business_identity_sub', 'Core company configuration and multi-workspace')} />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={Building2} 
            title={t('more.business_profile', 'Business Profile')} 
            description={t('more.business_profile_desc', 'Company name, logo, phone, address and tax identification')} 
            onClick={() => setCurrentTab('settings')} 
            isFirst={true}
          />
          <CommandItem 
            icon={Store} 
            title={t('more.workspace_manager', 'Workspace Manager')} 
            description={t('more.workspace_manager_desc', 'Create, switch, or manage multiple separate business branches')} 
            onClick={() => setCurrentTab('workspace-manager')} 
            tag={t('more.multi_business', 'Multi-Business')}
          />
          <CommandItem 
            icon={Sliders} 
            title={t('more.modules_presets', 'Modules & Presets')} 
            description={t('more.modules_presets_desc', 'Configure industry presets (Retail, Tailor, Clinic, Tuition, etc.)')} 
            onClick={() => setCurrentTab('settings')} 
          />
          <CommandItem 
            icon={Palette} 
            title={t('more.templates_layouts', 'Templates & Layouts')} 
            description={t('more.templates_layouts_desc', 'Custom invoice PDF layouts, typography & Live Link studios')} 
            onClick={() => setCurrentTab('marketplace')} 
          />
          {isFeatureEnabled('product') && (
            <CommandItem 
              icon={Layers} 
              title={t('more.products_inventory', 'Products & Inventory')} 
              description={t('more.products_inventory_desc', 'Manage item catalog, pricing, SKU codes & stock')} 
              onClick={() => setCurrentTab('products')} 
              isLast={true}
            />
          )}
        </div>
      </div>

      {/* 3. Bills & Finance Command Group */}
      <div>
        <SectionHeader title={t('more.bills_finance', 'Bills & Financial Intelligence')} subtitle={t('more.bills_finance_sub', 'Ledgers, invoicing, and incoming payments')} />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={FileSpreadsheet} 
            title={t('more.invoices_bills', 'Invoices & Bills')} 
            description={t('more.invoices_bills_desc', 'View, issue, print, and track all customer bills')} 
            onClick={() => setCurrentTab('invoices')} 
            isFirst={true}
          />
          {isFeatureEnabled('invoice.estimates') && (
            <CommandItem 
              icon={FileText} 
              title={t('more.estimates_quotes', 'Estimates & Quotations')} 
              description={t('more.estimates_quotes_desc', 'Create proforma invoices, quotes and proposals')} 
              onClick={() => setCurrentTab('estimates')} 
            />
          )}
          {isFeatureEnabled('reports') && (
            <CommandItem 
              icon={PieChart} 
              title={t('more.reports_analytics', 'Reports & Analytics')} 
              description={t('more.reports_analytics_desc', 'Revenue breakdown, collection velocity, tax & margin reports')} 
              onClick={() => setCurrentTab('reports')} 
              tag={t('more.intelligence', 'Intelligence')}
            />
          )}
          {isFeatureEnabled('treasury') && (
            <CommandItem 
              icon={BookOpen} 
              title={t('more.due_ledger', 'Customer Due Ledger')} 
              description={t('more.due_ledger_desc', 'Comprehensive customer debit/credit balance ledger')} 
              onClick={() => setCurrentTab('due-ledger')} 
            />
          )}
          {isFeatureEnabled('treasury') && (
            <CommandItem 
              icon={Landmark} 
              title={t('more.bank_cash', 'Internal Bank & Cash')} 
              description={t('more.bank_cash_desc', 'Bank accounts, cash registers, and reconciled liquidity')} 
              onClick={() => setCurrentTab('bank')} 
            />
          )}
          {isFeatureEnabled('treasury.moneyOut') && (
            <CommandItem 
              icon={TrendingDown} 
              title={t('more.expenses', 'Business Expenses')} 
              description={t('more.expenses_desc', 'Overhead, operational costs, vendor payouts & receipts')} 
              onClick={() => setCurrentTab('expenses')} 
            />
          )}
          {isFeatureEnabled('payment') && (
            <CommandItem 
              icon={CreditCard} 
              title={t('more.collection_center', 'Collection Center')} 
              description={t('more.collection_center_desc', 'Collect UPI/QR payments & verify digital payment proofs')} 
              onClick={() => setCurrentTab('collection-center')} 
              alertCount={pendingPaymentsCount}
              tag={t('more.verification', 'Verification')}
              isLast={true}
            />
          )}
        </div>
      </div>

      {/* 4. System & Cloud Operations Group */}
      <div>
        <SectionHeader title={t('more.system_cloud', 'System & Cloud Operations')} subtitle={t('more.system_cloud_sub', 'Safety, snapshots, and SaaS subscription')} />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={Database} 
            title={t('more.backup_restore', 'Backup & Restore')} 
            description={t('more.backup_restore_desc', 'Export encrypted database backup & restore offline snapshots')} 
            onClick={() => setCurrentTab('backup-restore')} 
            isFirst={true}
          />
          <CommandItem 
            icon={Activity} 
            title={t('more.storage_sync', 'Storage & Sync Health')} 
            description={t('more.storage_sync_desc', 'Verify IndexedDB storage and real-time cloud sync queue')} 
            onClick={() => setCurrentTab('system-health')} 
          />
          <CommandItem 
            icon={Sparkles} 
            title={t('more.subscription', 'Subscription & Plan')} 
            description={t('more.subscription_desc', 'Manage BillQyro plan, invoice limits & cloud features')} 
            onClick={() => setCurrentTab('subscription')} 
            isLast={true}
          />
        </div>
      </div>

      {/* 5. Support & Compliance Group */}
      <div>
        <SectionHeader title={t('more.support_compliance', 'Support & Compliance')} subtitle={t('more.support_compliance_sub', 'Documentation, help desk, and privacy terms')} />
        <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium-sm overflow-hidden divide-y divide-theme-border-soft">
          <CommandItem 
            icon={HelpCircle} 
            title={t('more.help_center', 'Help Center')} 
            description={t('more.help_center_desc', 'Interactive guides, shortcuts, and billing tutorials')} 
            onClick={() => setCurrentTab('help-center')} 
            isFirst={true}
          />
          <CommandItem 
            icon={MessageSquare} 
            title={t('more.contact_support', 'Contact Support')} 
            description={t('more.contact_support_desc', 'Direct developer & customer service support line')} 
            onClick={() => setCurrentTab('support')} 
          />
          <CommandItem 
            icon={Info} 
            title={t('more.privacy_legal', 'Privacy & Legal')} 
            description={t('more.privacy_legal_desc', 'Privacy Policy, Terms of Service & Refund commitments')} 
            onClick={() => setCurrentTab('privacy')} 
            isLast={true}
          />
        </div>
      </div>

      {/* 6. Danger Zone */}
      <div className="pt-4">
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h5 className="text-xs font-bold text-rose-500">{t('more.factory_reset', 'Factory Reset Safe Mode')}</h5>
            <p className="text-[10px] text-theme-muted font-medium">{t('more.factory_reset_desc', 'Clears local cached state. Cloud database stays completely safe.')}</p>
          </div>
          <button
            onClick={handleFactoryReset}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{t('more.factory_reset_btn', 'Factory Reset App')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default MoreMenu;

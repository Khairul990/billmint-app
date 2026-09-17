import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { createPortal } from 'react-dom';
import { 
  Building2, Palette, Globe, LayoutDashboard, 
  LayoutTemplate, Zap, Blocks, Shield, Save, Database, Undo, Redo, RotateCcw,
  Crown, Lock, HardDrive, Globe2, Bell, ArrowLeft, PanelLeftClose, PanelLeftOpen,
  CheckCircle2, Menu, X, ChevronDown, ChevronRight, Search, Sparkles, ArrowRight,
  SlidersHorizontal, RefreshCw, AlertTriangle, Store, ShieldCheck, User, Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsHistory } from '../../hooks/useSettingsHistory';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SignatureSurface, Badge } from '../../components/ui';
import { getStudioHeaderTarget } from '../../utils/portalTargets';
import { useI18n } from '../../utils/i18n';

// Lazy-loaded studio modules
const BusinessStudio = React.lazy(() => import('./BusinessStudio'));
const ThemeStudio = React.lazy(() => import('./ThemeStudio'));
const InvoiceStudio = React.lazy(() => import('./InvoiceStudio'));
const FormBuilder = React.lazy(() => import('./FormBuilder'));
const PortalStudio = React.lazy(() => import('./PortalStudio'));
const DashboardStudio = React.lazy(() => import('./DashboardStudio'));
const AutomationStudio = React.lazy(() => import('./AutomationStudio'));
const RoleStudio = React.lazy(() => import('./RoleStudio'));
const DatabaseStudio = React.lazy(() => import('./DatabaseStudio'));
const SubscriptionStudio = React.lazy(() => import('./SubscriptionStudio'));
const SecurityStudio = React.lazy(() => import('./SecurityStudio'));
const BackupStudio = React.lazy(() => import('./BackupStudio'));
const LocalizationStudio = React.lazy(() => import('./LocalizationStudio'));
const NotificationStudio = React.lazy(() => import('./NotificationStudio'));
const FeatureControlStudio = React.lazy(() => import('./FeatureControlStudio'));

const STUDIO_ROUTES = [
  { type: 'label', label: 'Command Center', tier: 'simple' },
  { id: 'overview', label: 'Settings Overview', icon: SlidersHorizontal, desc: 'Command center & workspace summary', count: 'Overview', tier: 'simple' },

  { type: 'label', label: 'Core Workspace', tier: 'simple' },
  { id: 'business', label: 'Business Profile', icon: Building2, desc: 'Name, phone, logo, tax & address', count: '12 settings', tier: 'simple' },
  { id: 'theme', label: 'Appearance & Theme', icon: Palette, desc: 'Themes, dark mode, accent & layout', count: '8 settings', tier: 'simple' },
  { id: 'invoice', label: 'Invoice & Billing', icon: LayoutTemplate, desc: 'Prefix, terms, tax, footer & templates', count: '14 settings', tier: 'simple' },
  { id: 'features', label: 'Modules & Features', icon: Blocks, desc: 'Category-aware module switches', count: '10 modules', tier: 'simple' },
  { id: 'backup', label: 'Data & Cloud Backup', icon: HardDrive, desc: 'Export, import & cloud snapshots', count: '6 settings', tier: 'simple' },
  { id: 'subscription', label: 'Subscription & Plan', icon: Crown, desc: 'Usage limits & active tier status', count: 'Pro Tier', tier: 'simple' },

  { type: 'label', label: 'Advanced Operations', tier: 'advanced' },
  { id: 'portal', label: 'Client Portal & Live Links', icon: Globe, desc: 'Public bill link & customer experience', count: '5 settings', tier: 'advanced' },
  { id: 'form', label: 'Custom Form Fields', icon: LayoutTemplate, desc: 'Custom invoice & customer inputs', count: '4 settings', tier: 'advanced' },
  { id: 'security', label: 'Security & Access', icon: Lock, desc: 'Workspace isolation & active sessions', count: '6 settings', tier: 'advanced' },
  { id: 'roles', label: 'Staff & Roles', icon: Shield, desc: 'User permissions & role management', count: '4 roles', tier: 'advanced' },
  { id: 'notification', label: 'Notifications & Alerts', icon: Bell, desc: 'WhatsApp templates & payment reminders', count: '6 templates', tier: 'advanced' },
  { id: 'localization', label: 'Currency & Regions', icon: Globe2, desc: 'Regional currency & time formats', count: '3 formats', tier: 'advanced' },
  { id: 'dashboard', label: 'Dashboard Widgets', icon: LayoutDashboard, desc: 'Customize KPI card visibility', count: '8 cards', tier: 'advanced' },
  { id: 'automation', label: 'Automations', icon: Zap, desc: 'Custom workflows & payment triggers', count: '4 rules', tier: 'advanced' },
  { id: 'database', label: 'Data Collections', icon: Database, desc: 'Inspect database tables & metrics', count: 'Tables', tier: 'advanced' }
];

const StudioLayout = ({
  settings, onSaveSettings, isAdmin, subscription, setCurrentTab
}) => {
  const [activeStudio, setActiveStudio] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'simple', 'advanced'
  const { t, lang } = useI18n();

  // Route label/desc translation (falls back to the built-in English string)
  const routeLabel = (route) => route?.type === 'label'
    ? t('studio.group.' + route.label, route.label)
    : t('studio.label.' + route.id, route.label);
  const routeDesc = (route) => (route?.desc ? t('studio.desc.' + route.id, route.desc) : '');
  
  const {
    draftSettings,
    isDirty,
    handleUpdateDraft,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useSettingsHistory(settings);

  const [isSaving, setIsSaving] = useState(false);

  // Latest draft snapshot for immediate theme publishing.
  const draftRef = useRef(draftSettings);
  useEffect(() => { draftRef.current = draftSettings; }, [draftSettings]);

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  // Theme changes publish instantly - users expect a clicked theme to
  // stick without pressing Save. Everything else keeps the draft flow.
  const handleThemeUpdate = (updates) => {
    handleUpdateDraft(updates);
    const THEME_KEYS = ['themeColor', 'darkMode', 'brandColor', 'themeType'];
    if (Object.keys(updates).some((k) => THEME_KEYS.includes(k))) {
      const merged = { ...draftRef.current, ...updates };
      Promise.resolve(onSaveSettings(merged)).catch(() => {});
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings(draftSettings);
      reset(draftSettings);
      toast.success('Settings published successfully');
    } catch {
      // App.jsx handles the toast error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    reset(settings);
    toast('Changes discarded');
  };

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let routes = STUDIO_ROUTES;

    if (!q && viewMode !== 'all') {
      routes = routes.filter(r => r.type === 'label' || r.tier === viewMode);
    }

    if (q) {
      routes = routes.filter(r => 
        r.type === 'label' ||
        r.label.toLowerCase().includes(q) || 
        (r.desc && r.desc.toLowerCase().includes(q)) ||
        (r.id && t('studio.label.' + r.id, '').toLowerCase().includes(q))
      );
    }

    return routes.filter((route, index, arr) => {
      if (route.type === 'label') {
        const nextRoute = arr[index + 1];
        if (!nextRoute || nextRoute.type === 'label') {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, viewMode, lang]);

  const activeRouteObj = STUDIO_ROUTES.find(r => r.id === activeStudio) || STUDIO_ROUTES[1];

  const handleSelectRoute = (routeId) => {
    setActiveStudio(routeId);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-theme-app text-theme-primary select-none">
      
      {/* 1. DESKTOP / TABLET NAVIGATION RAIL */}
      <aside 
        className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-72'} transition-all duration-200 bg-theme-surface/60 backdrop-blur-2xl border-r border-theme-border-soft flex-col shrink-0 z-20 shadow-xs`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.2,0,0,1)' }}
      >
        {/* Rail Header */}
        <div className="p-3.5 border-b border-theme-border-soft space-y-2.5">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-sm font-black text-theme-primary">{t('studio.settings_studio', 'Settings Studio')}</h2>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider font-mono">{t('studio.control_center', 'Control Center')}</p>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card transition-colors shrink-0 mx-auto cursor-pointer"
              title={isSidebarCollapsed ? "Expand Rail" : "Collapse Rail"}
              aria-label={isSidebarCollapsed ? "Expand Rail" : "Collapse Rail"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                <input 
                  type="text"
                  placeholder={t('studio.search', 'Search settings...')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                />
              </div>

              {!searchQuery && (
                <div className="flex items-center p-0.5 bg-theme-surface border border-theme-border-soft rounded-xl text-[10px] font-bold text-theme-muted">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'all' ? 'bg-theme-card text-theme-primary shadow-xs font-extrabold' : 'hover:text-theme-primary'}`}
                  >
                    {t('studio.all', 'All')}
                  </button>
                  <button
                    onClick={() => setViewMode('simple')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'simple' ? 'bg-theme-card text-theme-accent shadow-xs font-extrabold' : 'hover:text-theme-primary'}`}
                  >
                    {t('studio.core', 'Core')}
                  </button>
                  <button
                    onClick={() => setViewMode('advanced')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'advanced' ? 'bg-theme-card text-theme-accent shadow-xs font-extrabold' : 'hover:text-theme-primary'}`}
                  >
                    {t('studio.advanced', 'Advanced')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto p-2.5 pb-8 space-y-1 custom-scrollbar">
          {filteredRoutes.map((route, idx) => {
            if (route.type === 'label') {
              if (isSidebarCollapsed) {
                return <div key={`label-${idx}`} className="h-2"></div>;
              }
              return (
                <div key={`label-${idx}`} className="pt-3 pb-1 px-2.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-muted/70">{routeLabel(route)}</p>
                </div>
              );
            }
            const Icon = route.icon;
            const isActive = activeStudio === route.id;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                title={isSidebarCollapsed ? `${route.label} — ${routeDesc(route)}` : undefined}
                className={`w-full flex items-center p-2 rounded-xl transition-all duration-150 relative overflow-hidden group cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                  isActive 
                    ? 'bg-theme-accent/10 text-theme-accent border-l-2 border-theme-accent font-extrabold shadow-2xs' 
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface/70 font-semibold'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSidebarCollapsed ? '' : 'mr-2.5'} ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-primary'}`} />
                {!isSidebarCollapsed && (
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-xs truncate font-bold leading-tight">{routeLabel(route)}</div>
                    <div className="text-[10px] text-theme-muted truncate leading-tight mt-0.5">{routeDesc(route)}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* 2. MOBILE TOP NAVIGATION DROPDOWN */}
      <div className="md:hidden p-3 bg-theme-surface/80 border-b border-theme-border-soft flex items-center justify-between gap-2 shrink-0 backdrop-blur-md">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex-1 flex items-center justify-between p-2 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-left shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
              {React.createElement(activeRouteObj.icon || Building2, { className: 'w-3.5 h-3.5' })}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-theme-primary block truncate">{routeLabel(activeRouteObj)}</span>
              <span className="text-[9px] text-theme-muted block truncate">{t('studio.tap_to_switch', 'Tap to switch section')}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-theme-muted shrink-0 ml-1.5" />
        </button>

        {subscription && !['premium'].includes(String(subscription?.planStatus || subscription?.status || 'free').toLowerCase()) && (
          <button
            onClick={() => setCurrentTab && setCurrentTab('upgrade')}
            className="h-9 px-3 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
            title="Upgrade to Pro"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            isDirty 
              ? 'bg-theme-accent text-white shadow-xs hover:opacity-95' 
              : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? t('studio.saving', 'Saving') : t('studio.save', 'Save')}</span>
        </button>
      </div>

      {/* 3. MOBILE SETTINGS DRAWER MODAL */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex flex-col justify-end"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-theme-app border-t border-theme-border-soft rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                <div>
                  <h3 className="text-sm font-black text-theme-primary">{t('studio.settings_menu', 'Settings Menu')}</h3>
                  <p className="text-[10px] text-theme-muted">{t('studio.select_section', 'Select a studio section to configure')}</p>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2.5">
                <input 
                  type="text"
                  placeholder={t('studio.search', 'Search settings...')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 py-1 custom-scrollbar">
                {filteredRoutes.map((route, idx) => {
                  if (route.type === 'label') {
                    return (
                      <div key={`mob-label-${idx}`} className="pt-2.5 pb-1 px-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-theme-muted">{routeLabel(route)}</p>
                      </div>
                    );
                  }
                  const Icon = route.icon;
                  const isActive = activeStudio === route.id;
                  return (
                    <button
                      key={`mob-${route.id}`}
                      onClick={() => handleSelectRoute(route.id)}
                      className={`w-full flex items-center p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-theme-accent/10 border border-theme-accent/20 text-theme-accent font-bold' 
                          : 'bg-theme-surface border border-theme-border-soft text-theme-secondary hover:text-theme-primary font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-theme-accent' : 'text-theme-muted'}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block truncate">{routeLabel(route)}</span>
                        <span className="text-[9px] text-theme-muted block truncate">{routeDesc(route)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN SETTINGS CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Sticky Header Left Side */}
        {getStudioHeaderTarget('studio-header-portal') && createPortal(
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              className="p-1.5 rounded-xl hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition-colors bg-theme-surface border border-theme-border-soft shadow-2xs cursor-pointer"
              title={t('studio.back', 'Back to Dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-theme-accent/10 border border-theme-accent/20 hidden sm:flex items-center justify-center">
              {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-4 h-4 text-theme-accent' })}
            </div>
            <div>
              <div className="text-xs font-black text-theme-primary truncate max-w-[160px] sm:max-w-none">
                {routeLabel(STUDIO_ROUTES.find(r => r.id === activeStudio)) || 'Settings'}
              </div>
              <div className="text-[10px] text-theme-secondary font-bold flex items-center gap-1.5">
                {isDirty ? (
                  <span className="flex items-center gap-1 text-amber-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> {t('studio.unsaved', 'Unsaved Changes')}</span>
                ) : (
                  <span className="flex items-center gap-1 text-theme-accent"><CheckCircle2 className="w-3 h-3 text-theme-accent" /> {t('studio.synced', 'Auto-Synced')}</span>
                )}
              </div>
            </div>
          </div>,
          document.getElementById('studio-header-portal')
        )}

        {/* Sticky Header Right Actions */}
        {getStudioHeaderTarget('studio-header-actions-portal') && createPortal(
          <div className="flex items-center gap-2 mr-1">
            <div className="hidden sm:flex items-center bg-theme-surface border border-theme-border-soft rounded-xl p-0.5 shadow-2xs">
              <button 
                onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {isDirty && (
              <button 
                onClick={handleDiscard} title="Discard changes"
                className="h-8 px-2.5 rounded-xl border border-theme-border-soft text-theme-muted hover:text-theme-primary bg-theme-surface hover:bg-theme-card text-xs font-bold transition-all hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('studio.discard', 'Discard')}</span>
              </button>
            )}

            <button 
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`h-8 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                isDirty 
                  ? 'bg-theme-accent text-white shadow-xs hover:opacity-95 active:scale-98' 
                  : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? t('studio.publishing', 'Publishing...') : t('studio.publish', 'Publish Changes')}</span>
            </button>
          </div>,
          document.getElementById('studio-header-actions-portal')
        )}

        {/* Dynamic Studio Canvas / Overview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* A. OVERVIEW COMMAND CENTER LANDING */}
          {activeStudio === 'overview' && (
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-6xl mx-auto pb-16"
            >
              {/* 1. Signature Business Identity Hero Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-theme-surface-elevated border border-theme-border-soft backdrop-blur-xl relative overflow-hidden shadow-premium">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                        <Sparkles className="w-3 h-3" />
                        {t('studio.active_workspace', 'Active Workspace')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-theme-surface border border-theme-border-soft text-theme-muted uppercase">
                        {draftSettings?.businessType || settings?.businessType || 'Retail'}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight truncate">
                      {draftSettings?.businessName || settings?.businessName || 'BillQyro Workspace'}
                    </h1>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-theme-muted font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-theme-accent" />
                        {draftSettings?.ownerName || settings?.ownerName || 'Administrator'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-theme-accent" />
                        {draftSettings?.phone || settings?.phone || 'No phone registered'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-theme-primary font-bold">
                        Currency: {draftSettings?.currency || settings?.currency || '₹'}
                      </span>
                    </div>
                  </div>

                  {/* Badges and Quick Links */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    <div className="p-3 rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center gap-2.5 shadow-2xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse"></div>
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase text-theme-muted tracking-wider">{t('studio.cloud_state', 'Cloud State')}</p>
                        <p className="text-xs font-black text-theme-primary">{t('studio.synchronized', 'Synchronized')}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-theme-surface border border-theme-border-soft flex items-center gap-2.5 shadow-2xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase text-theme-muted tracking-wider">{t('studio.storage_guard', 'Storage Guard')}</p>
                        <p className="text-xs font-black text-theme-primary">{t('studio.encrypted', 'Encrypted')}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentTab('workspace-manager')}
                      className="px-3.5 py-3 rounded-2xl bg-theme-surface hover:bg-theme-card border border-theme-border-soft hover:border-theme-accent/30 text-xs font-bold text-theme-primary transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Store className="w-4 h-4 text-theme-accent" />
                      <span className="whitespace-nowrap">{t('studio.switch_workspace', 'Switch Workspace')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Core Workspace Configuration Group */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-xs font-black uppercase tracking-widest text-theme-muted font-mono">
                    {t('studio.core_config', 'Core Business Configuration')}
                  </h2>
                  <span className="text-[10px] text-theme-muted font-bold">{t('studio.studio_essentials', 'Immediate Studio Essentials')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {STUDIO_ROUTES.filter(r => r.tier === 'simple' && r.id && r.id !== 'overview' && r.icon).map(route => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={route.id}
                        onClick={() => setActiveStudio(route.id)}
                        className="p-4 rounded-2xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft hover:border-theme-border-strong text-left transition-all duration-200 group shadow-2xs hover:shadow-premium-sm cursor-pointer flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-10 h-10 rounded-xl bg-theme-surface group-hover:bg-theme-accent/10 border border-theme-border-soft group-hover:border-theme-accent/30 text-theme-muted group-hover:text-theme-accent flex items-center justify-center transition-colors shrink-0">
                            {Icon && <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted group-hover:text-theme-primary transition-colors">
                            {route.count}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors flex items-center gap-1.5">
                            <span>{routeLabel(route)}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-theme-accent" />
                          </h3>
                          <p className="text-[11px] text-theme-muted font-medium mt-1 leading-snug line-clamp-2">
                            {routeDesc(route)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Advanced Operations Configuration Group */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1 mt-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-theme-muted font-mono">
                    {t('studio.advanced_config', 'Advanced Operations & Security')}
                  </h2>
                  <span className="text-[10px] text-theme-muted font-bold">{t('studio.deep_controls', 'Deep Controls & Automation')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {STUDIO_ROUTES.filter(r => r.tier === 'advanced' && r.id && r.icon).map(route => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={route.id}
                        onClick={() => setActiveStudio(route.id)}
                        className="p-4 rounded-2xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft hover:border-theme-border-strong text-left transition-all duration-200 group shadow-2xs hover:shadow-premium-sm cursor-pointer flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-10 h-10 rounded-xl bg-theme-surface group-hover:bg-theme-accent/10 border border-theme-border-soft group-hover:border-theme-accent/30 text-theme-muted group-hover:text-theme-accent flex items-center justify-center transition-colors shrink-0">
                            <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted group-hover:text-theme-primary transition-colors">
                            {route.count}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors flex items-center gap-1.5">
                            <span>{routeLabel(route)}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-theme-accent" />
                          </h3>
                          <p className="text-[11px] text-theme-muted font-medium mt-1 leading-snug line-clamp-2">
                            {routeDesc(route)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* B. DYNAMIC SUB-STUDIO RENDERER */}
          {activeStudio !== 'overview' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStudio}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-full pb-16"
              >
                <Suspense fallback={
                  <div className="p-12 text-center text-theme-muted">
                    <div className="animate-spin w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-xs font-bold">{t('studio.loading', 'Loading Studio Component...')}</p>
                  </div>
                }>
                  {activeStudio === 'business' && <BusinessStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'features' && <FeatureControlStudio workspaceId={settings?.activeWorkspaceId || 'default'} />}
                  {activeStudio === 'invoice' && <InvoiceStudio settings={draftSettings} onUpdate={handleUpdateDraft} subscription={subscription} />}
                  {activeStudio === 'theme' && <ThemeStudio settings={draftSettings} onUpdate={handleThemeUpdate} />}
                  {activeStudio === 'backup' && <BackupStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'subscription' && <SubscriptionStudio settings={draftSettings} onUpdate={handleUpdateDraft} subscription={subscription} />}
                  {activeStudio === 'portal' && <PortalStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'form' && <FormBuilder settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'security' && <SecurityStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'roles' && <RoleStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'notification' && <NotificationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'localization' && <LocalizationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'dashboard' && <DashboardStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'automation' && <AutomationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'database' && <DatabaseStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;

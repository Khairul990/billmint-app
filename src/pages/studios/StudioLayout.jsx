import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { createPortal } from 'react-dom';
import { 
  Building2, Palette, Globe, LayoutDashboard, 
  LayoutTemplate, Zap, Blocks, Shield, Save, Database, Undo, Redo, RotateCcw,
  Crown, Lock, HardDrive, Globe2, Bell, ArrowLeft, PanelLeftClose, PanelLeftOpen,
  CheckCircle2, Menu, X, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsHistory } from '../../hooks/useSettingsHistory';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getStudioHeaderTarget } from '../../utils/portalTargets';

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
  { type: 'label', label: 'Essential Settings', tier: 'simple' },
  { id: 'business', label: 'Business Profile', icon: Building2, desc: 'Name, phone, logo & address', tier: 'simple' },
  { id: 'features', label: 'Modules & Features', icon: Blocks, desc: 'Turn features on or off safely', tier: 'simple' },
  { id: 'invoice', label: 'Invoice & Billing', icon: LayoutTemplate, desc: 'Prefix, notes, tax & terms', tier: 'simple' },
  { id: 'theme', label: 'Appearance & Theme', icon: Palette, desc: 'Colors, dark mode & layout', tier: 'simple' },
  { id: 'backup', label: 'Data & Backup', icon: HardDrive, desc: 'Export, import & cloud snapshots', tier: 'simple' },
  { id: 'subscription', label: 'Subscription & Plan', icon: Crown, desc: 'Usage limits & active tier', tier: 'simple' },

  { type: 'label', label: 'Advanced Tools', tier: 'advanced' },
  { id: 'portal', label: 'Client Portal', icon: Globe, desc: 'Public link & customer experience', tier: 'advanced' },
  { id: 'form', label: 'Custom Form Fields', icon: LayoutTemplate, desc: 'Additional invoice/customer inputs', tier: 'advanced' },
  { id: 'security', label: 'Security & Access', icon: Lock, desc: 'Workspace isolation & sessions', tier: 'advanced' },
  { id: 'roles', label: 'Staff & Permissions', icon: Shield, desc: 'User roles & access control', tier: 'advanced' },
  { id: 'notification', label: 'Notifications & Alerts', icon: Bell, desc: 'WhatsApp templates & reminders', tier: 'advanced' },
  { id: 'localization', label: 'Currency & Regions', icon: Globe2, desc: 'Regional currency & time formats', tier: 'advanced' },
  { id: 'dashboard', label: 'Dashboard Widgets', icon: LayoutDashboard, desc: 'Customize KPI card visibility', tier: 'advanced' },
  { id: 'automation', label: 'Automations', icon: Zap, desc: 'Custom workflows & rules', tier: 'advanced' },
  { id: 'database', label: 'Data Collections', icon: Database, desc: 'Inspect database tables', tier: 'advanced' }
];

const StudioLayout = ({
  settings, onSaveSettings, isAdmin, subscription, setCurrentTab
}) => {
  const [activeStudio, setActiveStudio] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'simple', 'advanced'
  
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

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

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

    // Filter by view mode (simple vs advanced) if not actively searching
    if (!q && viewMode !== 'all') {
      routes = routes.filter(r => r.type === 'label' || r.tier === viewMode);
    }

    if (q) {
      routes = routes.filter(r => 
        r.type === 'label' ||
        r.label.toLowerCase().includes(q) || 
        (r.desc && r.desc.toLowerCase().includes(q))
      );
    }

    // Clean up empty section headers
    return routes.filter((route, index, arr) => {
      if (route.type === 'label') {
        const nextRoute = arr[index + 1];
        if (!nextRoute || nextRoute.type === 'label') {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, viewMode]);

  const activeRouteObj = STUDIO_ROUTES.find(r => r.id === activeStudio) || STUDIO_ROUTES[1];

  const handleSelectRoute = (routeId) => {
    setActiveStudio(routeId);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-theme-app text-theme-primary">
      {/* Desktop / Tablet Sidebar */}
      <div className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 bg-theme-surface/40 backdrop-blur-xl border-r border-theme-border-soft flex-col shrink-0 z-20 shadow-sm`}>
        <div className="p-4 border-b border-theme-border-soft backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent mb-0.5">Settings Control</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Business Preferences</p>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card transition-colors shrink-0 mx-auto"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="space-y-2">
              <Input 
                isSearch
                placeholder="Search settings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-theme-surface/60 border-theme-border-soft text-xs h-9"
              />

              {/* Simple vs Advanced Toggle */}
              {!searchQuery && (
                <div className="flex items-center p-0.5 bg-theme-surface-elevated/70 border border-theme-border-soft rounded-lg text-[11px] font-bold text-theme-muted">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'all' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'hover:text-theme-primary'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setViewMode('simple')}
                    className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'simple' ? 'bg-theme-surface text-theme-accent shadow-sm' : 'hover:text-theme-primary'}`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setViewMode('advanced')}
                    className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'advanced' ? 'bg-theme-surface text-theme-warning shadow-sm' : 'hover:text-theme-primary'}`}
                  >
                    Advanced
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 pb-12 space-y-1 custom-scrollbar">
          {filteredRoutes.map((route, idx) => {
            if (route.type === 'label') {
              if (isSidebarCollapsed) {
                return <div key={`label-${idx}`} className="h-3"></div>;
              }
              return (
                <div key={`label-${idx}`} className="pt-3 pb-1 px-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">{route.label}</p>
                </div>
              );
            }
            const Icon = route.icon;
            const isActive = activeStudio === route.id;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                title={isSidebarCollapsed ? `${route.label} - ${route.desc}` : ''}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 relative overflow-hidden group ${isSidebarCollapsed ? 'justify-center' : ''} ${
                  isActive 
                    ? 'bg-theme-accent/10 border border-theme-accent/30 shadow-sm text-theme-primary' 
                    : 'border border-transparent hover:bg-theme-surface-hover/80 text-theme-secondary hover:text-theme-primary'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-theme-accent rounded-r-full shadow-[0_0_8px_var(--accent)]" 
                  />
                )}
                <Icon className={`w-4 h-4 z-10 shrink-0 transition-colors ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-primary'}`} />
                {!isSidebarCollapsed && (
                  <div className="text-left z-10 min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-theme-primary' : 'text-theme-secondary group-hover:text-theme-primary'}`}>{route.label}</div>
                    <div className="text-[10px] text-theme-muted truncate">{route.desc}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Navigation Dropdown / Drawer Trigger */}
      <div className="md:hidden p-3 bg-theme-surface/80 border-b border-theme-border-soft flex items-center justify-between gap-2 shrink-0 backdrop-blur-md">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex-1 flex items-center justify-between p-2.5 bg-theme-surface-elevated border border-theme-border-soft rounded-xl text-left shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
              {React.createElement(activeRouteObj.icon || Building2, { className: 'w-4 h-4' })}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-theme-primary block truncate">{activeRouteObj.label}</span>
              <span className="text-[9px] text-theme-muted block truncate">Tap to switch settings section</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-theme-muted shrink-0 ml-2" />
        </button>

        <Button
          variant={isDirty ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          isLoading={isSaving}
          leftIcon={Save}
          className="h-10 px-3 text-xs shrink-0"
        >
          {isSaving ? 'Saving' : 'Save'}
        </Button>
      </div>

      {/* Mobile Settings Drawer Modal */}
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
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                <div>
                  <h3 className="text-base font-black text-theme-primary">Settings Menu</h3>
                  <p className="text-[11px] text-theme-muted">Select a section to customize</p>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Tabs */}
              <div className="py-3 space-y-2">
                <Input 
                  isSearch
                  placeholder="Search settings..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-theme-surface/60 border-theme-border-soft text-xs h-9"
                />

                {!searchQuery && (
                  <div className="flex items-center p-0.5 bg-theme-surface-elevated border border-theme-border-soft rounded-lg text-[11px] font-bold text-theme-muted">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'all' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'hover:text-theme-primary'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setViewMode('simple')}
                      className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'simple' ? 'bg-theme-surface text-theme-accent shadow-sm' : 'hover:text-theme-primary'}`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setViewMode('advanced')}
                      className={`flex-1 py-1 rounded-md transition-all ${viewMode === 'advanced' ? 'bg-theme-surface text-theme-warning shadow-sm' : 'hover:text-theme-primary'}`}
                    >
                      Advanced
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 custom-scrollbar">
                {filteredRoutes.map((route, idx) => {
                  if (route.type === 'label') {
                    return (
                      <div key={`mob-label-${idx}`} className="pt-3 pb-1 px-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">{route.label}</p>
                      </div>
                    );
                  }
                  const Icon = route.icon;
                  const isActive = activeStudio === route.id;
                  return (
                    <button
                      key={`mob-${route.id}`}
                      onClick={() => handleSelectRoute(route.id)}
                      className={`w-full flex items-center p-3 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-theme-accent/10 border border-theme-accent/30 text-theme-primary shadow-sm' 
                          : 'bg-theme-surface border border-theme-border-soft text-theme-secondary hover:text-theme-primary'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 shrink-0 ${isActive ? 'bg-theme-accent text-white' : 'bg-theme-surface-elevated text-theme-muted'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <span className="text-xs font-bold block truncate">{route.label}</span>
                        <span className="text-[10px] text-theme-muted block truncate">{route.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Sticky Header via Portal (Left Side) */}
        {getStudioHeaderTarget('studio-header-portal') && createPortal(
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              className="p-2 rounded-xl hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition-colors bg-theme-surface border border-theme-border-soft shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-theme-accent/10 border border-theme-accent/20 hidden sm:flex items-center justify-center">
              {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-4 h-4 text-theme-accent' })}
            </div>
            <div>
              <div className="text-sm font-black text-theme-primary truncate max-w-[140px] sm:max-w-none">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label || 'Settings'}</div>
              <div className="text-[10px] text-theme-secondary font-bold flex items-center gap-2">
                {isDirty ? (
                  <span className="flex items-center gap-1 text-theme-warning"><span className="w-1.5 h-1.5 rounded-full bg-theme-warning animate-pulse" /> Unsaved</span>
                ) : (
                  <span className="flex items-center gap-1 text-theme-success"><CheckCircle2 className="w-3 h-3 text-theme-success" /> Auto-Synced</span>
                )}
              </div>
            </div>
          </div>,
          document.getElementById('studio-header-portal')
        )}

        {/* Sticky Header via Portal (Right Side Actions) */}
        {getStudioHeaderTarget('studio-header-actions-portal') && createPortal(
          <div className="flex items-center gap-2 mr-2">
            <div className="hidden sm:flex items-center bg-theme-surface border border-theme-border-soft rounded-xl p-0.5 shadow-sm">
              <Button 
                variant="ghost" size="icon"
                onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                className="h-7 w-7"
              >
                <Undo className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" size="icon"
                onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                className="h-7 w-7"
              >
                <Redo className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            {isDirty && (
              <Button 
                variant="outline" size="sm"
                onClick={handleDiscard} title="Discard changes"
                leftIcon={RotateCcw}
                className="h-8 text-xs hidden sm:inline-flex"
              >
                Discard
              </Button>
            )}
            <Button 
              variant={isDirty ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              isLoading={isSaving}
              leftIcon={Save}
              className="h-8 text-xs"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>,
          getStudioHeaderTarget('studio-header-actions-portal')
        )}

        {/* Settings Overview Banner */}
        <div className="p-3 sm:p-4 bg-theme-surface/50 border-b border-theme-border-soft flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-theme-accent/10 border border-theme-accent/20 shrink-0">
              <Building2 className="w-4 h-4 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-theme-primary truncate">{draftSettings?.businessName || 'Your Business'}</p>
              <p className="text-[10px] text-theme-muted truncate">Workspace: <span className="font-bold text-theme-secondary">{settings?.activeWorkspaceId || 'Main Store'}</span></p>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-theme-success/10 text-theme-success border border-theme-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-success" />
              Synced
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
              <Lock className="w-2.5 h-2.5" />
              Isolated
            </span>
          </div>
        </div>

        {/* Dynamic Studio Renderer */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 custom-scrollbar">
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
                  Loading Studio...
                </div>
              }>
                {activeStudio === 'business' && <BusinessStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'features' && <FeatureControlStudio workspaceId={settings?.activeWorkspaceId || 'default'} />}
                {activeStudio === 'invoice' && <InvoiceStudio settings={draftSettings} onUpdate={handleUpdateDraft} subscription={subscription} />}
                {activeStudio === 'theme' && <ThemeStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
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
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;

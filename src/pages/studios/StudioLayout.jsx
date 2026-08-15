import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { createPortal } from 'react-dom';
import { 
  Building2, Palette, FileText, Globe, LayoutDashboard, 
  LayoutTemplate, Zap, Blocks, Shield, Copy, Save, X, Search, Database, Undo, Redo, RotateCcw,
  Crown, Lock, HardDrive, Globe2, Bell, ArrowLeft, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsHistory } from '../../hooks/useSettingsHistory';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getStudioHeaderTarget } from '../../utils/portalTargets';

// Placeholder imports for individual studios (to be created)
const BusinessStudio = React.lazy(() => import('./BusinessStudio'));
const ThemeStudio = React.lazy(() => import('./ThemeStudio'));
const InvoiceStudio = React.lazy(() => import('./InvoiceStudio'));
const FormBuilder = React.lazy(() => import('./FormBuilder'));
const PortalStudio = React.lazy(() => import('./PortalStudio'));
const DashboardStudio = React.lazy(() => import('./DashboardStudio'));
const AutomationStudio = React.lazy(() => import('./AutomationStudio'));
const RoleStudio = React.lazy(() => import('./RoleStudio'));
const BusinessTemplateStudio = React.lazy(() => import('./BusinessTemplateStudio'));
const DatabaseStudio = React.lazy(() => import('./DatabaseStudio'));
const SubscriptionStudio = React.lazy(() => import('./SubscriptionStudio'));
const SecurityStudio = React.lazy(() => import('./SecurityStudio'));
const BackupStudio = React.lazy(() => import('./BackupStudio'));
const LocalizationStudio = React.lazy(() => import('./LocalizationStudio'));
const NotificationStudio = React.lazy(() => import('./NotificationStudio'));
const FeatureControlStudio = React.lazy(() => import('./FeatureControlStudio'));

const STUDIO_ROUTES = [
  { type: 'label', label: 'Core Platform' },
  { id: 'business', label: 'Business Studio', icon: Building2, desc: 'Brand & Identity' },
  { id: 'features', label: 'Module Manager', icon: Blocks, desc: 'Toggle Sidebar Features' },
  { id: 'subscription', label: 'Subscription Studio', icon: Crown, desc: 'Plans & Limits' },

  { type: 'label', label: 'Customization' },
  { id: 'theme', label: 'Theme Studio', icon: Palette, desc: 'Colors & UI' },
  { id: 'invoice', label: 'Bill Studio', icon: LayoutTemplate, desc: 'Invoice Builder, Templates & Columns' },
  { id: 'form', label: 'Form Builder', icon: LayoutTemplate, desc: 'Custom Fields' },
  { id: 'portal', label: 'Portal Studio', icon: Globe, desc: 'Client Experience' },

  { type: 'label', label: 'Access & Security' },
  { id: 'roles', label: 'Role Studio', icon: Shield, desc: 'Permissions & Access' },
  { id: 'security', label: 'Security Studio', icon: Lock, desc: '2FA & Sessions' },

  { type: 'label', label: 'Advanced System' },
  { id: 'dashboard', label: 'Dashboard Studio', icon: LayoutDashboard, desc: 'Widgets & Layout' },
  { id: 'automation', label: 'Automation Studio', icon: Zap, desc: 'If-This-Then-That Logic' },
  { id: 'notification', label: 'Notification Studio', icon: Bell, desc: 'Email & SMS' },
  { id: 'localization', label: 'Localization Studio', icon: Globe2, desc: 'Currency & Time' },
  { id: 'backup', label: 'Backup Studio', icon: HardDrive, desc: 'Cloud Restore' },
  { id: 'database', label: 'Database Studio', icon: Database, desc: 'Custom Collections' }
];

const StudioLayout = ({
  settings, onSaveSettings, isAdmin, subscription, setCurrentTab
}) => {
  const [activeStudio, setActiveStudio] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  let filteredRoutes = STUDIO_ROUTES.filter(r => 
    r.type === 'label' ||
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.desc && r.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  filteredRoutes = filteredRoutes.filter((route, index) => {
    if (route.type === 'label') {
      const nextRoute = filteredRoutes[index + 1];
      if (!nextRoute || nextRoute.type === 'label') {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-theme-app text-theme-primary">
      {/* Premium Glass Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-theme-surface/30 backdrop-blur-xl border-r border-theme-border-soft flex flex-col shrink-0 z-20 shadow-sm`}>
        <div className="p-4 border-b border-theme-border-soft backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent mb-1">Platform Studio</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">Premium Control Center</p>
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
            <div className="relative group">
              <Input 
                isSearch
                placeholder="Search modules..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-theme-surface/50 border-theme-border-soft"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-1.5 custom-scrollbar">
          {filteredRoutes.map((route, idx) => {
            if (route.type === 'label') {
              if (isSidebarCollapsed) {
                return <div key={`label-${idx}`} className="h-4"></div>;
              }
              return (
                <div key={`label-${idx}`} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{route.label}</p>
                </div>
              );
            }
            const Icon = route.icon;
            const isActive = activeStudio === route.id;
            return (
              <button
                key={route.id}
                onClick={() => setActiveStudio(route.id)}
                title={isSidebarCollapsed ? route.label : ''}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${isSidebarCollapsed ? 'justify-center' : ''} ${
                  isActive 
                    ? 'bg-theme-accent/5 border border-theme-accent/20 shadow-sm' 
                    : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-theme-accent rounded-r-full shadow-[0_0_8px_var(--accent)]" 
                  />
                )}
                <Icon className={`w-[18px] h-[18px] z-10 transition-colors ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-theme-accent' : 'text-theme-secondary group-hover:text-theme-primary'}`} />
                {!isSidebarCollapsed && (
                  <div className="text-left z-10">
                    <div className={`text-xs font-bold transition-colors ${isActive ? 'text-theme-primary' : 'text-theme-secondary group-hover:text-theme-primary'}`}>{route.label}</div>
                    <div className={`text-[9px] transition-colors ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-secondary'}`}>{route.desc}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-theme-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-theme-accent-dark/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Sticky Header via Portal (Left Side) */}
        {getStudioHeaderTarget('studio-header-portal') && createPortal(
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              className="mr-2 p-2 rounded-full hover:bg-theme-main text-theme-muted hover:text-theme-primary transition-colors shadow-sm bg-theme-surface border border-theme-border-soft"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
              {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-5 h-5 text-theme-accent' })}
            </div>
            <div>
              <div className="text-sm font-black text-theme-primary">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label || 'Studio'}</div>
              <div className="text-[10px] text-theme-secondary font-bold flex items-center gap-2 mt-1 px-1">
                {isDirty ? (
                  <span className="flex items-center gap-1 text-theme-warning"><span className="w-1.5 h-1.5 rounded-full bg-theme-warning animate-pulse" /> Unsaved Changes Draft</span>
                ) : (
                  <span className="flex items-center gap-1 text-theme-success"><span className="w-1.5 h-1.5 rounded-full bg-theme-success" /> Published</span>
                )}
              </div>
            </div>
          </div>,
          document.getElementById('studio-header-portal')
        )}

        {/* Sticky Header via Portal (Right Side Actions) */}
        {getStudioHeaderTarget('studio-header-actions-portal') && createPortal(
          <div className="flex items-center gap-3 mr-3 pr-3 border-r border-theme-border-soft">
            <div className="flex items-center gap-1 bg-white/50 dark:bg-theme-surface-elevated border border-theme-border-soft rounded-xl p-1 backdrop-blur-md">
              <Button 
                variant="ghost" size="icon"
                onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" size="icon"
                onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
            
            {isDirty && (
              <Button 
                variant="danger" size="sm"
                onClick={handleDiscard} title="Discard all changes"
                leftIcon={RotateCcw}
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
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>,
          getStudioHeaderTarget('studio-header-actions-portal')
        )}

        {/* Dynamic Studio Renderer */}
        <div className="flex-1 overflow-y-auto z-0 relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStudio}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full h-full"
            >
              <div className="w-full min-h-full bg-theme-app p-2 sm:p-4 relative">
                <Suspense fallback={<div className="p-12 text-center text-theme-muted"><div className="animate-spin w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>Loading Studio...</div>}>
                  {activeStudio === 'business' && <BusinessStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'theme' && <ThemeStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'invoice' && <InvoiceStudio settings={draftSettings} onUpdate={handleUpdateDraft} subscription={subscription} />}
                  {activeStudio === 'form' && <FormBuilder settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'portal' && <PortalStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'dashboard' && <DashboardStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'automation' && <AutomationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'roles' && <RoleStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'subscription' && <SubscriptionStudio settings={draftSettings} onUpdate={handleUpdateDraft} subscription={subscription} />}
                  {activeStudio === 'security' && <SecurityStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'backup' && <BackupStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'localization' && <LocalizationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  {activeStudio === 'notification' && <NotificationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                  { activeStudio === 'database' && <DatabaseStudio settings={draftSettings} onUpdate={handleUpdateDraft} /> }
                  { activeStudio === 'features' && <FeatureControlStudio workspaceId={settings?.activeWorkspaceId || 'default'} /> }
                </Suspense>
                
                {/* Fallback for unknown studio */}
                {![...STUDIO_ROUTES.map(r => r.id)].includes(activeStudio) && (
                  <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-theme-surface/50 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/20 to-transparent opacity-50" />
                      {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-10 h-10 text-theme-accent relative z-10' })}
                    </div>
                    <h3 className="text-2xl font-black text-theme-primary mb-2 tracking-tight">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label}</h3>
                    <p className="text-sm text-theme-muted max-w-md">This studio module is currently being finalized for the production 3.0 release.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;

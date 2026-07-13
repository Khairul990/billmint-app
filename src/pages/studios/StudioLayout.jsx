import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { 
  Building2, Palette, FileText, Globe, LayoutDashboard, 
  LayoutTemplate, Zap, Shield, Copy, Save, X, Search, Database, Undo, Redo, RotateCcw,
  Crown, Lock, HardDrive, Globe2, Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsHistory } from '../../hooks/useSettingsHistory';

// Placeholder imports for individual studios (to be created)
import BusinessStudio from './BusinessStudio';
import ThemeStudio from './ThemeStudio';
import InvoiceStudio from './InvoiceStudio';
import FormBuilder from './FormBuilder';
import PortalStudio from './PortalStudio';
import DashboardStudio from './DashboardStudio';
import AutomationStudio from './AutomationStudio';
import RoleStudio from './RoleStudio';
import BusinessTemplateStudio from './BusinessTemplateStudio';
import DatabaseStudio from './DatabaseStudio';
import SubscriptionStudio from './SubscriptionStudio';
import SecurityStudio from './SecurityStudio';
import BackupStudio from './BackupStudio';
import LocalizationStudio from './LocalizationStudio';
import NotificationStudio from './NotificationStudio';

const STUDIO_ROUTES = [
  { id: 'business', label: 'Business Studio', icon: Building2, desc: 'Brand & Identity' },
  { id: 'theme', label: 'Theme Studio', icon: Palette, desc: 'Colors & UI' },
  { id: 'invoice', label: 'Invoice Studio', icon: FileText, desc: 'Templates & Columns' },
  { id: 'form', label: 'Form Builder', icon: LayoutTemplate, desc: 'Custom Fields' },
  { id: 'portal', label: 'Portal Studio', icon: Globe, desc: 'Client Experience' },
  { id: 'dashboard', label: 'Dashboard Studio', icon: LayoutDashboard, desc: 'Widgets & Layout' },
  { id: 'automation', label: 'Automation Studio', icon: Zap, desc: 'If-This-Then-That Logic' },
  { id: 'roles', label: 'Role Studio', icon: Shield, desc: 'Permissions & Access' },
  { id: 'subscription', label: 'Subscription Studio', icon: Crown, desc: 'Plans & Limits' },
  { id: 'security', label: 'Security Studio', icon: Lock, desc: '2FA & Sessions' },
  { id: 'backup', label: 'Backup Studio', icon: HardDrive, desc: 'Cloud Restore' },
  { id: 'localization', label: 'Localization Studio', icon: Globe2, desc: 'Currency & Time' },
  { id: 'notification', label: 'Notification Studio', icon: Bell, desc: 'Email & SMS' },
  { id: 'database', label: 'Database Studio', icon: Database, desc: 'Custom Collections' }
];

const StudioLayout = ({
  settings, onSaveSettings, isAdmin, subscription, setCurrentTab
}) => {
  const [activeStudio, setActiveStudio] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
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
      setIsDirty(false);
      toast.success('Studio configuration saved globally!');
    } catch (e) {
      toast.error('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    reset(settings);
    toast('Changes discarded');
  };

  const filteredRoutes = STUDIO_ROUTES.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-theme-main via-theme-main to-theme-surface text-white">
      {/* Premium Glass Sidebar */}
      <div className="w-72 bg-theme-surface/30 backdrop-blur-xl border-r border-theme-border-soft flex flex-col shrink-0 z-20 shadow-premium">
        <div className="p-6 border-b border-white/5 backdrop-blur-md">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent mb-1">Platform Studio</h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mb-5">Premium Control Center</p>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-theme-muted group-focus-within:text-theme-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search modules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-theme-accent/50 focus:bg-white/10 transition-all shadow-inner"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {filteredRoutes.map(route => {
            const Icon = route.icon;
            const isActive = activeStudio === route.id;
            return (
              <button
                key={route.id}
                onClick={() => setActiveStudio(route.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'bg-gradient-to-r from-theme-accent/20 to-transparent border border-theme-accent/30 shadow-lg' 
                    : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent rounded-r-full shadow-[0_0_10px_var(--accent)]" 
                  />
                )}
                <Icon className={`w-5 h-5 mr-3 z-10 transition-colors ${isActive ? 'text-theme-accent drop-shadow-md' : 'text-theme-muted group-hover:text-white'}`} />
                <div className="text-left z-10">
                  <div className={`text-xs font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{route.label}</div>
                  <div className={`text-[9px] transition-colors ${isActive ? 'text-theme-accent/80' : 'text-gray-600 group-hover:text-gray-400'}`}>{route.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-theme-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Sticky Header */}
        <div className="h-[72px] border-b border-white/5 bg-theme-surface/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-10 shadow-sm sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
              {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-5 h-5 text-theme-accent' })}
            </div>
            <div>
              <div className="text-sm font-black text-white">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label || 'Studio'}</div>
              <div className="text-[10px] text-theme-muted font-bold flex items-center gap-2">
                {isDirty ? (
                  <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Unsaved Changes Draft</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Published</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
              <button 
                onClick={undo}
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-all ${canUndo ? 'text-white hover:bg-white/10 active:scale-95' : 'text-theme-muted opacity-30 cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={redo}
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-all ${canRedo ? 'text-white hover:bg-white/10 active:scale-95' : 'text-theme-muted opacity-30 cursor-not-allowed'}`}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
            
            {isDirty && (
              <button 
                onClick={handleDiscard}
                className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-sm"
                title="Discard all changes"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Discard
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${
                isDirty 
                  ? 'bg-gradient-to-r from-theme-accent to-blue-600 text-white shadow-lg shadow-theme-accent/25 hover:shadow-theme-accent/40 hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-white/5 border border-white/10 text-theme-muted opacity-50 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Publishing...' : 'Publish Changes'}
            </button>
          </div>
        </div>

        {/* Dynamic Studio Renderer */}
        <div className="flex-1 overflow-y-auto p-8 z-0 relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStudio}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-6xl mx-auto w-full"
            >
              <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-2 sm:p-8 relative overflow-hidden">
                {activeStudio === 'business' && <BusinessStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'theme' && <ThemeStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'invoice' && <InvoiceStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'form' && <FormBuilder settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'portal' && <PortalStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'dashboard' && <DashboardStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'automation' && <AutomationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'roles' && <RoleStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'subscription' && <SubscriptionStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'security' && <SecurityStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'backup' && <BackupStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'localization' && <LocalizationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'notification' && <NotificationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'database' && <DatabaseStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                
                {/* Fallback for unknown studio */}
                {![...STUDIO_ROUTES.map(r => r.id)].includes(activeStudio) && (
                  <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-theme-surface/50 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/20 to-transparent opacity-50" />
                      {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-10 h-10 text-theme-accent relative z-10' })}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label}</h3>
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

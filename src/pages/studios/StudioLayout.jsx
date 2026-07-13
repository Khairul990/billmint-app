import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { 
  Building2, Palette, FileText, Globe, LayoutDashboard, 
  LayoutTemplate, Zap, Shield, Copy, Save, X, Search, Database 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const STUDIO_ROUTES = [
  { id: 'business', label: 'Business Studio', icon: Building2, desc: 'Brand & Identity' },
  { id: 'theme', label: 'Theme Studio', icon: Palette, desc: 'Colors & UI' },
  { id: 'invoice', label: 'Invoice Studio', icon: FileText, desc: 'Templates & Columns' },
  { id: 'form', label: 'Form Builder', icon: LayoutTemplate, desc: 'Custom Fields' },
  { id: 'portal', label: 'Portal Studio', icon: Globe, desc: 'Client Experience' },
  { id: 'dashboard', label: 'Dashboard Studio', icon: LayoutDashboard, desc: 'Widgets & Layout' },
  { id: 'automation', label: 'Automation Studio', icon: Zap, desc: 'If-This-Then-That Logic' },
  { id: 'roles', label: 'Role Studio', icon: Shield, desc: 'Permissions & Access' },
  { id: 'templates', label: 'Template Studio', icon: Copy, desc: 'Business Presets' },
  { id: 'database', label: 'Database Studio', icon: Database, desc: 'Custom Collections' }
];

const StudioLayout = ({
  settings, onSaveSettings, isAdmin, subscription, setCurrentTab
}) => {
  const [activeStudio, setActiveStudio] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create a local draft of settings so studios can mutate them without immediately saving to DB
  const [draftSettings, setDraftSettings] = useState(() => settings || {});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftSettings(settings || {});
    setIsDirty(false);
  }, [settings]);

  const handleUpdateDraft = (partialUpdate) => {
    setDraftSettings(prev => ({ ...prev, ...partialUpdate }));
    setIsDirty(true);
  };

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
    setDraftSettings(settings || {});
    setIsDirty(false);
    toast('Changes discarded');
  };

  const filteredRoutes = STUDIO_ROUTES.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-theme-main text-white">
      {/* Studio Sidebar */}
      <div className="w-72 bg-theme-card border-r border-theme-border-soft flex flex-col shrink-0">
        <div className="p-5 border-b border-theme-border-soft">
          <h2 className="text-lg font-black text-theme-primary mb-1">No-Code Studio</h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-4">Platform Control Center</p>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-theme-muted" />
            <input 
              type="text" 
              placeholder="Search studios..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-theme-accent transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredRoutes.map(route => {
            const Icon = route.icon;
            const isActive = activeStudio === route.id;
            return (
              <button
                key={route.id}
                onClick={() => setActiveStudio(route.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20' 
                    : 'text-theme-muted hover:bg-theme-surface hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-theme-muted'}`} />
                <div className="text-left">
                  <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{route.label}</div>
                  <div className={`text-[9px] ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{route.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-theme-main">
        {/* Top Header */}
        <div className="h-16 border-b border-theme-border-soft flex items-center justify-between px-6 shrink-0 bg-theme-main">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-white capitalize">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label || 'Studio'}</div>
            {isDirty && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-1 rounded-md">Unsaved Changes</span>}
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <button 
                onClick={handleDiscard}
                className="px-4 py-2 bg-theme-surface text-theme-muted hover:text-white text-xs font-bold rounded-xl transition-colors"
              >
                Discard
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 ${
                isDirty 
                  ? 'bg-theme-accent text-white hover:bg-theme-accent/90' 
                  : 'bg-theme-surface text-theme-muted opacity-50 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Publish Changes'}
            </button>
          </div>
        </div>

        {/* Dynamic Studio Renderer */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStudio}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-5xl mx-auto"
            >
              <div className="w-full">
                {activeStudio === 'business' && <BusinessStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'theme' && <ThemeStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'invoice' && <InvoiceStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'form' && <FormBuilder settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'portal' && <PortalStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'dashboard' && <DashboardStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'automation' && <AutomationStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'roles' && <RoleStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'templates' && <BusinessTemplateStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                {activeStudio === 'database' && <DatabaseStudio settings={draftSettings} onUpdate={handleUpdateDraft} />}
                
                {/* Fallback for unknown studio */}
                {![...STUDIO_ROUTES.map(r => r.id)].includes(activeStudio) && (
                  <div className="card-premium p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-theme-surface rounded-2xl flex items-center justify-center mb-4">
                      {React.createElement(STUDIO_ROUTES.find(r => r.id === activeStudio)?.icon || Building2, { className: 'w-8 h-8 text-theme-accent' })}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">{STUDIO_ROUTES.find(r => r.id === activeStudio)?.label}</h3>
                    <p className="text-sm text-theme-muted">Module under construction. Modularizing from SettingsStudioV2.</p>
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

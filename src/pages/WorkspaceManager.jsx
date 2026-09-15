import { toast } from 'react-hot-toast';
import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { 
  Store, 
  Plus, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  Circle, 
  Settings2, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  Layers,
  Building2,
  Check,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUSINESS_PRESETS, ALL_MODULES as ALL_MODULES_CONFIG } from '../config/businessPresets';
import { SignatureSurface, Badge, Button, Input } from '../components/ui';

const ALL_MODULES = ALL_MODULES_CONFIG;

/**
 * Signature BillQyro Business Workspace Experience
 * Clear demarcation between ACTIVE BUSINESS and OTHER BUSINESSES.
 * Strictly maintains workspace isolation without cross-tenant leakage.
 */
const WorkspaceManager = ({ 
  businessWorkspaces = [], 
  activeWorkspaceId, 
  setActiveWorkspace,
  settings,
  onSaveSettings,
  setCurrentTab
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('retail');
  const [enabledModules, setEnabledModules] = useState(['billing', 'customers']);

  const workspaces = businessWorkspaces || [];
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const otherWorkspaces = workspaces.filter(w => w.id !== activeWorkspaceId);

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingWorkspace(null);
    setName('');
    setType('retail');
    setEnabledModules(['billing', 'customers', 'products', 'dueLedger', 'reports']);
  };

  const handleOpenEdit = (ws) => {
    setIsAdding(true);
    setEditingWorkspace(ws);
    setName(ws.name || '');
    setType(ws.type || 'retail');
    setEnabledModules(ws.enabledModules || []);
  };

  const toggleModule = (modId) => {
    if (enabledModules.includes(modId)) {
      setEnabledModules(enabledModules.filter(id => id !== modId));
    } else {
      setEnabledModules([...enabledModules, modId]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    let updatedWorkspaces = [...workspaces];
    
    if (editingWorkspace) {
      updatedWorkspaces = updatedWorkspaces.map(ws => {
        if (ws.id === editingWorkspace.id) {
          return { ...ws, name: name.trim(), type, enabledModules };
        }
        return ws;
      });
      toast.success('Workspace updated');
    } else {
      const newWs = {
        id: 'ws_' + Date.now(),
        name: name.trim(),
        type,
        enabledModules,
        archived: false
      };
      updatedWorkspaces.push(newWs);
      toast.success('New workspace created');
      if (updatedWorkspaces.length === 1) {
        setActiveWorkspace(newWs.id);
      }
    }
    
    onSaveSettings({ ...settings, businessWorkspaces: updatedWorkspaces });
    setIsAdding(false);
  };

  const handleToggleArchive = (ws) => {
    if (ws.id === activeWorkspaceId) {
      toast.error("Cannot archive the currently active workspace.");
      return;
    }
    
    const updatedWorkspaces = workspaces.map(w => {
      if (w.id === ws.id) {
        return { ...w, archived: !w.archived };
      }
      return w;
    });
    onSaveSettings({ ...settings, businessWorkspaces: updatedWorkspaces });
    toast.success(ws.archived ? "Workspace restored" : "Workspace archived");
  };

  const handleSwitchWorkspace = (wsId) => {
    setActiveWorkspace(wsId);
    toast.success("Switched active business");
  };

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto pb-24 px-3 sm:px-4 space-y-6 animate-fadeIn">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentTab('more')}
              className="w-10 h-10 bg-theme-surface hover:bg-theme-card border border-theme-border-soft rounded-2xl flex items-center justify-center text-theme-muted hover:text-theme-primary transition-all shadow-2xs cursor-pointer"
              title="Back to More Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
                Workspace Manager
              </h1>
              <p className="text-xs font-semibold text-theme-muted">
                {workspaces.filter(w => !w.archived).length} Active Business Entities
              </p>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-2xl bg-theme-accent hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Workspace</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isAdding ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* SECTION 1: ACTIVE BUSINESS */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-theme-accent font-mono">
                      Active Business Workspace
                    </h2>
                  </div>
                  <span className="text-[10px] text-theme-muted font-bold">Currently Engaged</span>
                </div>

                {activeWorkspace ? (
                  <div className="p-6 rounded-3xl bg-theme-card border-2 border-theme-accent shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-theme-accent text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-2xl tracking-wider shadow-sm flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current Active
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center shrink-0 shadow-sm">
                          <Store className="w-7 h-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-base sm:text-lg text-theme-primary truncate">
                              {activeWorkspace.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-accent/10 border border-theme-accent/20 text-theme-accent uppercase">
                              {activeWorkspace.type || 'Retail'}
                            </span>
                          </div>
                          <p className="text-xs text-theme-muted font-medium mt-1">
                            {activeWorkspace.enabledModules?.length || 0} Modules configured • Full Local & Cloud Sync
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-theme-border-soft">
                        <button 
                          onClick={() => handleOpenEdit(activeWorkspace)}
                          className="px-3 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-theme-muted" />
                          <span>Configure</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-theme-card rounded-3xl border border-dashed border-theme-border-soft">
                    <p className="text-xs text-theme-muted font-bold">No active workspace detected.</p>
                  </div>
                )}
              </div>

              {/* SECTION 2: OTHER BUSINESSES */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1 mt-6">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-theme-muted font-mono">
                    Other Business Workspaces ({otherWorkspaces.length})
                  </h2>
                  <span className="text-[10px] text-theme-muted font-bold">Isolated Records & Storage</span>
                </div>

                {otherWorkspaces.length === 0 ? (
                  <div className="p-8 text-center bg-theme-card/60 rounded-3xl border border-theme-border-soft space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-theme-muted/50" />
                    <h4 className="text-xs font-bold text-theme-primary">No Secondary Workspaces</h4>
                    <p className="text-[11px] text-theme-muted max-w-sm mx-auto">
                      All your customer records, invoices, and accounting ledgers operate cleanly under your primary workspace.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {otherWorkspaces.map(ws => (
                      <div 
                        key={ws.id} 
                        className={`p-4 sm:p-5 rounded-2xl bg-theme-card border transition-all duration-150 shadow-2xs hover:shadow-sm ${
                          ws.archived 
                            ? 'opacity-60 border-theme-border-soft bg-theme-surface/40' 
                            : 'border-theme-border-soft hover:border-theme-border-strong'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div 
                            className="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1"
                            onClick={() => {
                              if (!ws.archived) handleSwitchWorkspace(ws.id);
                            }}
                            title={ws.archived ? "Workspace is archived" : "Click to switch to this business"}
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                              ws.archived 
                                ? 'bg-theme-surface border-theme-border-soft text-theme-muted' 
                                : 'bg-theme-surface border-theme-border-soft text-theme-secondary hover:text-theme-accent hover:border-theme-accent/30 transition-colors'
                            }`}>
                              <Store className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-theme-primary truncate">
                                  {ws.name}
                                </h4>
                                {ws.archived && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase">
                                    Archived
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-theme-muted font-medium capitalize mt-0.5">
                                {ws.type || 'Retail'} • {ws.enabledModules?.length || 0} Modules
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-theme-border-soft">
                            {!ws.archived && (
                              <button
                                onClick={() => handleSwitchWorkspace(ws.id)}
                                className="px-3 py-1.5 rounded-xl bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent text-xs font-bold transition-colors cursor-pointer"
                              >
                                Switch
                              </button>
                            )}
                            <button 
                              onClick={() => handleOpenEdit(ws)}
                              className="w-8 h-8 rounded-xl bg-theme-surface hover:bg-theme-card border border-theme-border-soft flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                              title="Edit workspace"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleToggleArchive(ws)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                                ws.archived 
                                  ? 'bg-theme-tint-bg text-theme-accent hover:bg-theme-tint-bg border-theme-tint-border' 
                                  : 'bg-theme-surface text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 border-theme-border-soft'
                              }`}
                              title={ws.archived ? "Restore Workspace" : "Archive Workspace"}
                            >
                              {ws.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* CREATE / EDIT WORKSPACE FORM */
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-theme-card rounded-3xl p-6 sm:p-7 border border-theme-border-soft shadow-premium space-y-6">
                <div className="flex items-center justify-between border-b border-theme-border-soft pb-4">
                  <div>
                    <h3 className="text-base font-black text-theme-primary">
                      {editingWorkspace ? `Configure ${editingWorkspace.name}` : 'Create New Business Workspace'}
                    </h3>
                    <p className="text-xs text-theme-muted font-medium">
                      Define identity and configure active operational modules
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft text-theme-muted">
                    {editingWorkspace ? 'Editing' : 'New Entity'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-2">
                    Workspace / Branch Name
                  </label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Downtown Boutique or Branch 2"
                    className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-3 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-2">
                    Business Preset Category
                  </label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-3 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors cursor-pointer"
                  >
                    {BUSINESS_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                      Enabled Operational Modules ({enabledModules.length})
                    </label>
                    <span className="text-[10px] text-theme-muted">Toggle workspace features</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ALL_MODULES.map(mod => {
                      const isEnabled = enabledModules.includes(mod.id);
                      return (
                        <div 
                          key={mod.id} 
                          onClick={() => toggleModule(mod.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isEnabled 
                              ? 'bg-theme-accent/5 border-theme-accent/30 text-theme-accent' 
                              : 'bg-theme-surface border-theme-border-soft text-theme-secondary hover:text-theme-primary'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-xs block truncate">{mod.name}</span>
                          </div>
                          {isEnabled ? (
                            <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-theme-muted shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 bg-theme-surface hover:bg-theme-card text-theme-secondary hover:text-theme-primary font-bold rounded-2xl border border-theme-border-soft transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex-1 py-3 bg-theme-accent text-white font-bold rounded-2xl shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-xs sm:text-sm"
                >
                  {editingWorkspace ? 'Update Workspace' : 'Save Workspace'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default WorkspaceManager;

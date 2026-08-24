import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Check, Plus, Settings, Building2, Sparkles, Cloud } from 'lucide-react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { motion, AnimatePresence } from 'framer-motion';

const WorkspaceSwitcher = ({ businessWorkspaces = [], activeWorkspaceId, setActiveWorkspace, setCurrentTab, mobile }) => {
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef(null);
  
  const workspacesList = businessWorkspaces || [];
  const activeWorkspace = workspacesList.find(ws => ws.id === activeWorkspaceId) || workspacesList[0] || {};

  useOnClickOutside(dropdownRef, () => setOpen(false));

  const handleSelect = (id) => {
    if (id === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    setIsSwitching(true);
    setActiveWorkspace(id);
    setOpen(false);
    setTimeout(() => {
      setIsSwitching(false);
    }, 500);
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'WS';
  };

  if (mobile) {
    return (
      <div className="relative inline-block text-left z-50" ref={dropdownRef}>
        <button
          onClick={() => setOpen(prev => !prev)}
          disabled={isSwitching}
          className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border-soft px-2.5 py-1 bg-theme-surface/80 text-xs font-bold text-theme-primary hover:bg-theme-card active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          {isSwitching ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] animate-pulse">Switching...</span>
            </div>
          ) : (
            <>
              <div className="w-4 h-4 rounded-md bg-theme-accent/15 text-theme-accent flex items-center justify-center text-[9px] font-black shrink-0">
                {getInitials(activeWorkspace.name)}
              </div>
              <span className="truncate max-w-[110px]">{activeWorkspace.name || 'Workspace'}</span>
              {open ? <ChevronUp className="w-3 h-3 text-theme-muted shrink-0" /> : <ChevronDown className="w-3 h-3 text-theme-muted shrink-0" />}
            </>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="origin-top-left absolute left-0 mt-1.5 w-56 rounded-2xl shadow-xl bg-theme-card border border-theme-border-soft focus:outline-none z-50 overflow-hidden p-1.5 text-xs"
            >
              <div className="px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-theme-muted">
                Workspaces ({workspacesList.length})
              </div>
              <div className="space-y-0.5">
                {workspacesList.map(ws => {
                  const isCurrent = ws.id === activeWorkspaceId;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSelect(ws.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                        isCurrent 
                          ? 'bg-theme-accent/10 text-theme-accent' 
                          : 'text-theme-primary hover:bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCurrent ? 'bg-theme-accent text-white' : 'bg-theme-surface text-theme-secondary border border-theme-border-soft'
                        }`}>
                          {getInitials(ws.name)}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-theme-accent shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-theme-border-soft mt-1.5 pt-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setOpen(false);
                    if (setCurrentTab) setCurrentTab('onboarding');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-theme-accent font-bold hover:bg-theme-accent/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Workspace</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Luxury Workspace Identity Control
  return (
    <div className="relative w-full z-30" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={isSwitching}
        className="w-full flex items-center justify-between p-2 rounded-2xl bg-theme-surface/70 hover:bg-theme-surface border border-theme-border-soft hover:border-theme-border-strong text-left transition-all duration-150 shadow-2xs group cursor-pointer"
        title="Switch or manage workspace"
      >
        {isSwitching ? (
          <div className="flex items-center gap-2 py-1 px-1">
            <div className="w-3.5 h-3.5 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-theme-muted animate-pulse">Switching workspace...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-theme-accent/10 border border-theme-accent/20 text-theme-accent flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-theme-accent group-hover:text-white transition-colors">
                {getInitials(activeWorkspace.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-theme-primary truncate leading-snug">
                  {activeWorkspace.name || 'Default Workspace'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="truncate">Cloud Synced</span>
                </div>
              </div>
            </div>

            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-theme-muted group-hover:text-theme-primary transition-colors shrink-0">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl shadow-2xl bg-theme-card border border-theme-border-soft z-50 overflow-hidden p-1.5 text-xs"
          >
            <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-theme-muted flex items-center justify-between">
              <span>Workspaces</span>
              <span className="text-theme-muted font-mono">{workspacesList.length}</span>
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
              {workspacesList.map(ws => {
                const isCurrent = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelect(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                      isCurrent 
                        ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20' 
                        : 'text-theme-primary hover:bg-theme-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCurrent 
                          ? 'bg-theme-accent text-white' 
                          : 'bg-theme-surface text-theme-secondary border border-theme-border-soft'
                      }`}>
                        {getInitials(ws.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-tight">{ws.name}</p>
                        {ws.type && (
                          <p className="text-[9px] font-normal text-theme-muted capitalize truncate">{ws.type}</p>
                        )}
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-theme-accent shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-theme-border-soft mt-1.5 pt-1.5 space-y-0.5">
              <button
                onClick={() => {
                  setOpen(false);
                  if (setCurrentTab) setCurrentTab('onboarding');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-theme-accent font-bold hover:bg-theme-accent/10 transition-colors cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Workspace</span>
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  if (setCurrentTab) setCurrentTab('settings');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-theme-secondary font-semibold hover:bg-theme-surface transition-colors cursor-pointer text-xs"
              >
                <Settings className="w-3.5 h-3.5 text-theme-muted" />
                <span>Workspace Settings</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSwitcher;

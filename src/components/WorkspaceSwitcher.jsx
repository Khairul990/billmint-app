import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const WorkspaceSwitcher = ({ businessWorkspaces, activeWorkspaceId, setActiveWorkspace, setCurrentTab }) => {
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const activeWorkspace = businessWorkspaces.find(ws => ws.id === activeWorkspaceId) || {};

  const handleSelect = (id) => {
    setIsSwitching(true);
    setActiveWorkspace(id);
    setOpen(false);
    setTimeout(() => {
      setIsSwitching(false);
    }, 600); // 600ms premium transition feel
  };

  return (
    <div className="relative inline-block text-left mr-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        disabled={isSwitching}
        className="inline-flex items-center justify-center w-full rounded-md border border-theme-border-soft/50 shadow-sm px-3 py-1.5 bg-theme-surface text-sm font-bold text-theme-primary hover:bg-theme-card focus:outline-none transition-colors"
        title="Switch Workspace"
      >
        {isSwitching ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[11px] animate-pulse">Switching...</span>
          </div>
        ) : (
          <>
            {activeWorkspace.name || 'Workspace'}
            {open ? <ChevronUp className="ml-2 w-4 h-4 text-theme-muted" /> : <ChevronDown className="ml-2 w-4 h-4 text-theme-muted" />}
          </>
        )}
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-theme-card border border-theme-border-soft focus:outline-none z-20">
          <div className="py-1">
            {businessWorkspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws.id)}
                className={`block w-full text-left px-4 py-2 text-sm ${ws.id === activeWorkspaceId ? 'bg-theme-accent-light/20' : ''}`}
              >
                {ws.name}
              </button>
            ))}
            <div className="border-t border-theme-border-soft mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  if (setCurrentTab) setCurrentTab('onboarding');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-theme-accent font-bold hover:bg-theme-accent/10"
              >
                + Add Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;

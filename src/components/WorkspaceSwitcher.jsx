import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const WorkspaceSwitcher = ({ businessWorkspaces, activeWorkspaceId, setActiveWorkspace, setCurrentTab }) => {
  const [open, setOpen] = useState(false);
  const activeWorkspace = businessWorkspaces.find(ws => ws.id === activeWorkspaceId) || {};

  const handleSelect = (id) => {
    setActiveWorkspace(id);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left mr-4">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex justify-center w-full rounded-md border border-theme-border-soft/20 shadow-sm px-3 py-2 bg-theme-card text-sm font-medium text-theme-primary hover:bg-theme-accent-light/10 focus:outline-none"
        title="Switch Workspace"
      >
        {activeWorkspace.name || 'Workspace'}
        {open ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-theme-card ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
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

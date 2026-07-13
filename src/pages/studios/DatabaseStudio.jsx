import React from 'react';
import { Database, Table, Plus, Save, Server, Shield } from 'lucide-react';

const DatabaseStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Database Schema Studio</h2>
            <p className="text-xs text-theme-muted">Manage your custom data structures and Firebase collections.</p>
          </div>
        </div>

        <div className="bg-theme-surface/50 border border-theme-border-soft rounded-2xl p-6 text-center">
          <Server className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white mb-2">Custom Collections (Coming Soon)</h3>
          <p className="text-xs text-theme-muted mb-6 max-w-md mx-auto">
            The No-Code Database Studio will allow you to create custom tables (e.g., Inventory, Tasks, Vehicles) that automatically sync with Firestore and support offline mode.
          </p>
          
          <div className="flex justify-center gap-4">
            <button className="px-4 py-2 bg-theme-accent/20 text-theme-accent font-bold text-xs rounded-xl border border-theme-accent/30 opacity-50 cursor-not-allowed flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Table
            </button>
            <button className="px-4 py-2 bg-theme-main text-theme-muted font-bold text-xs rounded-xl border border-theme-border-soft flex items-center gap-2">
              <Shield className="w-4 h-4" /> View DB Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStudio;

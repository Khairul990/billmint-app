import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Trash2, Database, Play, Bell } from 'lucide-react';
import { generateDemoWorkspace, resetSandboxData } from '../../services/demoGenerator';
import { toast } from 'react-hot-toast';
import { addNotification } from '../../services/notificationsService';

const SandboxAdmin = ({ setCurrentTab }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!window.confirm('This will overwrite current Sandbox data. Proceed?')) return;
    setIsGenerating(true);
    toast.loading('Generating Demo Workspace...', { id: 'demo-gen' });
    
    // Simulate generation time to look realistic
    setTimeout(() => {
      const success = generateDemoWorkspace();
      if (success) {
        toast.success('Workspace Generated Successfully!', { id: 'demo-gen' });
        addNotification('Sandbox Ready', 'Generated 100 invoices, 50 customers, and 30 products.', 'success');
      } else {
        toast.error('Failed to generate. Ensure Sandbox is Active.', { id: 'demo-gen' });
      }
      setIsGenerating(false);
    }, 1500);
  };

  const handleReset = () => {
    if (!window.confirm('WARNING: This will delete ALL data in the Sandbox. Proceed?')) return;
    resetSandboxData();
    toast.success('Sandbox Data Reset');
    addNotification('Sandbox Reset', 'All sandbox databases and notifications have been cleared.', 'info');
  };

  const handleSimulateNotification = () => {
    addNotification('Test Alert', 'This is a simulated notification from the Sandbox Control Center.', 'info');
    toast.success('Notification simulated');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8 border-b border-theme-border-soft pb-4">
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Sandbox Control Center</h1>
          <p className="text-sm font-medium text-theme-muted mt-1">Manage mock data and test environments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Creator Mode */}
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-theme-primary mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-theme-accent" />
            Content Creator Mode
          </h2>
          <p className="text-sm text-theme-muted mb-6">
            Instantly populate the Sandbox with realistic data for YouTube demos or Instagram reels.
            Creates 100 invoices, 50 customers, and 30 products.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-theme-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Generate Demo Workspace'}
          </button>
        </div>

        {/* Sandbox Utilities */}
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-bold text-theme-primary mb-2 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-theme-secondary" />
            Sandbox Utilities
          </h2>
          
          <button
            onClick={handleSimulateNotification}
            className="w-full py-3 bg-theme-app border border-theme-border-soft text-theme-primary font-bold rounded-xl hover:bg-theme-accent-light hover:text-theme-accent transition-all flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" />
            Simulate Notification
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 mt-auto"
          >
            <Trash2 className="w-5 h-5" />
            Factory Reset Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick fix for missing Wrench icon in imports above
import { Wrench } from 'lucide-react';
export default SandboxAdmin;

import React from 'react';
import { Copy, Users, Check, LayoutTemplate, Box, ArrowRight } from 'lucide-react';

const PRESETS = [
  { id: 'retail', name: 'Retail / Shop', icon: Box, color: 'text-theme-warning', bg: 'bg-theme-warning/10' },
  { id: 'service', name: 'Service Business', icon: Users, color: 'text-theme-accent', bg: 'bg-theme-accent/10' },
  { id: 'education', name: 'Education / Coaching', icon: LayoutTemplate, color: 'text-theme-success', bg: 'bg-theme-success/10' }
];

const BusinessTemplateStudio = ({ settings, onUpdate }) => {

  const handleApplyPreset = (presetId) => {
    if (!window.confirm(`Are you sure you want to apply the ${presetId} preset? This will overwrite your current layout settings but won't delete data.`)) {
      return;
    }
    
    // In a real scenario, this would import specific preset configurations.
    // Here we just set the businessType.
    onUpdate({ businessType: presetId });
    alert(`Preset ${presetId} logic mapped. Save changes to apply fully.`);
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Business Template Studio</h2>
            <p className="text-xs text-theme-muted">Quickly configure your platform for specific industries</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = settings?.businessType === preset.id;
            
            return (
              <div key={preset.id} className={`p-5 rounded-2xl border-2 transition-all relative ${isActive ? 'border-theme-accent bg-theme-surface shadow-xl' : 'border-theme-border-soft bg-theme-main hover:border-theme-border'}`}>
                {isActive && <div className="absolute top-3 right-3 bg-theme-accent text-white text-[8px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3" /> Active</div>}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${preset.bg} ${preset.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{preset.name}</h3>
                <p className="text-[10px] text-theme-muted mb-6 leading-relaxed">
                  Pre-configured layout with specific data fields tailored for the {preset.name.toLowerCase()} industry.
                </p>
                <button 
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${isActive ? 'bg-theme-accent/20 text-theme-accent cursor-not-allowed' : 'bg-theme-surface border border-theme-border-soft text-white hover:bg-white hover:text-black'}`}
                >
                  {isActive ? 'Currently Active' : <>Apply Preset <ArrowRight className="w-3 h-3" /></>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-5 bg-theme-surface/50 border border-theme-border-soft rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Create Custom Preset</h3>
            <p className="text-xs text-theme-muted">Save your current platform layout as a reusable template.</p>
          </div>
          <button className="px-4 py-2 bg-theme-main border border-theme-border-soft text-theme-muted text-xs font-bold rounded-xl opacity-50 cursor-not-allowed">
            Premium Feature
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessTemplateStudio;

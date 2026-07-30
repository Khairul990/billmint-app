import React from 'react';
import { Palette, Sun, Moon, Monitor, PaintBucket, Sparkles } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { ALL_THEMES, THEME_INFO } from '../../utils/themeUtils';
import { applyFullTheme } from '../../hooks/useThemeEngine';

const THEME_PRESETS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'auto', label: 'Auto', icon: Monitor },
  { id: 'custom', label: 'Custom', icon: PaintBucket }
];

const ThemeStudio = ({ settings, onUpdate }) => {
  
  const handleChange = (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    onUpdate({ [key]: value });
    
    // Live preview theme apply instantly injects CSS variables to :root
    applyFullTheme(updatedSettings, false);
  };

  const handleToggleDark = () => {
    handleChange('darkMode', !settings?.darkMode);
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Theme Engine</h2>
            <p className="text-xs text-theme-muted">Customize every visual aspect of your platform instantly</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between p-4 bg-theme-surface/50 border border-theme-border-soft rounded-2xl mb-6">
          <div>
            <h3 className="text-xs font-bold text-theme-primary">Dark Mode</h3>
            <p className="text-[9px] text-theme-muted">Toggle dark/light appearance across the platform</p>
          </div>
          <Switch 
            checked={!!settings?.darkMode}
            onChange={handleToggleDark}
          />
        </div>

        {/* Theme Presets Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-theme-muted mb-3 uppercase tracking-wider">Premium Theme Catalog</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_THEMES.map(({ id, name, category }) => {
              const info = THEME_INFO[id];
              const isActive = settings?.themeColor === id;
              return (
                <button 
                  key={id} 
                  onClick={() => handleChange('themeColor', id)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02] ${isActive ? 'border-theme-accent shadow-lg shadow-theme-accent/20 bg-theme-surface' : 'border-theme-border-soft hover:border-theme-border bg-theme-main'}`}
                >
                  <div className="flex gap-1 mb-2">
                    {info?.colors?.slice(0, 3).map((c, i) => <div key={i} className="flex-1 h-3 rounded-sm" style={{ backgroundColor: c }} />)}
                  </div>
                  <p className="text-[10px] font-bold text-theme-primary truncate">{name}</p>
                  <p className="text-[8px] text-theme-muted uppercase tracking-wider">{category}</p>
                  {isActive && <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[8px]">+</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Brand Color */}
        <div className="flex items-center gap-4 p-4 bg-theme-surface/50 border border-theme-border-soft rounded-2xl mb-6">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-theme-primary">Custom Brand Color</h3>
            <p className="text-[9px] text-theme-muted">Override primary accent with your hex code</p>
          </div>
          <input 
            type="color" 
            value={settings?.brandColor || '#14b8a6'} 
            onChange={(e) => handleChange('brandColor', e.target.value)} 
            className="w-10 h-10 rounded-xl cursor-pointer border border-theme-border-soft bg-transparent" 
          />
            <input 
              type="text" 
              value={settings?.brandColor || '#14b8a6'} 
              onChange={(e) => handleChange('brandColor', e.target.value)} 
              className="w-24 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-lg text-xs font-mono text-theme-primary text-center focus:outline-none focus:border-theme-accent" 
            />
        </div>

        {/* Layout Modifiers */}
        <div>
          <h3 className="text-xs font-bold text-theme-muted mb-3 uppercase tracking-wider">Layout Modifiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Corner Radius', key: 'cornerRadius', min: 4, max: 24, unit: 'px', default: 12 },
              { label: 'Shadow Intensity', key: 'shadowIntensity', min: 0, max: 100, unit: '%', default: 50 },
              { label: 'Animation Speed', key: 'animationSpeed', min: 0.25, max: 2, step: 0.25, unit: 'x', default: 1 },
              { label: 'Font Density', key: 'fontDensity', options: ['compact', 'normal', 'relaxed'], default: 'normal' }
            ].map((opt, i) => (
              <div key={i} className="p-4 bg-theme-surface/50 border border-theme-border-soft rounded-2xl">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider block mb-2">{opt.label}</label>
                {opt.options ? (
                  <select 
                    value={settings?.[opt.key] || opt.default}
                    onChange={(e) => handleChange(opt.key, e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary text-xs rounded-lg p-2 focus:outline-none cursor-pointer"
                  >
                    {opt.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div>
                    <input 
                      type="range" 
                      min={opt.min} max={opt.max} step={opt.step || 1}
                      value={settings?.[opt.key] ?? opt.default} 
                      onChange={(e) => handleChange(opt.key, parseFloat(e.target.value))} 
                      className="w-full accent-theme-accent" 
                    />
                    <div className="text-center mt-1 text-xs font-bold text-theme-primary">
                      {settings?.[opt.key] ?? opt.default}{opt.unit}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ThemeStudio;

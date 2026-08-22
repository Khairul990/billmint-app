import React from 'react';
import { Palette, Sparkles, Lock } from 'lucide-react';

const PremiumThemePicker = ({ 
  brandColor, 
  setBrandColor, 
  themeType, 
  setThemeType, 
  isPremium 
}) => {
  return (
    <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-theme-accent/10 rounded-xl text-theme-accent">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-primary">Smart SVG Theme Engine</h3>
            <p className="text-xs text-theme-muted">Customize your entire dashboard with your brand color</p>
          </div>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/20">
            <Lock className="w-3.5 h-3.5" />
            PREMIUM
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-theme-border-soft">
        <div className="flex-1 space-y-3">
          <label className="text-sm font-semibold text-theme-secondary flex items-center gap-2">
            Theme Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setThemeType('preset')}
              className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                themeType === 'preset' 
                  ? 'bg-theme-accent text-white border-theme-accent shadow-premium' 
                  : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
              }`}
            >
              Pre-built Themes
            </button>
            <button
              type="button"
              onClick={() => {
                if (isPremium) setThemeType('custom');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                themeType === 'custom' 
                  ? 'bg-gradient-to-r from-theme-accent to-fuchsia-500 text-white border-transparent shadow-premium' 
                  : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
              } ${!isPremium ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <Sparkles className="w-4 h-4" />
              Custom Brand
            </button>
          </div>
        </div>

        {themeType === 'custom' && (
          <div className="flex-1 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <label className="text-sm font-semibold text-theme-secondary flex items-center gap-2">
              Select HEX Color
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-12 p-0 border-0 rounded-xl overflow-hidden cursor-pointer shadow-sm"
              />
              <input 
                type="text" 
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 bg-theme-surface border border-theme-border-soft rounded-xl px-3 py-2 text-sm font-mono text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent outline-none"
                placeholder="#HEXCODE"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumThemePicker;

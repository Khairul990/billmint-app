import React from 'react';
import { Palette, CheckCircle2, Monitor, Laptop2, Sparkles, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getThemePreviewColors } from '../../utils/themeUtils';

const ThemeStudioTab = (props) => {
  const { themeColor, setThemeColor, darkMode, setDarkMode, brandColor, setBrandColor, pdfVisibleFields, setPdfVisibleFields, settings, onSaveSettings, handleSave, enableHaptics, setEnableHaptics, enableSounds, setEnableSounds } = props;

  return (
    <>
        
          <div className="space-y-6 animate-fadeIn">
            {/* Studio Header */}
            <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary">Brand Theme Studio</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Customize the look of your BillQyro workspace and invoice PDF</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Preset Selectors & Controls */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Light/Dark Mode Toggle */}
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-theme-primary dark:text-theme-primary tracking-wider">Dark Mode</h3>
                    <p className="text-[10px] text-theme-muted font-medium">Use a dark aesthetic across your dashboard.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDarkMode(!darkMode);
                      // Instantly toggle the class so the preview is accurate
                      if (!darkMode) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 focus:outline-none ${darkMode ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}`}
                  >
                    <span className={`w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                  <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Select Brand Color</h3>
                  
                  {/* Theme Presets List */}
                  <div className="space-y-3">
                    {[
                        { id: 'obsidian-gold', name: 'Obsidian Gold', desc: 'Ultra Premium Executive', colors: ['#B8860B', '#1F2937', '#FFF9EC', '#1A1A1A', '#6B5B3E'] },
                        { id: 'arctic-teal', name: 'Arctic Teal', desc: 'Clean Premium Business', colors: ['#009E7F', '#0F766E', '#F4FFFD', '#10201D', '#4B6F68'] },
                        { id: 'sapphire-noir', name: 'Sapphire Noir', desc: 'Financial Corporate', colors: ['#2563EB', '#1E3A8A', '#F7FAFF', '#0F172A', '#4B5D7A'] },
                        { id: 'rose-platinum', name: 'Rose Platinum', desc: 'Luxury Elegant', colors: ['#C75C75', '#8B3A4A', '#FFF7FA', '#2A1118', '#7A4B58'] },
                        { id: 'carbon-violet', name: 'Carbon Violet', desc: 'Modern Tech Startup', colors: ['#7C3AFF', '#4C1D95', '#FAF7FF', '#1E1238', '#67548A'] },
                        { id: 'graphite-copper', name: 'Graphite Copper', desc: 'Industrial Luxury', colors: ['#B76535', '#4B2A1A', '#FFF8F2', '#24130C', '#7A5642'] },
                        { id: 'arctic-diamond', name: 'Arctic Diamond', desc: 'Luxury White & Ice Blue', colors: ['#60A5FA', '#CBD5E1', '#F3F7FC', '#0F172A', '#64748B'] },
                        { id: 'emerald-royal', name: 'Emerald Royal', desc: 'Emerald & Gold Finance', colors: ['#10B981', '#D4AF37', '#F0FDF4', '#052E16', '#4B635A'] },
                        { id: 'midnight-ruby', name: 'Midnight Ruby', desc: 'Ruby Red Luxury', colors: ['#C0392B', '#7F1D1D', '#FFF1F2', '#2B0D0D', '#7C4A4A'] },
                        { id: 'titanium-blue', name: 'Titanium Blue', desc: 'Modern SaaS Stripe Style', colors: ['#2563EB', '#94A3B8', '#F8FAFC', '#0F172A', '#64748B'] },
                        { id: 'deep-bluish-green', name: 'Deep Bluish Green', desc: 'Premium Nature', colors: ['#0f9d58', '#0a7d48', '#e0f7e9', '#0a0c0a', '#151a15'] },
                        { id: 'deep-blue-premium', name: 'Deep Blue Premium', desc: 'Corporate Luxury', colors: ['#1e40af', '#172d7e', '#e0e8ff', '#0a0c1a', '#151a31'] },
                        { id: 'crimson-gold', name: 'Crimson Gold', desc: 'Elite Business', colors: ['#d4af37', '#aa8c2c', '#fcf5f7', '#1c0a0f', '#3d1720'] },
                        { id: 'royal-black', name: 'Royal Black', desc: 'Ultimate Premium', colors: ['#eab308', '#ca8a04', '#fafafa', '#050505', '#121212'] },
                        { id: 'luxury-cream', name: 'Luxury Cream', desc: 'Elegant Boutique', colors: ['#b48c59', '#937042', '#fdfbf7', '#1c1a17', '#2b2823'] }
                      ].map((preset) => {
                        const isSelected = themeColor === preset.id;
                        const lightColors = getThemePreviewColors(preset.id, 'light');
                        const darkColors = getThemePreviewColors(preset.id, 'dark');

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setThemeColor(preset.id);
                              document.documentElement.setAttribute('data-theme', preset.id);
                              import('../utils/themeIcon').then(m => m.updateFaviconForTheme(preset.id));
                            }}
                            className={`w-full text-left rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col ${
                              isSelected 
                                ? 'border-theme-accent bg-theme-accent/[0.03] shadow-premium ring-1 ring-theme-accent' 
                                : 'border-theme-border-soft/60 dark:border-theme-border-soft hover:border-theme-border-strong bg-theme-app/50 dark:bg-theme-surface hover:shadow-md'
                            }`}
                          >
                            <div className="flex w-full h-1.5 opacity-90">
                              {preset.colors.map((c, i) => (
                                <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                              ))}
                            </div>
                            
                            <div className="p-4 w-full space-y-3">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-extrabold text-theme-primary dark:text-theme-primary">{preset.name}</span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[8px] font-bold shadow-sm shadow-theme-accent/30">✓</span>
                                )}
                              </div>
                              <p className="text-[10px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed">{preset.desc}</p>
                              
                              <div className="mt-3 flex rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner">
                                
                                <div className="flex-1 p-2 flex gap-1.5" style={{ backgroundColor: lightColors.background }}>
                                  <div className="w-5 rounded shadow-sm p-1 space-y-1" style={{ backgroundColor: lightColors.sidebar }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lightColors.accent }}></div>
                                    <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: lightColors.text }}></div>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="w-full h-5 rounded shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: lightColors.card }}>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: lightColors.btnFrom }}></div>
                                      <div className="w-1 h-3 rounded-t-sm" style={{ backgroundColor: lightColors.btnTo }}></div>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: lightColors.btnFrom }}></div>
                                    </div>
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: `linear-gradient(90deg, ${lightColors.btnFrom}, ${lightColors.btnTo})` }}></div>
                                  </div>
                                </div>

                                <div className="flex-1 p-2 flex gap-1.5 border-l border-white/10" style={{ backgroundColor: darkColors.background }}>
                                  <div className="w-5 rounded shadow-sm p-1 space-y-1" style={{ backgroundColor: darkColors.sidebar }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: darkColors.accent }}></div>
                                    <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: darkColors.text }}></div>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="w-full h-5 rounded shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: darkColors.card }}>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: darkColors.btnFrom }}></div>
                                      <div className="w-1 h-3 rounded-t-sm" style={{ backgroundColor: darkColors.btnTo }}></div>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: darkColors.btnFrom }}></div>
                                    </div>
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: `linear-gradient(90deg, ${darkColors.btnFrom}, ${darkColors.btnTo})` }}></div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft/80">
                    <button
                      type="button"
                      onClick={() => {
                        document.documentElement.setAttribute('data-theme', themeColor);
                        import('../utils/themeIcon').then(m => m.updateFaviconForTheme(themeColor));
                        toast.success(`Previewing ${themeColor} theme!`);
                      }}
                      className="w-full py-3 bg-theme-surface hover:bg-theme-border-soft/75 dark:bg-theme-card dark:hover:bg-slate-750 text-theme-primary dark:text-theme-secondary font-black text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Test UI Live Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(null)}
                      className="w-full py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Save Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeColor('blue');
                        setDarkMode(false);
                        const payload = {
                          ...settings,
                          themeColor: 'blue',
                          darkMode: false,
                          themePreset: 'blue', // Legacy support
                          themeUpdatedAt: new Date().toISOString()
                        };
                        onSaveSettings(payload);
                        document.documentElement.setAttribute('data-theme', 'light');
                        import('../utils/themeIcon').then(m => m.updateFaviconForTheme('light'));
                        document.documentElement.classList.remove('dark');
                        toast.success('Reset to BillQyro Classic default theme!');
                      }}
                      className="w-full py-2 bg-transparent text-theme-muted hover:text-theme-danger text-[10px] font-bold text-center transition-all cursor-pointer block uppercase tracking-wider"
                    >
                      Reset to BillQyro Classic
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Mocks Previews */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Theme Studio Live Mocks</h3>
                    <p className="text-[9px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed mt-0.5">Real-time dynamic visualization of presets applied to core panels</p>
                  </div>

                  {/* Previews Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Dashboard Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-theme-border-soft/10">PC Workspace</span>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-theme-muted tracking-wider block">Desktop Dashboard</span>
                            <div className="flex gap-2">
                              {/* Sidebar miniature */}
                              <div className="w-14 rounded p-1.5 space-y-1" style={{ backgroundColor: colors.sidebar }}>
                                <div className="w-8 h-1 rounded-sm bg-theme-card/40"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                              </div>
                              {/* Main panel miniature */}
                              <div className="flex-1 space-y-2">
                                {/* Hero Mock */}
                                <div className="rounded p-2 text-white text-[6px] space-y-1 relative" style={{ background: `linear-gradient(135deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                                  <span className="font-extrabold block">Welcome to BillQyro</span>
                                  <div className="w-12 h-1 bg-theme-card/30 rounded-sm"></div>
                                </div>
                                {/* Stats Box mock */}
                                <div className="grid grid-cols-2 gap-1">
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-theme-muted block leading-none">Collection</span>
                                    <span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$1,200</span>
                                  </div>
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-theme-muted block leading-none">Dues</span>
                                    <span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$450</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Create button */}
                          <div className="w-full h-5 rounded-lg flex items-center justify-center text-[7px] font-black uppercase tracking-wider text-white shadow-sm" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                            Create Invoice
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Mobile screen Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden bg-theme-app min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/10 px-1.5 py-0.5 rounded border border-white/5">Smartphone UI</span>
                          {/* Mobile Screen Shell */}
                          <div className="w-3/4 flex-1 border border-white/10 bg-theme-card rounded-t-xl overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                            {/* Mobile header */}
                            <div className="p-1 flex justify-between items-center border-b" style={{ borderColor: colors.border }}>
                              <span className="text-[5px] font-bold" style={{ color: colors.text }}>BillQyro</span>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                            </div>
                            {/* Mobile card info */}
                            <div className="p-2 space-y-1.5">
                              <div className="rounded p-1.5 border space-y-1" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                <div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div>
                                <div className="w-14 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></div>
                              </div>
                            </div>
                            {/* Floating pill action mock */}
                            <div className="flex justify-center -mb-2">
                              <span className="px-2 py-0.5 rounded-full text-[4.5px] font-black text-white shadow-sm flex items-center gap-0.5" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                                ⚡ Quick Bill
                              </span>
                            </div>
                            {/* Mobile Bottom navigation bar mockup */}
                            <div className="h-4 border-t flex justify-around items-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. A4 Printable PDF Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 bg-theme-surface dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-theme-border-soft/10">Printable PDF</span>
                          {/* Mini paper sheet */}
                          <div className="w-[85%] flex-1 bg-theme-card border border-theme-border-soft shadow-sm p-2 flex flex-col justify-between">
                            {/* Header accent */}
                            <div className="flex justify-between items-start pb-1.5 border-b border-theme-border-soft">
                              <div className="space-y-0.5">
                                <span className="text-[6px] font-extrabold block" style={{ color: colors.headerColor }}>BillQyro Store</span>
                                <div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div>
                              </div>
                              <span className="text-[6px] font-black tracking-wide" style={{ color: colors.headerColor }}>INVOICE</span>
                            </div>
                            {/* Table Mockup */}
                            <div className="my-1.5 space-y-0.5">
                              {/* Header Accent Line */}
                              <div className="h-1 rounded-sm w-full" style={{ backgroundColor: colors.tableHeaderBg }}></div>
                              <div className="h-0.5 bg-theme-surface w-full"></div>
                              <div className="h-0.5 bg-theme-surface w-full"></div>
                            </div>
                            {/* Total Highlight Accent Row */}
                            <div className="flex justify-between items-center p-1 rounded-sm" style={{ backgroundColor: colors.totalBg }}>
                              <span className="text-[5px] font-black" style={{ color: colors.headerColor }}>GRAND TOTAL</span>
                              <span className="text-[5.5px] font-black" style={{ color: colors.headerColor }}>$1,650.00</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. Scan to Pay QR Card Preview */}
                    {(() => {
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 bg-theme-card dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-surface dark:bg-theme-card/80 px-1.5 py-0.5 rounded border border-theme-border-soft/10">QR Pay Card</span>
                          {/* Miniature Scan Card frame */}
                          <div className="w-[85%] border border-theme-border-soft dark:border-theme-border-soft rounded-xl p-2.5 flex flex-col items-center justify-between text-center gap-1.5 shadow-sm bg-theme-app dark:bg-theme-app/20">
                            <span className="text-[6px] font-bold text-theme-muted dark:text-theme-muted uppercase tracking-widest block leading-none">Scan to Pay</span>
                            
                            {/* Mini QR border styled in theme accent */}
                            <div className="p-1 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: colors.accent }}>
                              <div className="w-10 h-10 bg-theme-border-soft dark:bg-theme-card flex items-center justify-center text-[5px] text-theme-muted">QR Code</div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[5.5px] text-theme-muted dark:text-theme-muted block font-semibold leading-none">BillQyro Payment</span>
                              <span className="text-[7px] font-black block leading-tight" style={{ color: colors.headerColor }}>$1,650.00 Due</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Premium Mobile UX</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Configure haptic vibrations and premium sounds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { state: enableHaptics, setter: setEnableHaptics, label: 'Enable Haptic Feedback', desc: 'Vibrate on success, errors, and key actions' },
                { state: enableSounds, setter: setEnableSounds, label: 'Enable Premium Sounds', desc: 'Play satisfying audio cues when bills are saved' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl">
                  <div className="mr-3">
                    <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-slate-250 block">{item.label}</span>
                    <span className="text-[9px] text-theme-muted dark:text-theme-muted font-semibold">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`w-9 h-5 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-[image:var(--accent-gradient)] shadow-sm shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ${item.state ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
    </>
  );
};

export default ThemeStudioTab;
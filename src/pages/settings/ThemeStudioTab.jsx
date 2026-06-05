import React from 'react';
import { Palette, CheckCircle2, Monitor, Laptop2, Sparkles } from 'lucide-react';

const ThemeStudioTab = (props) => {
  const { themeColor, setThemeColor, darkMode, setDarkMode, brandColor, setBrandColor, pdfVisibleFields, setPdfVisibleFields } = props;

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
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-theme-card w-4 h-4 rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`} />
                  </button>
                </div>

                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                  <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Select Brand Color</h3>
                  
                  {/* Theme Presets List */}
                  <div className="space-y-3">
                    {[
                        { id: 'pink', name: 'Pink Premium', desc: 'Deep navy backgrounds with premium pink accents. Best for SaaS.', colors: ['#10122B', '#EC4899', '#FB7185'] },
                        { id: 'indigo', name: 'Royal Indigo', desc: 'Deep indigo and vibrant purple for an elegant touch.', colors: ['#312E81', '#5B34D6', '#7C3AED'] },
                        { id: 'emerald', name: 'Emerald Business', desc: 'Rich emerald greens for eco and finance sectors.', colors: ['#12372A', '#059669', '#34D399'] },
                        { id: 'rose', name: 'Rose Gold Luxe', desc: 'Warm rose and gold accents on dark brown backgrounds.', colors: ['#3A1F1A', '#F43F5E', '#D4A44A'] },
                        { id: 'midnight', name: 'Midnight Blue', desc: 'Deep blues and cyan for a professional marine look.', colors: ['#081A35', '#2563EB', '#38BDF8'] },
                        { id: 'champagne', name: 'Champagne Black', desc: 'Elegant black and champagne gold for high-end feel.', colors: ['#1E1A15', '#D6A84F', '#F97316'] },
                        { id: 'ruby', name: 'Ruby Burgundy', desc: 'Deep burgundy and ruby for a rich, vibrant aesthetic.', colors: ['#2B1220', '#BE185D', '#7C2D12'] },
                        { id: 'ocean-blue', name: 'Ocean Blue', desc: 'Refreshing blue gradients for a clean look.', colors: ['#0C4A6E', '#0284C7', '#38BDF8'] },
                        { id: 'sunset-orange', name: 'Sunset Orange', desc: 'Vibrant orange and red hues for an energetic vibe.', colors: ['#7C2D12', '#EA580C', '#F97316'] },
                        { id: 'forest-green', name: 'Forest Green', desc: 'Natural greens for a calm, organic aesthetic.', colors: ['#14532D', '#16A34A', '#22C55E'] },
                        { id: 'golden-luxury', name: 'Golden Luxury', desc: 'Dark brown backgrounds with rich gold for a luxurious feel.', colors: ['#1a1510', '#d4af37', '#aa8c2c'] },
                        { id: 'purple-haze', name: 'Purple Haze', desc: 'Deep purple backgrounds with vibrant amethyst accents.', colors: ['#1a0f1f', '#a855f7', '#9333ea'] },
                        { id: 'crimson-red', name: 'Crimson Red', desc: 'Intense crimson red accents on a dark red-black canvas.', colors: ['#1f0a0a', '#dc2626', '#b91c1c'] },
                        { id: 'silver-elite', name: 'Silver Elite', desc: 'Monochrome silver and slate for an elite corporate vibe.', colors: ['#0f1419', '#94a3b8', '#64748b'] },
                        { id: 'cyber-blue', name: 'Cyber Blue', desc: 'Neon cyan accents on deep space blue backgrounds.', colors: ['#0a0e27', '#00ffff', '#00cccc'], neon: true }
                      ].map((preset) => {
                      const isSelected = themeColor === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setThemeColor(preset.id);
                            document.documentElement.setAttribute('data-theme', preset.id);
                            import('../utils/themeIcon').then(m => m.updateFaviconForTheme(preset.id));
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col gap-2 ${
                            isSelected 
                              ? 'border-theme-accent bg-theme-accent/[0.03] shadow-premium glow-emerald' 
                              : 'border-theme-border-soft/60 dark:border-theme-border-soft hover:border-slate-350 dark:hover:border-slate-700 bg-theme-app/50 dark:bg-theme-surface'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-850 dark:text-theme-primary">{preset.name}</span>
                              {preset.neon && (
                                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[8px] font-black uppercase tracking-widest shadow-[0_0_8px_rgba(0,255,255,0.4)] animate-pulse">
                                  Neon
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 items-center">
                              {preset.colors.map((c, i) => (
                                <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }}></span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed pr-6">{preset.desc}</p>
                          {isSelected && (
                            <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[8px] font-bold">✓</span>
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
                    className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-theme-accent' : 'bg-slate-350 dark:bg-theme-surface'}`}
                  >
                    <div className={`w-3 h-3 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${item.state ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
    </>
  );
};

export default ThemeStudioTab;
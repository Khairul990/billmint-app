const fs = require('fs');

const files = [
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx'
];

const new_button = `                      ].map((preset) => {
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
                          className={\`w-full text-left rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col \${
                            isSelected 
                              ? 'border-theme-accent bg-theme-accent/[0.03] shadow-premium ring-1 ring-theme-accent' 
                              : 'border-theme-border-soft/60 dark:border-theme-border-soft hover:border-theme-border-strong bg-theme-app/50 dark:bg-theme-surface hover:shadow-md'
                          }\`}
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
                            
                            <div className="mt-3 p-2 rounded-xl border border-black/5 dark:border-white/5 flex gap-2 relative overflow-hidden shadow-inner" style={{ backgroundColor: preset.colors[3] }}>
                              <div className="w-8 rounded-lg p-1.5 space-y-1.5 shadow-sm" style={{ backgroundColor: preset.colors[4] }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors[0] }}></div>
                                <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: preset.colors[0] }}></div>
                                <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: preset.colors[0] }}></div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="w-full h-3 rounded-md flex justify-end items-center px-1 shadow-sm" style={{ backgroundColor: preset.colors[4] }}>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.colors[1] }}></div>
                                </div>
                                <div className="flex gap-1">
                                  <div className="flex-1 h-8 rounded-md shadow-sm p-1 flex flex-col justify-between" style={{ backgroundColor: preset.colors[4] }}>
                                    <div className="w-4 h-0.5 rounded-full opacity-40" style={{ backgroundColor: preset.colors[0] }}></div>
                                    <div className="w-6 h-1 rounded-full" style={{ backgroundColor: preset.colors[1] }}></div>
                                  </div>
                                  <div className="flex-1 h-8 rounded-md shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: preset.colors[4] }}>
                                    <div className="w-1.5 h-3 rounded-t-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                                    <div className="w-1.5 h-5 rounded-t-sm" style={{ backgroundColor: preset.colors[2] }}></div>
                                    <div className="w-1.5 h-4 rounded-t-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                                  </div>
                                </div>
                                <div className="w-full h-3 rounded-md shadow-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );`;

const new_presets = `                    {[
                        { id: 'classic', name: 'BillQyro Classic', desc: 'Warm ivory and premium orange for a modern SaaS feel.', colors: ['#1C1917', '#F97316', '#C2410C', '#FCFBF8', '#F4F1E9'] },
                        { id: 'rose', name: 'Rose Gold Luxe', desc: 'Premium luxury aesthetics with rose gold and champagne ivory.', colors: ['#2C1A14', '#B56576', '#E5989B', '#FFFBF9', '#FDF2EE'] },
                        { id: 'ocean', name: 'Ocean Mist', desc: 'Modern technology vibes with aqua blue and ice white.', colors: ['#0A2E36', '#0493A6', '#3EBDCC', '#F0F8FA', '#E1F2F5'] },
                        { id: 'emerald', name: 'Emerald Prestige', desc: 'Rich emerald green and mint white for business & finance.', colors: ['#112A1F', '#10B981', '#34D399', '#F2F9F5', '#E2F2E9'] },
                        { id: 'indigo', name: 'Royal Indigo', desc: 'Deep indigo and lavender white for an elegant startup look.', colors: ['#1B1A31', '#4F46E5', '#818CF8', '#F6F6FA', '#EDEDF5'] },
                        { id: 'midnight', name: 'Midnight Platinum', desc: 'Monochrome silver and OLED black inspired by Apple.', colors: ['#1D1D1F', '#000000', '#434343', '#F5F5F7', '#EBEBEF'] },
                        { id: 'sakura', name: 'Soft Sakura', desc: 'Elegant modern aesthetic with soft pinks and peach white.', colors: ['#3A1B28', '#F472B6', '#F9A8D4', '#FFF5F7', '#FFEAF0'] },
                        { id: 'desert', name: 'Desert Sand', desc: 'Warm earth tones and sand beige for a retail boutique feel.', colors: ['#382C22', '#D4A373', '#E6C2A1', '#FCF9F5', '#F2EBE1'] },
                        { id: 'obsidian', name: 'Obsidian Gold', desc: 'Ultra-premium executive style with obsidian black and gold.', colors: ['#0F0F0F', '#D4AF37', '#9E8224', '#F0F0F0', '#E0E0E0'] },
                        { id: 'crimson', name: 'Crimson Executive', desc: 'Corporate leadership aesthetics with wine red and gray.', colors: ['#2C181D', '#8B0000', '#C21807', '#F8F4F5', '#EFE7E9'] }
                      ].map((preset) => {`;

for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/\{\[\s*\{\s*id:\s*'classic'[\s\S]*?\]\.map\(\(preset\)\s*=>\s*\{/g, new_presets);
    
    content = content.replace(/\]\.map\(\(preset\)\s*=>\s*\{[\s\S]*?const isSelected = themeColor === preset.id;[\s\S]*?return \([\s\S]*?<button[\s\S]*?key=\{preset\.id\}[\s\S]*?type="button"[\s\S]*?onClick=\{[\s\S]*?\}\}[\s\S]*?className=\{`w-full text-left[\s\S]*?`\}[\s\S]*?>[\s\S]*?<\/button>[\s\S]*?\);/g, new_button);
    
    content = content.replaceAll("useState('light')", "useState('classic')");
    content = content.replaceAll("useState('pink')", "useState('classic')");
    
    const old_init = "setThemeColor(settings.themeColor || (settings.themePreset === 'dark' ? 'light' : settings.themePreset) || 'light');";
    const old_init2 = "setThemeColor(settings.themeColor || (settings.themePreset === 'dark' ? 'classic' : settings.themePreset) || 'classic');";
    
    const new_init = `      const validThemes = ['classic', 'rose', 'ocean', 'emerald', 'indigo', 'midnight', 'sakura', 'arctic', 'desert', 'lavender', 'obsidian', 'crimson'];
      let initialTheme = settings.themeColor || settings.themePreset;
      if (initialTheme === 'dark' || initialTheme === 'light' || !validThemes.includes(initialTheme)) {
        initialTheme = 'classic';
      }
      setThemeColor(initialTheme);`;
    
    content = content.replace(old_init, new_init);
    content = content.replace(old_init2, new_init);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Rewrote", filePath);
}

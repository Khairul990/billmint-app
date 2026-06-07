const fs = require('fs');

const oldButtonRegex = /<button[\s\S]*?key=\{preset\.id\}[\s\S]*?type="button"[\s\S]*?onClick=\{[\s\S]*?\}\}*?[\s\S]*?className=\{`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col gap-2 \$\{[\s\S]*?isSelected[\s\S]*?\? 'border-theme-accent bg-theme-accent\/\[0\.03\] shadow-premium glow-emerald'[\s\S]*?: 'border-theme-border-soft\/60 dark:border-theme-border-soft hover:border-theme-border-soft dark:hover:border-theme-border-strong bg-theme-app\/50 dark:bg-theme-surface'[\s\S]*?\}`\}[\s\S]*?>[\s\S]*?<div className="flex justify-between items-center w-full">[\s\S]*?<div className="flex items-center gap-2">[\s\S]*?<span className="text-xs font-extrabold text-theme-primary dark:text-theme-primary">\{preset\.name\}<\/span>[\s\S]*?\{preset\.neon && \([\s\S]*?<span className="px-1\.5 py-0\.5 bg-cyan-500\/20 text-cyan-400 border border-cyan-500\/30 rounded text-\[8px\] font-black uppercase tracking-widest shadow-\[0_0_8px_rgba\(0,255,255,0\.4\)\] animate-pulse">[\s\S]*?Neon[\s\S]*?<\/span>[\s\S]*?\)\}[\s\S]*?<\/div>[\s\S]*?<div className="flex gap-1 items-center">[\s\S]*?\{preset\.colors\.map\(\(c, i\) => \([\s\S]*?<span key=\{i\} className="w-3\.5 h-3\.5 rounded-full border border-white\/20 shadow-sm" style=\{\{ backgroundColor: c \}\}\><\/span>[\s\S]*?\)\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<p className="text-\[10px\] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed pr-6">\{preset\.desc\}<\/p>[\s\S]*?\{isSelected && \([\s\S]*?<span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-\[8px\] font-bold">✓<\/span>[\s\S]*?\)\}[\s\S]*?<\/button>/g;

const newButton = `<button
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
                          {/* Palette Strip at the very top */}
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
                            
                            {/* Miniature UI Preview */}
                            <div className="mt-3 p-2 rounded-xl border border-black/5 dark:border-white/5 flex gap-2 relative overflow-hidden shadow-inner" style={{ backgroundColor: preset.colors[3] }}>
                              {/* Mini Sidebar */}
                              <div className="w-8 rounded-lg p-1.5 space-y-1.5 shadow-sm" style={{ backgroundColor: preset.colors[4] }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors[0] }}></div>
                                <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: preset.colors[0] }}></div>
                                <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: preset.colors[0] }}></div>
                              </div>
                              {/* Mini Content Area */}
                              <div className="flex-1 space-y-2">
                                {/* Mini Header */}
                                <div className="w-full h-3 rounded-md flex justify-end items-center px-1 shadow-sm" style={{ backgroundColor: preset.colors[4] }}>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.colors[1] }}></div>
                                </div>
                                {/* Mini Cards & Chart */}
                                <div className="flex gap-1">
                                  <div className="flex-1 h-8 rounded-md shadow-sm p-1 flex flex-col justify-between" style={{ backgroundColor: preset.colors[4] }}>
                                    <div className="w-4 h-0.5 rounded-full opacity-40" style={{ backgroundColor: preset.colors[0] }}></div>
                                    <div className="w-6 h-1 rounded-full" style={{ backgroundColor: preset.colors[1] }}></div>
                                  </div>
                                  <div className="flex-1 h-8 rounded-md shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: preset.colors[4] }}>
                                    {/* Mini Bar Chart */}
                                    <div className="w-1.5 h-3 rounded-t-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                                    <div className="w-1.5 h-5 rounded-t-sm" style={{ backgroundColor: preset.colors[2] }}></div>
                                    <div className="w-1.5 h-4 rounded-t-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                                  </div>
                                </div>
                                {/* Mini Button */}
                                <div className="w-full h-3 rounded-md shadow-sm" style={{ backgroundColor: preset.colors[1] }}></div>
                              </div>
                            </div>
                          </div>
                        </button>`;

const files = [
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    let newContent = content.replace(oldButtonRegex, newButton);
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Updated', file);
    } else {
      console.log('No match found in', file);
    }
  }
});

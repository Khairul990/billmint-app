import fs from 'fs';

let c = fs.readFileSync('src/pages/PdfTemplateStudio.jsx', 'utf8');

c = c.replace(/<div key=\{tpl\.id\} className=\{\`group bg-theme-surface/g, "<div key={tpl.id} onClick={() => { if(!isLocked) { handleApply(tpl.id, tpl.type); setUseAnimId(tpl.id); setTimeout(() => setUseAnimId(null), 1500); } }} className={`group bg-theme-surface");

const buttonRegex = /<button[\s\S]*?onClick=\{\(\) => \{ handleApply\(tpl\.id, tpl\.type\);[\s\S]*?<\/button>/m;

c = c.replace(buttonRegex, `
                      {isLocked ? (
                        <button
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:scale-[1.02]"
                        >
                          <Lock className="w-3.5 h-3.5" /> Unlock Pro
                        </button>
                      ) : (
                        <div className="flex-1"></div>
                      )}
`);

fs.writeFileSync('src/pages/PdfTemplateStudio.jsx', c);
console.log('Removed Use Template button and made card clickable');

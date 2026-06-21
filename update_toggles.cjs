const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/Settings.jsx',
  'src/pages/settings/ThemeStudioTab.jsx',
  'src/pages/settings/BusinessProfileTab.jsx',
  'src/pages/settings/AdminConsoleTab.jsx',
  'src/pages/SetupBilling.jsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace type 1: className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
  // inner: <span className={`absolute top-1 left-1 bg-theme-card w-4 h-4 rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`} />
  
  content = content.replace(/className=\{`relative w-12 h-6 rounded-full transition-colors duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    // We want to extract what's inside the condition. Usually it's `darkMode ? ... : ...`
    // Let's replace the whole outer string with a premium design
    const boolVar = condition.split('?')[0].trim();
    return `className={\`relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });

  content = content.replace(/className=\{`absolute top-1 left-1 bg-theme-card w-4 h-4 rounded-full transition-transform duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out \${${boolVar} ? 'translate-x-6' : 'translate-x-0'}\`}`;
  });

  // Replace type 2: w-9 h-5 / w-3 h-3
  // outer: className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-theme-accent' : 'bg-slate-350 dark:bg-theme-surface'}`}
  // inner: <div className={`w-3 h-3 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${item.state ? 'left-5' : 'left-1'}`}></div>
  content = content.replace(/className=\{`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0\.5 focus:outline-none \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-9 h-5 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 mt-0.5 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-sm shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });

  content = content.replace(/className=\{`w-3 h-3 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-3 h-3 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out \${${boolVar} ? 'translate-x-4' : 'translate-x-0'}\`}`;
  });

  // Replace type 3: w-12 h-6 / w-4 h-4 (AdminConsole, SetupBilling, Settings left-7/left-1 pattern)
  // outer: <button type="button" onClick={() => ...} className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${paymentQrEnabled ? 'bg-theme-accent' : 'bg-slate-350 dark:bg-theme-surface'}`}>
  // inner: <div className={`w-4 h-4 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${paymentQrEnabled ? 'left-7' : 'left-1'}`}></div>
  content = content.replace(/className=\{`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-12 h-6 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });
  content = content.replace(/className=\{`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 mt-0\.5 focus:outline-none \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-12 h-6 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 mt-0.5 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });

  content = content.replace(/className=\{`w-4 h-4 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out \${${boolVar} ? 'translate-x-6' : 'translate-x-0'}\`}`;
  });

  // SetupBilling.jsx: w-10 h-5 / w-3.5 h-3.5
  content = content.replace(/className=\{`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-10 h-5 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-0.5 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-sm shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });
  content = content.replace(/className=\{`w-3\.5 h-3\.5 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-4 h-4 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out \${${boolVar} ? 'translate-x-5' : 'translate-x-0'}\`}`;
  });
  
  // AdminConsoleTab.jsx: w-10 h-5 / w-3.5 h-3.5 absolute top-0.5 left-6 / left-0.5
  content = content.replace(/className=\{`w-10 h-5 rounded-full relative transition-colors duration-300 shrink-0 focus:outline-none \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-10 h-5 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-0.5 shrink-0 focus:outline-none \${${boolVar} ? 'bg-[image:var(--accent-gradient)] shadow-sm shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}\`}`;
  });
  content = content.replace(/className=\{`w-3\.5 h-3\.5 bg-theme-card dark:bg-theme-card rounded-full absolute top-0\.5 transition-all duration-300 \$\{([^}]+)\}`\}/g, (match, condition) => {
    const boolVar = condition.split('?')[0].trim();
    return `className={\`w-4 h-4 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out \${${boolVar} ? 'translate-x-5' : 'translate-x-0'}\`}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});

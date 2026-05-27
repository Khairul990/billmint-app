const fs = require('fs');
const path = require('path');

const replacements = {
  // CreateInvoice.jsx
  'hover:bg-indigo-700': 'hover:opacity-90',
  'bg-gradient-to-br from-teal-400 to-emerald-500': 'bg-[image:var(--accent-gradient)] text-theme-button-text',
  'border-teal-400': 'border-theme-accent',
  'shadow-teal-500/30': 'shadow-theme-glow',
  'focus:ring-teal-500/30': 'focus:ring-theme-accent/30',
  'hover:border-indigo-400': 'hover:border-theme-accent',
  
  // Dashboard.jsx
  'dark:border-emerald-900/50': 'dark:border-theme-accent/20',
  'dark:bg-emerald-900/50': 'dark:bg-theme-accent/20',
  
  // App.jsx
  'border-teal-500': 'border-theme-accent',
  'text-indigo-400': 'text-theme-accent'
};

const srcDir = path.join(__dirname, 'src');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [search, replace] of Object.entries(replacements)) {
        if (content.includes(search)) {
          content = content.split(search).join(replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log('Done.');

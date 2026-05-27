const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const regexReplacements = [
  // Gradients
  { regex: /from-emerald-\d+ to-cyan-\d+/g, replace: 'bg-[image:var(--accent-gradient)]' },
  { regex: /from-blue-\d+ to-cyan-\d+/g, replace: 'bg-[image:var(--accent-gradient)]' },
  { regex: /from-teal-\d+ to-emerald-\d+/g, replace: 'bg-[image:var(--accent-gradient)]' },
  { regex: /bg-gradient-to-[a-z]+ bg-\[image:var\(--accent-gradient\)\]/g, replace: 'bg-[image:var(--accent-gradient)]' },
  
  // Emerald / Cyan / Teal / Blue standard classes
  { regex: /bg-emerald-(300|400|500)\/(10|15|20|25|35|45)/g, replace: 'bg-theme-accent-light' },
  { regex: /bg-emerald-300\/\[[0-9.]+\]/g, replace: 'bg-theme-accent-light' },
  { regex: /bg-(emerald|cyan|teal|blue)-(300|400|500)/g, replace: 'bg-theme-accent' },
  { regex: /text-(emerald|cyan|teal|blue)-(300|400|500)/g, replace: 'text-theme-accent' },
  { regex: /border-(emerald|cyan|teal|blue)-(300|400|500)\/(10|15|20|25|30)/g, replace: 'border-theme-border-soft' },
  { regex: /border-(emerald|cyan|teal|blue)-(300|400|500)/g, replace: 'border-theme-accent' },
  { regex: /shadow-(emerald|cyan|teal|blue)-(300|400|500)\/(20|25|30|40)/g, replace: 'shadow-theme-glow' },
  
  // Custom shadows
  { regex: /shadow-\[0_18px_45px_rgba\(16,185,129,0\.22\)\]/g, replace: 'shadow-theme-glow' },
  { regex: /shadow-\[0_0_12px_rgba\(110,231,183,0\.9\)\]/g, replace: 'shadow-theme-glow' },
  
  // Clean up double classes
  { regex: /shadow-lg shadow-lg shadow-lg shadow-glow/g, replace: 'shadow-glow' },
  { regex: /shadow-lg shadow-lg shadow-glow/g, replace: 'shadow-glow' },
  { regex: /shadow-xl shadow-lg shadow-glow/g, replace: 'shadow-glow' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Specifically fix Sidebar hardcoded white if processing Sidebar.jsx
      if (file === 'Sidebar.jsx') {
        content = content.replace(/forceWhiteText={true}/g, 'forceWhiteText={false}');
        content = content.replace(/text-white truncate/g, 'text-theme-sidebar-text truncate');
        content = content.replace(/border border-white\/5/g, 'border border-theme-border-soft');
        content = content.replace(/bg-theme-card\/5/g, 'bg-theme-accent-light/10');
        modified = true;
      }
      
      for (const { regex, replace } of regexReplacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
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

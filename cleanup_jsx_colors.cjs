const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Replace dark:hover:bg-indigo-950/X, dark:bg-indigo-950/X, dark:hover:bg-blue-950/X with dark:hover:bg-theme-accent-light
      content = content.replace(/dark:hover:bg-(?:indigo|blue|purple|pink)-950\/\d+/g, 'dark:hover:bg-theme-accent-light');
      content = content.replace(/dark:bg-(?:indigo|blue|purple|pink)-950\/\d+/g, 'dark:bg-theme-accent-light');
      
      // Replace remaining bg-indigo-950/30 or similar with bg-theme-accent-light
      content = content.replace(/bg-(?:indigo|blue|purple)-950\/\d+/g, 'bg-theme-accent-light');
      content = content.replace(/bg-indigo-950(?![\/\w])/g, 'bg-theme-accent-dark');
      
      // Fix bKash? Actually bKash is pink, so maybe leave it.
      
      // In Subscription.jsx: bg-pink-500/10 -> bg-theme-accent-light, text-pink-500 -> text-theme-accent
      if (file === 'Subscription.jsx') {
        content = content.replace(/bg-pink-500\/10/g, 'bg-theme-accent-light');
        content = content.replace(/border-pink-500\/20/g, 'border-theme-accent/20');
        content = content.replace(/text-pink-500/g, 'text-theme-accent');
        
        content = content.replace(/bg-purple-500\/10/g, 'bg-theme-accent-light');
        content = content.replace(/border-purple-500\/20/g, 'border-theme-accent/20');
        content = content.replace(/text-purple-500/g, 'text-theme-accent');
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up ${file}`);
      }
    }
  }
}

processDir('e:/Billmint/src');
console.log('Component cleanup completed.');

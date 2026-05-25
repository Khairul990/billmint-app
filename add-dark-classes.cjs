const fs = require('fs');
const path = require('path');

const directories = ['src/pages', 'src/components'];

const replacements = [
  { regex: /bg-white(?! dark:bg-slate-900)/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /text-slate-800(?! dark:text-slate-100)/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { regex: /bg-slate-50(?! dark:bg-slate-800\/50)/g, replacement: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /border-slate-100(?! dark:border-slate-800)/g, replacement: 'border-slate-100 dark:border-slate-800' },
  { regex: /text-slate-700(?! dark:text-slate-300)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-900(?! dark:text-white)/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /bg-slate-100(?! dark:bg-slate-800)/g, replacement: 'bg-slate-100 dark:bg-slate-800' }
];

function processDirectory(dirPath) {
  const fullPath = path.resolve(__dirname, dirPath);
  if (!fs.existsSync(fullPath)) return;

  const files = fs.readdirSync(fullPath);
  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(path.join(dirPath, file));
    } else if (filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let updated = content;
      for (const rule of replacements) {
        updated = updated.replace(rule.regex, rule.replacement);
      }
      if (updated !== content) {
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

directories.forEach(processDirectory);
console.log("Dark mode classes added to all components.");

const fs = require('fs');
const path = require('path');

const replacements = [
  // Guide.jsx
  { regex: /bg-blue-600/g, replace: 'bg-theme-accent' },
  { regex: /bg-teal-600/g, replace: 'bg-theme-accent' },
  { regex: /bg-teal-200/g, replace: 'bg-theme-accent-light' },
  { regex: /border-emerald-200/g, replace: 'border-theme-border-soft' },
  { regex: /bg-teal-600\/30 border border-theme-accent\/50 hover:bg-teal-600\/50/g, replace: 'bg-[image:var(--accent-gradient)] border-0 hover:opacity-90' },
  
  // Login.jsx
  { regex: /hover:text-emerald-200/g, replace: 'hover:text-theme-accent' },
  { regex: /border-emerald-200\/25/g, replace: 'border-theme-border-soft' },
  { regex: /via-emerald-300\/18 to-cyan-300\/12/g, replace: 'via-theme-accent/10 to-transparent' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  for (const { regex, replace } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replace);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

processFile(path.join(__dirname, 'src', 'pages', 'Guide.jsx'));
processFile(path.join(__dirname, 'src', 'pages', 'Expenses.jsx'));
processFile(path.join(__dirname, 'src', 'pages', 'Login.jsx'));

console.log('Final cleanup done.');

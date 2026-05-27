const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Login.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { regex: /bg-\[#030914\]/g, replace: 'bg-theme-app' },
  { regex: /bg-\[#07101d\]/g, replace: 'bg-theme-surface' },
  { regex: /bg-\[#0e1520\]/g, replace: 'bg-theme-app/50' },
  { regex: /bg-\[#0b1420\]/g, replace: 'bg-theme-surface/80' },
  { regex: /bg-\[#0b1728\]/g, replace: 'bg-theme-surface' },
  { regex: /bg-\[#080f1c\]/g, replace: 'bg-theme-surface' },
  { regex: /bg-\[#060b14\]/g, replace: 'bg-theme-card' },
  { regex: /border-white\/10/g, replace: 'border-theme-border-soft' },
  { regex: /border-white\/5/g, replace: 'border-theme-border-soft/40' },
  { regex: /text-white/g, replace: 'text-theme-primary' },
  { regex: /text-slate-200/g, replace: 'text-theme-primary' },
  { regex: /bg-theme-card\/\[0\.0[0-9]+\]/g, replace: 'bg-theme-surface' },
  { regex: /bg-theme-app\/[457]5/g, replace: 'bg-theme-card' },
];

replacements.forEach(({ regex, replace }) => {
  content = content.replace(regex, replace);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Login.jsx showcase colors updated successfully.');

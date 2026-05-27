const fs = require('fs');

const themes = [
  { id: 'pink', name: 'Pink Premium', p: '#10122B', a: '#EC4899', a2: '#FB7185', lb: '#FFF7FB', ls: '#FCE7F3', lc: '#FFFFFF', lt: '#21111D', db: '#07081C', ds: '#151735', dc: '#10122B', dt: '#FFF7FB' },
  { id: 'indigo', name: 'Royal Indigo', p: '#312E81', a: '#5B34D6', a2: '#7C3AED', lb: '#F5F3FF', ls: '#EDE9FE', lc: '#FFFFFF', lt: '#1E1B4B', db: '#080712', ds: '#141026', dc: '#1D1638', dt: '#F8F7FF' },
  { id: 'emerald', name: 'Emerald Business', p: '#12372A', a: '#059669', a2: '#34D399', lb: '#F4FBF8', ls: '#DCFCE7', lc: '#FFFFFF', lt: '#12372A', db: '#071A14', ds: '#0D241C', dc: '#12372A', dt: '#ECFDF5' },
  { id: 'rose', name: 'Rose Gold Luxe', p: '#3A1F1A', a: '#F43F5E', a2: '#D4A44A', lb: '#FFF8F2', ls: '#FFE4E6', lc: '#FFFFFF', lt: '#2A1714', db: '#150B08', ds: '#281611', dc: '#20110D', dt: '#FFF7ED' },
  { id: 'midnight', name: 'Midnight Blue', p: '#081A35', a: '#2563EB', a2: '#38BDF8', lb: '#F5FAFF', ls: '#DBEAFE', lc: '#FFFFFF', lt: '#081A35', db: '#06101F', ds: '#0B1B35', dc: '#081A35', dt: '#F5FAFF' },
  { id: 'champagne', name: 'Champagne Black', p: '#1E1A15', a: '#D6A84F', a2: '#F97316', lb: '#FFFCF4', ls: '#FEF3C7', lc: '#FFFFFF', lt: '#241D12', db: '#100E0B', ds: '#211B12', dc: '#1A1510', dt: '#FFFBEB' },
  { id: 'ruby', name: 'Ruby Burgundy', p: '#2B1220', a: '#BE185D', a2: '#7C2D12', lb: '#FFF8FA', ls: '#FCE7F0', lc: '#FFFFFF', lt: '#2B1220', db: '#14070E', ds: '#22101A', dc: '#2B1220', dt: '#FFF7FB' }
];

let css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');\n\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml {\n  font-size: 14px;\n}\n\n@layer base {\n`;

function hexToRgbStr(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

themes.forEach((t, index) => {
  const isDefault = t.id === 'pink';
  const lightSelector = isDefault ? `:root, [data-theme="${t.id}"]` : `[data-theme="${t.id}"]`;
  const darkSelector = isDefault ? `.dark, .dark[data-theme="${t.id}"], [data-theme="${t.id}"].dark` : `.dark[data-theme="${t.id}"]`;
  const accentRgb = hexToRgbStr(t.a);
  css += `  /* ${index + 1}. ${t.name} */\n  ${lightSelector} {\n    --app-bg: ${t.lb};\n    --app-bg-soft: ${t.ls};\n    --surface: ${t.lc};\n    --surface-elevated: ${t.lc};\n    --card-bg: ${t.lc};\n    \n    --text-primary: ${t.lt};\n    --text-secondary: ${t.p};\n    --text-muted: ${t.p};\n    --button-text: #FFFFFF;\n    \n    --border-soft: rgba(${accentRgb}, 0.15);\n    --border-strong: rgba(${accentRgb}, 0.3);\n    \n    --accent: ${t.a};\n    --accent-light: rgba(${accentRgb}, 0.08);\n    --accent-dark: ${t.p};\n    --accent-gradient: linear-gradient(135deg, ${t.a}, ${t.a2});\n    --accent-glow: rgba(${accentRgb}, 0.25);\n    \n    --sidebar-bg: ${t.lb};\n    --sidebar-active: rgba(${accentRgb}, 0.1);\n    --sidebar-text: ${t.lt};\n    \n    --input-bg: ${t.lc};\n    --chart-primary: ${t.a};\n    \n    --status-success: #10B981;\n    --status-warning: #F59E0B;\n    --status-danger: #EF4444;\n  }\n  \n  ${darkSelector} {\n    --app-bg: ${t.db};\n    --app-bg-soft: ${t.ds};\n    --surface: ${t.db};\n    --surface-elevated: ${t.ds};\n    --card-bg: ${t.dc};\n    \n    --text-primary: ${t.dt};\n    --text-secondary: ${t.dt};\n    --text-muted: rgba(255, 255, 255, 0.5);\n    --button-text: #FFFFFF;\n    \n    --border-soft: rgba(${accentRgb}, 0.15);\n    --border-strong: rgba(${accentRgb}, 0.3);\n    \n    --accent: ${t.a};\n    --accent-light: rgba(${accentRgb}, 0.15);\n    --accent-dark: ${t.a2};\n    --accent-gradient: linear-gradient(135deg, ${t.a}, ${t.a2});\n    --accent-glow: rgba(${accentRgb}, 0.3);\n    \n    --sidebar-bg: ${t.db};\n    --sidebar-active: rgba(${accentRgb}, 0.15);\n    --sidebar-text: ${t.dt};\n    \n    --input-bg: ${t.dc};\n    --chart-primary: ${t.a2};\n    \n    --status-success: #10B981;\n    --status-warning: #F59E0B;\n    --status-danger: #EF4444;\n  }\n\n`;
});

css += `  body {\n    @apply bg-theme-app text-theme-primary font-sans antialiased overflow-x-hidden transition-colors duration-500;\n    -webkit-tap-highlight-color: transparent;\n  }\n}\n\n/* Custom scrollbars */\n::-webkit-scrollbar {\n  width: 6px;\n  height: 6px;\n}\n::-webkit-scrollbar-track {\n  background: transparent;\n}\n::-webkit-scrollbar-thumb {\n  background: var(--border-strong, #cbd5e1);\n  border-radius: 10px;\n  transition: background 0.3s ease;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: var(--accent, #94a3b8);\n}\n`;

fs.writeFileSync('src/index.css', css);
console.log('index.css generated successfully!');

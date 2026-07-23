const fs = require('fs');
const file = 'd:/Khair_Murafiq_Empire/BillQyro/src/index.css';
let css = fs.readFileSync(file, 'utf8');

// Remove old broken block
const startIdx = css.indexOf('/* Premium Themes with Light/Dark Modes */');
if (startIdx > -1) {
  css = css.substring(0, startIdx);
}

const THEMES = {
  'obsidian-black': { h: '#1A1A1A', a: '#0C0C0C', lb: '#F1F5F9', ls: '#FFFFFF', lc: '#FFFFFF', lt: '#0F172A', db: '#0C0C0C', ds: '#121212', dc: '#1A1A1A', dt: '#F9FAFB' },
  'wine-ash': { h: '#4A3A45', a: '#32292F', lb: '#F5F1F3', ls: '#FFFFFF', lc: '#FCFAFB', lt: '#2B1D28', db: '#2B2329', ds: '#32292F', dc: '#3E333A', dt: '#F9FAFB' },
  'sunlit-yellow': { h: '#E6B01C', a: '#FFC72C', lb: '#FFFDF0', ls: '#FFFFFF', lc: '#FFFEFA', lt: '#3D2D0B', db: '#141100', ds: '#1F1900', dc: '#2E2500', dt: '#F9FAFB' },
  'turquoise': { h: '#158F87', a: '#1CA69D', lb: '#F0FBF9', ls: '#FFFFFF', lc: '#FAFEFD', lt: '#0F3D39', db: '#0A1C1A', ds: '#0F2624', dc: '#153633', dt: '#F9FAFB' },
  'midnight-blue-premium': { h: '#274D91', a: '#102552', lb: '#F1F5F9', ls: '#FFFFFF', lc: '#F8FAFC', lt: '#0F172A', db: '#0A1224', ds: '#102552', dc: '#163169', dt: '#F9FAFB' },
  'jet-black': { h: '#333333', a: '#1D1D1D', lb: '#F5F5F5', ls: '#FFFFFF', lc: '#FAFAFA', lt: '#111111', db: '#141414', ds: '#1D1D1D', dc: '#262626', dt: '#F9FAFB' },
  'orchid': { h: '#945F8E', a: '#C77EB5', lb: '#FDF5FA', ls: '#FFFFFF', lc: '#FEFAFD', lt: '#3D2235', db: '#2B1D28', ds: '#382534', dc: '#4A3144', dt: '#F9FAFB' },
  'blush-onyx': { h: '#333333', a: '#0D0D0D', lb: '#FAFAFA', ls: '#FFFFFF', lc: '#FDFBFB', lt: '#1C1C1C', db: '#0D0D0D', ds: '#141414', dc: '#1C1C1C', dt: '#F9FAFB' },
  'violet-slate': { h: '#4C1935', a: '#2B0D1E', lb: '#F7F8FA', ls: '#FFFFFF', lc: '#FCFCFD', lt: '#1E1218', db: '#2B0D1E', ds: '#381227', dc: '#4C1935', dt: '#F9FAFB' }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

let append = '  /* Premium Themes with Light/Dark Modes */\n';
for (const [id, t] of Object.entries(THEMES)) {
  const rgb = hexToRgb(t.a);
  const rgba = (a) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
  
  append += `  [data-theme="${id}"] {
    --app-bg: ${t.lb};
    --app-bg-soft: ${t.lc};
    --surface: ${t.ls};
    --surface-elevated: ${t.ls};
    --card-bg: ${t.lc};
    --text-primary: ${t.lt};
    --text-secondary: ${t.lt};
    --text-muted: ${t.lt}99;
    --button-text: #FFFFFF;
    --border-soft: ${rgba(0.15)};
    --border-strong: ${rgba(0.3)};
    --accent: ${t.a};
    --accent-light: ${rgba(0.1)};
    --accent-dark: ${t.h};
    --accent-gradient: linear-gradient(135deg, ${t.h}, ${t.a});
    --accent-glow: ${rgba(0.25)};
    --sidebar-bg: ${t.lc};
    --sidebar-active: ${rgba(0.1)};
    --sidebar-text: ${t.lt};
    --input-bg: ${t.ls};
    --chart-primary: ${t.h};
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }\n`;

  append += `  .dark[data-theme="${id}"], [data-theme="${id}"].dark {
    --app-bg: ${t.db};
    --app-bg-soft: ${t.ds};
    --surface: ${t.ds};
    --surface-elevated: ${t.dc};
    --card-bg: ${t.dc};
    --text-primary: ${t.dt};
    --text-secondary: ${t.dt}dd;
    --text-muted: ${t.dt}99;
    --button-text: #000000;
    --border-soft: ${rgba(0.15)};
    --border-strong: ${rgba(0.3)};
    --accent: ${t.a};
    --accent-light: ${rgba(0.1)};
    --accent-dark: ${t.h};
    --accent-gradient: linear-gradient(135deg, ${t.a}, ${t.h});
    --accent-glow: ${rgba(0.25)};
    --sidebar-bg: ${t.db};
    --sidebar-active: ${rgba(0.1)};
    --sidebar-text: ${t.dt};
    --input-bg: ${t.ds};
    --chart-primary: ${t.a};
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }\n`;
}
fs.writeFileSync(file, css + append);
console.log('Fixed index.css');

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const oldPinkBlock = `  /* 1. Pink Premium */
  :root, [data-theme="pink"] {
    --app-bg: #FAEDF0;
    --app-bg-soft: #FDE8EF;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    
    --text-primary: #1C0A14;
    --text-secondary: #4A2B3C;
    --text-muted: #825D71;
    --button-text: #FFFFFF;
    
    --border-soft: rgba(236, 72, 153, 0.15);
    --border-strong: rgba(236, 72, 153, 0.3);
    
    --accent: #EC4899;
    --accent-light: rgba(236, 72, 153, 0.1);
    --accent-dark: #BE185D;
    --accent-gradient: linear-gradient(135deg, #EC4899, #8B5CF6);
    --accent-glow: rgba(236, 72, 153, 0.3);
    
    --sidebar-bg: #1E122A;
    --sidebar-active: rgba(236, 72, 153, 0.15);
    --sidebar-text: #FFFFFF;
    
    --input-bg: #FFFFFF;
    --chart-primary: #EC4899;
    
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }`;

const newPinkBlock = `  /* 1. Pink Premium */
  :root, [data-theme="pink"] {
    --app-bg: #FFF9FA; /* warm ivory / soft white */
    --app-bg-soft: #FCE8F0; /* soft blush pink */
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    
    --text-primary: #2D1A25; /* dark charcoal / dark plum */
    --text-secondary: #5A3A4A; /* cocoa / slate-brown */
    --text-muted: #8F7281; /* readable warm gray, not too light */
    --button-text: #FFFFFF;
    
    --border-soft: rgba(225, 29, 72, 0.15); /* very soft rose-gray */
    --border-strong: rgba(225, 29, 72, 0.3);
    
    --accent: #E11D48; /* rose pink */
    --accent-light: rgba(225, 29, 72, 0.08); /* very light pink */
    --accent-dark: #BE123C;
    --accent-gradient: linear-gradient(135deg, #E11D48, #F472B6); /* rose pink to soft blush pink */
    --accent-glow: rgba(225, 29, 72, 0.25); /* very subtle pink glow */
    
    --sidebar-bg: #FFF9FA; /* soft white/ivory */
    --sidebar-active: rgba(225, 29, 72, 0.1);
    --sidebar-text: #2D1A25; /* dark and readable */
    
    --input-bg: #FFFFFF;
    --chart-primary: #E11D48;
    
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }`;

if (cssContent.includes(oldPinkBlock)) {
  cssContent = cssContent.replace(oldPinkBlock, newPinkBlock);
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('Updated index.css');
} else {
  console.log('Could not find oldPinkBlock in index.css');
}

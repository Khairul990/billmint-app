const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

const navCode = `setCurrentTab={(tab) => {
  const map = {
    'themes': 'appearance',
    'pdf-templates': 'pdf-studio',
    'live-link-templates': 'livelink-studio',
    'marketplace': 'template-studio',
    'settings': 'general',
    'dashboard': 'dashboard'
  };
  if (tab === 'dashboard') {
    if (setCurrentTab) setCurrentTab('dashboard');
  } else {
    setActiveCategory(map[tab] || 'general');
  }
}} businessSettings={settings} setSettings={onSave}`;

code = code.replace(/<DesignStudio \/>/g, `<DesignStudio ${navCode} />`);
code = code.replace(/<PdfTemplateStudio \/>/g, `<PdfTemplateStudio ${navCode} />`);
code = code.replace(/<LiveLinkTemplateStudio \/>/g, `<LiveLinkTemplateStudio ${navCode} />`);
code = code.replace(/<TemplateMarketplace \/>/g, `<TemplateMarketplace ${navCode} />`);

fs.writeFileSync('src/pages/Settings.jsx', code);
console.log('Added props to studios successfully');

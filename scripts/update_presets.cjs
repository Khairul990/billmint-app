const fs = require('fs');

const oldArrayRegex = /\{\[\s*\{\s*id:\s*'classic'[\s\S]*?\]\.map\(\(preset\)\s*=>\s*\{/g;

const newArray = `{[
                        { id: 'classic', name: 'BillQyro Classic', desc: 'Warm ivory and premium orange for a modern SaaS feel.', colors: ['#1C1917', '#F97316', '#C2410C', '#FCFBF8', '#F4F1E9'] },
                        { id: 'rose', name: 'Rose Gold Luxe', desc: 'Premium luxury aesthetics with rose gold and champagne ivory.', colors: ['#2C1A14', '#B56576', '#E5989B', '#FFFBF9', '#FDF2EE'] },
                        { id: 'ocean', name: 'Ocean Mist', desc: 'Modern technology vibes with aqua blue and ice white.', colors: ['#0A2E36', '#0493A6', '#3EBDCC', '#F0F8FA', '#E1F2F5'] },
                        { id: 'emerald', name: 'Emerald Prestige', desc: 'Rich emerald green and mint white for business & finance.', colors: ['#112A1F', '#10B981', '#34D399', '#F2F9F5', '#E2F2E9'] },
                        { id: 'indigo', name: 'Royal Indigo', desc: 'Deep indigo and lavender white for an elegant startup look.', colors: ['#1B1A31', '#4F46E5', '#818CF8', '#F6F6FA', '#EDEDF5'] },
                        { id: 'midnight', name: 'Midnight Platinum', desc: 'Monochrome silver and OLED black inspired by Apple & Notion.', colors: ['#1D1D1F', '#000000', '#434343', '#F5F5F7', '#EBEBEF'] },
                        { id: 'sakura', name: 'Soft Sakura', desc: 'Elegant modern aesthetic with soft pinks and peach white.', colors: ['#3A1B28', '#F472B6', '#F9A8D4', '#FFF5F7', '#FFEAF0'] },
                        { id: 'desert', name: 'Desert Sand', desc: 'Warm earth tones and sand beige for a retail boutique feel.', colors: ['#382C22', '#D4A373', '#E6C2A1', '#FCF9F5', '#F2EBE1'] },
                        { id: 'obsidian', name: 'Obsidian Gold', desc: 'Ultra-premium executive style with obsidian black and royal gold.', colors: ['#0F0F0F', '#D4AF37', '#9E8224', '#F0F0F0', '#E0E0E0'] },
                        { id: 'crimson', name: 'Crimson Executive', desc: 'Corporate leadership aesthetics with wine red and graphite gray.', colors: ['#2C181D', '#8B0000', '#C21807', '#F8F4F5', '#EFE7E9'] }
                      ].map((preset) => {`;

const files = [
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx',
  'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(oldArrayRegex, newArray);
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});

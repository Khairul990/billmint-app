const fs = require('fs');
const glob = require('glob');

const newPresets = `[
                        { id: 'classic', name: 'BillQyro Classic', desc: 'Warm ivory and premium orange for a modern SaaS feel.', colors: ['#FCFBF8', '#FFFFFF', '#F97316'] },
                        { id: 'rose', name: 'Rose Gold Luxe', desc: 'Warm rose and gold accents on dark brown backgrounds.', colors: ['#FFFBF9', '#FFFFFF', '#B56576'] },
                        { id: 'ocean', name: 'Ocean Mist', desc: 'Refreshing blue gradients for a clean, aquatic look.', colors: ['#F4F9F9', '#FFFFFF', '#0493A6'] },
                        { id: 'emerald', name: 'Emerald Elite', desc: 'Rich emerald greens for eco, health, and finance sectors.', colors: ['#F5F9F6', '#FFFFFF', '#10B981'] },
                        { id: 'indigo', name: 'Royal Indigo', desc: 'Deep indigo and vibrant purple for an elegant touch.', colors: ['#F7F7FA', '#FFFFFF', '#6366F1'] },
                        { id: 'midnight', name: 'Midnight Platinum', desc: 'Monochrome silver and slate for an elite corporate vibe.', colors: ['#F8F9FA', '#FFFFFF', '#495057'] },
                        { id: 'sakura', name: 'Soft Sakura', desc: 'Soft pinks and cherry blossom hues for a delicate aesthetic.', colors: ['#FFF5F7', '#FFFFFF', '#F472B6'] },
                        { id: 'arctic', name: 'Arctic Frost', desc: 'Cool grays and frosty blues for a crisp, minimal look.', colors: ['#F4F7FB', '#FFFFFF', '#94A3B8'] },
                        { id: 'desert', name: 'Desert Sand', desc: 'Warm earth tones and desert sands for an organic feel.', colors: ['#FDF9F3', '#FFFFFF', '#D4A373'] },
                        { id: 'lavender', name: 'Lavender Dream', desc: 'Soft lavenders and violet for a creative, dreamy workspace.', colors: ['#F8F5FB', '#FFFFFF', '#A855F7'] }
                      ]`;

const oldPresetsRegex = /\[\s*\{\s*id:\s*'pink'[\s\S]*?\}\s*\]/g;

function fixFiles() {
    const files = [
        'e:/Khair_Murafiq_Empire/BillQyro/src/App.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Landing.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/hooks/useThemeEngine.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/AdminConsoleTab.jsx',
        'e:/Khair_Murafiq_Empire/BillQyro/src/utils/themeIcon.js'
    ];

    files.forEach(file => {
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');

        // Replace old hardcodings
        content = content.replace(/\|\| 'pink'/g, "|| 'classic'");
        content = content.replace(/setAttribute\('data-theme', 'light'\)/g, "setAttribute('data-theme', 'classic')");
        content = content.replace(/setAttribute\('data-theme', 'pink'\)/g, "setAttribute('data-theme', 'classic')");
        content = content.replace(/updateFaviconForTheme\('light'\)/g, "updateFaviconForTheme('classic')");
        content = content.replace(/updateFaviconForTheme\('pink'\)/g, "updateFaviconForTheme('classic')");
        content = content.replace(/setThemeColor\('blue'\)/g, "setThemeColor('classic')");
        content = content.replace(/themePreset: 'blue'/g, "themePreset: 'classic'");
        content = content.replace(/themeColor: 'blue'/g, "themeColor: 'classic'");
        content = content.replace(/useState\('light'\)/g, "useState('classic')");
        content = content.replace(/useState\('pink'\)/g, "useState('classic')");

        // Options dropdown in AdminConsoleTab / Settings
        content = content.replace(/<option value="pink">Pink Premium<\/option>/g, '<option value="classic">BillQyro Classic</option>');

        // Replace old preset array
        if (content.match(oldPresetsRegex)) {
            content = content.replace(oldPresetsRegex, newPresets);
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    });
}

fixFiles();

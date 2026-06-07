const fs = require('fs');

const filesToUpdate = [
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx'
];

for (const path of filesToUpdate) {
    let content = fs.readFileSync(path, 'utf8');

    // Remove old definition if it exists
    const funcRegex = /const getThemePreviewColors = \(preset\) => \{[\s\S]*?return themes\[preset\] \|\| themes\.[a-z]+;\s*\};\r?\n/g;
    content = content.replace(funcRegex, '');

    // Add import at the top if not exists
    if (!content.includes('import { getThemePreviewColors }')) {
        // Find the last import statement
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const nextNewLine = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, nextNewLine + 1) + "import { getThemePreviewColors } from '../utils/themeUtils';\n" + content.slice(nextNewLine + 1);
        } else {
            content = "import { getThemePreviewColors } from '../utils/themeUtils';\n" + content;
        }
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${path}`);
}

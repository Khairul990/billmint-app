const fs = require('fs');

const filesToUpdate = [
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/ThemeStudioTab.jsx',
    'e:/Khair_Murafiq_Empire/BillQyro/src/pages/settings/BusinessProfileTab.jsx'
];

for (const path of filesToUpdate) {
    let content = fs.readFileSync(path, 'utf8');

    // Remove the misplaced import
    content = content.replace("import { getThemePreviewColors } from '../utils/themeUtils';\n", "");
    content = content.replace("import { getThemePreviewColors } from '../utils/themeUtils';", "");

    // Find the end of the last valid top-level import statement
    const lines = content.split('\n');
    let lastImportLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportLineIndex = i;
        } else if (lines[i].trim() !== '' && !lines[i].trim().startsWith('import ') && lastImportLineIndex !== -1) {
            break;
        }
    }

    if (lastImportLineIndex !== -1) {
        lines.splice(lastImportLineIndex + 1, 0, "import { getThemePreviewColors } from '../utils/themeUtils';");
    } else {
        lines.unshift("import { getThemePreviewColors } from '../utils/themeUtils';");
    }
    
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log(`Updated ${path}`);
}

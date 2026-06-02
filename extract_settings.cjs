const fs = require('fs');

const code = fs.readFileSync('src/pages/Settings.jsx', 'utf8');
const lines = code.split('\n');

const extractAndClean = (blocks) => {
  let content = blocks.map(([start, end]) => lines.slice(start, end).join('\n')).join('\n');
  content = content.replace(/\{activeTab === '[a-z_]+' && \(/g, '');
  content = content.replace(/^\s*\)\}\s*$/gm, '');
  return content;
};

// ThemeStudioTab
const tsCode = extractAndClean([[995, 1282], [1762, 1795]]);
fs.writeFileSync('src/pages/settings/ThemeStudioTab.jsx', 
  `import React from 'react';\nimport { Palette, CheckCircle2, Monitor, Laptop2, Sparkles } from 'lucide-react';\n\nconst ThemeStudioTab = (props) => {\n  const { themeColor, setThemeColor, darkMode, setDarkMode, brandColor, setBrandColor, pdfVisibleFields, setPdfVisibleFields } = props;\n\n  return (\n    <>\n${tsCode}\n    </>\n  );\n};\n\nexport default ThemeStudioTab;`
);

// AdminConsoleTab
const acCode = extractAndClean([[1914, 2649]]);
fs.writeFileSync('src/pages/settings/AdminConsoleTab.jsx', 
  `import React from 'react';\nimport { ShieldAlert, Users, TrendingUp, CheckCircle, XCircle, Eye, Settings as SettingsIcon, CloudLightning } from 'lucide-react';\n\nconst AdminConsoleTab = (props) => {\n  const { adminSubTab, setAdminSubTab, loadingAdminData, adminUsers, adminRequests, handleForceSync, globalSettings, adminGlobalTheme, setAdminGlobalTheme, adminGlobalMode, setAdminGlobalMode, updateGlobalAdminSettings, setSelectedScreenshot, setShowRejectionModalFor, rejectionReasonInput, setRejectionReasonInput, handleConfirmRejectRequest } = props;\n\n  return (\n    <>\n${acCode}\n    </>\n  );\n};\n\nexport default AdminConsoleTab;`
);

// DataBackupTab
const dbCode = extractAndClean([[1799, 1913]]); // Data backup tab and PWA install tab
fs.writeFileSync('src/pages/settings/DataBackupTab.jsx', 
  `import React from 'react';\nimport { Database, Download, Upload, Trash2, ShieldAlert, Smartphone, Laptop, RefreshCw } from 'lucide-react';\n\nconst DataBackupTab = (props) => {\n  const { handleExportData, handleImportData, dbProvider, handleSetDbProvider, handleGranularWipe, handleResetData, storageInfo } = props;\n\n  return (\n    <>\n${dbCode}\n    </>\n  );\n};\n\nexport default DataBackupTab;`
);

console.log('Extraction complete.');

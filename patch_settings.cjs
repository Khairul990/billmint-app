const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

// 1. Fix globalSettings
code = code.replace(
  "const [adminGlobalMode, setAdminGlobalMode] = useState('light');",
  "const [adminGlobalMode, setAdminGlobalMode] = useState('light');\n  const [globalSettings, setGlobalSettings] = useState(null);"
);

code = code.replace(
  "const [users, requests, globalSettings] = await Promise.all([",
  "const [users, requests, fetchedGlobalSettings] = await Promise.all(["
);

code = code.replace(
  "if (globalSettings) {",
  "if (fetchedGlobalSettings) {\n        setGlobalSettings(fetchedGlobalSettings);"
);

code = code.replace(
  "if (globalSettings.defaultTheme) setAdminGlobalTheme(globalSettings.defaultTheme);",
  "if (fetchedGlobalSettings.defaultTheme) setAdminGlobalTheme(fetchedGlobalSettings.defaultTheme);"
);

code = code.replace(
  "if (globalSettings.defaultMode) setAdminGlobalMode(globalSettings.defaultMode);",
  "if (fetchedGlobalSettings.defaultMode) setAdminGlobalMode(fetchedGlobalSettings.defaultMode);"
);

// 2. Add handleExportData & handleImportData
const targetFuncs = `  const handleForceSync = () => {`;
const insertFuncs = `  const handleExportData = async () => {
    try {
      await exportBackup();
      toast.success('Backup exported successfully');
    } catch (e) {
      toast.error('Failed to export backup');
    }
  };

  const handleImportData = async (e) => {
    toast.error('Import is not fully implemented in this view yet.');
  };

  const handleForceSync = () => {`;

code = code.replace(targetFuncs, insertFuncs);

fs.writeFileSync('src/pages/Settings.jsx', code);
console.log('Settings.jsx successfully patched!');

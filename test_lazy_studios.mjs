const studios = [
  './src/pages/studios/BusinessStudio.jsx',
  './src/pages/studios/ThemeStudio.jsx',
  './src/pages/studios/InvoiceStudio.jsx',
  './src/pages/studios/FormBuilder.jsx',
  './src/pages/studios/PortalStudio.jsx',
  './src/pages/studios/DashboardStudio.jsx',
  './src/pages/studios/AutomationStudio.jsx',
  './src/pages/studios/RoleStudio.jsx',
  './src/pages/studios/DatabaseStudio.jsx',
  './src/pages/studios/SubscriptionStudio.jsx',
  './src/pages/studios/SecurityStudio.jsx',
  './src/pages/studios/BackupStudio.jsx',
  './src/pages/studios/LocalizationStudio.jsx',
  './src/pages/studios/NotificationStudio.jsx',
  './src/pages/studios/FeatureControlStudio.jsx'
];

async function testAll() {
  for (const studioPath of studios) {
    try {
      const mod = await import(studioPath);
      if (!mod.default) {
        console.error(`❌ NO DEFAULT EXPORT IN: ${studioPath}`);
      } else {
        console.log(`✅ ${studioPath} exported default: ${typeof mod.default}`);
      }
    } catch (err) {
      console.error(`❌ IMPORT FAILED FOR ${studioPath}:`, err.message);
    }
  }
}

testAll();

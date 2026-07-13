const fs = require('fs');

const services = [
  'themeEngine.js',
  'subscriptionEngine.js',
  'settingsEngine.js',
  'searchEngine.js',
  'roleEngine.js',
  'productEngine.js',
  'portalEngine.js',
  'paymentEngine.js',
  'migrationEngine.js',
  'expenseEngine.js',
  'automationEngine.js',
  'auditEngine.js',
  'analyticsEngine.js',
  'activityEngine.js'
];

for (const file of services) {
  const path = 'src/services/' + file;
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import\s*\{\s*dbEngine(,\s*[^}]*)?\s*\}\s*from\s*'\.\/dbEngine';/, (match, p1) => {
    if (p1) {
      return `import * as dbEngine from './dbEngine';\nimport {${p1} } from './dbEngine';`;
    }
    return `import * as dbEngine from './dbEngine';`;
  });
  fs.writeFileSync(path, content);
  console.log('Fixed ' + file);
}

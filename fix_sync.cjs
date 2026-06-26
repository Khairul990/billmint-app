const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'dbEngine.js');
let code = fs.readFileSync(filePath, 'utf8');

// Update updateLocalCache
code = code.replace(
  /export const updateLocalCache = \(key, items\) => \{[\s\S]*?localStorage\.setItem\(targetKey, JSON\.stringify\(sorted\)\);\n\};/g,
  `export const updateLocalCache = (key, items) => {
  let targetKey = key;
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    if (key.includes('invoices')) targetKey = 'billqyro_demo_invoices';
    else if (key.includes('customers')) targetKey = 'billqyro_demo_customers';
    else if (key.includes('products')) targetKey = 'billqyro_demo_products';
    else if (key.includes('expenses')) targetKey = 'billqyro_demo_expenses';
    else if (key.includes('settings')) targetKey = 'billqyro_demo_settings';
  } else {
    // Enforce Phase 2 Architecture: localStorage is ONLY for Settings
    if (key !== KEYS.SETTINGS && !key.includes('settings') && !key.includes('platform')) {
      return;
    }
  }

  const sorted = [...items].sort((a,b) => {
    const da = a.createdAt ? new Date(a.createdAt) : 0;
    const db = b.createdAt ? new Date(b.createdAt) : 0;
    return db - da;
  });
  localStorage.setItem(targetKey, JSON.stringify(sorted));
};`
);

// Fix Getters: Remove localStorage fallback at the end of try-catch blocks
const models = ['INVOICES', 'CUSTOMERS', 'PRODUCTS', 'EXPENSES'];

models.forEach(model => {
  const localVar = `const localData = JSON.parse(localStorage.getItem(KEYS.${model})) || [];`;
  const returnLine = `return includeDeleted ? localData : localData.filter(`;
  
  // Regex to match the catch block and the localData fallback
  const regex = new RegExp(`\\} catch\\(e\\) \\{\\}\\s*const localData = JSON\\.parse\\(localStorage\\.getItem\\(KEYS\\.${model}\\)\\) \\|\\| \\[\\];\\s*return includeDeleted \\? localData : localData\\.filter\\([\\s\\S]*?\\);`, 'g');
  
  code = code.replace(regex, `} catch(e) {}\n  return [];`);
});

fs.writeFileSync(filePath, code);
console.log('Successfully refactored dbEngine.js to deprecate localStorage for data models.');

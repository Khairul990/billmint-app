const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// Replace import statement block
content = content.replace(/import\s+\{[\s\S]*?\}\s+from\s+'\.\/services\/dbEngine';/, `import { 
  hasCompletedOnboarding,
  getActiveAnnouncement
} from './services/dbEngine';
import { authEngine } from './services/authEngine';
import { settingsEngine } from './services/settingsEngine';
import { adminEngine } from './services/adminEngine';
import { offlineEngine } from './services/offlineEngine';
import { invoiceEngine } from './services/invoiceEngine';
import { customerEngine } from './services/customerEngine';
import { productEngine } from './services/productEngine';
import { expenseEngine } from './services/expenseEngine';
import { backupEngine } from './services/backupEngine';
import { subscriptionEngine } from './services/subscriptionEngine';
import { paymentEngine } from './services/paymentEngine';
`);

// Methods replacement
const replacements = {
  'getAuthSession()': 'authEngine.getAuthSession()',
  'getAuthSession(': 'authEngine.getAuthSession(',
  'logout()': 'authEngine.logout()',
  'getInvoices()': 'invoiceEngine.getInvoices()',
  'saveInvoice(': 'invoiceEngine.updateInvoice(', // Assuming saveInvoice is basically updateInvoice in the engine
  'deleteInvoice(': 'invoiceEngine.deleteInvoice(',
  'getCustomers()': 'customerEngine.getCustomers()',
  'saveCustomer(': 'customerEngine.saveCustomer(',
  'deleteCustomer(': 'customerEngine.deleteCustomer(',
  'getProducts()': 'productEngine.getProducts()',
  'saveProduct(': 'productEngine.saveProduct(',
  'deleteProduct(': 'productEngine.deleteProduct(',
  'getSettings()': 'settingsEngine.getSettings()',
  'saveSettings(': 'settingsEngine.saveSettings(',
  'resetToDemoData()': 'adminEngine.factoryResetAllData()',
  'initializeStorage()': 'adminEngine.initializeStorage()',
  'getSubscriptionStatus()': 'subscriptionEngine.getSubscriptionDetails()',
  'saveSubscriptionStatus(': 'subscriptionEngine.upgradePlan(',
  'getExpenses()': 'expenseEngine.getExpenses()',
  'saveExpense(': 'expenseEngine.saveExpense(',
  'deleteExpense(': 'expenseEngine.deleteExpense(',
  'getStudents()': 'customerEngine.getCustomers()',
  'saveStudent(': 'customerEngine.saveCustomer(',
  'deleteStudent(': 'customerEngine.deleteCustomer(',
  'importRestore(': 'backupEngine.importRestore(',
  'syncFromFirestore()': 'invoiceEngine.syncFromCloud()',
  'getGlobalAdminSettings()': 'adminEngine.getGlobalAdminSettings()',
  'getUserRevenueState(': 'paymentEngine.getUserRevenueState(',
  'syncOfflineTransactions()': 'offlineEngine.syncNow()',
  'cleanDuplicateDrafts()': 'adminEngine.cleanDuplicateDrafts()',
  'cloudWins(': 'offlineEngine.detectConflict(',
  'hasCompletedOnboarding(': 'authEngine.hasCompletedOnboarding(',
  'isAdminUser(': 'adminEngine.isAdminUser(',
  'getActiveAnnouncement(': 'adminEngine.getActiveAnnouncement(',
  'getRealUserId()': 'authEngine.getRealUserId()',
  'clearAllLocalData()': 'adminEngine.clearAllLocalData()'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

// Special dynamic imports in App.jsx
content = content.replace(/import\('\.\/services\/dbEngine'\)\.then\(\(\{ getInvoiceByPublicToken \}\) => \{[\s\S]*?getInvoiceByPublicToken\(token\)\.then\(\(inv\) => \{/g, 
  "import('./services/invoiceEngine').then(({ invoiceEngine }) => { invoiceEngine.getInvoiceByPublicToken(token).then((inv) => {");

fs.writeFileSync('src/App.jsx', content);
console.log('Done refactoring App.jsx');

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('PHASE 6B: BILLQYRO UNLIKE SIGNATURE DASHBOARD', () => {

  const dashboardPath = path.join(projectRoot, 'src', 'pages', 'Dashboard.jsx');
  assert.ok(fs.existsSync(dashboardPath), 'Dashboard.jsx must exist');
  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

  test('1. Dashboard imports and integrates signature primitives from Phase 6A', () => {
    assert.match(dashboardCode, /import\s*\{[^}]*FinancialValue[^}]*\}\s*from\s*['"]\.\.\/components\/ui\/FinancialValue['"]/, 'Must import FinancialValue');
    assert.match(dashboardCode, /import\s*\{[^}]*FinancialEquation[^}]*\}\s*from\s*['"]\.\.\/components\/ui\/FinancialEquation['"]/, 'Must import FinancialEquation');
    assert.match(dashboardCode, /import\s*\{[^}]*StatusBadge[^}]*\}\s*from\s*['"]\.\.\/components\/ui\/Badge['"]/, 'Must import StatusBadge');
    assert.match(dashboardCode, /import\s*\{[^}]*SignatureSurface[^}]*\}\s*from\s*['"]\.\.\/components\/ui\/Card['"]/, 'Must import SignatureSurface');
    assert.match(dashboardCode, /import\s*\{[^}]*Button[^}]*\}\s*from\s*['"]\.\.\/components\/ui\/Button['"]/, 'Must import Button');
  });

  test('2. Dashboard contains all core signature financial sections', () => {
    assert.ok(dashboardCode.includes('LEVEL 1: EXECUTIVE HEADER'), 'Level 1 Executive Header must exist');
    assert.ok(dashboardCode.includes("TODAY'S BUSINESS SNAPSHOT"), 'Level 2 Business Snapshot & Pulse must exist');
    assert.ok(dashboardCode.includes('Business Money Overview'), 'Level 3 Business Money Command Center must exist');
    assert.ok(dashboardCode.includes('Revenue & Collection Trend'), 'Level 4 Revenue & Collection Intelligence must exist');
    assert.ok(dashboardCode.includes('Money Still to Collect'), 'Level 5 Money Still to Collect must exist');
    assert.ok(dashboardCode.includes('Needs Your Attention'), 'Level 6 Action Required / Attention Center must exist');
    assert.ok(dashboardCode.includes('Sales & Invoice Intelligence'), 'Level 7 Sales & Invoice Intelligence must exist');
    assert.ok(dashboardCode.includes('Expense & Cash Flow'), 'Level 8 Expense & Cash Flow Intelligence must exist');
    assert.ok(dashboardCode.includes('Customer Intelligence'), 'Level 9 Customer Intelligence must exist');
    assert.ok(dashboardCode.includes('Personal Money & Salary'), 'Level 10 Personal Money must exist');
    assert.ok(dashboardCode.includes('Recent Financial Activity'), 'Level 11 Recent Confirmed Financial Activity must exist');
  });

  test('3. Canonical financial terminology & equation architecture', () => {
    assert.ok(dashboardCode.includes('Earlier Due') || dashboardCode.includes('Earlier Balance') || dashboardCode.includes('Earlier'), 'Must include Earlier Due / Balance');
    assert.ok(dashboardCode.includes('This Bill') || dashboardCode.includes('Current Bill'), 'Must include This Bill / Current Bill');
    assert.ok(dashboardCode.includes('Business Money'), 'Must include Business Money');
    assert.ok(dashboardCode.includes('Money Still to Collect'), 'Must include Money Still to Collect');
    assert.match(dashboardCode, /<FinancialEquation/, 'Must render <FinancialEquation> primitive');
  });

  test('4. Quick actions remain directly connected to canonical workflows', () => {
    assert.match(dashboardCode, /setCurrentTab\(['"]create-bill['"]\)/, 'Create bill action routes to create-bill');
    assert.match(dashboardCode, /onOpenCollection/, 'Collect money routes to onOpenCollection');
    assert.match(dashboardCode, /setShowAddCustomerSheet\(true\)/, 'Customer action opens AddCustomerSheet');
  });

  test('5. Workspace isolation strictly preserved', () => {
    assert.match(dashboardCode, /filterByWorkspace\(invoices,\s*activeWsId\)/, 'Invoices must be filtered by activeWsId');
    assert.match(dashboardCode, /filterByWorkspace\(expenses,\s*activeWsId\)/, 'Expenses must be filtered by activeWsId');
    assert.match(dashboardCode, /filterByWorkspace\(customers,\s*activeWsId\)/, 'Customers must be filtered by activeWsId');
    assert.match(dashboardCode, /paymentEngine\.calculateFinancialBuckets/, 'Financial buckets must be computed via paymentEngine');
  });

  test('6. Category personality adaptation integrated', () => {
    assert.match(dashboardCode, /getCategoryExperience/, 'Must consume getCategoryExperience for dynamic labels & hints');
  });

  test('7. Empty business state welcoming screen exists', () => {
    assert.ok(dashboardCode.includes('Your business starts here'), 'Must provide welcoming empty business state');
    assert.ok(dashboardCode.includes('isBusinessEmpty'), 'Must detect empty business state');
  });

  test('8. Responsive layout & typography tokens applied', () => {
    assert.ok(dashboardCode.includes('bq-font-display'), 'Must use bq-font-display for Sora typography');
    assert.ok(dashboardCode.includes('bq-financial-number'), 'Must use bq-financial-number for tabular digits');
    assert.ok(dashboardCode.includes('overflow-x-hidden'), 'Must prevent horizontal overflow');
  });

  test('9. Accessibility standards respected', () => {
    assert.match(dashboardCode, /aria-label="Sync Data"/, 'Icon-only sync button has accessible aria-label');
    assert.match(dashboardCode, /<StatusBadge/, 'Status must use multi-channel StatusBadge');
  });

  test('10. No duplicate payment logic or math changes in Dashboard', () => {
    assert.ok(!dashboardCode.includes('Math.round(total * 100) / 100 + fake'), 'No fake math introduced');
    assert.match(dashboardCode, /calculateCanonicalInvoiceFinancials/, 'Must consume calculateCanonicalInvoiceFinancials');
  });
});

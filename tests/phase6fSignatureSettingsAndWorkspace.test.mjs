import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allocatePayment } from '../src/utils/invoiceMath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('PHASE 6F: BILLQYRO UNLIKE SIGNATURE SETTINGS + MORE + WORKSPACE EXPERIENCE', () => {

  const moreMenuPath = path.join(projectRoot, 'src', 'pages', 'MoreMenu.jsx');
  const studioLayoutPath = path.join(projectRoot, 'src', 'pages', 'studios', 'StudioLayout.jsx');
  const workspaceManagerPath = path.join(projectRoot, 'src', 'pages', 'WorkspaceManager.jsx');

  assert.ok(fs.existsSync(moreMenuPath), 'MoreMenu.jsx must exist');
  assert.ok(fs.existsSync(studioLayoutPath), 'StudioLayout.jsx must exist');
  assert.ok(fs.existsSync(workspaceManagerPath), 'WorkspaceManager.jsx must exist');

  const moreMenuCode = fs.readFileSync(moreMenuPath, 'utf8');
  const studioLayoutCode = fs.readFileSync(studioLayoutPath, 'utf8');
  const workspaceManagerCode = fs.readFileSync(workspaceManagerPath, 'utf8');

  test('1. MoreMenu provides signature command center hierarchy and groups', () => {
    assert.ok(moreMenuCode.includes('Business & Identity'), 'Must have Business & Identity group');
    assert.ok(moreMenuCode.includes('Bills & Financial Intelligence'), 'Must have Bills & Finance group');
    assert.ok(moreMenuCode.includes('System & Cloud Operations'), 'Must have System & Cloud group');
    assert.ok(moreMenuCode.includes('Support & Compliance'), 'Must have Support & Compliance group');
    assert.ok(moreMenuCode.includes('Factory Reset Safe Mode'), 'Must preserve safe factory reset danger zone');
  });

  test('2. MoreMenu displays rich business identity header with cloud status', () => {
    assert.ok(moreMenuCode.includes('activeWorkspaceName'), 'Must render active workspace name');
    assert.ok(moreMenuCode.includes('Cloud Active'), 'Must render cloud active status');
    assert.ok(moreMenuCode.includes('businessName'), 'Must render business name');
    assert.ok(moreMenuCode.includes('ownerName'), 'Must render owner name');
    assert.ok(moreMenuCode.includes('phone'), 'Must render phone identity');
  });

  test('3. MoreMenu integrates alertCount for collection center and pending payments', () => {
    assert.ok(moreMenuCode.includes('Collection Center'), 'Must have Collection Center item');
    assert.ok(moreMenuCode.includes('alertCount={pendingPaymentsCount}'), 'Must pass pending payments count as alert badge');
    assert.ok(moreMenuCode.includes('CreditCard'), 'Must use CreditCard icon for payments');
  });

  test('4. StudioLayout Settings Overview displays active business identity card', () => {
    assert.ok(studioLayoutCode.includes('Active Workspace'), 'Must showcase Active Workspace banner');
    assert.ok(studioLayoutCode.includes('businessName'), 'Must render business name');
    assert.ok(studioLayoutCode.includes('businessType'), 'Must render active category preset');
    assert.ok(studioLayoutCode.includes('Cloud State'), 'Must show Cloud State indicator');
    assert.ok(studioLayoutCode.includes('Storage Guard'), 'Must show Storage Guard indicator');
    assert.ok(studioLayoutCode.includes('Switch Workspace'), 'Must include quick link to Workspace Manager');
  });

  test('5. StudioLayout structures configuration modules into Core and Advanced tiers', () => {
    assert.ok(studioLayoutCode.includes('Core Business Configuration'), 'Must have Core Business Configuration section');
    assert.ok(studioLayoutCode.includes('Advanced Operations & Security'), 'Must have Advanced Operations section');
    assert.ok(studioLayoutCode.includes('STUDIO_ROUTES'), 'Must maintain canonical STUDIO_ROUTES');
  });

  test('6. WorkspaceManager separates ACTIVE BUSINESS and OTHER BUSINESSES clearly', () => {
    assert.ok(workspaceManagerCode.includes('Active Business Workspace'), 'Must have distinct Active Business section');
    assert.ok(workspaceManagerCode.includes('Other Business Workspaces'), 'Must have distinct Other Business section');
    assert.ok(workspaceManagerCode.includes('Current Active'), 'Must display Current Active badge');
  });

  test('7. WorkspaceManager enforces workspace safety and prevents archiving active workspace', () => {
    assert.ok(
      workspaceManagerCode.includes('Cannot archive the currently active workspace'),
      'Must guard active workspace against accidental archiving'
    );
    assert.ok(workspaceManagerCode.includes('activeWorkspaceId'), 'Must maintain activeWorkspaceId');
    assert.ok(workspaceManagerCode.includes('BUSINESS_PRESETS'), 'Must utilize canonical BUSINESS_PRESETS');
  });

  test('8. WorkspaceManager supports one-click workspace switching', () => {
    assert.ok(workspaceManagerCode.includes('handleSwitchWorkspace'), 'Must implement handleSwitchWorkspace');
    assert.ok(workspaceManagerCode.includes('setActiveWorkspace'), 'Must trigger canonical setActiveWorkspace');
  });

  test('9. Default tax remains strictly 0% across defaults and schemas', () => {
    const dbEnginePath = path.join(projectRoot, 'src', 'services', 'dbEngine.js');
    const dbEngineCode = fs.readFileSync(dbEnginePath, 'utf8');
    assert.match(dbEngineCode, /defaultTax:\s*0/, 'dbEngine defaultTax must remain 0%');
    assert.match(dbEngineCode, /defaultTaxRate:\s*0/, 'dbEngine defaultTaxRate must remain 0%');

    const wizardPath = path.join(projectRoot, 'src', 'pages', 'onboarding', 'OnboardingWizard.jsx');
    const wizardCode = fs.readFileSync(wizardPath, 'utf8');
    assert.match(wizardCode, /defaultTax:\s*0/, 'OnboardingWizard defaultTax must remain 0%');

    const invoiceContextPath = path.join(projectRoot, 'src', 'context', 'InvoiceContext.jsx');
    const invoiceContextCode = fs.readFileSync(invoiceContextPath, 'utf8');
    assert.ok(invoiceContextCode.includes('businessSettings?.defaultTax ?? 0'), 'InvoiceContext defaultTax fallback must remain 0');
  });

  test('10. Theme Studio reuses canonical applyFullTheme engine without duplication', () => {
    const themeStudioPath = path.join(projectRoot, 'src', 'pages', 'studios', 'ThemeStudio.jsx');
    const themeStudioCode = fs.readFileSync(themeStudioPath, 'utf8');
    assert.ok(themeStudioCode.includes('applyFullTheme'), 'ThemeStudio must reuse applyFullTheme');
    assert.ok(themeStudioCode.includes('ALL_THEMES'), 'ThemeStudio must reuse canonical ALL_THEMES catalog');
  });

  test('11. Financial Engine Safety: Old Due Waterfall Allocation remains fully preserved', () => {
    // Critical scenario from user specification:
    // Invoice 1: ₹1,000, Paid: ₹500 (Old Due carried forward to Invoice 2 = ₹500)
    // Invoice 2: ₹800, Old Due: ₹500, Total Payable: ₹1,300
    // Customer payment: ₹600
    // Expected:
    // Earlier balance paid: ₹500 (fully settling Invoice 1)
    // Invoice 2 paid: ₹100
    // Invoice 2 outstanding: ₹700
    // Customer outstanding: ₹700

    const allocation = allocatePayment(600, 500, 800);

    assert.equal(allocation.paymentAmount, 600, 'Payment amount must be ₹600');
    assert.equal(allocation.allocatedToOldDue, 500, 'Invoice 1 old due must receive ₹500 and clear');
    assert.equal(allocation.remainingOldDue, 0, 'Earlier due remaining must be ₹0');
    assert.equal(allocation.allocatedToCurrentInvoice, 100, 'Current bill must receive ₹100');
    assert.equal(allocation.remainingCurrentInvoiceDue, 700, 'Invoice 2 balance due must be ₹700');
    assert.equal(allocation.customerTotalDue, 700, 'Customer total outstanding must be ₹700');
    assert.equal(allocation.currentInvoicePaymentStatus, 'Partial', 'Current invoice status must be Partial');
  });

});

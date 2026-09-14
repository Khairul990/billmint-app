import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Phase 6A: CSS Tokens and Surface Hierarchy in billqyro-luxury.css', () => {
  const cssPath = path.join(projectRoot, 'src', 'styles', 'billqyro-luxury.css');
  assert.ok(fs.existsSync(cssPath), 'billqyro-luxury.css must exist');
  
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Brand family tokens
  assert.match(cssContent, /--bq-emerald:\s*#0B8F78/, 'Must declare official Signature Emerald #0B8F78');
  assert.match(cssContent, /--bq-champagne:\s*#C8A96B/, 'Must declare official Champagne #C8A96B');
  assert.match(cssContent, /--bq-emerald-deep:\s*#075E50/, 'Must declare Deep Emerald');
  assert.match(cssContent, /--bq-emerald-bright:\s*#18B99B/, 'Must declare Bright Emerald');

  // Surface Hierarchy (Levels 1 - 5)
  assert.match(cssContent, /--bq-surface-app/, 'Must declare Level 1 Atmospheric Surface token');
  assert.match(cssContent, /--bq-surface-primary/, 'Must declare Level 2 Primary Signature Surface token');
  assert.match(cssContent, /--bq-surface-secondary/, 'Must declare Level 3 Secondary Surface token');
  assert.match(cssContent, /--bq-surface-elevated/, 'Must declare Level 4 Interactive Surface token');
  assert.match(cssContent, /--bq-surface-financial/, 'Must declare Level 5 Financial Highlight Surface token');

  // Semantic helper classes
  assert.match(cssContent, /\.bq-surface-primary/, 'Must provide .bq-surface-primary class');
  assert.match(cssContent, /\.bq-surface-financial/, 'Must provide .bq-surface-financial class');
  assert.match(cssContent, /\.bq-financial-number/, 'Must provide .bq-financial-number class');
  assert.match(cssContent, /\.bq-font-display/, 'Must provide .bq-font-display utility');
});

test('Phase 6A: Tailwind Configuration has Sora display font and brand colors', () => {
  const tailwindPath = path.join(projectRoot, 'tailwind.config.js');
  const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

  // Typography
  assert.match(tailwindContent, /display:\s*\[['"]Sora['"]/, 'Display font must be Sora');
  assert.match(tailwindContent, /sans:\s*\[['"]+Plus Jakarta Sans['"]+/, 'Sans font must start with Plus Jakarta Sans');

  // Brand and semantic bq colors
  assert.match(tailwindContent, /emerald:\s*['"]#0B8F78['"]/, 'Tailwind must configure emerald #0B8F78');
  assert.match(tailwindContent, /champagne:\s*['"]#C8A96B['"]/, 'Tailwind must configure champagne #C8A96B');
  assert.match(tailwindContent, /'surface-financial':\s*['"]var\(--bq-surface-financial\)['"]/, 'Tailwind must map surface-financial');
});

test('Phase 6A: Foundational UI Component Exports and Primitives', () => {
  const uiIndexPath = path.join(projectRoot, 'src', 'components', 'ui', 'index.js');
  assert.ok(fs.existsSync(uiIndexPath), 'Barrel export index.js must exist in src/components/ui');
  const uiIndexContent = fs.readFileSync(uiIndexPath, 'utf8');

  assert.match(uiIndexContent, /export \* from '\.\/Badge'/, 'Must export Badge');
  assert.match(uiIndexContent, /export \* from '\.\/Button'/, 'Must export Button');
  assert.match(uiIndexContent, /export \* from '\.\/Card'/, 'Must export Card');
  assert.match(uiIndexContent, /export \* from '\.\/FinancialValue'/, 'Must export FinancialValue');
  assert.match(uiIndexContent, /export \* from '\.\/FinancialEquation'/, 'Must export FinancialEquation');
  assert.match(uiIndexContent, /export \* from '\.\/Input'/, 'Must export Input');
});

test('Phase 6A: StatusBadge and Badge Multi-Channel Status Language', () => {
  const badgePath = path.join(projectRoot, 'src', 'components', 'ui', 'Badge.jsx');
  const badgeContent = fs.readFileSync(badgePath, 'utf8');

  // Statuses supported
  assert.match(badgeContent, /export const StatusBadge/, 'Must export StatusBadge');
  assert.match(badgeContent, /paid:/, 'Must support paid status');
  assert.match(badgeContent, /partial:/, 'Must support partial status');
  assert.match(badgeContent, /unpaid:/, 'Must support unpaid status');
  assert.match(badgeContent, /overdue:/, 'Must support overdue status');
  assert.match(badgeContent, /pending:/, 'Must support pending status');
  assert.match(badgeContent, /draft:/, 'Must support draft status');
  assert.match(badgeContent, /void:/, 'Must support void status');
});

test('Phase 6A: FinancialValue and FinancialEquation Architecture', () => {
  const finValuePath = path.join(projectRoot, 'src', 'components', 'ui', 'FinancialValue.jsx');
  const finEqPath = path.join(projectRoot, 'src', 'components', 'ui', 'FinancialEquation.jsx');

  assert.ok(fs.existsSync(finValuePath), 'FinancialValue.jsx must exist');
  assert.ok(fs.existsSync(finEqPath), 'FinancialEquation.jsx must exist');

  const eqContent = fs.readFileSync(finEqPath, 'utf8');
  assert.match(eqContent, /Old Due/, 'Must display Old Due in equation');
  assert.match(eqContent, /Current Bill/, 'Must display Current Bill in equation');
  assert.match(eqContent, /Total Payable/, 'Must display Total Payable in equation');
  assert.match(eqContent, /Paid/, 'Must display Paid in equation');
  assert.match(eqContent, /Balance Due/, 'Must display Balance Due in equation');
});

test('Phase 6A: Design System Reference Documentation Exists and Complete', () => {
  const docPath = path.join(projectRoot, 'docs', 'BILLQYRO_SIGNATURE_DESIGN_SYSTEM.md');
  assert.ok(fs.existsSync(docPath), 'BILLQYRO_SIGNATURE_DESIGN_SYSTEM.md must exist');

  const docContent = fs.readFileSync(docPath, 'utf8');
  assert.match(docContent, /Financial Clarity \+ Soft Luxury/, 'Doc must state core philosophy');
  assert.match(docContent, /#0B8F78/, 'Doc must document Signature Emerald');
  assert.match(docContent, /Surface Hierarchy/, 'Doc must document Surface Hierarchy');
  assert.match(docContent, /Status System/, 'Doc must document Status System');
  assert.match(docContent, /Financial Visual Language/, 'Doc must document Financial Visual Language');
  assert.match(docContent, /Do \/ Don't Examples/, 'Doc must provide Do / Don\'t guidelines');
});

/**
 * Phase 24 — Bundle size budget guard.
 *
 * Keeps the 5,000-user performance promise from regressing silently:
 *  1. Heavy libraries (charts, PDF, firebase) must stay OUT of the boot path —
 *     only lazy() pages / dynamic import() may pull them.
 *  2. When a production build (dist/) exists, the entry payload referenced by
 *     index.html must stay under budget.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

// Files evaluated during first paint (static import chain roots).
const BOOT_PATH_FILES = [
  'src/main.jsx',
  'src/App.jsx',
  'src/components/Layout.jsx',
  'src/components/BottomNav.jsx',
  'src/components/PostLoginWelcome.jsx',
  'src/components/ClassicLoader.jsx',
  'src/components/AnnouncementSurface.jsx',
  'src/components/DemoImportOffer.jsx',
  'src/components/AdBanner.jsx',
];

// Libraries that must never be statically imported on the boot path.
const HEAVY_LIBS = [
  { name: 'recharts', reason: 'chart vendor (~348KB) — lazy pages only' },
  { name: 'chart.js', reason: 'chart vendor — lazy pages only' },
  { name: 'jspdf', reason: 'PDF vendor — lazy util only' },
  { name: 'jspdf-autotable', reason: 'PDF vendor — lazy util only' },
  { name: 'firebase/', reason: 'firebase (~752KB) — services with lazy auth only' },
  { name: 'jszip', reason: 'zip vendor — lazy services only' },
  { name: '@capacitor/', reason: 'native bridge — lazy services only' },
];

const stripComments = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

test('heavy libraries stay off the boot path (static imports)', () => {
  const violations = [];
  for (const rel of BOOT_PATH_FILES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue; // renamed/removed files are fine
    const code = stripComments(fs.readFileSync(file, 'utf8'));
    for (const lib of HEAVY_LIBS) {
      // static import / export-from, but NOT dynamic import()
      const re = new RegExp(`(?:^|[\\n;])\\s*(?:import|export)[^\\n]*?from\\s+['"]([^'"]*${lib.name.replace('/', '\\/')}[^'"]*)['"]`, 'm');
      const m = code.match(re);
      if (m) violations.push(`${rel} → ${m[1]} (${lib.reason})`);
    }
  }
  assert.deepStrictEqual(violations, [], `Boot-path heavy imports found:\n${violations.join('\n')}`);
});

test('boot-path files use dynamic import() for firebase-backed services where required', () => {
  // main.jsx / App.jsx must not statically import dbEngine's firebase chain
  // (dbEngine statically imports firebaseConfig — so it must not appear either).
  const appCode = stripComments(fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8'));
  const staticDb = /(?:^|[\n;])\s*import[^\\n]*?from\s+['"][^'"]*services\/dbEngine(\.js)?['"]/.test(appCode);
  assert.equal(staticDb, false, 'App.jsx must not statically import dbEngine (pulls firebase into the entry bundle)');
});

test('when dist/ exists: entry payload stays under budget', () => {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    return; // no build present in this environment — static rules above still ran
  }
  const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const scriptTags = [...indexHtml.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(scriptTags.length > 0, 'dist/index.html has no entry script');
  let total = 0;
  const perAsset = [];
  for (const srcAttr of scriptTags) {
    const assetPath = path.join(dist, srcAttr.replace(/^\//, ''));
    assert.ok(fs.existsSync(assetPath), `entry asset missing in dist: ${srcAttr}`);
    const size = fs.statSync(assetPath).size;
    total += size;
    perAsset.push(`${srcAttr} ${(size / 1024).toFixed(0)}KB`);
  }
  // Budget: 1.6MB entry payload (current baseline ~1.13MB + headroom for
  // growth). If this fails, code-split the new dependency instead of raising it.
  const BUDGET = 1.6 * 1024 * 1024;
  assert.ok(total <= BUDGET, `Entry payload ${(total / 1024 / 1024).toFixed(2)}MB exceeds the 1.6MB budget.\n${perAsset.join('\n')}`);
});

test('guide screenshots are served from public/ (not bundled into JS)', () => {
  const guidesData = fs.readFileSync(path.join(SRC, 'data', 'guides.js'), 'utf8');
  const badRefs = guidesData.match(/image:\s*'(?!\/guides\/)[^']*\/guides\//g);
  assert.equal(badRefs, null, 'guide images must be referenced as /guides/*.jpg (public dir)');
  const publicGuides = path.join(ROOT, 'public', 'guides');
  if (fs.existsSync(publicGuides)) {
    const files = fs.readdirSync(publicGuides);
    assert.ok(files.length >= 9, `expected the captured tutorial screenshots in public/guides (found ${files.length})`);
  }
});

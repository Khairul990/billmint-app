/**
 * BillQyro Phase 25 — RevenueCenter UPI-QR + PWA Install Prompt contracts
 * Run: node tests/phase25Features.test.mjs
 *
 * Static source-contract tests (DOM-canvas and beforeinstallprompt need a
 * browser; runtime behaviour is covered by the dev-audit Playwright pass).
 */

import { readFileSync } from 'fs';

let passed = 0;
let failures = 0;
function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✅ PASS: ${message}`); }
  else { failures++; console.error(`  ❌ FAIL: ${message}`); }
}

console.log('\n======================================================');
console.log('💠 RUNNING PHASE 25 FEATURE-CONTRACT TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------
console.log('--- 1. RevenueCenter UPI QR generation ---');
{
  const src = readFileSync('./src/pages/admin/RevenueCenter.jsx', 'utf8');
  assert(src.includes("9903591839@ybl"), 'UPI ID 9903591839@ybl present');
  assert(src.includes('upi://pay?pa='), 'UPI pay-intent scheme used');
  assert(src.includes('cu=INR'), 'currency INR in intent');
  assert(src.includes("import('qrcode')"), 'qrcode loaded via dynamic import (budget-safe)');
  assert(!/^import Qrcode|import \{ QRCode|from 'qrcode'/m.test(src), 'no static qrcode import on boot path');
  assert(/canvas.*224|224.*canvas|qrCanvasRef/.test(src), 'canvas ref sized for QR render');
  assert(src.includes('billqyro-upi-qr-'), 'download filename carries billqyro-upi-qr- prefix');
  assert(/copy|clipboard/i.test(src), 'copy/UPI-link affordance present');
  assert(/placeholder|loading|qrError/i.test(src), 'loading/error state handled');
}

// ----------------------------------------------------
console.log('--- 2. PwaInstallPrompt component ---');
{
  const src = readFileSync('./src/components/PwaInstallPrompt.jsx', 'utf8');
  assert(src.includes('beforeinstallprompt'), 'captures beforeinstallprompt event');
  assert(/standalone|display-mode/.test(src), 'never shows when running standalone');
  assert(src.includes('billqyro_install_nudge_dismissed_at'), 'dismiss honours the 7-day cool-off key');
  assert(/setTimeout\(/.test(src) && /\},\s*[0-9]{4,}\)/.test(src), 'nudge is delayed (not instant popup)');
  const landing = readFileSync('./src/pages/Landing.jsx', 'utf8');
  assert(landing.includes('PwaInstallPrompt'), 'Landing mounts the install prompt');
}

// ----------------------------------------------------
console.log('--- 3. Onboarding tips wired into App ---');
{
  const app = readFileSync('./src/App.jsx', 'utf8');
  assert(app.includes('getOnboardingTip'), 'App consumes getOnboardingTip');
  assert(/isDemoSessionActive/.test(app), 'tips suppressed for demo sessions');
  const svc = readFileSync('./src/services/onboardingTipsService.js', 'utf8');
  assert(svc.includes('billqyro_onboarding_started_at'), 'start-timestamp key present');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
process.exit(failures > 0 ? 1 : 0);
